import React from 'react';
import { type StyleProp, Text, type TextStyle, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { r, useColors, useThemedStyles } from '../../../theme';
import { Icon } from '../Icon';
import { useListVariant } from './context';
import { Leading } from './Leading';
import { makeStyles } from './styles';
import type { CellProps } from './types';

function renderSlot(
  value: React.ReactNode,
  textStyle: StyleProp<TextStyle>,
  numberOfLines: number
): React.ReactNode {
  if (value == null) return null;
  if (typeof value === 'string') {
    return (
      <Text style={textStyle} numberOfLines={numberOfLines}>
        {value}
      </Text>
    );
  }
  return value;
}

/**
 * 设置 / 列表行。布局:`leading? · (title / desc) · extra? · arrow?`
 *
 * 两种风格(由父 `<List>` 通过 ListVariantContext 决定):
 * - `grouped`(默认):独立白卡片 + 8px 间距
 * - `flush`(嵌在 Card 内):紧凑列表,28×28 橙色 icon 盒子,行间 inset hairline 分隔
 */
export function Cell({
  title,
  titleLines,
  desc,
  extra,
  arrow,
  leading,
  onPress,
  disabled,
  danger,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
}: CellProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const variant = useListVariant();
  const flush = variant === 'flush';

  const cellStyle = [
    styles.cell,
    flush && styles.cellFlush,
    flush && desc != null && styles.cellFlushWithDesc,
    style,
  ];

  const titleColor = danger ? c.error : undefined;
  const titleStyle = [
    flush ? styles.titleFlush : styles.title,
    titleColor && { color: titleColor },
  ];
  const descStyle = flush ? styles.descFlush : styles.desc;
  const extraStyle = flush ? styles.extraFlush : styles.extra;

  const inner = (
    <View style={cellStyle} testID={onPress ? undefined : testID}>
      {leading != null ? <Leading slot={leading} danger={danger} /> : null}
      <View style={styles.body}>
        {renderSlot(title, titleStyle, titleLines ?? 1)}
        {renderSlot(desc, descStyle, 2)}
      </View>
      {renderSlot(extra, extraStyle, 1)}
      {arrow && !danger ? (
        <Icon
          name="chevron-right"
          size={r(flush ? 18 : 20)}
          color={c.foregroundSubtle}
          style={flush ? styles.chevronFlush : undefined}
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ?? (typeof title === 'string' ? title : undefined)
        }
        accessibilityHint={accessibilityHint}
        accessibilityState={disabled ? { disabled: true } : undefined}
        testID={testID}
        style={({ pressed }) => [
          { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}
