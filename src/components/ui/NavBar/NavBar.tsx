import React, { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { useColors, useThemedStyles } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { IconButton } from '../IconButton';
import { classifyNavBarSlot, type NavBarSlotClassification } from './isSlot';
import { makeStyles } from './styles';
import type { NavBarAction, NavBarProps } from './types';

const log = createLogger('NavBar');

/** NavBarAction → IconButton(variant='ghost' + 外部 tint)。 */
function renderSlot(slot: NavBarAction, tint: string) {
  return (
    <IconButton
      icon={slot.icon}
      onPress={slot.onPress}
      variant="ghost"
      color={tint}
      accessibilityLabel={slot.accessibilityLabel}
    />
  );
}

/** left / right slot:NavBarAction → IconButton,ReactNode → 原样。 */
function resolveSlot(
  slot: NavBarSlotClassification,
  tint: string
): React.ReactNode {
  if (slot.kind === 'action') return renderSlot(slot.action, tint);
  if (slot.kind === 'node') return slot.node;
  return null;
}

/**
 * 安全区归属：NavBar **不**内置 top safe-area inset。
 * 宿主页面负责处理（推荐做法：在屏幕根容器或 Stack.Screen header 里
 * 用 `<SafeAreaView edges={['top']}>` 包住 NavBar，或配合
 * `react-navigation` 的 `headerStatusBarHeight` 选项）。
 * 这样 NavBar 可在任何场景复用（modal、底部抽屉 header 等不需要 top inset）。
 */
export function NavBar({
  title,
  subtitle,
  left,
  right,
  variant = 'default',
  style,
  testID,
}: NavBarProps) {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const isBrand = variant === 'brand';
  const isTransparent = variant === 'transparent';
  const leftSlot = classifyNavBarSlot(left);
  const rightSlot = classifyNavBarSlot(right);
  const warnedInvalidSlot = useRef(false);
  const hasInvalidSlot =
    leftSlot.kind === 'invalid' || rightSlot.kind === 'invalid';
  useEffect(() => {
    if (hasInvalidSlot && !warnedInvalidSlot.current) {
      warnedInvalidSlot.current = true;
      log.warn('忽略无效的 NavBar action；请传 NavBarAction 或 ReactNode');
    }
  }, [hasInvalidSlot]);
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
        style,
      ]}
      testID={testID}
    >
      <View style={styles.side}>{resolveSlot(leftSlot, tint)}</View>
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
        {resolveSlot(rightSlot, tint)}
      </View>
    </View>
  );
}
