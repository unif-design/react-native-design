import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';

export type CellProps = {
  /** 标题（必填）；string 自动套 Text + numberOfLines=titleLines，传 ReactNode 完全自定义 */
  title: ReactNode;
  /** title 是 string 时的 numberOfLines（默认 1）。多行场景如新闻列表标题传 2。 */
  titleLines?: number;
  /** 副标题；string 自动 numberOfLines=2，传 ReactNode 完全自定义 */
  desc?: ReactNode;
  /** 右侧 slot —— 字符串自动套 Text；传 ReactNode 放 Switch / Stepper / Tag 等控件 */
  extra?: ReactNode;
  /** 显示右侧 chevron-right 图标，常配合 onPress 表示「可进入下一级」 */
  arrow?: boolean;
  /** 前置 slot —— IconName 自动渲染 24×24 图标；传 ReactNode 放 Avatar / 自定义图形 */
  leading?: IconName | ReactNode;
  /** 点击回调 —— 不传则 cell 不可点（纯展示） */
  onPress?: () => void;
  /**
   * 显式禁用：仅对带 onPress 的 cell 有效。
   * disabled=true 时 onPress 不触发 + 整体半透明 + a11y disabled。
   */
  disabled?: boolean;
  /** 危险态:icon 盒子 + 标题用 error 红色,且不渲染 arrow(常用于退出登录 / 删除等)。 */
  danger?: boolean;
  /** 额外样式覆盖(合并到 cell 容器的 style 数组) */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
  /** 显式 SR 朗读文案,覆盖 Cell 默认从 string title 推断的 fallback。
   *  title 是 ReactNode(自定义渲染)时尤其需要,否则 SR 用户听不到任何内容。 */
  accessibilityLabel?: string;
  /** SR 朗读 hint —— 说明 tap 后行为(短 ≤8 字)。
   *  常用:"查看详情" / "打开应用" 等;onPress 缺省时此 prop 无意义。 */
  accessibilityHint?: string;
};

export type ListProps = {
  /** 一组 Cell */
  children: ReactNode;
  /**
   * `flush=true` 时不画灰色容器,行直接放在透明背景上。
   * 用于:嵌套在 Card 内 / 第一屏 hero 区下方等已有底色的场景。
   */
  flush?: boolean;
  /** flush 模式下行间分隔线样式,默认 `'full'`(铺满全宽 hairline) / `'none'` 不画 */
  divider?: 'full' | 'none';
  /** 额外样式覆盖 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
