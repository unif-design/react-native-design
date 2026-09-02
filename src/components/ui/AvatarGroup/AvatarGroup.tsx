import React, { useEffect } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import {
  pressedOpacity,
  scaleFontMetric,
  useColors,
  useFontScale,
  useThemedStyles,
} from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { Avatar } from '../Avatar';
import { resolveAvatarBorderRadius, sizingFor } from '../Avatar/styles';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { resolveAvatarGroupLayout } from './layout';
import { normalizeAvatarGroup } from './normalize';
import { makeStyles } from './styles';
import type { AvatarGroupProps } from './types';

const log = createLogger('AvatarGroup');
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  log.warn(message);
}

/** 重叠头像组；只拥有布局、溢出计数和可选溢出 action。 */
export function AvatarGroup({
  items,
  size = 'md',
  shape = 'circle',
  max,
  style,
  testID,
  onOverflowPress,
  overflowAccessibilityLabel,
  overflowAccessibilityHint,
}: AvatarGroupProps): React.JSX.Element | null {
  const colors = useColors();
  const fontScale = useFontScale();
  const styles = useThemedStyles(makeStyles);
  const normalized = normalizeAvatarGroup(items, max);
  const layout = resolveAvatarGroupLayout(size);
  const avatarSizing = sizingFor(size);
  const overflowFontSize = scaleFontMetric(avatarSizing.fs, fontScale);
  const customOverflowLabel = normalizeNonBlankText(overflowAccessibilityLabel);
  const hasBlankOverflowLabel =
    normalized.overflowCount > 0 &&
    onOverflowPress !== undefined &&
    overflowAccessibilityLabel !== undefined &&
    customOverflowLabel === undefined;

  useEffect(() => {
    if (typeof __DEV__ === 'undefined' || !__DEV__) return;
    if (normalized.invalidMax) {
      warnOnce(
        `max:${String(max)}`,
        `max 必须是大于等于 2 的有限整数，传入 ${String(max)}，已展示全部成员。`
      );
    }
    if (hasBlankOverflowLabel) {
      warnOnce(
        'overflowAccessibilityLabel:blank',
        'overflowAccessibilityLabel 不能为空白，已回退默认名称。'
      );
    }
  }, [hasBlankOverflowLabel, max, normalized.invalidMax]);

  if (items.length === 0) return null;

  const slotStyle = (index: number): ViewStyle => ({
    borderColor: colors.surface,
    borderWidth: layout.borderWidth,
    marginStart: index === 0 ? 0 : -layout.overlap,
    zIndex: index,
  });
  const overflowCount = normalized.overflowCount;
  const overflowLabel = `+${overflowCount}`;
  const overflowA11yLabel =
    onOverflowPress === undefined
      ? `还有 ${overflowCount} 位成员`
      : (customOverflowLabel ?? `查看其余 ${overflowCount} 位成员`);
  const overflowStyle: ViewStyle = {
    ...slotStyle(normalized.visibleItems.length),
    width: layout.box,
    height: layout.box,
    borderRadius: resolveAvatarBorderRadius(size, shape),
    backgroundColor: colors.primaryContainer,
  };
  const overflowText = (
    <Text
      style={[
        styles.overflowText,
        { color: colors.primary, fontSize: overflowFontSize },
      ]}
      numberOfLines={1}
    >
      {overflowLabel}
    </Text>
  );

  return (
    <View style={[styles.root, style]} testID={testID}>
      {normalized.visibleItems.map((item, index) => (
        <Avatar
          key={item.key}
          label={item.label}
          source={item.source}
          variant={item.variant}
          size={size}
          shape={shape}
          style={slotStyle(index)}
        />
      ))}
      {overflowCount === 0 ? null : onOverflowPress === undefined ? (
        <View
          accessible
          accessibilityLabel={overflowA11yLabel}
          style={[styles.overflow, overflowStyle]}
          testID={childTestID(testID, 'overflow')}
        >
          {overflowText}
        </View>
      ) : (
        <Pressable
          accessible
          accessibilityRole="button"
          accessibilityLabel={overflowA11yLabel}
          accessibilityHint={overflowAccessibilityHint}
          onPress={onOverflowPress}
          hitSlop={layout.hitSlop}
          style={({ pressed }) => [
            styles.overflow,
            overflowStyle,
            { opacity: pressed ? pressedOpacity : 1 },
          ]}
          testID={childTestID(testID, 'overflow')}
        >
          {overflowText}
        </Pressable>
      )}
    </View>
  );
}
