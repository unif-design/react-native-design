import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useThemedStyles } from '@/theme';
import { makeStyles } from './styles';
import type { ChipProps } from './types';

/**
 * 胶囊形可点击 chip。
 * - 默认：白底 + 细线边框，fg-1 文本
 * - 选中：主色边框 + 主色文本
 * - 按下：透明度 0.7
 *
 * 常用于建议 chip、筛选 pill、多选标签等。
 */
export function Chip({
  label,
  selected,
  onPress,
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
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected: !!selected }}
        accessibilityLabel={label}
        testID={testID}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}
