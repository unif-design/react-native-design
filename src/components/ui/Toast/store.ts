import type { Logger } from '../../../utils/logger';
import type { ToastEntry } from './types';

/**
 * Toast 的纯状态机 —— 不含任何 React / 渲染依赖,可直接单测。
 *
 * 与 Confirm 的语义**不同**,故意不抽成泛型事件总线:
 * - Confirm 是「一次决策」,需要 active entry + Promise;
 * - Toast 是「最新一条覆盖旧的」,需要 pending / delivery 双态。
 *
 * 双态模型:
 * - `pending` —— 还没有 Host 接住的最新一条消息。**latest-wins**:后来的直接覆盖,
 *   不排队(toast 是瞬时反馈,补投一串历史消息毫无意义)。
 * - `delivered` —— 已交给当前 Host 的那一条,带 `ownerToken` + `leaseId` + `entry.id`
 *   三重身份。Host 的每个 timer / RAF / 动画完成回调在动 UI 前都必须用这三项做 CAS,
 *   否则旧回调会把新 toast 提前抹掉(经典竞态:A 的 3s 定时器在 B 显示后才触发)。
 *
 * `leaseId` 单调递增,同一 entry 被重新投递(Host 重挂)也会拿到新的 leaseId ——
 * 仅比较 entry.id 不足以区分「同一条消息的两次投递」。
 *
 * **栈式 owner**(与 Confirm 同构):后挂载的 Host 接管投递,前任入栈挂起并收到 clear,
 * 接管者卸载后自动归还。RN `Modal` 是独立 native window,根 Host 渲染的 toast 会被
 * Modal 物理盖住,只有「Modal 内自挂一个 Host」能显示 —— 旧的 first-wins 把这条唯一
 * 正解判成恒惰性死码。切换瞬间**在途 toast 直接丢弃**:toast 是瞬态反馈,接管发生在
 * Modal 开 / 关那一刻,把它搬到另一个 owner 上重放没有意义。
 */

export type ToastDelivery = {
  entry: ToastEntry;
  ownerToken: symbol;
  leaseId: number;
};

export type ToastSubscriber = (delivery: ToastDelivery) => void;

/**
 * owner 被接管 / 归还时的撤回通知 —— 对应 Confirm 的 `clear` 事件。
 *
 * 没有它,挂起中的 Host 会把最后一条 toast **冻在屏幕上**:store 已丢弃那次投递,
 * Host 自己的退场 timer 过不了 `isCurrent` CAS,永远走不到清 UI 那一步。
 */
export type ToastClearSubscriber = () => void;

export type ToastHostLease = {
  readonly ownerToken: symbol;
  /** Host 卸载。幂等:重复调用、或本 owner 已被摘掉,都是无副作用的 no-op。 */
  release(): void;
};

export type ToastStore = {
  publish(entry: ToastEntry): void;
  /**
   * 挂载 Host。已有 owner 时走接管(不再拒绝);返回 `null` 只剩一种含义 ——
   * 补投 pending 时 subscriber 抛错,这个 owner 当场就被作废了。
   */
  registerHost(
    subscriber: ToastSubscriber,
    onClear?: ToastClearSubscriber
  ): ToastHostLease | null;
  complete(ownerToken: symbol, leaseId: number, entryId: number): boolean;
  isCurrent(delivery: ToastDelivery): boolean;
  pendingEntry(): ToastEntry | null;
  currentDelivery(): ToastDelivery | null;
};

type Owner = {
  token: symbol;
  subscriber: ToastSubscriber | null;
  onClear: ToastClearSubscriber | null;
};

