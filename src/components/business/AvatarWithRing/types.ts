import type { StyleProp, ViewStyle } from 'react-native';

export type AvatarWithRingProps = {
  /** 显示在中心的字符(通常 userName 首字母 / 中文名首字)。 */
  label: string;
  /**
   * 头像总直径(含 ring),默认 64(r() 缩放在内部)。
   * 视觉占比:label 字号约 size * 0.40,ring 宽度约 size * 0.0625。
   */
  size?: number;
  /** ring 颜色,默认 c.avatarRing(白系半透明)。 */
  ringColor?: string;
  /** 容器附加样式(margin / position 等定位)。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
