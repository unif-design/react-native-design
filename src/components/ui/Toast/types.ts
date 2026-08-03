/** Toast 类型：info=灰点 / success=绿点 / error=红点 */
export type ToastKind = 'info' | 'success' | 'error';

/** Toast 显示位置：top=顶部 / bottom=底部(默认) / center=屏幕居中 */
export type ToastPosition = 'top' | 'bottom' | 'center';

/**
 * `toast(...)` 调用入参：
 * - 字符串简写：默认 info kind、bottom 位置、3000ms duration
 * - 对象形式：可指定 kind / duration / position
 */
export type ToastInput =
  | string
  | {
      /** 消息文本 */
      message: string;
      /** Toast 类型，默认 'info' */
      kind?: ToastKind;
      /** 自动消失毫秒数，默认 3000 */
      duration?: number;
      /** 显示位置，默认 'bottom' */
      position?: ToastPosition;
    };

/**
 * 归一化后的一条 toast。`id` 是**内部身份**,与 `ToastDelivery` 的 ownerToken /
 * leaseId 一起构成竞态守卫,不保证跨版本稳定 —— 业务不要依赖它的具体取值。
 */
export type ToastEntry = {
  /** 内部自增 id —— 竞态守卫的一环,Host 只处理「仍是当前投递」的回调 */
  id: number;
  /** 消息文本 */
  message: string;
  /** Toast 类型 */
  kind: ToastKind;
  /** 显示毫秒数 */
  duration: number;
  /** 显示位置 */
  position: ToastPosition;
};

// delivery / lease / subscriber 类型都在 `store.ts` —— 它们是 Host 与 Store 之间的
// 内部协议,不进公共 barrel。

export type ToastHostProps = {
  /** E2E / 测试定位（业务读 toast 文本时用） */
  testID?: string;
};
