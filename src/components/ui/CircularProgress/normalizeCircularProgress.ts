import { createLogger } from '../../../utils/logger';

const log = createLogger('CircularProgress');
const warnedKeys = new Set<string>();

export type NormalizedCircularProgress = Readonly<{
  safeValue: number;
  percentage: number;
  safeSize: number;
  safeThickness: number;
  radius: number;
  circumference: number;
  dashOffset: number;
}>;

function warnOnce(key: string, message: string): void {
  if (warnedKeys.has(key)) return;
  warnedKeys.add(key);
  log.warn(message);
}

export function normalizeCircularProgress(input: {
  value: number;
  size: number;
  thickness: number;
}): NormalizedCircularProgress {
  const { value, size, thickness } = input;

  if (!Number.isFinite(value) || value < 0 || value > 1) {
    warnOnce(
      `value:${value}`,
      `value 应为 0..1 的有限数，传入 ${value}，已收敛到安全范围`
    );
  }
  if (!Number.isFinite(size) || size < 16) {
    warnOnce(`size:${size}`, `size 应为 ≥16 的有限数，传入 ${size}，已钳到 16`);
  }
  if (!Number.isFinite(thickness) || thickness <= 0) {
    warnOnce(
      `thickness:${thickness}`,
      `thickness 应为正有限数，传入 ${thickness}，已 fallback 为 2`
    );
  }

  const safeValue = Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : 0;
  const safeSize = Number.isFinite(size) && size >= 16 ? size : 16;
  const fallbackThickness =
    Number.isFinite(thickness) && thickness > 0 ? thickness : 2;
  const safeThickness = Math.min(fallbackThickness, safeSize / 2);
  const radius = (safeSize - safeThickness) / 2;
  const circumference = 2 * Math.PI * radius;

  return {
    safeValue,
    percentage: Math.round(safeValue * 100),
    safeSize,
    safeThickness,
    radius,
    circumference,
    dashOffset: circumference * (1 - safeValue),
  };
}
