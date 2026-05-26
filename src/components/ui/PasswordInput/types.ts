import type { TextInputProps } from 'react-native';

export type PasswordInputProps = {
  value: string;
  onChangeText: (v: string) => void;
  /** 默认 "请输入密码" */
  placeholder?: string;
  testID?: string;
  /** 透传给底层 Input 的其他 RN TextInput 属性(maxLength / autoFocus 等)。
   *  ⚠ 不要传 secureTextEntry,组件自管;传了会被组件内部覆盖。 */
  inputProps?: Partial<TextInputProps>;
};
