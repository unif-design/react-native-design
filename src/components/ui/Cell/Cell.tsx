import React from 'react';
import { type StyleProp, Text, type TextStyle, View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import { pressedOpacity, r, useColors, useThemedStyles } from '../../../theme';
import { Icon } from '../Icon';
import { useListVariant } from './context';
import { Leading } from './Leading';
import { makeStyles } from './styles';
import type { CellProps } from './types';

/** extra 是否包含可交互控件(Switch/Stepper/Checkbox 等 ReactNode)。
 *  用于决定 Pressable 外壳是否关闭 accessible —— 若外壳 accessible=true 且 extra 也是
 *  独立 accessible 控件,SR 会产生「双播报 + 控件被遮挡无法直接激活」的体验缺陷。
 *  规则:extra 是 ReactNode(非 string / null / undefined)时判定为「可能含控件」。
 *  使用方若明确 extra 是纯展示 ReactNode,可通过 accessibilityHint='none' 绕过(暂不加 prop)。*/
function extraHasInteractiveNode(extra: CellProps['extra']): boolean {
  return extra != null && typeof extra !== 'string';
}

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
    // 若 extra 含交互控件(Switch/Stepper 等),外壳 Pressable 关闭 accessible,
    // 让 SR 直接穿透读取控件本身,避免双播报和控件被遮挡无法激活的体验缺陷。
    const hasInteractiveExtra = extraHasInteractiveNode(extra);

    // 默认 a11y label:title + desc 拼接,给 SR 用户同时听到主副信息。
    // 有 accessibilityLabel 显式覆盖时走 prop,否则组合 title+desc。
    const defaultLabel =
      typeof title === 'string'
        ? typeof desc === 'string' && desc
          ? `${title},${desc}`
          : title
        : undefined;

    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? defaultLabel}
        accessibilityHint={accessibilityHint}
        accessibilityState={disabled ? { disabled: true } : undefined}
        // extra 含控件时外壳不作为独立 a11y 元素,让 SR 穿透到 extra 控件
        accessible={hasInteractiveExtra ? false : undefined}
        testID={testID}
        style={({ pressed }) => [
          { opacity: disabled ? 0.5 : pressed ? pressedOpacity : 1 },
        ]}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}
