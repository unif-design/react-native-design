import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { icon, useColors, useThemedStyles } from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { Icon } from '../Icon';
import { makeStyles } from './styles';
import type { TabBarProps } from './types';

/**
 * 固定底部 tab bar —— App 主导航。
 * 高 50px，顶部一条细线边框。激活色：primary。
 * 想留 home indicator 的安全区，请外面包一层 `<SafeAreaView edges={['bottom']}>`。
 */
export function TabBar({
  active,
  onChange,
  items,
  testID,
}: TabBarProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.bar} testID={testID}>
      {items.map((item) => {
        const on = item.id === active;
        const tint = on ? c.primary : c.foregroundSubtle;
        const itemTestID = childTestID(testID, item.id, item.testID);
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={item.label}
            testID={itemTestID}
            style={({ pressed }) => [
              styles.tab,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View>
              <Icon name={item.icon} size={icon.sm} color={tint} />
              {item.badge != null ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, { color: tint }]} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
