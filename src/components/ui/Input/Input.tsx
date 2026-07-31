import { forwardRef } from 'react';
import { TextFieldBase } from '../TextField/TextFieldBase';
import type { TextFieldHandle } from '../TextField/types';
import type { InputProps } from './types';

/**
 * 单行文本输入框(多行内容请用 `<Textarea />`)。
 *
 * 视觉状态由 props 隐式驱动:idle / focus / filled / error / disabled。
 *
 * 实现层走 `<TextFieldBase multiline={false}>`,本组件是薄 wrap。
 *
 * Ref:forwardRef<TextFieldHandle> —— 业务表单只能调 focus()/blur(),不会绕过值状态机。
 */
export const Input = forwardRef<TextFieldHandle, InputProps>(
  function Input(props, ref) {
    return <TextFieldBase ref={ref} multiline={false} {...props} />;
  }
);

Input.displayName = 'Input';
