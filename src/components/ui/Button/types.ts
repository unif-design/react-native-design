import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';

/** Button 尺寸：sm=28 / md=36 / lg=44（对应 control.sm/md/lg） */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button 视觉变体：
 * - `primary` 品牌橙底（主操作，业务页面通常只有 1 个）
 * - `secondary` 浅灰底（次要操作）
 * - `ghost` 透明底 + 品牌橙字（弱化的主操作；IconButton 用作"高亮 icon"）
 * - `neutral` 透明底 + 主文字色（深灰 / 白）—— 中性 icon-only 场景，
 *   避免 header right-tray 多个 icon 都染成主橙色，视觉过重
 * - `outline` 白底 + 灰边框 + 深色字（中性操作）
 * - `danger` 红底（破坏性操作：删除 / 退出 / 解绑）
 * - `text` 纯文字按钮，无背景无 padding（行内链接式触发）
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'neutral'
  | 'outline'
  | 'danger'
  | 'text';

export type ButtonProps = {
  /** 按钮文案；icon-only 场景请用 IconButton */
  label: string;
  /** 点击回调；disabled / loading 时不触发 */
  onPress?: () => void;
  /** 尺寸，默认 'md' */
  size?: ButtonSize;
  /** 视觉变体，默认 'primary' */
  variant?: ButtonVariant;
  /** 撑满父容器宽度（alignSelf: stretch + flexGrow: 1） */
  block?: boolean;
  /** 整体禁用：透明度 0.5 + 不响应 onPress */
  disabled?: boolean;
  /** 加载态：显示 ActivityIndicator 替代 label，自动 disabled */
  loading?: boolean;
  /** 左侧图标，与文本同色同高 */
  leftIcon?: IconName;
  /** 右侧图标，与文本同色同高 */
  rightIcon?: IconName;
  /** 额外样式覆盖（merge 到 Pressable 的 style 数组末尾） */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
  /** SR 朗读 label 后的行为说明 hint。仅在"行为不显然"时加(如 "切换主题")。 */
  accessibilityHint?: string;
};

/** ButtonBase 内部根据 size 算出的视觉参数集合,通过 render prop 暴露给消费者。 */
export type ButtonSizing = {
  /** 高度(对应 control.sm/md/lg) */
  h: number;
  /** 水平 padding(text variant 强制 0;square=true 也强制 0) */
  px: number;
  /** 字号(消费者据此 derive Icon size) */
  fs: number;
  /** 圆角(radius.sm/md/lg) */
  br: number;
  /** 内容之间 gap */
  gap: number;
};

/** ButtonBase 内部根据 variant + 主题色算出的调色板。 */
export type ButtonPalette = {
  bg: string;
  fg: string;
  border?: string;
};

/** ButtonBase children render prop 接收的上下文。 */
export type ButtonBaseRenderContext = {
  sizing: ButtonSizing;
  palette: ButtonPalette;
};
