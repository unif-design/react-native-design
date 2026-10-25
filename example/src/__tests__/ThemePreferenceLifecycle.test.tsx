import { act, render, renderHook, screen } from '@testing-library/react-native';
import React from 'react';
import { AccessibilityInfo, Platform, Text } from 'react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import {
  darkColors,
  lightColors,
  lightShadow,
  ScreenBackdrop,
  ThemeProvider,
  useTheme,
  warmOrangePalette,
} from '@unif/react-native-design';
import { GradientWash } from '../../../src/components/business/Decorations/GradientWash';
import { RadialHalo } from '../../../src/components/business/Decorations/RadialHalo';
import { usePrefersReducedMotion } from '../../../src/theme/usePrefersReducedMotion.web';
import { useReducedTransparency } from '../../../src/theme/useReducedTransparency';

const originalMatchMedia = Object.getOwnPropertyDescriptor(
  globalThis,
  'matchMedia'
);

afterEach(() => {
  if (originalMatchMedia) {
    Object.defineProperty(globalThis, 'matchMedia', originalMatchMedia);
  } else {
    Reflect.deleteProperty(globalThis, 'matchMedia');
  }
  jest.restoreAllMocks();
});

test('Web 无 matchMedia 时安全返回默认偏好', () => {
  Reflect.deleteProperty(globalThis, 'matchMedia');
  const hook = renderHook(usePrefersReducedMotion);
  expect(hook.result.current).toBe(false);
  hook.unmount();
});

test('Web 系统减少动效的初始值、变更及取消订阅使用同一个查询', () => {
  let notify: (() => void) | undefined;
  const query = {
    matches: true,
    addEventListener: jest.fn((_event: string, listener: () => void) => {
      notify = listener;
    }),
    removeEventListener: jest.fn(),
  };
  const matchMedia = jest.fn(() => query);
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: matchMedia,
  });
  const hook = renderHook(usePrefersReducedMotion);
  expect(hook.result.current).toBe(true);
  expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  act(() => {
    query.matches = false;
    notify?.();
  });
  expect(hook.result.current).toBe(false);
  hook.unmount();
  expect(query.removeEventListener).toHaveBeenCalledWith('change', notify);
});

test('系统透明度查询拒绝后维持实色，卸载释放监听', async () => {
  const remove = jest.fn();
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove });
  jest
    .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
    .mockRejectedValue(new Error('系统设置暂不可读'));
  const hook = renderHook(useReducedTransparency);
  await act(async () => {});
  expect(hook.result.current).toBe(true);
  hook.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('没有强制主题时实际跟随系统深色偏好', () => {
  const RN = require('react-native') as typeof import('react-native');
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
  const hook = renderHook(useTheme, {
    wrapper: ({ children }) =>
      React.createElement(ThemeProvider, null, children),
  });
  expect(hook.result.current.scheme).toBe('dark');
});

test.each([
  ['ios', false, true],
  ['android', false, true],
  ['ios', true, false],
  ['android', true, false],
  ['web', false, false],
  ['windows', false, false],
] as const)(
  '%s 原生玻璃支持=%s，仅目标平台使用柔雾白=%s',
  (os, supported, softWhite) => {
    jest.replaceProperty(Platform, 'OS', os);
    jest.replaceProperty(LiquidGlass, 'isLiquidGlassSupported', supported);
    const hook = renderHook(useTheme, {
      wrapper: ({ children }) => (
        <ThemeProvider forceScheme="light" fontScale={1.35}>
          {children}
        </ThemeProvider>
      ),
    });
    if (softWhite) {
      expect(hook.result.current.colors).toMatchObject({
        background: '#F5F5F7',
        surface: '#FFFFFF',
        surfaceContainer: '#F7F7F9',
        surfaceContainerHigh: '#FAFAFC',
        heroGradient0: '#FBFBFD',
        heroHalo: '#F0F0F5',
        foreground: '#333333',
        primary: '#EB6E00',
        error: '#F4511E',
        success: '#52C41A',
      });
    } else {
      expect(hook.result.current.colors).toBe(lightColors);
    }
    expect(warmOrangePalette.resolve('light')).toEqual(
      softWhite
        ? ['#F9F9FB', '#FFFFFF', '#F8F8FA', '#F6F6F9']
        : warmOrangePalette.light
    );
    expect(warmOrangePalette.resolve('dark')).toBe(warmOrangePalette.dark);
    expect(hook.result.current.shadow).toBe(lightShadow);
    expect(hook.result.current.fontScale).toBe(1.35);
    const colors = hook.result.current.colors;
    hook.rerender({});
    expect(hook.result.current.colors).toBe(colors);
  }
);

test.each(['ios', 'android', 'web'] as const)(
  '%s 的深色主题不受浅色回退配色影响',
  (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    jest.replaceProperty(LiquidGlass, 'isLiquidGlassSupported', false);
    const hook = renderHook(useTheme, {
      wrapper: ({ children }) => (
        <ThemeProvider forceScheme="dark">{children}</ThemeProvider>
      ),
    });
    expect(hook.result.current.colors).toBe(darkColors);
  }
);

test('旧 iOS 既有背景只换色，stop 位置、halo 几何与透明度不变', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.replaceProperty(LiquidGlass, 'isLiquidGlassSupported', false);
  render(
    <ThemeProvider forceScheme="light">
      <ScreenBackdrop preset="warmOrange">
        <Text>订单详情</Text>
      </ScreenBackdrop>
    </ThemeProvider>
  );
  expect(screen.UNSAFE_getByType(GradientWash).props.stops).toEqual([
    { offset: 0, color: '#F9F9FB', opacity: 1 },
    { offset: 0.35, color: '#FFFFFF', opacity: 1 },
    { offset: 0.75, color: '#F8F8FA', opacity: 1 },
    { offset: 1, color: '#F6F6F9', opacity: 1 },
  ]);
  expect(
    screen.UNSAFE_getAllByType(RadialHalo).map((item) => ({
      color: item.props.color,
      opacity: item.props.maxOpacity,
    }))
  ).toEqual([
    { color: '#F0F0F5', opacity: 0.22 },
    { color: '#F0F0F5', opacity: 0.18 },
    { color: '#F0F0F5', opacity: 0.16 },
  ]);
  expect(screen.getByText('订单详情')).toBeVisible();
});

test('柔雾白不覆盖调用方的自定义背景颜色', () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.replaceProperty(LiquidGlass, 'isLiquidGlassSupported', false);
  const stops = {
    light: [{ offset: 0, color: '#123456' }],
    dark: [{ offset: 0, color: '#654321' }],
  };
  render(
    <ThemeProvider forceScheme="light">
      <ScreenBackdrop
        preset="warmOrange"
        stops={stops}
        halos={[{ size: 120, color: '#778899', maxOpacity: 0.2 }]}
      />
    </ThemeProvider>
  );
  expect(screen.UNSAFE_getByType(GradientWash).props.stops).toBe(stops.light);
  expect(screen.UNSAFE_getByType(RadialHalo).props).toMatchObject({
    color: '#778899',
    size: 120,
    maxOpacity: 0.2,
  });
});
