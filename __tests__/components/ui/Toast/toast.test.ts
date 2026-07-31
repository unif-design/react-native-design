import { describe, expect, test } from '@jest/globals';
import { createToastStore } from '../../../../src/components/ui/Toast/store';
import type { ToastDelivery } from '../../../../src/components/ui/Toast/store';
import type { ToastEntry } from '../../../../src/components/ui/Toast/types';
import type { Logger } from '../../../../src/utils/logger';

/** 静默 logger —— Store 的错误路径会 log,测试只关心状态机。 */
const testLog: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

const entry = (id: number, message: string): ToastEntry => ({
  id,
  message,
  kind: 'info',
  duration: 3000,
  position: 'bottom',
});

describe('ToastStore — 无 Host 的 pending(latest-wins)', () => {
  test('无 Host 时保留最新一条,挂上 Host 后立即投递', () => {
    const store = createToastStore(testLog);
    store.publish(entry(1, 'A'));
    store.publish(entry(2, 'B'));
    expect(store.pendingEntry()?.message).toBe('B');
    expect(store.currentDelivery()).toBeNull();

    const deliveries: ToastDelivery[] = [];
    const lease = store.registerHost((delivery) => deliveries.push(delivery));
    expect(lease).not.toBeNull();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.entry.message).toBe('B');
    expect(store.pendingEntry()).toBeNull();
  });

  test('无 Host 不是错误路径 —— pending 被原子取走,不会重复投递', () => {
    const store = createToastStore(testLog);
    const a = entry(1, 'A');
    store.publish(a);

    const deliveries: ToastDelivery[] = [];
    store.registerHost((delivery) => deliveries.push(delivery));
    expect(deliveries).toHaveLength(1);
    expect(store.pendingEntry()).toBeNull();
    expect(store.currentDelivery()?.entry).toBe(a);
  });
});

describe('ToastStore — 有 Host 时的 latest-wins 投递', () => {
  test('连续 publish 立即投递,后者覆盖前者', () => {
    const store = createToastStore(testLog);
    const deliveries: ToastDelivery[] = [];
    store.registerHost((delivery) => deliveries.push(delivery));

    store.publish(entry(1, 'A'));
    store.publish(entry(2, 'B'));

    expect(deliveries.map((d) => d.entry.message)).toEqual(['A', 'B']);
    expect(store.currentDelivery()?.entry.message).toBe('B');
    // leaseId 单调递增 —— 旧回调据此识别自己已过期
    expect(deliveries[1]?.leaseId).toBeGreaterThan(deliveries[0]?.leaseId ?? 0);
  });

  test('投递 A 时同步发布 B,A 随后抛错也只回存 B', () => {
    const store = createToastStore(testLog);
    const a = entry(1, 'A');
    const b = entry(2, 'B');
    store.publish(a);

    const seen: ToastEntry[] = [];
    const lease = store.registerHost((delivery) => {
      seen.push(delivery.entry);
      if (delivery.entry === a) store.publish(b);
      throw new Error('host failed after B');
    });

    expect(seen).toEqual([a, b]);
    expect(lease).toBeNull();
    expect(store.pendingEntry()).toBe(b);
    expect(store.currentDelivery()).toBeNull();

    const deliveries: ToastDelivery[] = [];
    const next = store.registerHost((delivery) => deliveries.push(delivery));
    expect(next).not.toBeNull();
    expect(deliveries[0]?.entry).toBe(b);
  });

  test('抛错前已 complete 的 A 不会被复活', () => {
    const store = createToastStore(testLog);
    const a = entry(1, 'A');
    store.publish(a);

    const lease = store.registerHost((delivery) => {
      expect(
        store.complete(delivery.ownerToken, delivery.leaseId, delivery.entry.id)
      ).toBe(true);
      throw new Error('host failed after complete');
    });

    expect(lease).toBeNull();
    expect(store.pendingEntry()).toBeNull();
    expect(store.currentDelivery()).toBeNull();
  });
});

describe('ToastStore — owner 唯一性', () => {
  test('重复注册的 Host 拿到 null lease,永不接收投递', () => {
    const store = createToastStore(testLog);
    const first: ToastDelivery[] = [];
    const second: ToastDelivery[] = [];
    expect(store.registerHost((d) => first.push(d))).not.toBeNull();
    expect(store.registerHost((d) => second.push(d))).toBeNull();

    store.publish(entry(1, 'A'));
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });

  test('重复 Host 不会在第一个 release 后自动接管', () => {
    const store = createToastStore(testLog);
    const first = store.registerHost(() => {});
    const second: ToastDelivery[] = [];
    expect(store.registerHost((d) => second.push(d))).toBeNull();

    first?.release();
    store.publish(entry(1, 'A'));
    // 被拒绝的 Host 没有订阅,消息只能留在 pending 等新 Host
    expect(second).toHaveLength(0);
    expect(store.pendingEntry()?.message).toBe('A');
  });
});

