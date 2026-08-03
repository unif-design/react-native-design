import { createContext } from 'react';
import { lightColors } from './colors';
import { lightShadow } from './shadow';
import type { ThemeContextValue } from './ThemeProvider';

export const FALLBACK_THEME: ThemeContextValue = {
  scheme: 'light',
  colors: lightColors,
  shadow: lightShadow,
  fontScale: 1,
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

export const resolveThemeContext = (
  value: ThemeContextValue | undefined
): ThemeContextValue => value ?? FALLBACK_THEME;

export const shouldWarnMissingThemeProvider = (
  value: ThemeContextValue | undefined,
  isDev: boolean
): boolean => value === undefined && isDev;
