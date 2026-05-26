import React from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { useColors, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { Icon } from '../Icon';
import { colWidth, makeStyles } from './styles';
import type { GridProps } from './types';

const log = createLogger('Grid');

/**
 * 图标入口宫格 —— 首页 / 分类落地页。1..6 列。
 * 每格：图标 + 小标签，纵向居中。
 *
 * 性能：列宽走 StyleSheet 预生成规则（colWidth），避免每个 cell 创建内联对象。
 */
export function Grid({
  items,
  columns = 4,
  onPress,
  card = true,
  testID,
}: GridProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  if (![1, 2, 3, 4, 5, 6].includes(columns)) {
    log.warn(`columns 仅支持 1..6，传入 ${columns}，已 fallback 为 4 列`);
  }
  const cellWidth = colWidth(columns);
  return (
    <View style={[styles.wrap, card && styles.card]} testID={testID}>
      <View style={styles.inner}>
        {items.map((item) => {
          const itemTestID = childTestID(testID, item.id, item.testID);
          return (
            <View key={item.id} style={cellWidth}>
              <Pressable
                onPress={() => onPress?.(item)}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                testID={itemTestID}
                style={({ pressed }) => [
                  styles.cell,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <View>
                  {/* 28pt 介于 icon.md(26) / icon.lg(30) 之间的设计稿专定字号 */}
                  <Icon name={item.icon} size={28} color={c.foregroundMuted} />
                  {item.badge != null ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
