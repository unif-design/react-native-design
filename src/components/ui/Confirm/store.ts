import type { Logger } from '../../../utils/logger';
import type { ConfirmOptions } from './types';

/**
 * Confirm 的纯状态机 —— 不含任何 React / 渲染依赖,可直接单测。
 *
 * 两条不变量:
 * 1. **单一活跃 owner + 栈式接管** —— 同一时间只有一个 `<ConfirmHost />` 收事件,但
 *    后挂载者**接管**、前任入栈挂起,卸载时自动归还。RN `Modal` 是独立 native window,
 *    根 Host 渲染的对话框会被 Modal 物理盖住(iOS 兄弟 Modal 更是不叠放),所以
 *    「Modal 内自挂一个 Host」是唯一正解、必须是合法用法 —— 旧的 first-wins 把它判成
 *    恒惰性死码,才是要修的东西。
 * 2. **唯一 active entry** —— 同一时间只有一个未决对话框。所有关闭路径(确认 / 取消 /
 *    backdrop / 系统返回 / Host 卸载 / owner 切换 / subscriber 抛错)都汇聚到 `settle()`。
 *
 * 由 1 派生出一条关键不变量:**active entry 永远属于当前 owner**。owner 每次切换
 * (接管或归还)前都把 active 排空为 `false`,因此挂起中的 owner 手里不可能有未决
 * 对话框,恢复时也不会继承一个自己没见过 `show` 的槽位。
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
   * 幂等:重复调用、或本 owner 早已被接管者顶下去,都是无副作用的 no-op。
   */
  release(heldEntry: ConfirmEntry | null): void;
};

export type ConfirmStore = {
  request(options: ConfirmOptions): Promise<boolean>;
  /** 挂载 Host。恒返回可用 lease —— 已有 owner 时走接管,不再拒绝。 */
  registerHost(subscriber: ConfirmSubscriber): ConfirmHostLease;
  settle(entry: ConfirmEntry, result: boolean): boolean;
  activeEntry(): ConfirmEntry | null;
};

type Owner = { token: symbol; subscriber: ConfirmSubscriber | null };

export function createConfirmStore(log: Logger): ConfirmStore {
  let nextId = 0;
  let active: ConfirmEntry | null = null;
  let owner: Owner | null = null;
  /** 被接管而挂起的前任,栈顶 = 最近一个。当前 owner 卸载时从这里恢复。 */
  const suspended: Owner[] = [];

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
        // 只作废「抛错时捕获到的那个 owner」;期间若已 cleanup / 换人,不能误伤新 owner。
        // clear 回调可能同步 request() 出新 entry:先摘 owner 再 settle,避免再次回调已坏的
        // subscriber,同时保证新 Promise 不会以「active 但无 owner」永久悬挂。
        if (owner?.token === current.token) {
          owner = null;
          const reentrant = active;
          if (reentrant) settle(reentrant, false);
        }
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
        'confirm() 调用时未挂载 <ConfirmHost />,对话框无法显示,已 resolve(false)。请在 app 根附近挂一个 <ConfirmHost />。'
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

  /**
   * owner 切换前把 active 排空为 `false` —— Promise 不悬挂、单例槽不被带走。
   *
   * 每轮 settle 成功即 `active = null`,只有 clear 回调同步再 `request()` 时才会多转
   * 一轮;settle 返回 false(排不动)立即退出,不给死循环留口子。
   */
  function drainActive(): void {
    while (active) {
      if (!settle(active, false)) break;
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

  function registerHost(subscriber: ConfirmSubscriber): ConfirmHostLease {
    const token = Symbol('ConfirmHostOwner');
    const self: Owner = { token, subscriber };
    if (owner) {
      // 先排空再换人:此刻前任仍是 owner,clear 事件正好发给它,它的对话框就地关闭。
      // 顺序反过来(先换 owner 再 settle)clear 会误投给刚接管的新 Host。
      drainActive();
      // 排空期间 clear 回调若抛错,settle 已把前任作废(owner 置 null)—— 作废的不入栈,
      // 免得恢复出一个死订阅;若回调期间又有人注册,入栈的就是那位,同样不丢。
      const outgoing = owner;
      if (outgoing) suspended.push(outgoing);
    }
    owner = self;
    return {
      ownerToken: token,
      release(heldEntry: ConfirmEntry | null): void {
        const index = suspended.indexOf(self);
        if (index >= 0) {
          // 乱序卸载(父 Modal 先于内层 Host 卸载):挂起者的 active 在被接管时已结算,
          // 这里只把它摘出栈,绝不能碰当前 owner。
          suspended.splice(index, 1);
          self.subscriber = null;
          return;
        }
        if (owner?.token !== token) return;
        // 先摘订阅,再结算:settle 内部发的 clear 事件不应再回到正在卸载的 Host。
        self.subscriber = null;
        owner = null;
        if (heldEntry) settle(heldEntry, false);
        const successor = popSuspended();
        if (successor) {
          // 归还前再排空一次:前任没见过残留 entry 的 show,不能让它继承一个锁死的槽。
          // 此刻 owner 为 null,排空不会发出任何 clear。
          drainActive();
          owner = successor;
        }
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
