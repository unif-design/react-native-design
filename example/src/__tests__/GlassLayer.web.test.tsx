import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { LiquidGlassView } from '@callstack/liquid-glass';
import {
  ThemeProvider,
  darkColors,
  lightColors,
} from '@unif/react-native-design';
import { GlassLayer } from '../../../src/components/ui/GlassLayer/GlassLayer.web';

test.each([
  ['clear', 'blur(10px) saturate(180%)', lightColors.glassTintLight],
  ['regular', 'blur(40px) saturate(180%)', lightColors.sheetBackdrop],
] as const)(
  'Web 的 %s 材质保留 CSS 近似效果与默认 tint',
  (effect, filter, backgroundColor) => {
    const view = render(
      <ThemeProvider forceScheme="light">
        <GlassLayer
          effect={effect}
          style={{ borderRadius: 14 }}
          testID="web-glass"
        />
      </ThemeProvider>
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId('web-glass', { includeHiddenElements: true }).props
          .style
      )
    ).toMatchObject({
      position: 'absolute',
      borderRadius: 14,
      backdropFilter: filter,
      WebkitBackdropFilter: filter,
      backgroundColor,
      opacity: 1,
    });
    expect(screen.UNSAFE_queryAllByType(LiquidGlassView)).toHaveLength(0);
    view.rerender(
      <ThemeProvider forceScheme="dark">
        <GlassLayer effect={effect} testID="web-glass" />
      </ThemeProvider>
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId('web-glass', { includeHiddenElements: true }).props
          .style
      )
    ).toMatchObject({
      backgroundColor:
        effect === 'clear'
          ? darkColors.glassTintLight
          : darkColors.sheetBackdrop,
      opacity: 0.96,
    });
  }
);

test('Web 默认 regular，tintColor 覆盖主题背景且装饰层不接管无障碍或触摸', () => {
  render(
    <ThemeProvider>
      <GlassLayer tintColor={lightColors.primary} testID="web-glass" />
    </ThemeProvider>
  );
  const layer = screen.getByTestId('web-glass', {
    includeHiddenElements: true,
  });
  expect(StyleSheet.flatten(layer.props.style)).toMatchObject({
    backdropFilter: 'blur(40px) saturate(180%)',
    backgroundColor: lightColors.primary,
  });
  expect(layer.props).toMatchObject({
    pointerEvents: 'none',
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  });
});
