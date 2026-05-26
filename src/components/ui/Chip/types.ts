import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** 可选的前置插槽 —— 如 <Icon name="spark" /> */
  leading?: ReactNode;
  /** 可选的后置插槽 —— 如一个小的 × 关闭按钮 */
  trailing?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
