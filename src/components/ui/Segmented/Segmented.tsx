import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { fw, useTheme, useThemedStyles } from '@/theme';
import { childTestID } from '@/utils/testID';
import { makeStyles } from './styles';
import type { SegmentedProps } from './types';

/**
 * 局部分段控件 —— 32px pill 在 track 上,激活项是亮色 thumb。
 *
 * **active thumb 必须比 track 亮一档** —— shadow 只在亮色态显示,
 * 暗色态由 surface 明度差表达层级。
 */
export function Segmented({
  value,
  onChange,
  items,
  testID,
}: SegmentedProps): React.JSX.Element {
  const { colors: c, scheme, shadow } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const activeBg = scheme === 'dark' ? c.surfaceContainerHighest : c.surface;
  const activeShadow = scheme === 'dark' ? null : shadow.subtle;

  return (
    <View style={styles.seg} testID={testID}>
      {items.map((it) => {
        const on = it.id === value;
        const itemTestID = childTestID(testID, it.id, it.testID);
        return (
          <Pressable
            key={it.id}
            onPress={() => onChange(it.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={it.label}
            testID={itemTestID}
            style={({ pressed }) => [
              styles.segItem,
              on && { backgroundColor: activeBg },
              on && activeShadow,
              { opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text
              style={[
                styles.segLabel,
                {
                  color: on ? c.foreground : c.foregroundSubtle,
                  fontWeight: on ? fw.semi : fw.medium,
                },
              ]}
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
