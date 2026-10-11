import { GlassLayer } from '../GlassLayer';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  fw,
  scaleFontMetric,
  useFontScale,
  useTheme,
  useThemedStyles,
} from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { makeStyles, sizingFor } from './styles';
import type { SegmentedProps } from './types';

/**
 * 局部分段控件：solid 保持实色选中块；glass 使用内外胶囊和中性选中底。
 *
 * `size`:默认 `'md'`(44pt 触控达标);`'sm'` 紧凑(28pt)给模型下拉等局促位用。
 */
export function Segmented({
  surface = 'solid',
  value,
  onChange,
  items,
  size = 'md',
  disabled = false,
  testID,
}: SegmentedProps): React.JSX.Element {
  const { colors: c, scheme, shadow } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const fontScale = useFontScale();
  const sizing = useMemo(() => sizingFor(size), [size]);
  const textSize = scaleFontMetric(sizing.fs, fontScale);
  const isGlass = surface === 'glass';
  const activeBg = isGlass
    ? c.glassSeparator
    : scheme === 'dark'
      ? c.surfaceContainerHighest
      : c.surface;
  const activeShadow = isGlass || scheme === 'dark' ? null : shadow.subtle;

  return (
    // [L-34] accessibilityRole="tablist" —— SR 宣读"标签列表"
    <View
      style={[styles.seg, surface === 'glass' && styles.glass]}
      testID={testID}
      accessibilityRole="tablist"
    >
      {surface === 'glass' ? <GlassLayer style={styles.material} /> : null}
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
              isGlass && styles.glassItem,
              { minHeight: sizing.minHeight, paddingHorizontal: sizing.px },
              on && { backgroundColor: activeBg },
              on && activeShadow,
              { opacity: itemDisabled ? 0.4 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={{
                fontSize: textSize,
                color: on
                  ? c.foreground
                  : surface === 'glass'
                    ? c.foregroundMuted
                    : c.foregroundSubtle,
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
