import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { darkColors, lightColors, useTheme } from '../../../theme';
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
  const [transparent, setTransparent] = useState(false);
  useEffect(() => {
    const media = browser.matchMedia?.(
      '(prefers-reduced-transparency: reduce)'
    );
    const supported =
      browser.CSS?.supports('backdrop-filter', 'blur(1px)') ||
      browser.CSS?.supports('-webkit-backdrop-filter', 'blur(1px)');
    const update = () => setTransparent(Boolean(supported) && !media?.matches);
    update();
    media?.addEventListener('change', update);
    return () => media?.removeEventListener('change', update);
  }, []);
  const resolvedTint =
    tintColor ?? (effect === 'clear' ? c.tabBarGlassTint : c.glassSurface);
  const filter = transparent
    ? `blur(${webGlassBlur[effect]}px) saturate(180%)`
    : 'none';
  // RN 类型不含 CSS backdrop-filter；SSR 和无模糊能力的浏览器先呈现实色。
  const webGlassStyle: ViewStyle &
    Pick<React.CSSProperties, 'backdropFilter' | 'WebkitBackdropFilter'> = {
    backdropFilter: filter,
    WebkitBackdropFilter: filter,
    backgroundColor: transparent ? resolvedTint : c.surface,
  };

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
