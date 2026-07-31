import type { Logger } from '../../../utils/logger';
import type { ConfirmOptions } from './types';

/**
 * Confirm 的纯状态机 —— 不含任何 React / 渲染依赖,可直接单测。
 *
 * 两条不变量:
 * 1. **唯一 owner** —— 同一时间只有一个 `<ConfirmHost />` 持有订阅。重复挂载拿到 `null`
 *    lease、永久惰性,不会出现两个 Host 争抢同一个 entry。
 * 2. **唯一 active entry** —— 同一时间只有一个未决对话框。所有关闭路径(确认 / 取消 /
 *    backdrop / 系统返回 / Host 卸载 / subscriber 抛错)都汇聚到 `settle()`。
 *
 * `settle()` 用 **identity guard**(`active !== entry` 直接返回 false)而非 id 比较:
 * 旧 entry 的迟到回调拿着的是旧对象引用,永远匹配不上新 active,因此不可能误关新对话框。
 */

export type ConfirmEntry = {
  id: number;
  options: Readonly<ConfirmOptions>;
  settled: boolean;
  resolve: (result: boolean) => void;
};

export type ConfirmEvent =
  | { type: 'show'; entry: ConfirmEntry }
  | { type: 'clear'; id: number };

export type ConfirmSubscriber = (event: ConfirmEvent) => void;

export type ConfirmHostLease = {
  readonly ownerToken: symbol;
  /**
   * Host 卸载。`heldEntry` 是 Host 当时手里那个未决 entry(没有则传 `null`)——
   * 只有它仍是 active 时才会被 settle 成 `false`,避免误伤后来的对话框。
   */
  release(heldEntry: ConfirmEntry | null): void;
};

export type ConfirmStore = {
  request(options: ConfirmOptions): Promise<boolean>;
  registerHost(subscriber: ConfirmSubscriber): ConfirmHostLease | null;
  settle(entry: ConfirmEntry, result: boolean): boolean;
  activeEntry(): ConfirmEntry | null;
};

type Owner = { token: symbol; subscriber: ConfirmSubscriber | null };

export function createConfirmStore(log: Logger): ConfirmStore {
  let nextId = 0;
  let active: ConfirmEntry | null = null;
  let owner: Owner | null = null;

  function settle(entry: ConfirmEntry, result: boolean): boolean {
    if (entry.settled || active !== entry) return false;
    // 先翻状态、再断开 active,最后才 resolve —— resolve 的 then 回调可能同步重入
    // request(),那时必须已经看到「无 active」而不是半更新状态。
    entry.settled = true;
    active = null;
    entry.resolve(result);
    const current = owner;
    if (current?.subscriber) {
      try {
        current.subscriber({ type: 'clear', id: entry.id });
      } catch (error) {
        log.error('ConfirmHost clear subscriber 抛错', error);
        // 只作废「抛错时捕获到的那个 owner」;期间若已换人,不能误伤新 owner。
        if (owner?.token === current.token) owner = null;
      }
    }
    return true;
  }

  function request(options: ConfirmOptions): Promise<boolean> {
    if (active) {
      log.warn(
        'confirm() 已有一个对话框在显示,新请求被拒绝(同一时间只 1 个,避免叠加)。'
      );
      return Promise.resolve(false);
    }
    // 没有 Host 订阅 → entry 无人接收,Promise 会永久悬挂、调用方 await 卡死。
    // 立即 resolve(false) 且不占 active(否则后续 confirm 全被重入分支锁死)。
    const current = owner;
    if (!current?.subscriber) {
      log.warn(
        'confirm() 调用时未挂载 <ConfirmHost />,对话框无法显示,已 resolve(false)。请在 app 根附近挂一次 <ConfirmHost />。'
      );
      return Promise.resolve(false);
    }
    return new Promise<boolean>((resolve) => {
      const entry: ConfirmEntry = {
        id: ++nextId,
        options,
        settled: false,
        resolve,
      };
      active = entry;
      try {
        current.subscriber?.({ type: 'show', entry });
      } catch (error) {
        log.error('ConfirmHost show subscriber 抛错', error);
        if (owner?.token === current.token) owner = null;
        // Host 没能接住 entry:直接结算,否则 Promise 永久悬挂并锁死单例。
        // 此处不能走 settle() —— owner 已被作废,clear 事件无处可发。
        entry.settled = true;
        if (active === entry) active = null;
        resolve(false);
      }
    });
  }

  function registerHost(
    subscriber: ConfirmSubscriber
  ): ConfirmHostLease | null {
    if (owner) {
      log.warn(
        '检测到多个 <ConfirmHost />。只有第一个生效,重复挂载的实例保持惰性 —— 请在 app 根只挂一次。'
      );
      return null;
    }
    const token = Symbol('ConfirmHostOwner');
    const self: Owner = { token, subscriber };
    owner = self;
    return {
      ownerToken: token,
      release(heldEntry: ConfirmEntry | null): void {
        if (owner?.token !== token) return;
        // 先摘订阅,再结算:settle 内部发的 clear 事件不应再回到正在卸载的 Host。
        self.subscriber = null;
        owner = null;
        if (heldEntry) settle(heldEntry, false);
      },
    };
  }

  return {
    request,
    registerHost,
    settle,
    activeEntry: () => active,
  };
}
