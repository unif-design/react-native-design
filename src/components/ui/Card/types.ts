import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Card **视觉变体**（控制装饰，跟 `bare` 是正交维度）：
 * - `default`：白底 + 阴影（标准卡片;默认无边框,传 `borderColor` 才显示边框）
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
  /** 自定义圆角（覆盖默认 radius.xl） */
  borderRadius?: number;
  /** 边框色 —— 传入即显示边框（任何 variant 生效;默认无边框） */
  borderColor?: string;
  /** 边框宽度（默认 2;仅在传了 borderColor 时生效） */
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
  /**
   * 撑满模式:外层与内层 clip 都 `flex:1`,让 Card 在 flex 父里撑满可用空间、
   * 内容区填满外层,使内部 `flex:1` 的滚动视图能拿到高度。默认 false（内容自然高度）。
   */
  fill?: boolean;
  /** 额外样式覆盖 */
  style?: StyleProp<ViewStyle>;
  /** 测试 testID */
  testID?: string;
};
