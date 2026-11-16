import { afterEach, expect, jest, test } from '@jest/globals';
import { Platform, StyleSheet } from 'react-native';
import { renderHook } from '../../example/node_modules/@testing-library/react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import {
  ThemeProvider,
  darkColors,
  darkShadow,
  lightColors,
  useNativeSurfaceStyles,
} from '@unif/react-native-design';

const glassSupport: { isLiquidGlassSupported: boolean } = LiquidGlass;

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ['ios', false, 'light', true, true],
  ['android', false, 'light', true, true],
  ['ios', false, 'dark', false, true],
  ['android', false, 'dark', false, true],
  ['ios', true, 'light', false, false],
  ['ios', true, 'dark', false, false],
  ['web', false, 'light', false, false],
  ['web', false, 'dark', false, false],
] as const)(
  '表面装饰按实际平台保留：%s/%s/%s',
  (os, supported, scheme, lightRoles, inputRole) => {
    jest.replaceProperty(Platform, 'OS', os);
    jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', supported);
    const hook = renderHook(() => useNativeSurfaceStyles(), {
      wrapper: ({ children }) => (
        <ThemeProvider forceScheme={scheme}>{children}</ThemeProvider>
      ),
    });
    const styles = hook.result.current;
    expect(Boolean(styles.control)).toBe(lightRoles);
    expect(Boolean(styles.controlBorder)).toBe(lightRoles);
    expect(Boolean(styles.card)).toBe(lightRoles);
    expect(Boolean(styles.cardBorder)).toBe(lightRoles);
    expect(Boolean(styles.floating)).toBe(true);
    expect(Boolean(styles.floatingBorder)).toBe(lightRoles);
    expect(Boolean(styles.input)).toBe(inputRole);
    expect(Boolean(styles.inputBorder)).toBe(inputRole);
    const colors = scheme === 'dark' ? darkColors : lightColors;
    if (!lightRoles) {
      expect(styles.floating).toEqual({
        backgroundColor: 'transparent',
        shadowColor: colors.scrim,
        shadowOpacity: 0.2,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      });
    }
    expect(styles.icon).toEqual({
      backgroundColor: lightRoles
        ? '#FDF1E6'
        : os === 'web'
          ? colors.primaryContainer
          : colors.surfaceContainerHigh,
    });
    expect(Boolean(styles.welcomeIcon)).toBe(lightRoles);
    hook.rerender({});
    expect(hook.result.current).toBe(styles);
  }
);

test('输入装饰保留两种主题的既有外观', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', false);
  const hook = renderHook(() => useNativeSurfaceStyles(), {
    wrapper: ({ children }) => (
      <ThemeProvider forceScheme="light">{children}</ThemeProvider>
    ),
  });
  expect(hook.result.current.input).toMatchObject({
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  });
  expect(hook.result.current.inputBorder).toMatchObject({
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.08)',
  });
  const dark = renderHook(() => useNativeSurfaceStyles(), {
    wrapper: ({ children }) => (
      <ThemeProvider forceScheme="dark">{children}</ThemeProvider>
    ),
  });
  expect(dark.result.current.input).toEqual({
    backgroundColor: darkColors.surfaceContainerHigh,
    ...darkShadow.subtle,
  });
  expect(dark.result.current.inputBorder).toEqual({
    borderWidth: 0.5,
    borderColor: darkColors.outlineVariant,
  });
});

test.each([
  ['android', 28, true],
  ['android', 30, true],
  ['android', 27, false],
  ['ios', '16.7', false],
  ['web', undefined, false],
] as const)('阴影能力按平台/API 选择：%s/%s', (os, version, boxShadow) => {
  // 装饰在加载模块时确定平台；隔离加载以核对真实 API 边界。
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: os, Version: version },
      StyleSheet,
    }));
    jest.doMock('../../src/theme/useTheme', () => ({ useTheme: jest.fn() }));
    const { nativeFallbackStyles: styles } =
      require('../../src/theme/nativeFallbackStyles') as typeof import('../../src/theme/nativeFallbackStyles');
    for (const [role, y, blur, opacity, iosElevation] of [
      ['control', 2, 8, 0.06, 2],
      ['card', 1, 3, 0.04, 1],
      ['input', 4, 16, 0.08, 4],
    ] as const) {
      const style = styles[role];
      expect(style.elevation).toBe(
        boxShadow ? 0 : os === 'android' ? 1 : iosElevation
      );
      expect(style.boxShadow).toEqual(
        boxShadow
          ? [
              {
                offsetX: 0,
                offsetY: y,
                blurRadius: blur,
                color: `rgba(0,0,0,${opacity})`,
              },
            ]
          : undefined
      );
    }
    expect(styles.controlBorder).toMatchObject({
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(0,0,0,0.08)',
    });
    expect(styles.cardBorder.borderColor).toBe('#ECECF0');
    expect(styles.floatingBorder.borderColor).toBe('rgba(0,0,0,0.06)');
  });
  jest.dontMock('react-native');
  jest.dontMock('../../src/theme/useTheme');
});
