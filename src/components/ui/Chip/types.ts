import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** 整体禁用:opacity 0.5 + 不响应 onPress + accessibilityState.disabled */
  disabled?: boolean;
  /** 处理中(点了、请求在飞):leading 位换 spinner + opacity 0.6 + 不响应二次点击 +
   *  accessibilityState.busy。label 保留 —— 换掉它 chip 会塌成一个圆点、整行跟着重排。
   *  与 `disabled` 的分工:disabled = 现在不能点(更暗、无 spinner),busy = 正在办。 */
  busy?: boolean;
  /** 可选的前置插槽 —— 如 <Icon name="spark" /> */
  leading?: ReactNode;
  /** 可选的后置插槽 —— 如一个小的 × 关闭按钮 */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
