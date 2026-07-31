import type { PulseOptions } from './types';

export type { PulseOptions };

/**
 * Pulse 参数的**唯一**归一化入口 —— 公共 hook 先跑完这里,平台 driver 只消费产物。
 *
 * 为什么要单独一层:此前 native / web 两份 `usePulse` 各自读原始 props 并各自解释
 * 默认值,web 侧甚至把未校验的 `duration` 直接喂给 `setInterval`(0 或 2^31 会退化成
 * 「每帧触发」)。归一化收口后,两端拿到的一定是同一组已验证数值。
 *
 * 纪律:**不做 clamp、不做取整**。非法值一律整体回退到 defaults 并记一条诊断 ——
 * 悄悄把 `duration: 0` 夹成 `1` 会让调用方永远发现不了自己传错了。
 */

export type PulseDefaults = {
  duration: number;
  delay: number;
  from: number;
  to: number;
};

export type PulseDiagnostic = {
  field: keyof PulseDefaults;
  received: unknown;
  fallback: number;
};

export type NormalizedPulseOptions = PulseDefaults & {
  /** 两端相等 —— 没有可播的动画,driver 直接停在 `to`。 */
  isStatic: boolean;
  diagnostics: readonly PulseDiagnostic[];
};

// setTimeout / setInterval 内部用 int32 存时长,>= 2^31 会溢出成 0 变「每帧触发」。
const MAX_TIMER = 2 ** 31;

export function normalizePulseOptions(
  input: PulseOptions = {},
  defaults: PulseDefaults
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
