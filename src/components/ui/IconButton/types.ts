import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';
import type { ButtonSize, ButtonVariant } from '../Button/types';

export type IconButtonProps = {
  /** 图标名 */
  icon: IconName;
  /** 点击;disabled 时不触发 */
  onPress?: () => void;
  /** 尺寸,默认 'md'(28 / 36 / 44 方形) */
  size?: ButtonSize;
  /** 视觉变体,默认 'ghost'(透明底,适合 header right-tray 场景) */
  variant?: ButtonVariant;
  /** Icon 颜色 override —— 不传走 variant.palette.fg(品牌一致默认);
   *  caller 显式控制 icon 色场景(eg NavBar 内部按 variant 推导出 foreground /
   *  onPrimary)。仅影响 icon 色,bg/border 仍由 variant palette 决定。 */
  color?: string;
  /** 整体禁用:opacity 0.5 + 不响应 */
  disabled?: boolean;
  /** **必填** — 无文本提示语义,SR 需要 */
  accessibilityLabel: string;
  /** SR 朗读 label 后的行为说明 hint。仅在"行为不显然"时加。 */
  accessibilityHint?: string;
  /** 额外样式 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
