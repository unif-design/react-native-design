import type { ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

export type LogoProps = {
  /** 品牌 logo 图片源 —— consumer 必传(`require('./logo.png')` / `{ uri: '...' }`)。 */
  source: ImageSourcePropType;
  /** 渲染尺寸(正方形)。默认 64。 */
  size?: number;
  /** 覆盖圆角。默认 `size / 4`,呈柔和的 squircle。 */
  borderRadius?: number;
  /** SR / 测试用文案,默认 'Logo'。 */
  label?: string;
  style?: StyleProp<ImageStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
