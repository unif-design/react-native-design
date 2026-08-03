import type { TextInputProps } from 'react-native';
import type {
  RemovedTextInputProps,
  TextFieldCommonProps,
  TextFieldValueProps,
} from '../TextField/types';

/**
 * 多行文本输入框（评论 / 长备注 / 多行说明）。单行用 `<Input />`。
 *
 * 内部固定 `multiline=true`；高度在 `[minHeight, maxHeight]` 之间根据内容增长。
 * 继承除 `style` / `multiline` / `numberOfLines` 之外的 RN `TextInputProps`。
 */
export type TextareaProps = Omit<TextInputProps, RemovedTextInputProps> &
  TextFieldCommonProps &
  TextFieldValueProps & {
    /** 最小高度，默认 96（约 5 行） */
    minHeight?: number;
    /** 最大高度（超过后内部滚动），默认不限制 */
    maxHeight?: number;
  };
