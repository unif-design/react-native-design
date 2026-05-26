import React, { useState } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import { Icon } from '../Icon';
import { Input } from '../Input';
import { useColors } from '@/theme';
import { styles } from './styles';
import type { PasswordInputProps } from './types';

/** 密码 Input —— Input + leading lock + trailing eye 切换明文 / 密文。
 *  showPw 内部 useState,caller 只关心 value/onChangeText。
 *  a11y:label 已表达"显示/隐藏密码"意图,不再加 accessibilityHint(避免
 *  SR 朗读 over-hint,见 CLAUDE.md a11y 规范)。 */
export function PasswordInput({
  value,
  onChangeText,
  placeholder = '请输入密码',
  testID,
  inputProps,
}: PasswordInputProps): React.JSX.Element {
  const c = useColors();
  const [showPw, setShowPw] = useState(false);

  return (
    <Input
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      {...inputProps}
      secureTextEntry={!showPw}
      leading={<Icon name="lock" size={18} color={c.iconFaint40} />}
      trailing={
        <Pressable
          testID={testID ? `${testID}-toggle` : undefined}
          style={styles.eyeBtn}
          onPress={() => setShowPw((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={showPw ? '隐藏密码' : '显示密码'}
          hitSlop={8}
        >
          <Icon
            name={showPw ? 'eye' : 'eye-off'}
            size={16}
            color={c.iconFaint40}
          />
        </Pressable>
      }
    />
  );
}
