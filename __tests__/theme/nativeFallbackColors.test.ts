import { afterEach, expect, jest, test } from '@jest/globals';
import { Platform } from 'react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import { darkColors, lightColors } from '../../src/theme/colors';
import { resolveThemeColors } from '../../src/theme/nativeFallbackColors';
import { warmOrangePalette } from '../../src/theme/palettes';

const glassSupport: { isLiquidGlassSupported: boolean } = LiquidGlass;

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ['ios', false, true],
  ['android', false, true],
  ['ios', true, false],
  ['android', true, false],
  ['web', false, false],
  ['windows', false, false],
] as const)('%s 原生支持=%s，浅色柔雾白=%s', (os, supported, softWhite) => {
  jest.replaceProperty(Platform, 'OS', os);
  jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', supported);
  const colors = resolveThemeColors('light');
  if (softWhite) {
    expect(colors).toEqual({
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
    });
    expect(warmOrangePalette.resolve('light')).toEqual([
      '#F9F9FB',
      '#FFFFFF',
      '#F8F8FA',
      '#F6F6F9',
    ]);
  } else {
    expect(colors).toBe(lightColors);
    expect(warmOrangePalette.resolve('light')).toBe(warmOrangePalette.light);
  }
  expect(resolveThemeColors('light')).toBe(colors);
});

test.each(['ios', 'android', 'web'] as const)('%s 深色配色保持原引用', (os) => {
  jest.replaceProperty(Platform, 'OS', os);
  jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', false);
  expect(resolveThemeColors('dark')).toBe(darkColors);
  expect(warmOrangePalette.resolve('dark')).toBe(warmOrangePalette.dark);
});
