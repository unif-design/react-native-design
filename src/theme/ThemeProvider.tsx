import React, { createContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ColorTokens } from './colors';
import { lightShadow, darkShadow, type ShadowTokens } from './shadow';

export type ColorScheme = 'light' | 'dark';

export type ThemeContextValue = {
  scheme: ColorScheme;
  colors: ColorTokens;
  shadow: ShadowTokens;
  /** 应用级字号缩放倍数(app 内字体大小档)。useThemedStyles 出口对
   *  fontSize / lineHeight / letterSpacing 生效;1 = 不缩放。 */
  fontScale: number;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

type ThemeProviderProps = {
  children: React.ReactNode;
  /** 强制使用某个 scheme（覆盖 useColorScheme）。用于测试或 settingsStore 接入。 */
  forceScheme?: ColorScheme;
  /** 应用级字号缩放倍数,默认 1(不缩放)。接入方自持档位状态(persist
   *  store 等)并传入;变更即触发全树 themed 样式重算。 */
  fontScale?: number;
};

export function ThemeProvider({
  children,
  forceScheme,
  fontScale = 1,
}: ThemeProviderProps) {
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
      fontScale,
    }),
    [scheme, fontScale]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
