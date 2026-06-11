import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeProvider';
import { lightColors } from './colors';
import { lightShadow } from './shadow';

const FALLBACK: ThemeContextValue = {
  scheme: 'light',
  colors: lightColors,
  shadow: lightShadow,
};

// 静默回退而非 throw:FALLBACK 是模块级稳定引用,useThemedStyles 缓存契约不受影响。
// 缺点:漏包 ThemeProvider 时整 app 永远 light、暗色失效且零信号——
// 因此在 dev 下一次性告警提示接入方补 Provider。
// 用 typeof __DEV__ 守卫:裸 __DEV__ 在非 Metro 打包器(Webpack/Next.js)下会 ReferenceError,
// logger.ts:12 已有同等先例。
let _warnedMissingProvider = false;

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (ctx === undefined && !_warnedMissingProvider) {
    _warnedMissingProvider = true;
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn(
        '[unif/theme] useTheme: ThemeContext 未找到 —— 请在 app 根部渲染 <ThemeProvider>，否则暗色切换不生效。'
      );
    }
  }
  return ctx ?? FALLBACK;
}

export function useColors() {
  return useTheme().colors;
}

export function useShadow() {
  return useTheme().shadow;
}
