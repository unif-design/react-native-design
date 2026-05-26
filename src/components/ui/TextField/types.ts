import type { ReactNode } from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

/** internal — Input / Textarea 共享 props。
 *  caller 不直接消费,通过 InputProps / TextareaProps 间接传入。 */
export type TextFieldBaseProps = TextInputProps & {
  /** false(默认)= Input 行为(单行,固定 height);true = Textarea 行为
   *  (multiline,minHeight/maxHeight 控高,文字顶对齐) */
  multiline?: boolean;
  /** 单行 height(multiline=false 时生效),默认 control.lg */
  height?: number;
  /** 最小高度(multiline=true 时生效),默认 96 */
  minHeight?: number;
  /** 最大高度(multiline=true 时生效);超出 ScrollView 内滚 */
  maxHeight?: number;
  /** 左侧 slot —— Icon / 装饰 */
  leading?: ReactNode;
  /** 右侧 slot —— Icon / 操作按钮 */
  trailing?: ReactNode;
  /** 错误文案 —— 非空字符串时 wrap border 切 error 色,下方显示文本。
   *  空串 `""` / undefined 都不进 error 态(truthy 判定)。 */
  error?: string;
  /** 整体禁用 —— opacity 0.5 + TextInput editable=false,优先级高于 editable */
  disabled?: boolean;
  /** 外层 View 附加 style */
  containerStyle?: StyleProp<ViewStyle>;
};
