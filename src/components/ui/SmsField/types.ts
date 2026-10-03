import type { InputProps } from '../Input';

/** 长度、提示及发送文案由调用方提供；remainingSeconds 只控制冷却禁用。 */
export interface SmsFieldProps extends Pick<
  InputProps,
  'maxLength' | 'placeholder' | 'editable' | 'accessibilityLabel' | 'testID'
> {
  value: string;
  onChangeText(value: string): void;
  remainingSeconds: number;
  sendLabel: string;
  sendAccessibilityLabel?: string;
  sendDisabled?: boolean;
  onSend(): void;
}
