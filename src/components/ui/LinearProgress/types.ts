import type { StyleProp, ViewStyle } from 'react-native';

export interface LinearProgressProps {
  /** 当前进度，使用 0..1；越界值收敛到边界，非有限值按 0 处理。 */
  value: number;
  /** 进度条高度，默认 2；非有限或非正数按 2 处理。 */
  thickness?: number;
  /** 已完成部分颜色，默认主题 primary。 */
  color?: string;
  /** 轨道颜色，默认主题 surfaceContainer。 */
  trackColor?: string;
  /** 读屏名称，默认“进度”。 */
  accessibilityLabel?: string;
  /** 外层布局样式；位置和可用宽度由调用方决定。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位。 */
  testID?: string;
}
