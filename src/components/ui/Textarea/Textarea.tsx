import { forwardRef } from 'react';
import { TextFieldBase } from '../TextField/TextFieldBase';
import { sanitizeTextFieldWrapperProps } from '../TextField/normalize';
import type { TextFieldHandle } from '../TextField/types';
import type { TextareaProps } from './types';

/**
 * 多行文本输入框 —— 默认视觉与 Input 一致；plain 供外层已提供表面的组合使用。
 *
 * 跟 Input 区别:
 *  - 内置 `multiline=true`,业务不用传
 *  - 高度走 `minHeight` / `maxHeight`,超过 maxHeight 内部滚动
 *  - 文本顶对齐(textAlignVertical='top'),跨平台统一
 *
 * 实现层走 `<TextFieldBase multiline>`,本组件是薄 wrap。
 *
 * Ref:forwardRef<TextFieldHandle>,业务只可调 `focus()` / `blur()`。
 */
export const Textarea = forwardRef<TextFieldHandle, TextareaProps>(
  function Textarea({ surface = 'default', ...props }, ref) {
    const { props: safeProps } = sanitizeTextFieldWrapperProps(
      props as TextareaProps & Record<string, unknown>
    );
    return (
      <TextFieldBase
        ref={ref}
        {...(safeProps as TextareaProps)}
        multiline
        plainSurface={surface === 'plain'}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
