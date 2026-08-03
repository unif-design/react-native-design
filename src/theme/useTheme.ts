import { useContext, useEffect } from 'react';
import type { ThemeContextValue } from './ThemeProvider';
import {
  resolveThemeContext,
  shouldWarnMissingThemeProvider,
  ThemeContext,
} from './themeContext';
import { createMissingThemeProviderDiagnostic } from './themeDiagnostics';
import { createLogger } from '../utils/logger';

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const log = createLogger('useTheme');
const reportMissingProvider = createMissingThemeProviderDiagnostic(log.warn);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  useEffect(() => {
    reportMissingProvider(shouldWarnMissingThemeProvider(context, isDev));
  }, [context]);

  return resolveThemeContext(context);
}

export function useColors() {
  return useTheme().colors;
}

export function useShadow() {
  return useTheme().shadow;
}
