import type { ReactNode } from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

/**
 * 单行文本输入框。多行内容请用 `<Textarea />`。
 *
 * 继承除 `style` / `multiline` / `numberOfLines` 之外的全部 RN `TextInputProps`，业务可直接传
 * `keyboardType` / `autoCapitalize` / `secureTextEntry` 等原生行为。
 *
 * `multiline` / `numberOfLines` 故意 omit —— 单行场景这俩属性无意义，多行请用 Textarea。
 */
export type InputProps = Omit<
  TextInputProps,
  'style' | 'multiline' | 'numberOfLines'
> & {
  /** 可选的前置插槽（图标、label 等） */
  leading?: ReactNode;
  /** 可选的后置插槽（清除按钮、眼睛切换等） */
  trailing?: ReactNode;
  /** 错误信息 —— 容器进入错误态并在下方显示 */
  error?: string;
  /** 覆盖单行高度，默认 44（hitTarget） */
  height?: number;
  /** 容器外层样式（含 leading/trailing 整个 wrap） */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * 整体禁用：等价于 `editable={false}` + 视觉变灰；优先级高于 RN 原生 `editable`。
   * 业务表单常用此 prop 而非 editable，命名更直觉。
   */
  disabled?: boolean;
};
