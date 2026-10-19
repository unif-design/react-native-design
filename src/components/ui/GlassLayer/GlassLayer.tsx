import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import {
  LiquidGlassView,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';
import { darkColors, lightColors, useTheme } from '../../../theme';
import type { GlassLayerProps } from './types';
import { styles } from './styles';
import { GlassGradient } from './GlassGradient';
import { useReducedTransparency } from '../../../theme/useReducedTransparency';

/** 装饰玻璃层；旧系统使用半透明渐变，减少透明度时使用清晰实色。 */
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
  const reduced = useReducedTransparency();
  const nativeGlass = isLiquidGlassSupported && !reduced;
  const backgroundColor = reduced
    ? (fallbackColor ?? c.surface)
    : 'transparent';

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
        !nativeGlass &&
          !reduced &&
          Platform.OS === 'ios' && [
            styles.fallbackOutline,
            { borderColor: c.glassSeparator },
          ],
        { backgroundColor },
      ]}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    >
      {!nativeGlass && !reduced ? (
        <GlassGradient
          colors={c}
          effect={effect}
          testID={testID ? `${testID}-gradient` : undefined}
        />
      ) : null}
    </LiquidGlassView>
  );
}
