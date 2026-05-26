import React from 'react';
import { Text, View } from 'react-native';
import { useColors, useThemedStyles } from '@/theme';
import { IconButton } from '../IconButton';
import { isSlot } from './isSlot';
import { makeStyles } from './styles';
import type { NavBarProps, NavBarSlotConfig } from './types';

/** NavBarSlotConfig → IconButton(variant='ghost' + 外部 tint)。
 *  accessibilityLabel 必填(IconButton 强制),fallback 到 icon 名。 */
function renderSlot(slot: NavBarSlotConfig, tint: string) {
  return (
    <IconButton
      icon={slot.icon}
      onPress={slot.onPress}
      variant="ghost"
      color={tint}
      accessibilityLabel={slot.accessibilityLabel ?? slot.icon}
    />
  );
}

/** left / right slot:NavBarSlotConfig → IconButton,ReactNode → 原样。 */
function resolveSlot(
  slot: NavBarProps['left'] | NavBarProps['right'],
  tint: string
): React.ReactNode {
  if (!slot) return null;
  if (isSlot(slot)) return renderSlot(slot, tint);
  return slot;
}

export function NavBar({
  title,
  subtitle,
  left,
  right,
  variant = 'default',
  testID,
}: NavBarProps) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const isBrand = variant === 'brand';
  const isTransparent = variant === 'transparent';
  // brand 实底白字;default + transparent 都走深字(transparent 用在浅色
  // hero 渐变之上,白字看不清)。后续若有"相机 / 地图"等深色浮层场景需要
  // 白字 transparent navbar,再加 'transparentLight' variant。
  const tint = isBrand ? c.onPrimary : c.foreground;
  const subtint = isBrand ? c.onPrimaryMuted : c.foregroundSubtle;
  return (
    <View
      style={[
        styles.bar,
        isBrand && styles.barBrand,
        isTransparent && styles.barTransparent,
      ]}
      testID={testID}
    >
      <View style={styles.side}>{resolveSlot(left, tint)}</View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: tint }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtint }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>
        {resolveSlot(right, tint)}
      </View>
    </View>
  );
}
