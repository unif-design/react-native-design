import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { fw, pressedOpacity, useColors, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { makeStyles } from './styles';
import type { TabsProps } from './types';

const log = createLogger('Tabs');

/**
 * 页面级下划线 tabs。
 * 占满宽度，高 44px，激活项下方有 2px 主色下划线。
 */
export function Tabs({
  value,
  onChange,
  items,
  disabled: allDisabled = false,
  testID,
}: TabsProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  // items 长度守卫 —— types 注释承诺「≥2 项才有意义」,此处对违规使用方 dev warn。
  // 不 return null:渲染空 tablist 比渲染单 tab 更符合 a11y 预期,且不破坏 hook 调用顺序。
  if (items.length < 2) {
    log.warn(`Tabs 至少需要 2 项，当前传入 ${items.length} 项`);
  }
  return (
    <View style={styles.under} testID={testID} accessibilityRole="tablist">
      {items.map((it) => {
        const on = it.id === value;
        const itemDisabled = allDisabled || (it.disabled ?? false);
        const itemTestID = childTestID(testID, it.id, it.testID);
        return (
          <Pressable
            key={it.id}
            onPress={() => !itemDisabled && onChange(it.id)}
            disabled={itemDisabled}
            accessibilityRole="tab"
            accessibilityState={{
              selected: on,
              disabled: itemDisabled || undefined,
            }}
            accessibilityLabel={it.label}
            testID={itemTestID}
            style={({ pressed }) => [
              styles.underTab,
              { opacity: itemDisabled ? 0.4 : pressed ? pressedOpacity : 1 },
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
