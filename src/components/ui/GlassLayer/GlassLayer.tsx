import React from 'react';
import { StyleSheet } from 'react-native';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { useColors, useTheme } from '../../../theme';
import type { GlassLayerProps } from './types';

/** 装饰玻璃层；不支持原生材质的平台使用主题半透明背景。 */
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

  return (
    <LiquidGlassView
      // 支持标记也可能因宿主设计兼容设置关闭，必须显式禁用原生材质。
      effect={isLiquidGlassSupported ? effect : 'none'}
      tintColor={resolvedTint}
      colorScheme={scheme}
      // 纯装饰层无需材质切换动画，也不引入减少动态效果的额外状态。
      animated={false}
      style={[
        StyleSheet.absoluteFill,
        style,
        !isLiquidGlassSupported && { backgroundColor: resolvedTint },
      ]}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    />
  );
}
