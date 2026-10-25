import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Platform } from 'react-native';
import { darkColors, lightColors, type ColorTokens } from './colors';
import type { ColorScheme } from './ThemeProvider';

const softWhiteColors: ColorTokens = {
  ...lightColors,
  background: '#F5F5F7',
  surfaceContainer: '#F7F7F9',
  surfaceContainerHigh: '#FAFAFC',
  surfaceContainerHighest: '#E8E8EC',
  outline: '#EEEEF2',
  outlineVariant: '#E1E1E7',
  outlineFaint: '#F3F3F6',
  heroGradient0: '#FBFBFD',
  heroGradient1: '#F8F8FB',
  heroGradient2: '#F5F5F7',
  heroHalo: '#F0F0F5',
};

export function usesNativeFallbackColors(): boolean {
  return (
    (Platform.OS === 'ios' || Platform.OS === 'android') &&
    !isLiquidGlassSupported
  );
}

export function resolveThemeColors(scheme: ColorScheme): ColorTokens {
  if (scheme === 'dark') return darkColors;
  return usesNativeFallbackColors() ? softWhiteColors : lightColors;
}
