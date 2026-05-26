import { forwardRef } from 'react';
import { TextFieldBase, type TextInputRef } from '../TextField/TextFieldBase';
import type { InputProps } from './types';

/**
 * 单行文本输入框(多行内容请用 `<Textarea />`)。
 *
 * 视觉状态由 props 隐式驱动:idle / focus / filled / error / disabled。
 *
 * 实现层走 `<TextFieldBase multiline={false}>`,本组件是薄 wrap,
 * 公开 API 跟历史完全一致。
 *
 * Ref:forwardRef<TextInput> —— 业务表单调 `inputRef.current?.focus()` 聚焦错误字段。
 */
export const Input = forwardRef<TextInputRef, InputProps>(
  function Input(props, ref) {
    return <TextFieldBase ref={ref} multiline={false} {...props} />;
  }
);

Input.displayName = 'Input';
