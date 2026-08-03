import { describe, expect, test } from '@jest/globals';
import { resolveConfirmLabels } from '../../../../src/components/ui/Confirm/labels';
import { createConfirmStore } from '../../../../src/components/ui/Confirm/store';
import type {
  ConfirmEntry,
  ConfirmEvent,
} from '../../../../src/components/ui/Confirm/store';
import type { Logger } from '../../../../src/utils/logger';

/** 静默 logger —— Store 的错误路径会 log,测试不关心输出,只关心状态机。 */
const testLog: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const showEvents = (events: readonly ConfirmEvent[]) =>
  events.filter(
    (event): event is Extract<ConfirmEvent, { type: 'show' }> =>
      event.type === 'show'
  );

const firstEntry = (events: readonly ConfirmEvent[]): ConfirmEntry => {
  const shown = showEvents(events)[0];
  if (!shown) throw new Error('没有收到 show 事件');
  return shown.entry;
};

describe('Confirm labels', () => {
  test('trim 自定义 label，空白值回退默认文案', () => {
    expect(
      resolveConfirmLabels({
        confirmLabel: '  删除  ',
        cancelLabel: '\t',
      })
    ).toEqual({
      confirmLabel: '删除',
      cancelLabel: '取消',
    });
    expect(
      resolveConfirmLabels({ confirmLabel: '', cancelLabel: '  返回 ' })
    ).toEqual({
      confirmLabel: '确认',
      cancelLabel: '返回',
    });
  });
});

describe('ConfirmStore — 无 Host', () => {
  test('无 Host 时立即 resolve(false),不悬挂', async () => {
    const store = createConfirmStore(testLog);
    await expect(store.request({ title: 'x' })).resolves.toBe(false);
  }, 2000);

  test('无 Host 的请求不占单例锁 —— 之后注册 Host 仍能正常弹出', async () => {
    const store = createConfirmStore(testLog);
    expect(await store.request({ title: 'x' })).toBe(false);
    expect(store.activeEntry()).toBeNull();

    const events: ConfirmEvent[] = [];
    expect(store.registerHost((event) => events.push(event))).not.toBeNull();
    const promise = store.request({ title: 'y' });
    const entry = firstEntry(events);
    expect(store.settle(entry, true)).toBe(true);
    await expect(promise).resolves.toBe(true);
  }, 2000);
});

describe('ConfirmStore — 单 active entry', () => {
  test('已有活跃对话框时重入立即 resolve(false)', async () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    store.registerHost((event) => events.push(event));

    const first = store.request({ title: 'a' });
    await expect(store.request({ title: 'b' })).resolves.toBe(false);
    // 重入被拒绝不能连带清掉已有 active
    expect(store.activeEntry()).toBe(firstEntry(events));
    expect(showEvents(events)).toHaveLength(1);

    store.settle(firstEntry(events), true);
    await expect(first).resolves.toBe(true);
  }, 2000);

  test('settle 幂等 —— 同一 entry 第二次 settle 返回 false 且不改结果', async () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    store.registerHost((event) => events.push(event));

    const promise = store.request({ title: 'a' });
    const entry = firstEntry(events);
    expect(store.settle(entry, true)).toBe(true);
    expect(store.settle(entry, false)).toBe(false);
    await expect(promise).resolves.toBe(true);
    expect(store.activeEntry()).toBeNull();
  }, 2000);

  test('settle 成功后向 Host 发出 clear 事件,携带同一 id', async () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    store.registerHost((event) => events.push(event));

    const promise = store.request({ title: 'a' });
    const entry = firstEntry(events);
    store.settle(entry, false);
    await expect(promise).resolves.toBe(false);
    expect(events).toEqual([
      { type: 'show', entry },
      { type: 'clear', id: entry.id },
    ]);
  }, 2000);

  test('旧 entry 的重复 settle 不影响新 active entry', async () => {
    const events: ConfirmEvent[] = [];
    const store = createConfirmStore(testLog);
    const lease = store.registerHost((event) => events.push(event));
    expect(lease).not.toBeNull();

    const first = store.request({ title: 'A' });
    const entryA = firstEntry(events);
    expect(store.settle(entryA, true)).toBe(true);
    await expect(first).resolves.toBe(true);

    events.length = 0;
    const second = store.request({ title: 'B' });
    const entryB = firstEntry(events);
    expect(store.settle(entryA, false)).toBe(false);
    expect(store.activeEntry()).toBe(entryB);
    store.settle(entryB, false);
    await expect(second).resolves.toBe(false);
  }, 2000);
});

