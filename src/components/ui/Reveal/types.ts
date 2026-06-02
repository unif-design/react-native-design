import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type RevealProps = {
  children: ReactNode;
  /** 容器样式 */
  style?: StyleProp<ViewStyle>;
  /** 入/出场时长（毫秒，默认 motion.base = 200） */
  duration?: number;
  /** E2E / 测试定位 */
  testID?: string;
};
