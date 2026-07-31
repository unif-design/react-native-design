import type { InputProps } from '../Input';

/** 密码必须受控,且所有可用 TextInput 选项都以顶层 props 提供。 */
export type PasswordInputProps = Omit<
  InputProps,
  | 'value'
  | 'defaultValue'
  | 'onChangeText'
  | 'secureTextEntry'
  | 'leading'
  | 'trailing'
> & {
  value: string;
  onChangeText: (value: string) => void;
};
