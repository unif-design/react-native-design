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

describe('ConfirmStore — 栈式 lease(后挂载者接管)', () => {
  test('后挂载的 Host 接管事件,先挂载者不再收到', async () => {
    const store = createConfirmStore(testLog);
    const outer: ConfirmEvent[] = [];
    const inner: ConfirmEvent[] = [];
    store.registerHost((event) => outer.push(event));
    store.registerHost((event) => inner.push(event));

    const promise = store.request({ title: 'a' });
    expect(showEvents(inner)).toHaveLength(1);
    expect(outer).toHaveLength(0);
    store.settle(firstEntry(inner), true);
    await expect(promise).resolves.toBe(true);
  }, 2000);

  test('接管时原 owner 的 active 立即 resolve(false) 并收到 clear', async () => {
    const store = createConfirmStore(testLog);
    const outer: ConfirmEvent[] = [];
    store.registerHost((event) => outer.push(event));

    const promise = store.request({ title: 'a' });
    const entry = firstEntry(outer);
    expect(store.activeEntry()).toBe(entry);

    store.registerHost(() => {});
    // Promise 不悬挂、单例槽立即释放 —— 否则旧确认框会一直占着槽位
    await expect(promise).resolves.toBe(false);
    expect(store.activeEntry()).toBeNull();
    expect(outer).toEqual([
      { type: 'show', entry },
      { type: 'clear', id: entry.id },
    ]);
  }, 2000);

  test('接管后新 owner 能立刻拿到新请求(槽位已释放)', async () => {
    const store = createConfirmStore(testLog);
    store.registerHost(() => {});
    store.request({ title: 'a' });

    const inner: ConfirmEvent[] = [];
    store.registerHost((event) => inner.push(event));
    const promise = store.request({ title: 'b' });
    store.settle(firstEntry(inner), true);
    await expect(promise).resolves.toBe(true);
  }, 2000);

  test('接管不再告警 —— 多 Host 已是合法用法', () => {
    const warns: string[] = [];
    const store = createConfirmStore({
      ...testLog,
      warn: (...args) => warns.push(String(args[0])),
    });
    store.registerHost(() => {});
    store.registerHost(() => {});
    expect(warns).toHaveLength(0);
  });

  test('后挂载者卸载 → 事件回到先挂载者', async () => {
    const store = createConfirmStore(testLog);
    const outer: ConfirmEvent[] = [];
    store.registerHost((event) => outer.push(event));
    const inner = store.registerHost(() => {});

    inner.release(null);
    const promise = store.request({ title: 'a' });
    expect(showEvents(outer)).toHaveLength(1);
    store.settle(firstEntry(outer), true);
    await expect(promise).resolves.toBe(true);
  }, 2000);

  test('乱序卸载:挂起中的先挂载者先走,当前 owner 不受影响', async () => {
    const store = createConfirmStore(testLog);
    const outerLease = store.registerHost(() => {});
    const inner: ConfirmEvent[] = [];
    store.registerHost((event) => inner.push(event));

    // 父 Modal 先卸载、子 Host 后卸载的顺序:挂起者只是从栈里摘掉
    outerLease.release(null);
    const promise = store.request({ title: 'a' });
    expect(showEvents(inner)).toHaveLength(1);
    store.settle(firstEntry(inner), false);
    await expect(promise).resolves.toBe(false);
  }, 2000);

  test('乱序卸载后当前 owner 再卸载 → 栈空,回到无 Host 语义', async () => {
    const store = createConfirmStore(testLog);
    const outerLease = store.registerHost(() => {});
    const innerLease = store.registerHost(() => {});

    outerLease.release(null);
    innerLease.release(null);
    await expect(store.request({ title: 'a' })).resolves.toBe(false);
  }, 2000);

  test('release 幂等 —— 重复调用不会误摘新 owner', async () => {
    const store = createConfirmStore(testLog);
    const outer: ConfirmEvent[] = [];
    store.registerHost((event) => outer.push(event));
    const inner = store.registerHost(() => {});

    inner.release(null);
    inner.release(null);
    const promise = store.request({ title: 'a' });
    expect(showEvents(outer)).toHaveLength(1);
    store.settle(firstEntry(outer), true);
    await expect(promise).resolves.toBe(true);
  }, 2000);

  test('三层嵌套按栈序逐级归还', () => {
    const store = createConfirmStore(testLog);
    const seen: string[] = [];
    const track = (tag: string) => (event: ConfirmEvent) => {
      if (event.type === 'show')
        seen.push(`${tag}:${event.entry.options.title}`);
    };
    store.registerHost(track('L1'));
    const l2 = store.registerHost(track('L2'));
    const l3 = store.registerHost(track('L3'));

    store.request({ title: 'A' });
    l3.release(null);
    store.request({ title: 'B' });
    l2.release(null);
    store.request({ title: 'C' });

    expect(seen).toEqual(['L3:A', 'L2:B', 'L1:C']);
  });

  test('栈空时 confirm() 仍 warn + resolve(false)', async () => {
    const warns: string[] = [];
    const store = createConfirmStore({
      ...testLog,
      warn: (...args) => warns.push(String(args[0])),
    });
    const lease = store.registerHost(() => {});
    lease.release(null);

    await expect(store.request({ title: 'a' })).resolves.toBe(false);
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('<ConfirmHost />');
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
