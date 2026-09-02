import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import type { AvatarShape, AvatarSize, AvatarVariant } from '../Avatar';

export type AvatarGroupItem = Readonly<{
  /** 列表内唯一且稳定的身份键。 */
  key: string;
  /** 可见回退文字与 Avatar accessible name。 */
  label: string;
  source?: ImageSourcePropType;
  variant?: AvatarVariant;
}>;

type SharedAvatarGroupProps = {
  items: readonly AvatarGroupItem[];
  /** 所有成员共用的尺寸，默认 'md'。 */
  size?: AvatarSize;
  /** 所有成员与溢出位共用的形态，默认 'circle'。 */
  shape?: AvatarShape;
  /** 最大视觉位数量，包含 +N 溢出位，必须是大于等于 2 的整数。 */
  max?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type StaticOverflowProps = {
  onOverflowPress?: never;
  overflowAccessibilityLabel?: never;
  overflowAccessibilityHint?: never;
};

type ActionableOverflowProps = {
  onOverflowPress: () => void;
  /** 默认按实际数量生成“查看其余 N 位成员”。 */
  overflowAccessibilityLabel?: string;
  /** 描述打开弹层、抽屉或跳转等消费端结果。 */
  overflowAccessibilityHint?: string;
};

export type AvatarGroupProps = SharedAvatarGroupProps &
  (StaticOverflowProps | ActionableOverflowProps);
