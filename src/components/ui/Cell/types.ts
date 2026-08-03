import type { ReactElement, ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { IconName } from '../Icon';

export type CellTextValue = string | number | bigint;

export type CellLeading = IconName | { kind: 'display'; node: ReactElement };

export type CellExtra =
  | { kind: 'text'; value: CellTextValue }
  | {
      kind: 'display';
      node: ReactElement;
      accessibilityText?: string;
    }
  | { kind: 'control'; node: ReactElement };

type ActionableExtra = Exclude<CellExtra, { kind: 'control' }>;
type StaticExtra =
  | Extract<CellExtra, { kind: 'text' }>
  | {
      kind: 'display';
      node: ReactElement;
      accessibilityText?: never;
    };

type SharedCellProps = {
  /** 主标题由库内 Text 安全渲染。 */
  title: CellTextValue;
  /** 主标题的 numberOfLines（默认 1）。 */
  titleLines?: number;
  /** 副标题由库内 Text 安全渲染。 */
  desc?: CellTextValue;
  /** 图标名或显式的纯展示前导节点。 */
  leading?: CellLeading;
  /** 危险态：icon 盒子与标题使用 error 色；action arrow 不显示。 */
  danger?: boolean;
  /** 额外样式覆盖。 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位。 */
  testID?: string;
};

type ActionableCellProps = {
  onPress: () => void;
  extra?: ActionableExtra;
  arrow?: boolean;
  disabled?: boolean;
  /** 覆盖由 title、desc 与 extra 自动组合的 accessible name。 */
  accessibilityLabel?: string;
  /** SR 操作结果说明。 */
  accessibilityHint?: string;
};

type ControlCellProps = {
  extra: Extract<CellExtra, { kind: 'control' }>;
  onPress?: never;
  arrow?: never;
  disabled?: never;
  accessibilityLabel?: never;
  accessibilityHint?: never;
};

type StaticCellProps = {
  extra?: StaticExtra;
  onPress?: never;
  arrow?: never;
  disabled?: never;
  accessibilityLabel?: never;
  accessibilityHint?: never;
};

export type CellProps = SharedCellProps &
  (ActionableCellProps | ControlCellProps | StaticCellProps);

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
