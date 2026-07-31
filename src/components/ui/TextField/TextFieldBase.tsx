import React, {
  type ComponentRef,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { fixed, space, useColors, useThemedStyles } from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { createLogger } from '../../../utils/logger';
import {
  normalizeInputHeight,
  normalizeTextareaHeights,
  sanitizeTextFieldContainerStyle,
} from './normalize';
import { makeStyles } from './styles';
import { TextFieldSlot } from './TextFieldSlot';
import type { TextFieldBaseProps, TextFieldHandle } from './types';
import { useErrorAnnouncement } from './useErrorAnnouncement';
import { useTextFieldValue } from './useTextFieldValue';

const log = createLogger('TextField');

/** internal native ref type;公开 ref 一律用 TextFieldHandle。 */
type NativeTextInputRef = ComponentRef<typeof TextInput>;

/** Input / Textarea / Search 共享的严格输入 primitive — internal,不进公共 barrel。 */
export const TextFieldBase = forwardRef<TextFieldHandle, TextFieldBaseProps>(
  function TextFieldBase(props, forwardedRef): React.JSX.Element {
    const {
      multiline,
      height,
      minHeight,
      maxHeight,
      searchLayout,
      leading,
      trailing,
      error,
      disabled,
      editable,
      containerStyle,
      value,
      defaultValue,
      onChangeText,
      accessibilityState,
      accessibilityRole,
      placeholderTextColor: callerPlaceholder,
      onFocus,
      onBlur,
      testID,
      style: _style,
      numberOfLines: _numberOfLines,
      ['aria-disabled']: _ariaDisabled,
      readOnly: _readOnly,
      role: _role,
      enterKeyHint: _enterKeyHint,
      clearTextOnFocus: _clearTextOnFocus,
      ...allowedNativeProps
    } = props as TextFieldBaseProps & Record<string, unknown>;
    const removedNativeAliasKey = Object.entries({
      'style': _style,
      'numberOfLines': _numberOfLines,
      'aria-disabled': _ariaDisabled,
      'readOnly': _readOnly,
      'role': _role,
      'enterKeyHint': _enterKeyHint,
      'clearTextOnFocus': _clearTextOnFocus,
    })
      .filter(([, entry]) => entry !== undefined)
      .map(([name]) => name)
      .join(',');
    const colors = useColors();
    const styles = useThemedStyles(makeStyles);
    const [focused, setFocused] = useState(false);
    const nativeRef = React.useRef<NativeTextInputRef>(null);
    const scope = multiline ? 'Textarea' : 'Input';
    const controller = useTextFieldValue(
      {
        value,
        defaultValue,
        onChangeText:
          typeof onChangeText === 'function'
            ? (onChangeText as (next: string) => void)
            : undefined,
      },
      scope
    );
    const normalizedInputHeight = normalizeInputHeight(
      height === undefined ? fixed.hitTarget : height
    );
    const normalizedTextareaHeights = normalizeTextareaHeights(
      minHeight,
      maxHeight
    );
    const sanitizedContainer = sanitizeTextFieldContainerStyle(containerStyle);
    const effectiveEditable = disabled !== true && editable !== false;
    const mergedAccessibilityState = {
      ...accessibilityState,
      disabled: !effectiveEditable,
    };
    const normalizedHeight = multiline
      ? normalizedTextareaHeights.minHeight
      : normalizedInputHeight.value;
    const filled = controller.value.length > 0;
    const diagnostics = [
      ...normalizedInputHeight.diagnostics,
      ...normalizedTextareaHeights.diagnostics,
      ...sanitizedContainer.diagnostics,
    ];
    const diagnosticKey = diagnostics.join(',');

    useEffect(() => {
      if (diagnosticKey.length > 0) {
        log.warn(`${scope}: 非法布局值(${diagnosticKey})已回退。`);
      }
    }, [diagnosticKey, scope]);
    useEffect(() => {
      if (removedNativeAliasKey.length > 0) {
        log.warn(`${scope}: 已忽略受管原生 props(${removedNativeAliasKey})。`);
      }
    }, [removedNativeAliasKey, scope]);
    useErrorAnnouncement(error);

    useImperativeHandle(
      forwardedRef,
      () => ({
        focus: () => nativeRef.current?.focus(),
        blur: () => nativeRef.current?.blur(),
      }),
      []
    );

    const wrapStateStyles = error
      ? [styles.wrapActive, styles.wrapError]
      : focused
        ? [styles.wrapActive, styles.wrapFocus]
        : filled
          ? [styles.wrapActive, styles.wrapFilled]
          : [styles.wrapIdle];
    const interactiveHeight =
      searchLayout?.interactiveHeight ?? normalizedHeight;

    return (
      <View
        style={[
          sanitizedContainer.style,
          !effectiveEditable && styles.containerDisabled,
          searchLayout !== undefined && !multiline && styles.rootCentered,
          { minWidth: fixed.hitTarget, minHeight: normalizedHeight },
        ]}
        testID={testID}
      >
        <View
          style={[
            styles.wrap,
            multiline && styles.wrapMultiline,
            searchLayout === undefined && wrapStateStyles,
            searchLayout !== undefined && styles.searchInteractiveRow,
            multiline
              ? {
                  minHeight: normalizedHeight,
                  ...(normalizedTextareaHeights.maxHeight !== undefined && {
                    maxHeight: normalizedTextareaHeights.maxHeight,
                  }),
                }
              : { height: interactiveHeight },
          ]}
        >
          {searchLayout ? (
            <View
              pointerEvents="none"
              style={[
                styles.searchVisibleSurface,
                ...wrapStateStyles,
                {
                  top: searchLayout.verticalInset,
                  bottom: searchLayout.verticalInset,
                },
              ]}
            />
          ) : null}
          <TextFieldSlot
            slot={leading}
            effectiveEditable={effectiveEditable}
            testID={childTestID(testID, 'leading')}
          />
          <TextInput
            ref={nativeRef}
            {...(allowedNativeProps as TextInputProps)}
            value={controller.value}
            onChangeText={controller.onChangeText}
            editable={effectiveEditable}
            multiline={multiline}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              multiline && {
                minHeight: Math.max(0, normalizedHeight - space[4] * 2),
              },
              searchLayout !== undefined && {
                minHeight: searchLayout.interactiveHeight,
              },
            ]}
            placeholderTextColor={callerPlaceholder ?? colors.foregroundSubtle}
            accessibilityRole={accessibilityRole}
            accessibilityState={mergedAccessibilityState}
            testID={childTestID(testID, 'input')}
          />
          <TextFieldSlot
            slot={trailing}
            effectiveEditable={effectiveEditable}
            testID={childTestID(testID, 'trailing')}
          />
        </View>
        {error ? (
          <Text
            style={styles.errorMsg}
            accessibilityLiveRegion={
              Platform.OS === 'android' ? 'polite' : undefined
            }
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
