import { useContext, useEffect } from 'react';
import type { ThemeContextValue } from './ThemeProvider';
import {
  resolveThemeContext,
  shouldWarnMissingThemeProvider,
  ThemeContext,
} from './themeContext';
import { createLogger } from '../utils/logger';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const log = createLogger('useTheme');
let warnedMissing = false;

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  useEffect(() => {
    if (shouldWarnMissingThemeProvider(context, isDev) && !warnedMissing) {
      warnedMissing = true;
      log.warn('缺少 ThemeProvider，已使用稳定 light fallback');
    }
  }, [context]);

  return resolveThemeContext(context);
}

export function useColors() {
  return useTheme().colors;
}

export function useShadow() {
  return useTheme().shadow;
}
