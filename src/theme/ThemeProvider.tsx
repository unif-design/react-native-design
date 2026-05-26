import React, { createContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ColorTokens } from './colors';
import { lightShadow, darkShadow, type ShadowTokens } from './shadow';

export type ColorScheme = 'light' | 'dark';

export type ThemeContextValue = {
  scheme: ColorScheme;
  colors: ColorTokens;
  shadow: ShadowTokens;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
  /** 强制使用某个 scheme（覆盖 useColorScheme）。用于测试或 settingsStore 接入。 */
  forceScheme?: ColorScheme;
};

export function ThemeProvider({ children, forceScheme }: ThemeProviderProps) {
  const sysScheme = useColorScheme();
  const scheme: ColorScheme =
    forceScheme ?? (sysScheme === 'dark' ? 'dark' : 'light');

  // useMemo 必须依赖 scheme,不要依赖 light/dark 对象本身 —— 这是 useThemedStyles
  // 缓存生效的前提(每次渲染拿到稳定 colors / shadow 引用)。
  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      shadow: scheme === 'dark' ? darkShadow : lightShadow,
    }),
    [scheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
