import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export type RevealProps = {
  children: ReactNode;
  /** 唯一公开容器样式；Web 动画完成后保留 caller opacity。 */
  style?: StyleProp<ViewStyle>;
  /** 入/出场时长（毫秒，默认 motion.base = 200） */
  duration?: number;
  /** E2E / 测试定位 */
  testID?: string;
};
