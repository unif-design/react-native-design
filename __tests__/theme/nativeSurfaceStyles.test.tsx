import { afterEach, expect, jest, test } from '@jest/globals';
import { Platform } from 'react-native';
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