describe('ToastStore — release 把未完成投递退回 pending', () => {
  test('owner A 卸载后 owner B 拿到同一 entry,但 leaseId 是新的', () => {
    const store = createToastStore(testLog);
    const a = entry(1, 'A');
    const firstDeliveries: ToastDelivery[] = [];
    const leaseA = store.registerHost((d) => firstDeliveries.push(d));
    store.publish(a);
    const deliveryA = firstDeliveries[0];
    expect(deliveryA?.entry).toBe(a);

    leaseA?.release();
    expect(store.pendingEntry()).toBe(a);
    expect(store.currentDelivery()).toBeNull();

    const secondDeliveries: ToastDelivery[] = [];
    expect(store.registerHost((d) => secondDeliveries.push(d))).not.toBeNull();
    const deliveryB = secondDeliveries[0];
    expect(deliveryB?.entry).toBe(a);
    expect(deliveryB?.leaseId).toBeGreaterThan(deliveryA?.leaseId ?? 0);
    expect(deliveryB?.ownerToken).not.toBe(deliveryA?.ownerToken);
  });

  test('release 时若已有更新的 pending,不被旧 delivery 覆盖', () => {
    const store = createToastStore(testLog);
    const a = entry(1, 'A');
    const b = entry(2, 'B');
    let lease: { release(): void } | null = null;
    lease = store.registerHost(() => {
      // 回调内先卸载自己,再发布更新的 B —— 退回的旧 A 不能盖掉 B
      lease?.release();
      store.publish(b);
    });
    store.publish(a);

    expect(store.pendingEntry()).toBe(b);
    expect(store.currentDelivery()).toBeNull();
  });

  test('已 complete 的 delivery 不会在 release 时被退回', () => {
    const store = createToastStore(testLog);
    const captured: ToastDelivery[] = [];
    const lease = store.registerHost((d) => captured.push(d));
    store.publish(entry(1, 'A'));
    const delivery = captured[0];
    expect(delivery).toBeDefined();
    store.complete(delivery!.ownerToken, delivery!.leaseId, delivery!.entry.id);

    lease?.release();
    expect(store.pendingEntry()).toBeNull();
  });

  test('非当前 owner 的 release 无副作用', () => {
    const store = createToastStore(testLog);
    const leaseA = store.registerHost(() => {});
    leaseA?.release();

    const deliveries: ToastDelivery[] = [];
    store.registerHost((d) => deliveries.push(d));
    store.publish(entry(1, 'A'));
    // 旧 lease 再次 release 不能把新 owner 摘掉
    leaseA?.release();
    store.publish(entry(2, 'B'));
    expect(deliveries.map((d) => d.entry.message)).toEqual(['A', 'B']);
  });
});

describe('ToastStore — complete 的三重 CAS', () => {
  const setup = () => {
    const store = createToastStore(testLog);
    const captured: ToastDelivery[] = [];
    store.registerHost((d) => captured.push(d));
    store.publish(entry(1, 'A'));
    const delivery = captured[0];
    if (!delivery) throw new Error('没有收到投递');
    return { store, delivery };
  };

  test('三项全对才成功,且只能成功一次', () => {
    const { store, delivery } = setup();
    expect(
      store.complete(delivery.ownerToken, delivery.leaseId, delivery.entry.id)
    ).toBe(true);
    expect(
      store.complete(delivery.ownerToken, delivery.leaseId, delivery.entry.id)
    ).toBe(false);
    expect(store.currentDelivery()).toBeNull();
  });

  test('ownerToken 不符则失败', () => {
    const { store, delivery } = setup();
    expect(
      store.complete(Symbol('other'), delivery.leaseId, delivery.entry.id)
    ).toBe(false);
    expect(store.currentDelivery()).toBe(delivery);
  });

  test('leaseId 不符则失败', () => {
    const { store, delivery } = setup();
    expect(
      store.complete(
        delivery.ownerToken,
        delivery.leaseId + 1,
        delivery.entry.id
      )
    ).toBe(false);
    expect(store.currentDelivery()).toBe(delivery);
  });

  test('entryId 不符则失败', () => {
    const { store, delivery } = setup();
    expect(
      store.complete(
        delivery.ownerToken,
        delivery.leaseId,
        delivery.entry.id + 1
      )
    ).toBe(false);
    expect(store.currentDelivery()).toBe(delivery);
  });

  test('旧 delivery 的迟到 complete 不能清掉新 delivery', () => {
    const store = createToastStore(testLog);
    const captured: ToastDelivery[] = [];
    store.registerHost((d) => captured.push(d));
    store.publish(entry(1, 'A'));
    store.publish(entry(2, 'B'));
    const stale = captured[0];
    const current = captured[1];
    expect(stale).toBeDefined();
    expect(
      store.complete(stale!.ownerToken, stale!.leaseId, stale!.entry.id)
    ).toBe(false);
    expect(store.currentDelivery()).toBe(current);
  });
});

describe('ToastStore — isCurrent 守卫', () => {
  test('只有当前 delivery 为真', () => {
    const store = createToastStore(testLog);
    const captured: ToastDelivery[] = [];
    store.registerHost((d) => captured.push(d));
    store.publish(entry(1, 'A'));
    const first = captured[0];
    expect(first).toBeDefined();
    expect(store.isCurrent(first!)).toBe(true);

    store.publish(entry(2, 'B'));
    expect(store.isCurrent(first!)).toBe(false);
    expect(store.isCurrent(captured[1]!)).toBe(true);
  });

  test('complete 之后 isCurrent 为 false', () => {
    const store = createToastStore(testLog);
    const captured: ToastDelivery[] = [];
    store.registerHost((d) => captured.push(d));
    store.publish(entry(1, 'A'));
    const delivery = captured[0]!;
    store.complete(delivery.ownerToken, delivery.leaseId, delivery.entry.id);
    expect(store.isCurrent(delivery)).toBe(false);
  });
});
