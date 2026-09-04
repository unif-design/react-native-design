export type NormalizedBorderBeam = {
  duration: number;
  lineWidth: number;
  size: number;
  borderRadius: number;
};

export const BORDER_BEAM_DEFAULTS: NormalizedBorderBeam = {
  duration: 2400,
  lineWidth: 2,
  size: 40,
  borderRadius: 12,
};

type BorderBeamNumbers = Partial<NormalizedBorderBeam>;

const normalizeNumber = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
  allowZero = false
): number => {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    (!allowZero && value === 0)
  ) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
};

export function normalizeBorderBeam(input: BorderBeamNumbers) {
  return {
    duration: normalizeNumber(
      input.duration,
      BORDER_BEAM_DEFAULTS.duration,
      300,
      60_000
    ),
    lineWidth: normalizeNumber(
      input.lineWidth,
      BORDER_BEAM_DEFAULTS.lineWidth,
      0.5,
      8
    ),
    size: normalizeNumber(input.size, BORDER_BEAM_DEFAULTS.size, 8, 1_000),
    borderRadius: normalizeNumber(
      input.borderRadius,
      BORDER_BEAM_DEFAULTS.borderRadius,
      0,
      1_000,
      true
    ),
  };
}
