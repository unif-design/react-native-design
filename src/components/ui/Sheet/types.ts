import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type SheetContentMode = 'fixed' | 'scroll' | 'external-scroll';

export interface SheetProps {
  children: ReactNode;
  header?: ReactNode;
  /** 滚动正文可经过标题背后；固定或外部滚动内容仍由调用方布局。 */
  headerMode?: 'fixed' | 'overlay';
  footer?: ReactNode;
  /** 页脚工具区默认 glass；正文仍使用实色表面。 */
  footerSurface?: 'solid' | 'glass';
  contentMode?: SheetContentMode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
