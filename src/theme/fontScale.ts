import { useTheme } from './useTheme';

export function normalizeFontScale(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 1;
}

export function scaleFontMetric(value: number, fontScale: number): number {
  return value * normalizeFontScale(fontScale);
}

export function useFontScale(): number {
  return normalizeFontScale(useTheme().fontScale);
}
