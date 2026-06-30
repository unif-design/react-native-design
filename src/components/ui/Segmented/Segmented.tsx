import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { fw, useTheme, useThemedStyles } from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { makeStyles, sizingFor } from './styles';
import type { SegmentedProps } from './types';

/**
 * 局部分段控件 —— pill 在 track 上,激活项是亮色 thumb。
 *
 * **active thumb 必须比 track 亮一档** —— shadow 只在亮色态显示,
 * 暗色态由 surface 明度差表达层级。
 *
 * `size`:默认 `'md'`(44pt 触控达标);`'sm'` 紧凑(28pt)给模型下拉等局促位用。
 */
export function Segmented({
  value,
  onChange,
  items,
  size = 'md',
  disabled = false,
  testID,
}: SegmentedProps): React.JSX.Element {
  const { colors: c, scheme, shadow } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const sizing = useMemo(() => sizingFor(size), [size]);
  const activeBg = scheme === 'dark' ? c.surfaceContainerHighest : c.surface;
  const activeShadow = scheme === 'dark' ? null : shadow.subtle;

  return (
    // [L-34] accessibilityRole="tablist" —— SR 宣读"标签列表"
    <View style={styles.seg} testID={testID} accessibilityRole="tablist">
      {items.map((it) => {
        const on = it.id === value;
        const itemTestID = childTestID(testID, it.id, it.testID);
        // [L-82] item 禁用 = 整体 disabled OR 单项 it.disabled
        const itemDisabled = disabled || !!it.disabled;
        return (
          <Pressable
            key={it.id}
            onPress={() => !itemDisabled && onChange(it.id)}
            disabled={itemDisabled}
            accessibilityRole="tab"
            accessibilityState={{ selected: on, disabled: itemDisabled }}
            accessibilityLabel={it.label}
            testID={itemTestID}
            style={({ pressed }) => [
              styles.segItem,
              { minHeight: sizing.minHeight, paddingHorizontal: sizing.px },
              on && { backgroundColor: activeBg },
              on && activeShadow,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={{
                fontSize: sizing.fs,
                color: on ? c.foreground : c.foregroundSubtle,
                fontWeight: on ? fw.semi : fw.medium,
              }}
              numberOfLines={1}
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
