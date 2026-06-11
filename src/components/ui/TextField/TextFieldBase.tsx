import React, { type ComponentRef, forwardRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { control, r, space, useColors, useThemedStyles } from '../../../theme';
import { childTestID } from '../../../utils/testID';
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
      // [L-81] multiline minHeight 裸 96 → r(96),随设备缩放
      minHeight = r(96),
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
      onChangeText,
      testID,
      ...rest
    },
    ref
  ): React.JSX.Element {
    const c = useColors();
    const styles = useThemedStyles(makeStyles);
    const [focused, setFocused] = useState(false);
    // [M-9] 内部镜像 state:非受控场景 value 不传,用 _mirror 做 hasValue 判断
    const [_mirror, setMirror] = useState('');
    // [M-9] filled 在受控 value 和内部镜像 state 之间取 hasValue,
    // 保证非受控场景 filled 视觉态能正确响应用户输入,且受控用法行为不变
    const filled =
      value != null ? String(value).length > 0 : _mirror.length > 0;
    const isEditable = disabled ? false : editable;
    // [L-31] editable=false(非 disabled)时也应进入 disabled a11y state
    const isDisabledA11y = disabled || editable === false;

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
            onChangeText={(text) => {
              // [M-9] 同步内部镜像,非受控场景 filled 视觉态依赖此 state
              setMirror(text);
              onChangeText?.(text);
            }}
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
            // [L-31] editable=false 并入 disabled a11y state,SR 能正确播报不可编辑
            accessibilityState={isDisabledA11y ? { disabled: true } : undefined}
            testID={childTestID(testID, 'input')}
          />
          {trailing != null ? <View>{trailing}</View> : null}
        </View>
        {/* [L-31] error Text 补 accessibilityLiveRegion="polite" —— 错误出现时 SR 自动播报 */}
        {error ? (
          <Text
            style={styles.errorMsg}
            accessibilityLiveRegion="polite"
            testID={childTestID(testID, 'error')}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);

TextFieldBase.displayName = 'TextFieldBase';
