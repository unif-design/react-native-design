import React, { forwardRef, useEffect, useState } from 'react';
import { Input } from '../Input';
import type { TextFieldHandle, TextFieldSlot } from '../TextField/types';
import { createLogger } from '../../../utils/logger';
import type { PasswordInputProps } from './types';

const log = createLogger('PasswordInput');

/** 密码输入:只切换 secureTextEntry,不改变调用方持有的受控文本或焦点。 */
export const PasswordInput = forwardRef<TextFieldHandle, PasswordInputProps>(
  function PasswordInput(props, ref): React.JSX.Element {
    const {
      textContentType: rawTextContentType,
      autoComplete: rawAutoComplete,
      autoCapitalize: rawAutoCapitalize,
      value: rawValue,
      onChangeText: rawOnChangeText,
      disabled: rawDisabled,
      editable: rawEditable,
      placeholder: rawPlaceholder,
      defaultValue: _defaultValue,
      inputProps: _inputProps,
      secureTextEntry: _secureTextEntry,
      leading: _leading,
      trailing: _trailing,
      ...rest
    } = props as PasswordInputProps & Record<string, unknown>;
    const value = typeof rawValue === 'string' ? rawValue : '';
    const onChangeText =
      typeof rawOnChangeText === 'function'
        ? (rawOnChangeText as (next: string) => void)
        : undefined;
    const disabled = rawDisabled === true;
    const editable = rawEditable === false ? false : undefined;
    const placeholder =
      typeof rawPlaceholder === 'string' ? rawPlaceholder : '请输入密码';
    const removedNativeAliasKey = Object.entries({
      defaultValue: _defaultValue,
      inputProps: _inputProps,
      secureTextEntry: _secureTextEntry,
      leading: _leading,
      trailing: _trailing,
    })
      .filter(([, entry]) => entry !== undefined)
      .map(([name]) => name)
      .join(',');
    useEffect(() => {
      if (removedNativeAliasKey.length > 0) {
        log.warn(`已忽略 PasswordInput 自管 props(${removedNativeAliasKey})。`);
      }
    }, [removedNativeAliasKey]);
    const [showPassword, setShowPassword] = useState(false);
    const effectiveEditable = disabled !== true && editable !== false;
    const trailing: TextFieldSlot = {
      kind: 'action',
      icon: showPassword ? 'eye' : 'eye-off',
      onPress: () => setShowPassword((visible) => !visible),
      accessibilityLabel: showPassword ? '隐藏密码' : '显示密码',
      disabled: !effectiveEditable,
    };

    return (
      <Input
        ref={ref}
        {...(rest as PasswordInputProps)}
        value={value}
        onChangeText={onChangeText as (next: string) => void}
        disabled={disabled}
        editable={editable}
        placeholder={placeholder}
        textContentType={rawTextContentType ?? 'password'}
        autoComplete={rawAutoComplete ?? 'current-password'}
        autoCapitalize={rawAutoCapitalize ?? 'none'}
        secureTextEntry={!showPassword}
        leading={{ kind: 'icon', icon: 'lock', size: 18 }}
        trailing={trailing}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
