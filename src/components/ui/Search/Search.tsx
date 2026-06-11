import React, { forwardRef } from 'react';
import { Pressable } from 'react-native-gesture-handler';

import { control, fixed, r, useColors } from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { Icon } from '../Icon';
import { Input } from '../Input';
import type { TextInputRef } from '../TextField/TextFieldBase';
import type { SearchProps } from './types';

/**
 * 搜索输入框 —— `<Input>` 的预设：前置搜索图标、清除按钮、
 * 高 control.md、键盘 return 键为「搜索」。
 *
 * Ref 透传到 Input 内部 TextInput，业务可调 `searchRef.current?.focus()`。
 */
export const Search = forwardRef<TextInputRef, SearchProps>(function Search(
  { onSubmit, placeholder = '搜索…', value, onChangeText, testID, ...rest },
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
      // [L-81] 高度裸 36 → control.md(r(36),随设备缩放)
      height={control.md}
      returnKeyType="search"
      accessibilityRole="search"
      testID={testID}
      onSubmitEditing={(e) => {
        // [M-9] 改读 e.nativeEvent.text —— 不再依赖受控 value,非受控场景也能触发
        const text = e.nativeEvent.text;
        onSubmit?.(text);
      }}
      leading={<Icon name="search" size={r(18)} color={c.foregroundSubtle} />}
      trailing={
        filled ? (
          <Pressable
            onPress={() => onChangeText?.('')}
            // [M-7] 清除按钮 icon r(14)≈14pt;Input 高 control.md≈36pt 限制垂直扩展
            // horizontal 走 (44-14)/2=15;vertical 走 (44-control.md)/2≈4
            hitSlop={{
              top: Math.round((fixed.hitTarget - control.md) / 2),
              bottom: Math.round((fixed.hitTarget - control.md) / 2),
              left: Math.round((fixed.hitTarget - r(14)) / 2),
              right: Math.round((fixed.hitTarget - r(14)) / 2),
            }}
            accessibilityRole="button"
            accessibilityLabel="清除"
            testID={childTestID(testID, 'clear')}
          >
            <Icon name="close" size={r(14)} color={c.foregroundSubtle} />
          </Pressable>
        ) : null
      }
    />
  );
});

Search.displayName = 'Search';
