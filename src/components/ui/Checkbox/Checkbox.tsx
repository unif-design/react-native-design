import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  fixed,
  pressedOpacity,
  r,
  useColors,
  useThemedStyles,
} from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { Icon } from '../Icon';
import { makeStyles } from './styles';
import type { CheckboxProps } from './types';

const log = createLogger('Checkbox');

/**
 * 多选复选框。20×20 盒子。
 * 关：透明背景 + 细线边框。
 * 开：主色填充 + 白色对勾。
 *
 * `shape='circle'` —— 必勾确认项专用(协议同意等),圆形以示区别。
 */
export function Checkbox({
  checked,
  onChange,
  label,
  accessibilityLabel,
  shape = 'square',
  disabled,
  testID,
}: CheckboxProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const accessibleName =
    normalizeNonBlankText(accessibilityLabel) ?? normalizeNonBlankText(label);
  const hasMissingName = accessibleName === undefined;
  const isDisabled = disabled === true || hasMissingName;

  useEffect(() => {
    if (hasMissingName) {
      log.warn(
        'Checkbox 需要非空的 accessibilityLabel 或可见 label，当前 action 已禁用。'
      );
    }
  }, [hasMissingName]);

  return (
    <Pressable
      accessible={!hasMissingName}
      onPress={isDisabled ? undefined : () => onChange(!checked)}
      disabled={isDisabled}
      // [M-7] box 20pt → 垂直补 (44-20)/2=12 到 fixed.hitTarget
      hitSlop={Math.round((fixed.hitTarget - r(20)) / 2)}
      accessibilityRole={hasMissingName ? undefined : 'checkbox'}
      accessibilityState={
        hasMissingName ? undefined : { checked, disabled: isDisabled }
      }
      accessibilityLabel={accessibleName}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { opacity: isDisabled ? 0.5 : pressed ? pressedOpacity : 1 },
      ]}
    >
      <View
        {...A11Y_HIDDEN_PROPS}
        style={[
          styles.box,
          // [L-79] circle 形态改用 radius.pill —— sentinel 999 确保任何尺寸下都是真圆
          shape === 'circle' && styles.boxCircle,
          checked && {
            backgroundColor: c.primary,
            borderColor: c.primary,
          },
        ]}
      >
        {/* 常驻渲染 + opacity 切显隐(非 {checked?<Icon/>:null} 条件挂载)—— 见 styles.tickHidden。 */}
        <Icon
          name="check"
          size={r(14)}
          color={c.onPrimary}
          strokeWidth={3.5}
          style={checked ? undefined : styles.tickHidden}
        />
      </View>
      {label ? (
        <Text {...A11Y_HIDDEN_PROPS} style={styles.label}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}
