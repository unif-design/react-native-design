import React, { forwardRef } from 'react';
import { Pressable } from 'react-native-gesture-handler';

import { r, useColors } from '../../../theme';
import { Icon } from '../Icon';
import { Input } from '../Input';
import type { TextInputRef } from '../TextField/TextFieldBase';
import type { SearchProps } from './types';

/**
 * 搜索输入框 —— `<Input>` 的预设：前置搜索图标、清除按钮、
 * 高 36px、键盘 return 键为「搜索」。
 *
 * Ref 透传到 Input 内部 TextInput，业务可调 `searchRef.current?.focus()`。
 */
export const Search = forwardRef<TextInputRef, SearchProps>(function Search(
  { onSubmit, placeholder = '搜索…', value, onChangeText, ...rest },
  ref
): React.JSX.Element {
  const c = useColors();
  const filled = typeof value === 'string' && value.length > 0;
  return (
    <Input
      ref={ref}
      {...rest}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      height={36}
      returnKeyType="search"
      accessibilityRole="search"
      onSubmitEditing={() => {
        if (typeof value === 'string') onSubmit?.(value);
      }}
      leading={<Icon name="search" size={r(18)} color={c.foregroundSubtle} />}
      trailing={
        filled ? (
          <Pressable
            onPress={() => onChangeText?.('')}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="清除"
          >
            <Icon name="close" size={r(14)} color={c.foregroundSubtle} />
          </Pressable>
        ) : null
      }
    />
  );
});

Search.displayName = 'Search';
