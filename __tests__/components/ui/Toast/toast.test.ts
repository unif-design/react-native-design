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

describe('ToastStore — 栈式 lease(后挂载者接管)', () => {
  test('后挂载的 Host 接管投递,先挂载者不再收到', () => {
    const store = createToastStore(testLog);
    const outer: ToastDelivery[] = [];
    const inner: ToastDelivery[] = [];
    expect(store.registerHost((d) => outer.push(d))).not.toBeNull();
    expect(store.registerHost((d) => inner.push(d))).not.toBeNull();

    store.publish(entry(1, 'A'));
    expect(inner.map((d) => d.entry.message)).toEqual(['A']);
    expect(outer).toHaveLength(0);
  });

  test('接管时原 owner 收到 clear,在途投递被丢弃', () => {
    const store = createToastStore(testLog);
    let outerCleared = 0;
    const outer: ToastDelivery[] = [];
    store.registerHost(
      (d) => outer.push(d),
      () => {
        outerCleared += 1;
      }
    );
    store.publish(entry(1, 'A'));
    expect(store.currentDelivery()).not.toBeNull();

    store.registerHost(() => {});
    expect(outerCleared).toBe(1);
    // 在途 toast 是瞬态消息:接管瞬间丢弃,不回 pending、不跨 owner 重放
    expect(store.currentDelivery()).toBeNull();
    expect(store.pendingEntry()).toBeNull();
  });

  test('前任 clear 回调里同步 publish,投给接管者而不是正在退场的自己', () => {
    const store = createToastStore(testLog);
    const outer: ToastDelivery[] = [];
    const inner: ToastDelivery[] = [];
    store.registerHost(
      (d) => outer.push(d),
      () => store.publish(entry(2, 'B'))
    );
    store.publish(entry(1, 'A'));

    store.registerHost((d) => inner.push(d));
    expect(outer.map((d) => d.entry.message)).toEqual(['A']);
    expect(inner.map((d) => d.entry.message)).toEqual(['B']);
    expect(store.currentDelivery()?.entry.message).toBe('B');
  });

  test('接管不再告警 —— 多 Host 已是合法用法', () => {
    const warns: string[] = [];
    const store = createToastStore({
      ...testLog,
      warn: (...args) => warns.push(String(args[0])),
    });
    store.registerHost(() => {});
    store.registerHost(() => {});
    expect(warns).toHaveLength(0);
  });

  test('后挂载者卸载 → 投递回到先挂载者', () => {
    const store = createToastStore(testLog);
    const outer: ToastDelivery[] = [];
    store.registerHost((d) => outer.push(d));
    const inner = store.registerHost(() => {});

    inner?.release();
    store.publish(entry(1, 'A'));
    expect(outer.map((d) => d.entry.message)).toEqual(['A']);
  });

  test('归还时在途投递交回前任重新投递(Modal 内 toast 后立刻关窗)', () => {
    const store = createToastStore(testLog);
    const outer: ToastDelivery[] = [];
    const innerSeen: ToastDelivery[] = [];
    store.registerHost((d) => outer.push(d));
    const inner = store.registerHost((d) => innerSeen.push(d));
    const a = entry(1, 'A');
    store.publish(a);
    expect(innerSeen[0]?.entry).toBe(a);

    inner?.release();
    // 「Modal 内操作成功 → toast → setVisible(false)」是最常见路径:这条 toast 刚发出、
    // 用户一眼都还没看到,归还时必须整条交回上一层,不能跟着 Modal 一起消失。
    expect(outer.map((d) => d.entry.message)).toEqual(['A']);
    expect(outer[0]?.entry).toBe(a);
    // 重新投递 = 新 lease:前任的迟到回调仍然认不出它
    expect(outer[0]?.leaseId).toBeGreaterThan(innerSeen[0]?.leaseId ?? 0);
    expect(outer[0]?.ownerToken).not.toBe(innerSeen[0]?.ownerToken);
    expect(store.currentDelivery()?.entry).toBe(a);
    expect(store.pendingEntry()).toBeNull();
  });

  test('接管方向仍丢弃 —— 接管者不会收到前任的在途 toast', () => {
    const store = createToastStore(testLog);
    store.registerHost(() => {});
    store.publish(entry(1, 'A'));

    const inner: ToastDelivery[] = [];
    store.registerHost((d) => inner.push(d));
    // 接管 = 前任被盖住,它那条属于「过去」;只有归还方向才交回重投
    expect(inner).toHaveLength(0);
    expect(store.currentDelivery()).toBeNull();
    expect(store.pendingEntry()).toBeNull();
  });

  test('归还重投后 latest-wins 依旧 —— 后来的 toast 正常替换', () => {
    const store = createToastStore(testLog);
    const outer: ToastDelivery[] = [];
    store.registerHost((d) => outer.push(d));
    const inner = store.registerHost(() => {});
    store.publish(entry(1, 'A'));

    inner?.release();
    store.publish(entry(2, 'B'));
    expect(outer.map((d) => d.entry.message)).toEqual(['A', 'B']);
    expect(store.currentDelivery()?.entry.message).toBe('B');
    expect(store.pendingEntry()).toBeNull();
  });

  test('乱序卸载:挂起中的先挂载者先走,当前 owner 不受影响', () => {
    const store = createToastStore(testLog);
    const outerLease = store.registerHost(() => {});
    const inner: ToastDelivery[] = [];
    store.registerHost((d) => inner.push(d));

    // 父 Modal 先卸载、子 Host 后卸载的顺序:挂起者只是从栈里摘掉
    outerLease?.release();
    store.publish(entry(1, 'A'));
    expect(inner.map((d) => d.entry.message)).toEqual(['A']);
  });

  test('乱序卸载后当前 owner 再卸载,栈空回到 pending', () => {
    const store = createToastStore(testLog);
    const outerLease = store.registerHost(() => {});
    const innerLease = store.registerHost(() => {});

    outerLease?.release();
    innerLease?.release();
    store.publish(entry(1, 'A'));
    expect(store.pendingEntry()?.message).toBe('A');
  });

  test('release 幂等 —— 重复调用不会误摘新 owner', () => {
    const store = createToastStore(testLog);
    const outer: ToastDelivery[] = [];
    store.registerHost((d) => outer.push(d));
    const inner = store.registerHost(() => {});

    inner?.release();
    inner?.release();
    store.publish(entry(1, 'A'));
    expect(outer.map((d) => d.entry.message)).toEqual(['A']);
  });

  test('接管者补投 pending 时抛错 → null lease,且把挂起的前任放回 owner', () => {
    const store = createToastStore(testLog);
    const outer: ToastDelivery[] = [];
    store.registerHost((d) => outer.push(d));
    // 中间这个 Host 接管后在投递时抛错:owner 被作废、消息退回 pending,
    // 但前任还挂在栈上 —— 这就是「有 pending + 有挂起者」的局面
    store.registerHost(() => {
      throw new Error('middle host failed');
    });
    store.publish(entry(1, 'A'));
    expect(store.pendingEntry()?.message).toBe('A');

    // 再来一个也在补投时抛错:它自己拿 null lease,但不能把栈里的前任一起埋掉
    expect(
      store.registerHost(() => {
        throw new Error('next host failed');
      })
    ).toBeNull();

    store.publish(entry(2, 'B'));
    expect(outer.map((d) => d.entry.message)).toEqual(['B']);
  });

  test('前任的 clear 回调抛错 → 就地作废,不入栈也不会被恢复', () => {
    const store = createToastStore(testLog);
    const outer: ToastDelivery[] = [];
    store.registerHost(
      (d) => outer.push(d),
      () => {
        throw new Error('clear failed');
      }
    );
    const inner = store.registerHost(() => {});

    inner?.release();
    store.publish(entry(1, 'A'));
    // 坏掉的前任没有回到 owner —— 回到「无 Host」语义,消息留在 pending
    expect(outer).toHaveLength(0);
    expect(store.pendingEntry()?.message).toBe('A');
  });

  test('归还重投时前任抛错 → 继续往下弹,不把更外层的 Host 埋掉', () => {
    const store = createToastStore(testLog);
    const l1: ToastDelivery[] = [];
    store.registerHost((d) => l1.push(d));
    store.registerHost(() => {
      throw new Error('l2 failed');
    });
    const l3 = store.registerHost(() => {});
    store.publish(entry(1, 'A'));

    l3?.release();
    store.publish(entry(2, 'B'));
    expect(l1.map((d) => d.entry.message)).toEqual(['B']);
  });

  test('三层嵌套按栈序逐级归还', () => {
    const store = createToastStore(testLog);
    const seen: string[] = [];
    const captured: ToastDelivery[] = [];
    const track = (tag: string) => (d: ToastDelivery) => {
      seen.push(`${tag}:${d.entry.message}`);
      captured.push(d);
    };
    /** 让当前这条播完 —— 归还时没有在途投递要交回,只剩纯粹的栈序。 */
    const finishLatest = () => {
      const last = captured[captured.length - 1];
      if (last) store.complete(last.ownerToken, last.leaseId, last.entry.id);
    };

    store.registerHost(track('L1'));
    const l2 = store.registerHost(track('L2'));
    const l3 = store.registerHost(track('L3'));

    store.publish(entry(1, 'A'));
    finishLatest();
    l3?.release();
    store.publish(entry(2, 'B'));
    finishLatest();
    l2?.release();
    store.publish(entry(3, 'C'));

    expect(seen).toEqual(['L3:A', 'L2:B', 'L1:C']);
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
