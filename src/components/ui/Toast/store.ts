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
 */

export type ToastDelivery = {
  entry: ToastEntry;
  ownerToken: symbol;
  leaseId: number;
};

export type ToastSubscriber = (delivery: ToastDelivery) => void;

export type ToastHostLease = {
  readonly ownerToken: symbol;
  release(): void;
};

export type ToastStore = {
  publish(entry: ToastEntry): void;
  registerHost(subscriber: ToastSubscriber): ToastHostLease | null;
  complete(ownerToken: symbol, leaseId: number, entryId: number): boolean;
  isCurrent(delivery: ToastDelivery): boolean;
  pendingEntry(): ToastEntry | null;
  currentDelivery(): ToastDelivery | null;
};

type Owner = { token: symbol; subscriber: ToastSubscriber | null };

export function createToastStore(log: Logger): ToastStore {
  let pending: ToastEntry | null = null;
  let delivered: ToastDelivery | null = null;
  let owner: Owner | null = null;
  let leaseCounter = 0;

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

  function registerHost(subscriber: ToastSubscriber): ToastHostLease | null {
    if (owner) {
      log.warn(
        '检测到多个 <ToastHost />。只有第一个生效,重复挂载的实例保持惰性 —— 请在 app 根只挂一次。'
      );
      return null;
    }
    const token = Symbol('ToastHostOwner');
    const self: Owner = { token, subscriber };
    owner = self;
    if (pending) beginDelivery(pending, self);
    // 首投期间 subscriber 抛错会把 owner 作废 —— 此时不能发出可用的 lease。
    if (owner?.token !== token) return null;
    return {
      ownerToken: token,
      release(): void {
        if (owner?.token !== token) return;
        self.subscriber = null;
        owner = null;
        if (delivered?.ownerToken === token) {
          // 未完成的投递退回 pending,让下一个 Host 能补投;但更新的 pending 优先。
          if (!pending) pending = delivered.entry;
          delivered = null;
        }
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
