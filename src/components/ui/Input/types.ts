import type { TextInputProps } from 'react-native';
import type {
  RemovedTextInputProps,
  TextFieldCommonProps,
  TextFieldValueProps,
} from '../TextField/types';

/**
 * 单行文本输入框。多行内容请用 `<Textarea />`。
 *
 * 继承除 `style` / `multiline` / `numberOfLines` 之外的全部 RN `TextInputProps`，业务可直接传
 * `keyboardType` / `autoCapitalize` / `secureTextEntry` 等原生行为。
 *
 * `multiline` / `numberOfLines` 故意 omit —— 单行场景这俩属性无意义，多行请用 Textarea。
 */
export type InputProps = Omit<TextInputProps, RemovedTextInputProps> &
  TextFieldCommonProps &
  TextFieldValueProps & {
    /** 覆盖单行高度，默认 control.lg(r(44),随设备缩放) */
    height?: number;
  };
