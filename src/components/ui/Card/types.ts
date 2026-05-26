import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Card **视觉变体**（控制装饰，跟 `bare` 是正交维度）：
 * - `default`：白底 + 阴影 + 边框（标准卡片）
 * - `plain`：仅白底（无阴影无边框，承载更轻量，如 chat 气泡内嵌组件）
 * - `flat`：**deprecated** — 等价于 `plain`，新代码请用 `plain`。
 */
export type CardVariant = 'default' | 'flat' | 'plain';

export type CardProps = {
  /** Card 内容 */
  children: ReactNode;
  /** 视觉变体，默认 'default' */
  variant?: CardVariant;
  /** 自定义内边距（覆盖默认 padding） */
  padding?: number;
  /** 自定义圆角（覆盖默认 radius.md） */
  borderRadius?: number;
  /** 自定义边框色（覆盖默认 c.outline；仅 default/flat 有边框） */
  borderColor?: string;
  /** 自定义边框宽度（覆盖默认 1；仅 default/flat 有边框） */
  borderWidth?: number;
  /**
   * 「裸壳」模式：把 padding 设为 0，children 紧贴 Card 边缘渲染。
   *
   * **跟 variant 是正交维度**：
   *  - `variant` 控制装饰（阴影 / 边框 / 底色）
   *  - `bare` 控制内边距（是否留白）
   *
   * 常用组合：
   *  - 业务想自己控 padding 但保留卡片视觉 → `<Card variant="default" bare>`
   *  - 业务要「完全朴素」（无装饰 + 无 padding）→ `<Card variant="plain" bare>`
   */
  bare?: boolean;
  /** 额外样式覆盖 */
  style?: StyleProp<ViewStyle>;
  /** 测试 testID */
  testID?: string;
};
