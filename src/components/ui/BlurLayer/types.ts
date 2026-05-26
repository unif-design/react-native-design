import type { StyleProp, ViewStyle } from 'react-native';
import type { BlurIntensity } from '@/theme';

export type BlurLayerProps = {
  /** 模糊强度,对齐设计稿 token:
   *  - 'soft' = blurAmount 10,玻璃数据条 / 小区域玻璃感
   *  - 'strong' = blurAmount 40,焦点引导 backdrop */
  intensity: BlurIntensity;
  /** Tint override(不传按 intensity 推:soft → c.glassTintLight / strong → c.sheetBackdrop) */
  tint?: string;
  /** 附加样式;默认 absoluteFill,caller 通常不需要传 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
