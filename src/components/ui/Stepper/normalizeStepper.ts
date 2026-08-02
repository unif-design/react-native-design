export type NormalizedStepper = {
  safeMin: number;
  safeMax: number;
  safeStep: number;
  safeValue: number;
  rangeDisabled: boolean;
  canDecrement: boolean;
  canIncrement: boolean;
  accessibilityActions: Array<{
    name: 'increment' | 'decrement';
    label: '增加' | '减少';
  }>;
};

type StepperNormalizationInput = {
  value: number;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
};

/**
 * Stepper 唯一的范围与 action 归一化入口。
 *
 * 组件的视觉状态、handler 和 a11y 都消费同一份结果，避免边界按钮已禁用但
 * adjustable 仍暴露无效 action。
 */
export function normalizeStepper({
  value,
  min,
  max,
  step,
  disabled = false,
}: StepperNormalizationInput): NormalizedStepper {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max >= safeMin ? max : safeMin;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const safeValue = Number.isNaN(value)
    ? safeMin
    : Math.min(safeMax, Math.max(safeMin, value));
  const rangeDisabled = disabled || safeMin === safeMax;
  const canDecrement = !rangeDisabled && safeValue > safeMin;
  const canIncrement = !rangeDisabled && safeValue < safeMax;
  const accessibilityActions: NormalizedStepper['accessibilityActions'] = [];

  if (canIncrement) {
    accessibilityActions.push({ name: 'increment', label: '增加' });
  }
  if (canDecrement) {
    accessibilityActions.push({ name: 'decrement', label: '减少' });
  }

  return {
    safeMin,
    safeMax,
    safeStep,
    safeValue,
    rangeDisabled,
    canDecrement,
    canIncrement,
    accessibilityActions,
  };
}
