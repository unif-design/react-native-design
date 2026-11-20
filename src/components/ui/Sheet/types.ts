import type { ReactNode } from 'react';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type SheetContentMode = 'fixed' | 'scroll' | 'external-scroll';

export interface SheetProps {
  children: ReactNode;
  header?: ReactNode;
  /** 滚动正文可经过标题背后；固定或外部滚动内容仍由调用方布局。 */
  headerMode?: 'fixed' | 'overlay';
  /** 悬浮标题区的材质；transparent 保留标题高度与正文滚动避让。 */
  headerSurface?: 'glass' | 'transparent';
  /** 内部正文滚离顶部后，悬浮标题改用此背景色；回到顶部恢复 headerSurface。 */
  scrolledHeaderBackgroundColor?: ColorValue;
  footer?: ReactNode;
  /** 页脚工具区默认 glass；正文仍使用实色表面。 */
  footerSurface?: 'solid' | 'glass';
  contentMode?: SheetContentMode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
