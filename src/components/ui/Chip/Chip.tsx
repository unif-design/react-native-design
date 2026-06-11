import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { fixed, pressedOpacity, r, rf, useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { ChipProps } from './types';

/**
 * 胶囊形可点击 chip。
 * - 默认：surface 底 + outline 细线边框，foreground 文本
 * - 选中：主色边框 + 主色文本
 * - 按下：透明度 pressedOpacity(与 ButtonBase 同源)
 * - 禁用：透明度 0.5 + 不响应 onPress
 *
 * 常用于建议 chip、筛选 pill、多选标签等。
 */
export function Chip({
  label,
  selected,
  onPress,
  disabled,
  leading,
  trailing,
  style,
  testID,
}: ChipProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const inner = (
    <View
      style={[styles.chip, selected && styles.chipOn, style]}
      testID={onPress ? undefined : testID}
    >
      {leading != null ? <View>{leading}</View> : null}
      <Text style={[styles.text, selected && styles.textOn]} numberOfLines={1}>
        {label}
      </Text>
      {trailing != null ? <View>{trailing}</View> : null}
    </View>
  );

  if (onPress) {
    // [M-7] chip 内容高 ≈ 2×space[3] + xs 行高 ≈ 34pt < 44pt
    // Pressable 是外壳,hitSlop 向外补足到 fixed.hitTarget
    const chipHitSlopV = Math.max(
      0,
      Math.round((fixed.hitTarget - (2 * r(8) + rf(13) * 1.4)) / 2)
    );
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected, disabled: !!disabled }}
        accessibilityLabel={label}
        testID={testID}
        hitSlop={{ top: chipHitSlopV, bottom: chipHitSlopV, left: 0, right: 0 }}
        style={({ pressed }) => [
          {
            alignSelf: 'flex-start',
            opacity: disabled ? 0.5 : pressed ? pressedOpacity : 1,
          },
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}
