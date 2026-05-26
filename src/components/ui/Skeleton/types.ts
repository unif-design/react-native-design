import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';

export type SkeletonShape = 'line' | 'rect' | 'circle';

export type SkeletonProps = {
  /** 形状,默认 'rect'。
   *  - 'line' → width 100% / height 11 / radius 3(文本占位)
   *  - 'rect' → width 100% / height 80 / radius 8(图片或卡片占位)
   *  - 'circle' → size×size,radius = size/2(头像占位) */
  shape?: SkeletonShape;
  /** 宽度(line / rect)。circle 形态忽略,走 size */
  width?: DimensionValue;
  /** 高度(line / rect)。circle 形态忽略,走 size */
  height?: number;
  /** 直径(circle),默认 40。line / rect 忽略 */
  size?: number;
  /** 覆盖圆角:line 默认 3 / rect 默认 8 / circle = size/2 */
  radius?: number;
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
