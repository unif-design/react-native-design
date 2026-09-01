import type { StyleProp, ViewStyle } from 'react-native';

export type CircularProgressProps = {
  /** 当前进度，使用 0..1；越界值会收敛到边界，非有限值按 0 处理。 */
  value: number;
  /** 圆环直径，默认 32，最小 16。 */
  size?: number;
  /** 圆环描边宽度，默认 2，最大为半径。 */
  thickness?: number;
  /** 进度颜色，默认 c.primary。 */
  color?: string;
  /** 轨道颜色，默认 c.outline。 */
  trackColor?: string;
  /** 是否在圆环中央显示取整后的百分比，默认 false。 */
  showLabel?: boolean;
  /** 百分比文字颜色，默认 c.foreground。 */
  labelColor?: string;
  /** 进度条可访问性名称，默认“进度”。 */
  accessibilityLabel?: string;
  /** 外层布局样式。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位。 */
  testID?: string;
};
