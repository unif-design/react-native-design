import type { PulseOptions } from '../../Pulse/types';
import type {
  NormalizedPulseOptions,
  PulseDefaults,
  PulseDiagnostic,
} from './types';
import { MAX_TIMER } from './constants';

/** 共用的参数校验：非法字段采用所属组件默认值并报告诊断，不夹值或取整。 */
export function normalizePulseOptions(
  input: PulseOptions = {},
  defaults: Readonly<PulseDefaults>
): NormalizedPulseOptions {
  const diagnostics: PulseDiagnostic[] = [];
  const pick = (
    field: keyof PulseDefaults,
    valid: (value: number) => boolean
  ): number => {
    const received = input[field];
    if (received === undefined) return defaults[field];
    if (typeof received === 'number' && valid(received)) return received;
    diagnostics.push({ field, received, fallback: defaults[field] });
    return defaults[field];
  };
  const duration = pick(
    'duration',
    (value) => Number.isFinite(value) && value >= 1 && value < MAX_TIMER
  );
  const delay = pick(
    'delay',
    (value) => Number.isFinite(value) && value >= 0 && value < MAX_TIMER
  );
  const from = pick(
    'from',
    (value) => Number.isFinite(value) && value >= 0 && value <= 1
  );
  const to = pick(
    'to',
    (value) => Number.isFinite(value) && value >= 0 && value <= 1
  );
  return { duration, delay, from, to, isStatic: from === to, diagnostics };
}

/** driver 是否应当启动循环。静态或系统开启减弱动效时都不启动。 */
export const shouldAnimatePulse = (
  options: NormalizedPulseOptions,
  reducedMotion: boolean
): boolean => !reducedMotion && !options.isStatic;
