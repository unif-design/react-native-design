import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useColors, useTheme } from '../../../theme';
import { webGlassBlur } from './constants';
import type { GlassLayerProps } from './types';

/** Web 保留 CSS 玻璃近似效果，不加载原生 Liquid Glass 模块。 */
export function GlassLayer({
  effect = 'regular',
  tintColor,
  style,
  testID,
}: GlassLayerProps): React.JSX.Element {
  const c = useColors();
  const { scheme } = useTheme();
  const resolvedTint =
    tintColor ?? (effect === 'clear' ? c.glassTintLight : c.sheetBackdrop);
  // RN 类型不含 CSS backdrop-filter。保留原有饱和度和暗色透明度近似值。
  const webGlassStyle = {
    backdropFilter: `blur(${webGlassBlur[effect]}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${webGlassBlur[effect]}px) saturate(180%)`,
    backgroundColor: resolvedTint,
    opacity: scheme === 'dark' ? 0.96 : 1,
  } as unknown as StyleProp<ViewStyle>;

  return (
    <View
      style={[StyleSheet.absoluteFill, style, webGlassStyle]}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    />
  );
}
