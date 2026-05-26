import type { StyleProp, ViewStyle } from 'react-native';

export type SpinnerProps = {
  /** 直径（含 stroke），默认 18；非有限或 < 8 会被钳到 8 */
  size?: number;
  /** 描边颜色，默认 c.primary 主橙 */
  color?: string;
  /** 描边宽度，默认 2 */
  thickness?: number;
  /** 额外样式 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
