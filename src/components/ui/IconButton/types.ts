import type { ComponentType } from 'react';
import type { IconProps } from '@unif/react-native-icons';
import type { AccessibilityState, StyleProp, ViewStyle } from 'react-native';
import type { ButtonSize, ButtonVariant } from '../Button/types';

/** IconButton 支持的视觉变体:排除 'text'——text 撕除高度,与 square 方形布局语义冲突。 */
export type IconButtonVariant = Exclude<ButtonVariant, 'text'>;

/** 传入后才启用原位二次确认；目标、版本和实际操作由调用方管理。 */
export type IconButtonConfirmation = {
  label: string;
  confirmationKey?: string | number;
} & (
  | { confirming: boolean; onRequest(): void; onCancel(): void }
  | { confirming?: undefined; onRequest?: () => void; onCancel?: () => void }
);

export interface IconButtonProps {
  /** 图标组件 */
  icon: ComponentType<IconProps>;
  /** 点击;disabled 时不触发 */
  onPress: () => void;
  /** 可选原位确认；未提供时单击直接执行 onPress。 */
  confirmation?: IconButtonConfirmation;
  /** 尺寸,默认 'md'(28 / 36 / 44 方形) */
  size?: ButtonSize;
  /** 独立图标及加载指示尺寸；默认沿用 size 对应值。 */
  iconSize?: number;
  /** 方形表面边长；同时据此补足 44pt 命中区。默认沿用 size。 */
  surfaceSize?: number;
  /** 默认 glass 自动适配系统材质；primary／danger／outline 保持实色，ghost／neutral 保持透明。
   *  不支持 'text'——text variant 撕除高度,与 square 方形布局冲突。 */
  variant?: IconButtonVariant;
  /** Icon 颜色 override —— 不传走 variant.palette.fg(品牌一致默认);
   *  caller 显式控制 icon 色场景(eg NavBar 内部按 variant 推导出 foreground /
   *  onPrimary)。影响 icon 和确认文字颜色,bg/border 仍由 variant palette 决定。 */
  color?: string;
  /** 整体禁用:opacity 0.5 + 不响应 */
  disabled?: boolean;
  /** 加载态:显示 ActivityIndicator 替代 icon,自动 disabled */
  loading?: boolean;
  /** **必填** — 无文本提示语义,SR 需要 */
  accessibilityLabel: string;
  /** SR 朗读 label 后的行为说明 hint。仅在"行为不显然"时加。 */
  accessibilityHint?: string;
  /** 额外 a11y 状态；disabled / busy 由组件根据 disabled / loading 统一上报。 */
  accessibilityState?: Omit<AccessibilityState, 'disabled' | 'busy'>;
  /** 额外样式 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
}
