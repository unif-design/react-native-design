import type { ReactNode } from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

/**
 * 多行文本输入框（评论 / 长备注 / 多行说明）。单行用 `<Input />`。
 *
 * 内部固定 `multiline=true`；高度在 `[minHeight, maxHeight]` 之间根据内容增长。
 * 继承除 `style` / `multiline` / `numberOfLines` 之外的 RN `TextInputProps`。
 */
export type TextareaProps = Omit<
  TextInputProps,
  'style' | 'multiline' | 'numberOfLines'
> & {
  /** 可选的前置插槽（图标、label 等） */
  leading?: ReactNode;
  /** 可选的后置插槽（如字符计数器） */
  trailing?: ReactNode;
  /** 错误信息 —— 容器进入错误态并在下方显示。
   *  空串 `""` / undefined 都不进 error 态(truthy 判定),与 TextFieldBase 保持一致。[L-96] */
  error?: string;
  /** 最小高度，默认 96（约 5 行） */
  minHeight?: number;
  /** 最大高度（超过后内部滚动），默认不限制 */
  maxHeight?: number;
  /** 容器外层样式（含 leading/trailing 整个 wrap） */
  containerStyle?: StyleProp<ViewStyle>;
  /** 整体禁用：editable=false + 视觉变灰；优先级高于 RN 原生 `editable` */
  disabled?: boolean;
};
