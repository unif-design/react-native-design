import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

export type LogoProps = {
  /** 品牌 logo 图片源 —— consumer 必传(`require('./logo.png')` / `{ uri: '...' }`)。 */
  source: ImageSourcePropType;
  /** 渲染尺寸(正方形)。默认 64。 */
  size?: number;
  /** 覆盖圆角。默认 `size / 4`,呈柔和的 squircle。 */
  borderRadius?: number;
  /** 非空时作为有意义图片的可访问名称；缺省时按装饰图片处理。 */
  accessibilityLabel?: string;
  style?: StyleProp<ImageStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
