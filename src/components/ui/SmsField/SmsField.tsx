import React from 'react';
import { useColors } from '../../../theme';
import { Input } from '../Input';
import type { SmsFieldProps } from './types';

export function SmsField({
  value,
  onChangeText,
  remainingSeconds,
  sendDisabled,
  onSend,
  sendLabel,
  sendAccessibilityLabel,
  ...inputProps
}: SmsFieldProps): React.JSX.Element {
  const colors = useColors();
  return (
    <Input
      {...inputProps}
      value={value}
      onChangeText={onChangeText}
      keyboardType="number-pad"
      autoComplete="sms-otp"
      textContentType="oneTimeCode"
      leading={{
        kind: 'icon',
        icon: 'mail',
        size: 18,
        color: colors.iconFaint40,
      }}
      trailing={{
        kind: 'action',
        label: sendLabel,
        accessibilityLabel: sendAccessibilityLabel ?? sendLabel,
        disabled: sendDisabled || remainingSeconds > 0,
        onPress: onSend,
      }}
    />
  );
}
