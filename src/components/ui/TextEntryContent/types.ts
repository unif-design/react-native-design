import type { StyleProp, ViewStyle } from 'react-native';

/** 受控文字编辑内容；弹层、键盘和业务提交结果由宿主负责。 */
export interface TextEntryContentProps {
  /** card 保留多行卡片；compact 使用居中标题、胶囊单行输入与等宽操作。 */
  variant?: 'card' | 'compact';
  /** 交给实际输入控件；缺省不添加提示。 */
  placeholder?: string;
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
