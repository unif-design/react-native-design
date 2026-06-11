import type { TextInputProps } from 'react-native';

export type PasswordInputProps = {
  value: string;
  onChangeText: (v: string) => void;
  /** 默认 "请输入密码" */
  placeholder?: string;
  testID?: string;
  /** 错误信息 —— 传入时 Input 进入 error 态并在下方显示 */
  error?: string;
  /** 整体禁用:等价于 editable=false + 视觉变灰 */
  disabled?: boolean;
  /** 透传给底层 Input 的其他 RN TextInput 属性(maxLength / autoFocus 等)。
   *  ⚠ 不要传 secureTextEntry,组件自管;传了会被组件内部覆盖。
   *  [L-32] 类型显式 Omit<TextInputProps,'secureTextEntry'> 封堵传入歧义 */
  inputProps?: Omit<TextInputProps, 'secureTextEntry'>;
};
