import React from 'react';
import { StyleSheet } from 'react-native';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { darkColors, lightColors, useTheme } from '../../../theme';
import type { GlassLayerProps } from './types';
import { useReducedTransparency } from './useReducedTransparency';

/** 装饰玻璃层；无材质或减少透明度时使用可读的实色表面。 */
export function GlassLayer({
  effect = 'regular',
  tintColor,
  colorScheme,
  style,
  testID,
}: GlassLayerProps): React.JSX.Element {
  const theme = useTheme();
  const scheme = colorScheme ?? theme.scheme;
  const c = colorScheme
    ? scheme === 'dark'
      ? darkColors
      : lightColors
    : theme.colors;
  const reduced = useReducedTransparency(isLiquidGlassSupported);
  const nativeGlass = isLiquidGlassSupported && !reduced;
  const backgroundColor = nativeGlass ? 'transparent' : c.surface;

  return (
    <LiquidGlassView
      // 支持标记也可能因宿主设计兼容设置关闭，必须显式禁用原生材质。
      effect={nativeGlass ? effect : 'none'}
      tintColor={tintColor}
      colorScheme={scheme}
      // 纯装饰层无需材质切换动画，也不引入减少动态效果的额外状态。
      animated={false}
      style={[StyleSheet.absoluteFill, style, { backgroundColor }]}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    />
  );
}
