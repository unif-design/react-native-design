import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import {
  GlassLayer,
  GlassStats,
  ThemeProvider,
  darkColors,
  lightColors,
  radius,
} from '@unif/react-native-design';
import { restoreNativeMocks } from './helpers/nativeMocks';

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test.each(['clear', 'regular'] as const)(
  '支持原生玻璃时将 %s 材质、主题和 tint 交给 LiquidGlassView',
  (effect) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      true
    );
    const view = render(
      <ThemeProvider forceScheme="light">
        <GlassLayer effect={effect} testID="glass-layer" />
      </ThemeProvider>
    );
    const material = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(material.props).toMatchObject({
      effect,
      colorScheme: 'light',
      tintColor:
        effect === 'clear'
          ? lightColors.glassTintLight
          : lightColors.sheetBackdrop,
      animated: false,
      pointerEvents: 'none',
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
    expect(
      StyleSheet.flatten(material.props.style).backgroundColor
    ).toBeUndefined();

    view.rerender(
      <ThemeProvider forceScheme="dark">
        <GlassLayer effect={effect} testID="glass-layer" />
      </ThemeProvider>
    );
    expect(
      screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props
    ).toMatchObject({
      colorScheme: 'dark',
      tintColor:
        effect === 'clear'
          ? darkColors.glassTintLight
          : darkColors.sheetBackdrop,
    });
  }
);

test.each([
  ['ios', 'light', 'clear', lightColors.glassTintLight],
  ['ios', 'dark', 'regular', darkColors.sheetBackdrop],
  ['android', 'light', 'regular', lightColors.sheetBackdrop],
  ['android', 'dark', 'clear', darkColors.glassTintLight],
] as const)(
  '%s 无原生材质时使用 %s 主题的 %s 半透明背景',
  (os, scheme, effect, backgroundColor) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      false
    );
    jest.replaceProperty(Platform, 'OS', os);
    render(
      <ThemeProvider forceScheme={scheme}>
        <GlassLayer
          effect={effect}
          style={{ borderRadius: 14 }}
          testID="glass-layer"
        />
      </ThemeProvider>
    );
    expect(
      screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.effect
    ).toBe('none');
    expect(
      screen.getByTestId('glass-layer', { includeHiddenElements: true })
    ).toHaveStyle({
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: 14,
      backgroundColor,
    });
  }
);

test.each([true, false])(
  '自定义 tintColor 在原生支持=%s 时覆盖主题默认色',
  (supported) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    render(
      <ThemeProvider>
        <GlassLayer tintColor={lightColors.primary} testID="glass-layer" />
      </ThemeProvider>
    );
    expect(
      screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props
    ).toMatchObject({
      effect: supported ? 'regular' : 'none',
      tintColor: lightColors.primary,
    });
    expect(
      StyleSheet.flatten(
        screen.getByTestId('glass-layer', { includeHiddenElements: true }).props
          .style
      ).backgroundColor
    ).toBe(supported ? undefined : lightColors.primary);
  }
);

test.each([true, false])(
  'GlassStats 在原生支持=%s 时接回 clear 材质、主题和圆角',
  (supported) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    render(
      <ThemeProvider forceScheme="dark">
        <GlassStats
          items={[
            ['12', '今日'],
            ['86', '本月'],
          ]}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('12')).toBeOnTheScreen();
    expect(screen.getByText('本月')).toBeOnTheScreen();
    const material = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(material.props).toMatchObject({
      effect: supported ? 'clear' : 'none',
      colorScheme: 'dark',
      tintColor: darkColors.glassTintLight,
    });
    expect(StyleSheet.flatten(material.props.style)).toMatchObject({
      borderRadius: radius['2xl'],
    });
  }
);
