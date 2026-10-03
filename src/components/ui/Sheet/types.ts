import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type SheetContentMode = 'fixed' | 'scroll' | 'external-scroll';

export interface SheetProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  contentMode?: SheetContentMode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
