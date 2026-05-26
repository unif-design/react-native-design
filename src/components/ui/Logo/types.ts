import type { ImageStyle, StyleProp } from 'react-native';

export type LogoProps = {
  /** 渲染尺寸（正方形）。默认 64。 */
  size?: number;
  /** 覆盖圆角。默认 `size / 4`，呈柔和的 squircle。 */
  borderRadius?: number;
  /** 无障碍朗读文本。默认 'Unif';业务侧需要 APP_NAME 时显式传入。 */
  label?: string;
  style?: StyleProp<ImageStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
