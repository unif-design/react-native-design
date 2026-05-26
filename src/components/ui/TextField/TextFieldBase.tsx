import React, { type ComponentRef, forwardRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { control, space, useColors, useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { TextFieldBaseProps } from './types';

/** `TextInput` 在 react-native-strict-api 下是组件类型(`TextInputType`),
 *  ref 实例类型走 `ComponentRef<typeof TextInput>`(对应内部 `_TextInputInstance`)。 */
export type TextInputRef = ComponentRef<typeof TextInput>;

/**
 * Input / Textarea 共享 primitive —— internal,不在主 barrel 导出。
 *
 * 行为:
 * - 视觉 4 态:idle(浅灰)/ focus(白底 brand 边)/ filled(白底 outline 边)/ error
 * - leading / trailing 左右 slot
 * - disabled 优先于 editable
 * - multiline=false → 单行 fixed height(默认 control.lg)
 * - multiline=true → 多行 minHeight/maxHeight,文字顶对齐,wrap 上下加 padding
 * - forwardRef<TextInput> —— 业务表单 inputRef.current?.focus() 聚焦
 *
 * 公开 API 是 Input / Textarea(本组件不直接给业务用)。
 */
export const TextFieldBase = forwardRef<TextInputRef, TextFieldBaseProps>(
  function TextFieldBase(
    {
      multiline = false,
      height = control.lg,
      minHeight = 96,
      maxHeight,
      leading,
      trailing,
      error,
      disabled,
      editable,
      containerStyle,
      value,
      onFocus,
      onBlur,
      testID,
      ...rest
    },
    ref
  ): React.JSX.Element {
    const c = useColors();
    const styles = useThemedStyles(makeStyles);
    const [focused, setFocused] = useState(false);
    const filled = value != null && String(value).length > 0;
    const isEditable = disabled ? false : editable;

    // 视觉态优先级:error > focused > filled > idle。
    // active 三态(focus/filled/error)共享 wrapActive 白底,各自只覆 borderColor 差量。
    const wrapStateStyles = error
      ? [styles.wrapActive, styles.wrapError]
      : focused
        ? [styles.wrapActive, styles.wrapFocus]
        : filled
          ? [styles.wrapActive, styles.wrapFilled]
          : [styles.wrapIdle];

    return (
      <View
        style={[containerStyle, disabled && styles.containerDisabled]}
        testID={testID}
      >
        <View
          style={[
            styles.wrap,
            multiline && styles.wrapMultiline,
            ...wrapStateStyles,
            multiline
              ? { minHeight, ...(maxHeight != null && { maxHeight }) }
              : { height },
          ]}
        >
          {leading != null ? <View>{leading}</View> : null}
          <TextInput
            ref={ref}
            {...rest}
            editable={isEditable}
            value={value}
            multiline={multiline}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              // multiline:wrap 上下 padding 为 space[4]*2=20,input 内部 minHeight 减掉避免溢出
              multiline && {
                minHeight: Math.max(0, minHeight - space[4] * 2),
              },
            ]}
            placeholderTextColor={c.foregroundSubtle}
            accessibilityState={disabled ? { disabled: true } : undefined}
            testID={testID ? `${testID}-input` : undefined}
          />
          {trailing != null ? <View>{trailing}</View> : null}
        </View>
        {error ? <Text style={styles.errorMsg}>{error}</Text> : null}
      </View>
    );
  }
);

TextFieldBase.displayName = 'TextFieldBase';