export function createToastStore(log: Logger): ToastStore {
  let pending: ToastEntry | null = null;
  let delivered: ToastDelivery | null = null;
  let owner: Owner | null = null;
  let leaseCounter = 0;
  /** 被接管而挂起的前任,栈顶 = 最近一个。当前 owner 卸载时从这里恢复。 */
  const suspended: Owner[] = [];

  function beginDelivery(entry: ToastEntry, capturedOwner: Owner): void {
    const delivery: ToastDelivery = {
      entry,
      ownerToken: capturedOwner.token,
      leaseId: ++leaseCounter,
    };
    // 先原子地把 pending 取走并落 delivered,再调 subscriber:subscriber 内同步
    // 再 publish 时看到的必须是「已投递」而不是「还在 pending」的半状态。
    pending = null;
    delivered = delivery;
    try {
      capturedOwner.subscriber?.(delivery);
    } catch (error) {
      log.error('ToastHost subscriber 抛错', error);
      // 期间若 owner 已换人 / 已被作废,这次抛错不能牵连新 owner 或覆盖更新的 pending。
      if (owner?.token !== capturedOwner.token) return;
      owner = null;
      if (delivered?.ownerToken === capturedOwner.token) {
        // 回存的是 delivered 而非 entry:subscriber 内可能已同步投递了更新的一条,
        // 那条才是当前逻辑消息(latest-wins)。已 complete 的则 delivered 为 null,不复活。
        pending = delivered.entry;
        delivered = null;
      }
    }
  }

  function publish(entry: ToastEntry): void {
    const current = owner;
    // 未挂 Host 是**受支持路径**,不告警:启动早期的 toast 应当在 Host 挂上后补投。
    if (!current?.subscriber) {
      pending = entry;
      return;
    }
    beginDelivery(entry, current);
  }

  /** 把前任降为挂起态:丢弃它的在途投递,并通知它收起屏幕上那条 toast。 */
  function suspendOwner(target: Owner): void {
    // 不回退到 pending —— 否则接管者一挂上就把前任那条补投一遍(跨 owner 重放)。
    if (delivered?.ownerToken === target.token) delivered = null;
    const notify = target.onClear;
    if (!notify) return;
    try {
      notify();
    } catch (error) {
      log.error('ToastHost clear 回调抛错', error);
      // 坏 Host 就地作废:留在栈里也只会在恢复时接着抛。
      target.subscriber = null;
      target.onClear = null;
    }
  }

  /** 弹出最近一个仍可用的挂起 owner;抛错被作废的(subscriber 已置空)直接丢弃。 */
  function popSuspended(): Owner | null {
    while (suspended.length > 0) {
      const next = suspended.pop();
      if (next?.subscriber) return next;
    }
    return null;
  }

  function registerHost(
    subscriber: ToastSubscriber,
    onClear?: ToastClearSubscriber
  ): ToastHostLease | null {
    const token = Symbol('ToastHostOwner');
    const self: Owner = { token, subscriber, onClear: onClear ?? null };
    const previous = owner;
    // 先换 owner 再通知前任:clear 回调里同步 publish() 的那条应当投给**接管者**,
    // 投给正在退场的前任会立刻变成一条冻在屏幕上的孤儿 toast。
    //(Confirm 那侧顺序相反 —— 它的 clear 由 settle 发给当时的 owner,必须先排空。)
    owner = self;
    if (previous) {
      suspendOwner(previous);
      // clear 回调抛错作废的前任不入栈,免得恢复出一个死订阅。
      if (previous.subscriber) suspended.push(previous);
    }
    if (pending) beginDelivery(pending, self);
    // 首投期间 subscriber 抛错会把 owner 作废 —— 此时不能发出可用的 lease,
    // 并且要立刻把刚挂起的前任放回 owner,否则栈里的人再也醒不过来。
    if (owner?.token !== token) {
      const fallback = popSuspended();
      if (fallback) owner = fallback;
      return null;
    }
    return {
      ownerToken: token,
      release(): void {
        const index = suspended.indexOf(self);
        if (index >= 0) {
          // 乱序卸载(父 Modal 先于内层 Host 卸载):挂起者的在途投递在被接管时已丢弃,
          // 这里只把它摘出栈,绝不能碰当前 owner。
          suspended.splice(index, 1);
          self.subscriber = null;
          self.onClear = null;
          return;
        }
        if (owner?.token !== token) return;
        self.subscriber = null;
        self.onClear = null;
        owner = null;
        const mine = delivered?.ownerToken === token ? delivered : null;
        if (mine) delivered = null;
        const successor = popSuspended();
        // 有前任接手 → 在途 toast 丢弃(与接管同一条切换语义);无人接手 → 退回
        // pending,让下一个挂上来的 Host 补投(Host 重挂 / 热重载);更新的 pending 优先。
        if (mine && !successor && !pending) pending = mine.entry;
        if (successor) owner = successor;
      },
    };
  }

  function complete(
    ownerToken: symbol,
    leaseId: number,
    entryId: number
  ): boolean {
    const current = delivered;
    if (!current) return false;
    if (current.ownerToken !== ownerToken) return false;
    if (current.leaseId !== leaseId) return false;
    if (current.entry.id !== entryId) return false;
    delivered = null;
    return true;
  }

  function isCurrent(delivery: ToastDelivery): boolean {
    const current = delivered;
    return (
      current !== null &&
      current.ownerToken === delivery.ownerToken &&
      current.leaseId === delivery.leaseId &&
      current.entry.id === delivery.entry.id
    );
  }

  return {
    publish,
    registerHost,
    complete,
    isCurrent,
    pendingEntry: () => pending,
    currentDelivery: () => delivered,
  };
}
