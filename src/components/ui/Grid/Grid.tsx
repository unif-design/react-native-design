import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { pressedOpacity, r, useColors, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { Icon } from '../Icon';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { gridItemAccessibilityLabel } from './accessibility';
import { colWidth, makeStyles } from './styles';
import type { GridProps } from './types';

const log = createLogger('Grid');

// 渲染路径去重集合 —— 同一 columns 值只在首次渲染时告警一次,避免长列表重复刷 log。
const _warnedColumns = new Set<unknown>();

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
  style,
  testID,
}: GridProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const hasInvalidColumns = ![1, 2, 3, 4, 5, 6].includes(columns);
  const actionHandler = typeof onPress === 'function' ? onPress : undefined;
  const itemAccessibility = items.map(gridItemAccessibilityLabel);
  const missingActionNameKey =
    actionHandler === undefined
      ? ''
      : itemAccessibility
          .map((label, index) => (label === undefined ? String(index) : ''))
          .filter(Boolean)
          .join(',');

  useEffect(() => {
    if (hasInvalidColumns && !_warnedColumns.has(columns)) {
      _warnedColumns.add(columns);
      log.warn(
        `columns 仅支持 1..6，传入 ${String(columns)}，已 fallback 为 4 列`
      );
    }
  }, [columns, hasInvalidColumns]);
  useEffect(() => {
    if (missingActionNameKey.length > 0) {
      log.warn(
        `Grid item 缺少非空业务名称(${missingActionNameKey})，已按 display-only 渲染。`
      );
    }
  }, [missingActionNameKey]);

  const cellWidth = colWidth(columns);
  return (
    <View style={[styles.wrap, card && styles.card, style]} testID={testID}>
      <View style={styles.inner}>
        {items.map((item, index) => {
          const itemTestID = childTestID(testID, item.id, item.testID);
          const accessibilityLabel = itemAccessibility[index];
          const cellContent = (
            <>
              <View>
                {/* 28pt 介于 icon.md(26) / icon.lg(30) 之间的设计稿专定字形尺寸 */}
                <Icon name={item.icon} size={r(28)} color={c.foregroundMuted} />
                {item.badge != null ? (
                  <View {...A11Y_HIDDEN_PROPS} style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.label} numberOfLines={1}>
                {item.label}
              </Text>
            </>
          );
          return (
            <View key={item.id} style={cellWidth}>
              {actionHandler !== undefined &&
              accessibilityLabel !== undefined ? (
                // 有 onPress 才挂 Pressable + button 语义,纯展示宫格不播报 button
                <Pressable
                  onPress={() => actionHandler(item)}
                  accessibilityRole="button"
                  accessibilityLabel={accessibilityLabel}
                  testID={itemTestID}
                  style={({ pressed }) => [
                    styles.cell,
                    { opacity: pressed ? pressedOpacity : 1 },
                  ]}
                >
                  {cellContent}
                </Pressable>
              ) : (
                <View
                  accessible={accessibilityLabel !== undefined}
                  accessibilityLabel={accessibilityLabel}
                  style={styles.cell}
                  testID={itemTestID}
                >
                  {cellContent}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
