import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  fixed,
  pressedOpacity,
  r,
  useColors,
  useThemedStyles,
} from '../../../theme';
import { Icon } from '../Icon';
import { makeStyles } from './styles';
import type { CheckboxProps } from './types';

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
  shape = 'square',
  disabled,
  testID,
}: CheckboxProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      // [M-7] box 20pt → 垂直补 (44-20)/2=12 到 fixed.hitTarget
      hitSlop={Math.round((fixed.hitTarget - r(20)) / 2)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.5 : pressed ? pressedOpacity : 1 },
      ]}
    >
      <View
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
        {checked ? (
          <Icon
            name="check"
            size={r(14)}
            color={c.onPrimary}
            strokeWidth={3.5}
          />
        ) : null}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}
