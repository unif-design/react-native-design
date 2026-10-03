import type { StyleProp, ViewStyle } from 'react-native';

/** 受控文字编辑内容；弹层、键盘和业务提交结果由宿主负责。 */
export interface TextEntryContentProps {
  title: string;
  value: string;
  onChangeText(value: string): void;
  onSubmit(value: string): void;
  onCancel(): void;
  message?: string;
  busy?: boolean;
  maxLength?: number;
  confirmLabel?: string;
  cancelLabel?: string;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
