import React, { forwardRef, useEffect } from 'react';
import { fixed } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { TextFieldBase } from '../TextField/TextFieldBase';
import { normalizeSearchLayout } from '../TextField/normalize';
import type {
  TextFieldBaseProps,
  TextFieldHandle,
  TextFieldSlot,
} from '../TextField/types';
import { useTextFieldValue } from '../TextField/useTextFieldValue';
import type { SearchProps } from './types';

const log = createLogger('Search');

/**
 * 搜索输入框:值状态只在本层 controller 持有一次,下层 base 始终以受控形状渲染。
 */
export const Search = forwardRef<TextFieldHandle, SearchProps>(
  function Search(props, ref): React.JSX.Element {
    const {
      value: rawValue,
      defaultValue: rawDefaultValue,
      onChangeText: rawOnChangeText,
      onSubmit: rawOnSubmit,
      onSubmitEditing: rawOnSubmitEditing,
      disabled: rawDisabled,
      editable: rawEditable,
      placeholder: rawPlaceholder,
      leading: _leading,
      trailing: _trailing,
      height: _height,
      returnKeyType: _returnKeyType,
      accessibilityRole: _accessibilityRole,
      role: _role,
      clearButtonMode: _clearButtonMode,
      enterKeyHint: _enterKeyHint,
      ...rest
    } = props as SearchProps & Record<string, unknown>;
    const value = rawValue;
    const defaultValue = rawDefaultValue;
    const onChangeText =
      typeof rawOnChangeText === 'function'
        ? (rawOnChangeText as (next: string) => void)
        : undefined;
    const onSubmit =
      typeof rawOnSubmit === 'function'
        ? (rawOnSubmit as (next: string) => void)
        : undefined;
    const onSubmitEditing =
      typeof rawOnSubmitEditing === 'function'
        ? (rawOnSubmitEditing as NonNullable<SearchProps['onSubmitEditing']>)
        : undefined;
    const disabled = rawDisabled === true;
    const editable = rawEditable === false ? false : undefined;
    const placeholder =
      typeof rawPlaceholder === 'string' ? rawPlaceholder : '搜索…';
    const allowedNativeProps = rest as Omit<
      TextFieldBaseProps,
      | 'value'
      | 'defaultValue'
      | 'onChangeText'
      | 'multiline'
      | 'leading'
      | 'trailing'
      | 'height'
      | 'searchLayout'
      | 'returnKeyType'
      | 'accessibilityRole'
      | 'onSubmitEditing'
      | 'disabled'
      | 'editable'
      | 'placeholder'
    >;
    const removedNativeAliasKey = Object.entries({
      leading: _leading,
      trailing: _trailing,
      height: _height,
      returnKeyType: _returnKeyType,
      accessibilityRole: _accessibilityRole,
      role: _role,
      clearButtonMode: _clearButtonMode,
      enterKeyHint: _enterKeyHint,
    })
      .filter(([, entry]) => entry !== undefined)
      .map(([name]) => name)
      .join(',');
    useEffect(() => {
      if (removedNativeAliasKey.length > 0) {
        log.warn(`已忽略 Search 自管 props(${removedNativeAliasKey})。`);
      }
    }, [removedNativeAliasKey]);
    const controller = useTextFieldValue(
      { value, defaultValue, onChangeText },
      'Search'
    );
    const searchLayout = normalizeSearchLayout(fixed.hitTarget, 36);
    const effectiveEditable = disabled !== true && editable !== false;
    const trailing: TextFieldSlot | undefined =
      controller.value.length > 0 && effectiveEditable && controller.canUpdate
        ? {
            kind: 'action',
            icon: 'close',
            onPress: () => controller.onChangeText(''),
            accessibilityLabel: '清除搜索内容',
          }
        : undefined;

    return (
      <TextFieldBase
        ref={ref}
        {...allowedNativeProps}
        multiline={false}
        value={controller.value}
        onChangeText={controller.onChangeText}
        disabled={disabled}
        editable={editable}
        placeholder={placeholder}
        height={fixed.hitTarget}
        searchLayout={searchLayout}
        returnKeyType="search"
        accessibilityRole="search"
        onSubmitEditing={(event) => {
          onSubmitEditing?.(event);
          onSubmit?.(controller.value);
        }}
        leading={{ kind: 'icon', icon: 'search', size: 18 }}
        trailing={trailing}
      />
    );
  }
);

Search.displayName = 'Search';
