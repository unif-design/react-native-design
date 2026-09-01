import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type RibbonTone = 'brand' | 'danger';

export type RibbonProps = {
  /** 右上缎带的可见文案 */
  label: string;
  /** 语义色，默认 'brand' */
  tone?: RibbonTone;
  /** 被缎带标记的内容 */
  children: ReactNode;
  /** 可选读屏文案；不传时缎带只作为装饰，避免与内容重复播报 */
  accessibilityLabel?: string;
  /** 外层布局样式 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
