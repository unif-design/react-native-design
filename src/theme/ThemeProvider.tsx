import React, { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import type { ColorTokens } from './colors';
import { resolveThemeColors } from './nativeFallbackColors';
import { normalizeFontScale } from './fontScale';
import { lightShadow, darkShadow, type ShadowTokens } from './shadow';
import { ReducedTransparencyContext, ThemeContext } from './themeContext';
import { useReducedTransparency } from './useReducedTransparency';
import { createInvalidFontScaleDiagnostic } from './themeDiagnostics';
import { createLogger } from '../utils/logger';

export type ColorScheme = 'light' | 'dark';

export type ThemeContextValue = {
  scheme: ColorScheme;
  colors: ColorTokens;
  shadow: ShadowTokens;
  /** 应用级字号缩放倍数(app 内字体大小档)。useThemedStyles 出口对
   *  fontSize / lineHeight / letterSpacing 生效;非法值回退 1。 */
  fontScale: number;
};

type ThemeProviderProps = {
  children: React.ReactNode;
  /** 强制使用某个 scheme（覆盖 useColorScheme）。用于测试或 settingsStore 接入。 */
  forceScheme?: ColorScheme;
  /** 应用级字号缩放倍数,默认 1(不缩放)。接入方自持档位状态(persist
   *  store 等)并传入;仅接受有限正数,不设上限。 */
  fontScale?: number;
};

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const log = createLogger('ThemeProvider');
const reportInvalidFontScale = createInvalidFontScaleDiagnostic(log.warn);

export function ThemeProvider({
  children,
  forceScheme,
  fontScale = 1,
}: ThemeProviderProps) {
  const sysScheme = useColorScheme();
  const scheme: ColorScheme =
    forceScheme ?? (sysScheme === 'dark' ? 'dark' : 'light');
  const normalizedFontScale = normalizeFontScale(fontScale);
  const reducedTransparency = useReducedTransparency();
  const colors = resolveThemeColors(scheme);

  useEffect(() => {
    reportInvalidFontScale(fontScale, normalizedFontScale, isDev);
  }, [fontScale, normalizedFontScale]);

  // 调色板保持稳定引用，主题重渲染不使消费者的样式缓存失效。
  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors,
      shadow: scheme === 'dark' ? darkShadow : lightShadow,
      fontScale: normalizedFontScale,
    }),
    [scheme, colors, normalizedFontScale]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ReducedTransparencyContext.Provider value={reducedTransparency}>
        {children}
      </ReducedTransparencyContext.Provider>
    </ThemeContext.Provider>
  );
}
