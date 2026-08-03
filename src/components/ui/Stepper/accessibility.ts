import { nextStepperValue } from './normalizeStepper';
import type {
  StepperAccessibilityInput,
  StepperValueAccessibilityProps,
} from './accessibility.types';

export function getStepperValueAccessibilityProps({
  normalized,
  onChange,
}: StepperAccessibilityInput): StepperValueAccessibilityProps {
  const base = {
    accessibilityState: { disabled: normalized.rangeDisabled },
    accessibilityValue: {
      min: normalized.safeMin,
      max: normalized.safeMax,
      now: normalized.safeValue,
    },
  };

  if (normalized.rangeDisabled) return base;

  return {
    ...base,
    accessibilityActions: normalized.accessibilityActions,
    onAccessibilityAction: (event) => {
      const name = event.nativeEvent.actionName;
      if (name !== 'increment' && name !== 'decrement') return;
      const nextValue = nextStepperValue(normalized, name);
      if (nextValue !== undefined) onChange(nextValue);
    },
  };
}
