import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Tag 配色变体：
 * - `neutral` 灰底（默认） / `brand` 橙底（活动标签）
 * - `success` 绿底 / `error` 红底 / `info` 蓝底（语义标签）
 * - `outline` 仅描边（不填底，承载更轻）
 */
export type TagVariant =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'error'
  | 'info'
  | 'outline';

/** Tag 尺寸：md=22 (h) / lg=26 (h) */
export type TagSize = 'md' | 'lg';

export type TagProps = {
  /** 标签文字 */
  label: string;
  /** 配色变体，默认 'neutral' */
  variant?: TagVariant;
  /** 尺寸，默认 'md' */
  size?: TagSize;
  /** 额外样式覆盖 */
  style?: StyleProp<ViewStyle>;
  /** 文本 numberOfLines，默认 1（超长 ellipsis） */
  numberOfLines?: number;
  /** E2E / 测试定位 */
  testID?: string;
};
