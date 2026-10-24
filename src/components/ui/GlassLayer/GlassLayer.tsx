import React from 'react';
import { StyleSheet } from 'react-native';
import { LiquidGlassView } from '@callstack/liquid-glass';
import { darkColors, lightColors, useTheme } from '../../../theme';
import type { GlassLayerProps } from './types';
import { styles } from './styles';
import { useGlassFallback } from './useGlassFallback';

/** 装饰材质层；无原生玻璃时统一使用主题分组实色。 */
export function GlassLayer({
  effect = 'regular',
  tintColor,
  fallbackColor,
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
  const nativeGlass = !useGlassFallback();
  const backgroundColor = nativeGlass
    ? 'transparent'
    : (fallbackColor ?? c.surface);

  return (
    <LiquidGlassView
      // 支持标记也可能因宿主设计兼容设置关闭，必须显式禁用原生材质。
      effect={nativeGlass ? effect : 'none'}
      tintColor={tintColor}
      colorScheme={scheme}
      // 纯装饰层无需材质切换动画，也不引入减少动态效果的额外状态。
      animated={false}
      style={[
        StyleSheet.absoluteFill,
        style,
        !nativeGlass && styles.clipped,
        { backgroundColor },
      ]}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    />
  );
}
