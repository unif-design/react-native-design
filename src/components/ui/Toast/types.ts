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

export type ToastEntry = {
  /** 唯一 id（自增）—— 退场守卫用:ToastHost 只清「仍是当前」的 toast,避免清掉竞态期到达的新 toast */
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

/** Toast 订阅者函数签名（ToastHost 内部用） */
export type Subscriber = (entry: ToastEntry) => void;

export type ToastHostProps = {
  /** E2E / 测试定位（业务读 toast 文本时用） */
  testID?: string;
};
