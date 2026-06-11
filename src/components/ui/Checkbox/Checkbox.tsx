import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { r, useColors, useThemedStyles } from '../../../theme';
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
      hitSlop={4}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={label}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}
    >
      <View
        style={[
          styles.box,
          shape === 'circle' && { borderRadius: r(20) / 2 },
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
            strokeWidth={2.5}
          />
        ) : null}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </Pressable>
  );
}
