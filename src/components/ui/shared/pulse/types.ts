export interface PulseDefaults {
  duration: number;
  delay: number;
  from: number;
  to: number;
}

export interface PulseDiagnostic {
  field: keyof PulseDefaults;
  received: unknown;
  fallback: number;
}

export interface NormalizedPulseOptions extends PulseDefaults {
  /** 两端相等 —— 没有可播的动画,driver 直接停在 `to`。 */
  isStatic: boolean;
  diagnostics: readonly PulseDiagnostic[];
}
