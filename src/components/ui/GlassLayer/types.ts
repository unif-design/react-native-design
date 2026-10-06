import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type GlassEffect = 'clear' | 'regular';

export interface GlassLayerProps {
  /** 玻璃材质，默认 regular；clear 更通透。Web 使用对应的 CSS 近似效果。 */
  effect?: GlassEffect;
  /** 默认 clear 使用 glassTintLight，regular 使用 sheetBackdrop；降级时作为背景色。 */
  tintColor?: ColorValue;
  /** 布局、定位与圆角；默认 absoluteFill，材质颜色通过 tintColor 设置。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位。 */
  testID?: string;
}
