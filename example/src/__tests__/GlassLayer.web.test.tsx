import { CloseOutlined } from '@unif/react-native-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { act, render, renderHook, screen } from '@testing-library/react-native';
import { LiquidGlassView } from '@callstack/liquid-glass';
import {
  ThemeProvider,
  Input,
  IconButton,
  darkColors,
  lightColors,
} from '@unif/react-native-design';
import { GlassLayer } from '../../../src/components/ui/GlassLayer/GlassLayer.web';
import { useGlassFallback } from '../../../src/components/ui/GlassLayer/useGlassFallback.web';

// Exercise the same platform entries selected by Metro/Webpack.
jest.mock('../../../src/components/ui/GlassLayer/useGlassFallback', () =>
  jest.requireActual(
    '../../../src/components/ui/GlassLayer/useGlassFallback.web'
  )
);
jest.mock('../../../src/components/ui/GlassLayer/GlassLayer', () =>
  jest.requireActual('../../../src/components/ui/GlassLayer/GlassLayer.web')
);

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'web');
  Object.defineProperty(globalThis, 'CSS', {
    configurable: true,
    value: { supports: () => true },
  });
});
afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(globalThis, 'CSS');
  Reflect.deleteProperty(globalThis, 'matchMedia');
});

test.each([
  ['clear', 'blur(10px) saturate(180%)', lightColors.tabBarGlassTint],
  ['regular', 'blur(40px) saturate(180%)', lightColors.glassSurface],
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
          ? darkColors.tabBarGlassTint
          : darkColors.glassSurface,
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

test('Web 跟随减少透明度，无 CSS 模糊能力时保留渐变', () => {
  let changed!: () => void;
  const media = {
    matches: false,
    addEventListener: (_: string, fn: () => void) => {
      changed = fn;
    },
    removeEventListener: jest.fn(),
  };
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: () => media,
  });
  const view = render(
    <ThemeProvider>
      <GlassLayer colorScheme="dark" testID="web-glass" />
    </ThemeProvider>
  );
  const layer = () =>
    StyleSheet.flatten(
      screen.getByTestId('web-glass', { includeHiddenElements: true }).props
        .style
    );
  expect(layer().backdropFilter).toContain('blur');
  act(() => {
    media.matches = true;
    changed();
  });
  expect(layer()).toMatchObject({
    backdropFilter: 'none',
    backgroundColor: darkColors.surface,
  });
  view.unmount();
  expect(media.removeEventListener).toHaveBeenCalled();
  Object.defineProperty(globalThis, 'CSS', {
    configurable: true,
    value: { supports: () => false },
  });
  media.matches = false;
  render(
    <ThemeProvider>
      <GlassLayer colorScheme="dark" testID="web-glass" />
    </ThemeProvider>
  );
  expect(layer()).toMatchObject({
    backdropFilter: 'none',
    backgroundColor: 'transparent',
  });
  expect(
    screen.getByTestId('web-glass-gradient', { includeHiddenElements: true })
  ).toBeTruthy();
});

test('Web 减少透明度时采用显式实色背景', () => {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
  Object.defineProperty(globalThis, 'CSS', {
    configurable: true,
    value: { supports: () => false },
  });
  render(
    <ThemeProvider>
      <GlassLayer
        fallbackColor={lightColors.surfaceContainerHigh}
        testID="web-fallback"
      />
    </ThemeProvider>
  );
  expect(
    screen.getByTestId('web-fallback', { includeHiddenElements: true })
  ).toHaveStyle({ backgroundColor: lightColors.surfaceContainerHigh });
});

test('Web 无模糊支持时显式浅色仍绘制无 testID 渐变', () => {
  Reflect.deleteProperty(globalThis, 'CSS');
  const {
    GlassGradient,
  } = require('../../../src/components/ui/GlassLayer/GlassGradient');
  const page = render(
    <ThemeProvider forceScheme="dark">
      <GlassLayer colorScheme="light" />
    </ThemeProvider>
  );
  expect(page.UNSAFE_getByType(GlassGradient).props.colors).toBe(lightColors);
  expect(page.UNSAFE_getByType(GlassGradient).props.testID).toBeUndefined();
});

test('Web 输入外壳不采用原生降级装饰', () => {
  const { result } = renderHook(() => useGlassFallback());
  expect(result.current).toBe(false);
});

test('Web 输入与减少透明度的图标按钮保留原有表面', () => {
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: () => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }),
  });
  const page = render(
    <ThemeProvider>
      <Input testID="web-field" accessibilityLabel="名称" />
      <IconButton
        icon={CloseOutlined}
        variant="glass"
        accessibilityLabel="关闭"
        onPress={jest.fn()}
      />
    </ThemeProvider>
  );
  const materials = page.UNSAFE_getAllByType(GlassLayer);
  expect(materials.map((node) => node.props.fallbackColor)).toEqual([
    lightColors.surfaceContainerHigh,
    lightColors.surfaceContainerHighest,
  ]);
  const field = page
    .getByTestId('web-field')
    .findAllByType(View)
    .find((node) => StyleSheet.flatten(node.props.style)?.borderWidth === 1)!;
  expect(StyleSheet.flatten(field.props.style)).toMatchObject({
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  });
  expect(StyleSheet.flatten(field.props.style).shadowOpacity).toBeUndefined();
});
