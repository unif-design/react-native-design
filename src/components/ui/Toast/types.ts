/** Toast 类型：info=灰点 / success=绿点 / error=红点 */
export type ToastKind = 'info' | 'success' | 'error';

/**
 * `toast(...)` 调用入参：
 * - 字符串简写：默认 info kind 跟 2200ms duration
 * - 对象形式：可指定 kind 跟 duration
 */
export type ToastInput =
  | string
  | {
      /** 消息文本 */
      message: string;
      /** Toast 类型，默认 'info' */
      kind?: ToastKind;
      /** 自动消失毫秒数，默认 2200 */
      duration?: number;
    };

export type ToastEntry = {
  /** 唯一 id（自增），用于动画切换识别 */
  id: number;
  /** 消息文本 */
  message: string;
  /** Toast 类型 */
  kind: ToastKind;
  /** 显示毫秒数 */
  duration: number;
};

/** Toast 订阅者函数签名（ToastHost 内部用） */
export type Subscriber = (entry: ToastEntry) => void;

export type ToastHostProps = {
  /** E2E / 测试定位（业务读 toast 文本时用） */
  testID?: string;
};
