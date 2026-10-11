import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type GlassEffect = 'clear' | 'regular';

export interface GlassLayerProps {
  /** 玻璃材质，默认 regular；clear 更通透。Web 使用对应的 CSS 近似效果。 */
  effect?: GlassEffect;
  /** 可选材质染色；原生默认不额外染色，由系统呈现。实色降级采用对应主题 surface。 */
  tintColor?: ColorValue;
  /** 默认继承主题；相机等固定白色前景可指定 dark，前景色仍由内容负责。 */
  colorScheme?: 'light' | 'dark';
  /** 布局、定位与圆角；默认 absoluteFill，材质颜色通过 tintColor 设置。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位。 */
  testID?: string;
}
