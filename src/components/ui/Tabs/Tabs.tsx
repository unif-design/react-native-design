import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useColors, useThemedStyles, fw } from '@/theme';
import { childTestID } from '@/utils/testID';
import { makeStyles } from './styles';
import type { TabsProps } from './types';

/**
 * 页面级下划线 tabs。
 * 占满宽度，高 44px，激活项下方有 2px 主色下划线。
 */
export function Tabs({
  value,
  onChange,
  items,
  testID,
}: TabsProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.under} testID={testID}>
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
              styles.underTab,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={[
                styles.underLabel,
                {
                  color: on ? c.primary : c.foregroundMuted,
                  fontWeight: on ? fw.semi : fw.medium,
                },
              ]}
              numberOfLines={1}
            >
              {it.label}
            </Text>
            {on ? <View style={styles.underBar} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}
