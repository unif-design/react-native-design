import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeProvider';
import { lightColors } from './colors';
import { lightShadow } from './shadow';

const FALLBACK: ThemeContextValue = {
  scheme: 'light',
  colors: lightColors,
  shadow: lightShadow,
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  return ctx ?? FALLBACK;
}

export function useColors() {
  return useTheme().colors;
}

export function useShadow() {
  return useTheme().shadow;
}
