import type { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';

/** 头像尺寸（对应 avatar.xs..xl）：xs=18 / sm=28 / md=32 / lg=40 / xl=56 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 头像配色变体（仅在显示 letter / fallback 时生效，showImage 时被覆盖）：
 * - `brand` 品牌橙底（AI 头像专用）
 * - `info` 蓝底（用户头像专用）
 * - `soft` 浅橙底（次要场景）
 * - `neutral` 中性灰底（默认）
 */
export type AvatarVariant = 'brand' | 'info' | 'soft' | 'neutral';

export type AvatarProps = {
  /**
   * 头像里显示的文字（建议 1-2 字符）。
   * 同时作为 a11y label（screen reader 朗读）；source 加载失败时回退展示。
   */
  label: string;
  /** 尺寸，默认 'md' */
  size?: AvatarSize;
  /** 配色变体，默认 'neutral' */
  variant?: AvatarVariant;
  /**
   * 真实头像图片（URL `{ uri: '...' }`、URI source 数组或 `require(...)`）。
   * 运行时先校验并生成 immutable semantic snapshot；非法 source 直接 fallback。
   * Web 对 URI source 数组明确使用首个 candidate，native 保留完整数组。
   * class / custom prototype 只读取 own enumerable data，继承属性与 accessor 无效。
   * 等价 source 沿用同一 keyed attempt，真实字段变化才重试；失败 state 不跨
   * attempt 共享。
   */
  source?: ImageSourcePropType;
  /** 容器附加样式(margin / position 等布局微调)。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
