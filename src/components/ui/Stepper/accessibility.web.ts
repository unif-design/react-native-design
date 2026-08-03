import { nextStepperValue } from './normalizeStepper';
import type {
  StepperAccessibilityInput,
  StepperValueAccessibilityProps,
} from './accessibility.types';
import type { NormalizedStepper, StepperDirection } from './normalizeStepper';

export type StepperWebKeyResult = {
  handled: boolean;
  nextValue?: number;
};

export function resolveStepperWebKey(
  key: string,
  normalized: NormalizedStepper
): StepperWebKeyResult {
  const direction: StepperDirection | undefined =
    key === 'ArrowUp' || key === 'ArrowRight'
      ? 'increment'
      : key === 'ArrowDown' || key === 'ArrowLeft'
        ? 'decrement'
        : undefined;

  if (direction) {
    const nextValue = nextStepperValue(normalized, direction);
    return nextValue === undefined
      ? { handled: true }
      : { handled: true, nextValue };
  }
  if (key === 'Home') {
    return normalized.canDecrement
      ? { handled: true, nextValue: normalized.safeMin }
      : { handled: true };
  }
  if (key === 'End') {
    return normalized.canIncrement
      ? { handled: true, nextValue: normalized.safeMax }
      : { handled: true };
  }
  return { handled: false };
}

export function getStepperValueAccessibilityProps({
  normalized,
  onChange,
}: StepperAccessibilityInput): StepperValueAccessibilityProps {
  const base = {
    'aria-disabled': normalized.rangeDisabled,
    'aria-valuemin': normalized.safeMin,
    'aria-valuemax': normalized.safeMax,
    'aria-valuenow': normalized.safeValue,
    'tabIndex': normalized.rangeDisabled ? (-1 as const) : (0 as const),
  };
  if (normalized.rangeDisabled) return base;

  return {
    ...base,
    onKeyDown: (event) => {
      const result = resolveStepperWebKey(event.nativeEvent.key, normalized);
      if (!result.handled) return;
      event.preventDefault();
      if (result.nextValue !== undefined) onChange(result.nextValue);
    },
  };
}
