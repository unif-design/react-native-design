import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type SheetContentMode = 'fixed' | 'scroll' | 'external-scroll';

export interface SheetProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  /** 页脚工具区材质；正文仍使用实色表面。 */
  footerSurface?: 'solid' | 'glass';
  contentMode?: SheetContentMode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
