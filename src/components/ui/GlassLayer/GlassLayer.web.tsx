import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { darkColors, lightColors, useTheme } from '../../../theme';
import { styles } from './styles';
import { GlassGradient } from './GlassGradient';
import { webGlassBlur } from './constants';
import type { GlassLayerProps } from './types';

type MediaQuery = {
  matches: boolean;
  addEventListener: (event: 'change', listener: () => void) => void;
  removeEventListener: (event: 'change', listener: () => void) => void;
};
const browser = globalThis as typeof globalThis & {
  matchMedia?: (query: string) => MediaQuery;
  CSS?: { supports: (property: string, value: string) => boolean };
};

/** Web 保留 CSS 玻璃近似效果，不加载原生 Liquid Glass 模块。 */
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
  const [material, setMaterial] = useState({ blur: false, reduced: true });
  useEffect(() => {
    const media = browser.matchMedia?.(
      '(prefers-reduced-transparency: reduce)'
    );
    const supported =
      browser.CSS?.supports('backdrop-filter', 'blur(1px)') ||
      browser.CSS?.supports('-webkit-backdrop-filter', 'blur(1px)');
    const update = () =>
      setMaterial({
        blur: Boolean(supported),
        reduced: media?.matches ?? false,
      });
    update();
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);
  const resolvedTint =
    tintColor ?? (effect === 'clear' ? c.tabBarGlassTint : c.glassSurface);
  const transparent = material.blur && !material.reduced;
  const filter = transparent
    ? `blur(${webGlassBlur[effect]}px) saturate(180%)`
    : 'none';
  // SSR 在媒体偏好读取前保持实色；无模糊能力时仍可绘制渐变。
  const webGlassStyle: ViewStyle &
    Pick<React.CSSProperties, 'backdropFilter' | 'WebkitBackdropFilter'> = {
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    backgroundColor: material.reduced
      ? (fallbackColor ?? c.surface)
      : transparent
        ? resolvedTint
        : 'transparent',
  };

  return (
    <View
      style={[StyleSheet.absoluteFill, style, styles.clipped, webGlassStyle]}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
    >
      {!material.blur && !material.reduced ? (
        <GlassGradient
          colors={c}
          effect={effect}
          testID={testID ? `${testID}-gradient` : undefined}
        />
      ) : null}
    </View>
  );
}
