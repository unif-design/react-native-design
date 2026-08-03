import type { StyleProp, ViewStyle } from 'react-native';

export type SpinnerProps = {
  /** 直径（含 stroke），默认 18；非有限或 < 8 会被钳到 8 */
  size?: number;
  /** 描边颜色，默认 c.primary 主橙 */
  color?: string;
  /** 描边宽度，默认 2 */
  thickness?: number;
  /** 外层 layout 样式；width/height 可扩容，transform 不会覆盖内层旋转。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
