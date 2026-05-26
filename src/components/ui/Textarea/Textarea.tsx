import { forwardRef } from 'react';
import { TextFieldBase, type TextInputRef } from '../TextField/TextFieldBase';
import type { TextareaProps } from './types';

/**
 * 多行文本输入框 —— 视觉与 Input 一致(idle/focus/filled/error/disabled)。
 *
 * 跟 Input 区别:
 *  - 内置 `multiline=true`,业务不用传
 *  - 高度走 `minHeight` / `maxHeight`,超过 maxHeight 内部滚动
 *  - 文本顶对齐(textAlignVertical='top'),跨平台统一
 *
 * 实现层走 `<TextFieldBase multiline>`,本组件是薄 wrap。
 *
 * Ref:forwardRef<TextInput>,业务可调 `ref.current?.focus()`。
 */
export const Textarea = forwardRef<TextInputRef, TextareaProps>(
  function Textarea(props, ref) {
    return <TextFieldBase ref={ref} multiline {...props} />;
  }
);

Textarea.displayName = 'Textarea';
