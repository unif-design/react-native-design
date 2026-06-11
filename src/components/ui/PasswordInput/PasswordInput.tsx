import React, { forwardRef, useState } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import { Icon } from '../Icon';
import { Input } from '../Input';
import { control, fixed, r, useColors } from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { styles } from './styles';
import type { TextInputRef } from '../TextField/TextFieldBase';
import type { PasswordInputProps } from './types';

/**
 * 密码 Input —— Input + leading lock + trailing eye 切换明文 / 密文。
 *
 * [L-32] 增强:
 * - forwardRef<TextInput> —— 业务表单 focus() 聚焦
 * - inputProps 类型改为 Omit<TextInputProps,'secureTextEntry'>
 * - 补 textContentType='password' / autoComplete='current-password' / autoCapitalize='none' 默认值
 * - 暴露 error / disabled 透传给底层 Input
 *
 * showPw 内部 useState,caller 只关心 value/onChangeText。
 * a11y:label 已表达"显示/隐藏密码"意图,不再加 accessibilityHint(避免 SR 朗读 over-hint)。
 */
export const PasswordInput = forwardRef<TextInputRef, PasswordInputProps>(
  function PasswordInput(
    {
      value,
      onChangeText,
      placeholder = '请输入密码',
      testID,
      error,
      disabled,
      inputProps,
    },
    ref
  ): React.JSX.Element {
    const c = useColors();
    const [showPw, setShowPw] = useState(false);

    return (
      <Input
        ref={ref}
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        error={error}
        disabled={disabled}
        // [L-32] 补 textContentType / autoComplete / autoCapitalize 默认值 —— 提升密码自动填充体验
        textContentType="password"
        autoComplete="current-password"
        autoCapitalize="none"
        {...inputProps}
        // secureTextEntry 在 inputProps spread 之后覆盖,确保组件自管不被 caller 干扰
        secureTextEntry={!showPw}
        leading={<Icon name="lock" size={r(18)} color={c.iconFaint40} />}
        trailing={
          <Pressable
            testID={childTestID(testID, 'toggle')}
            style={styles.eyeBtn}
            onPress={() => setShowPw((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={showPw ? '隐藏密码' : '显示密码'}
            // [M-7] eye icon r(16)≈16pt;Input 高 control.md≈36pt 限制垂直扩展
            // vertical 走 (44-control.md)/2≈4;horizontal 走 (44-16)/2=14
            hitSlop={{
              top: Math.round((fixed.hitTarget - control.md) / 2),
              bottom: Math.round((fixed.hitTarget - control.md) / 2),
              left: Math.round((fixed.hitTarget - r(16)) / 2),
              right: Math.round((fixed.hitTarget - r(16)) / 2),
            }}
          >
            <Icon
              name={showPw ? 'eye' : 'eye-off'}
              size={r(16)}
              color={c.iconFaint40}
            />
          </Pressable>
        }
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