describe('ConfirmStore — owner 生命周期', () => {
  test('重复注册的 Host 拿到 null lease,且完全不接收事件', async () => {
    const store = createConfirmStore(testLog);
    const first: ConfirmEvent[] = [];
    const second: ConfirmEvent[] = [];
    expect(store.registerHost((event) => first.push(event))).not.toBeNull();
    expect(store.registerHost((event) => second.push(event))).toBeNull();

    const promise = store.request({ title: 'a' });
    expect(showEvents(first)).toHaveLength(1);
    expect(second).toHaveLength(0);
    store.settle(firstEntry(first), true);
    await expect(promise).resolves.toBe(true);
  }, 2000);

  test('被拒绝的重复 lease 是 null —— 没有可用来误伤 owner 的 release', () => {
    const store = createConfirmStore(testLog);
    store.registerHost(() => {});
    expect(store.registerHost(() => {})).toBeNull();
  });

  test('owner release 会 settle 自己持有的 entry 为 false', async () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    const lease = store.registerHost((event) => events.push(event));
    expect(lease).not.toBeNull();

    const promise = store.request({ title: 'a' });
    const entry = firstEntry(events);
    lease?.release(entry);
    await expect(promise).resolves.toBe(false);
    expect(store.activeEntry()).toBeNull();
  }, 2000);

  test('release 之后可以注册新的 Host,并正常接收新请求', async () => {
    const store = createConfirmStore(testLog);
    const first = store.registerHost(() => {});
    first?.release(null);

    const events: ConfirmEvent[] = [];
    expect(store.registerHost((event) => events.push(event))).not.toBeNull();
    const promise = store.request({ title: 'a' });
    store.settle(firstEntry(events), true);
    await expect(promise).resolves.toBe(true);
  }, 2000);

  test('release 传入非当前 active 的 entry 不会误伤 active', async () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    const lease = store.registerHost((event) => events.push(event));

    const first = store.request({ title: 'A' });
    const entryA = firstEntry(events);
    store.settle(entryA, true);
    await expect(first).resolves.toBe(true);

    events.length = 0;
    const second = store.request({ title: 'B' });
    const entryB = firstEntry(events);
    // Host 卸载时手里拿的是已结算的旧 entry:不能连带把新 active 结算掉
    lease?.release(entryA);
    expect(store.activeEntry()).toBe(entryB);
    store.settle(entryB, true);
    await expect(second).resolves.toBe(true);
  }, 2000);
});

describe('ConfirmStore — subscriber 抛错', () => {
  test('show subscriber 抛错时 resolve(false) 并只作废该 owner', async () => {
    const store = createConfirmStore(testLog);
    const lease = store.registerHost(() => {
      throw new Error('host render failed');
    });
    expect(lease).not.toBeNull();

    await expect(store.request({ title: 'a' })).resolves.toBe(false);
    expect(store.activeEntry()).toBeNull();

    // owner 已被作废 —— 新 Host 可以接管
    const events: ConfirmEvent[] = [];
    expect(store.registerHost((event) => events.push(event))).not.toBeNull();
    const promise = store.request({ title: 'b' });
    store.settle(firstEntry(events), true);
    await expect(promise).resolves.toBe(true);
  }, 2000);

  test('clear subscriber 抛错不影响 Promise 结果', async () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    store.registerHost((event) => {
      events.push(event);
      if (event.type === 'clear') throw new Error('clear failed');
    });

    const promise = store.request({ title: 'a' });
    const entry = firstEntry(events);
    expect(store.settle(entry, true)).toBe(true);
    await expect(promise).resolves.toBe(true);
    expect(store.activeEntry()).toBeNull();
  }, 2000);

  test('clear subscriber 抛错后 owner 作废,新 Host 可接管', async () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    store.registerHost((event) => {
      events.push(event);
      if (event.type === 'clear') throw new Error('clear failed');
    });
    const first = store.request({ title: 'a' });
    store.settle(firstEntry(events), true);
    await expect(first).resolves.toBe(true);

    const next: ConfirmEvent[] = [];
    expect(store.registerHost((event) => next.push(event))).not.toBeNull();
    const second = store.request({ title: 'b' });
    store.settle(firstEntry(next), false);
    await expect(second).resolves.toBe(false);
  }, 2000);

  test('clear 回调先同步 request(B) 再抛错时确定性结算 B,且不锁死后续请求', async () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    let second: Promise<boolean> | undefined;
    store.registerHost((event) => {
      events.push(event);
      if (event.type === 'clear') {
        second = store.request({ title: 'B' });
        throw new Error('clear failed after B');
      }
    });

    const first = store.request({ title: 'A' });
    expect(store.settle(firstEntry(events), true)).toBe(true);
    await expect(first).resolves.toBe(true);
    expect(second).toBeDefined();
    await expect(second).resolves.toBe(false);
    expect(store.activeEntry()).toBeNull();

    const next: ConfirmEvent[] = [];
    expect(store.registerHost((event) => next.push(event))).not.toBeNull();
    const third = store.request({ title: 'C' });
    store.settle(firstEntry(next), true);
    await expect(third).resolves.toBe(true);
  }, 2000);

  test('show 抛错的 entry 事后再 settle 也不会二次 resolve', async () => {
    const store = createConfirmStore(testLog);
    let captured: ConfirmEntry | null = null;
    store.registerHost((event) => {
      if (event.type === 'show') captured = event.entry;
      throw new Error('boom');
    });
    await expect(store.request({ title: 'a' })).resolves.toBe(false);
    expect(captured).not.toBeNull();
    expect(store.settle(captured as unknown as ConfirmEntry, true)).toBe(false);
  }, 2000);
});

describe('ConfirmStore — entry 形状', () => {
  test('entry 把 options 收在 options 字段下,不再摊平', () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    store.registerHost((event) => events.push(event));
    store.request({ title: 'a', message: 'm', destructive: true });
    const entry = firstEntry(events);
    expect(entry.options).toEqual({
      title: 'a',
      message: 'm',
      destructive: true,
    });
    expect(entry.settled).toBe(false);
    expect(typeof entry.id).toBe('number');
  });

  test('每个 Store 实例的 id 自增互不干扰', () => {
    const store = createConfirmStore(testLog);
    const events: ConfirmEvent[] = [];
    store.registerHost((event) => events.push(event));
    store.request({ title: 'a' });
    const a = firstEntry(events);
    store.settle(a, true);
    store.request({ title: 'b' });
    const b = showEvents(events)[1]?.entry;
    expect(b?.id).toBe(a.id + 1);
  });
});
