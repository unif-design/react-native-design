import { describe, expect, jest, test } from '@jest/globals';
import { getStepperValueAccessibilityProps } from '../../../../src/components/ui/Stepper/accessibility';
import { normalizeStepper } from '../../../../src/components/ui/Stepper/normalizeStepper';

describe('native Stepper accessibility driver', () => {
  test('min custom actions only list increment while invalid standard direction no-ops', () => {
    const onChange = jest.fn();
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 0, min: 0, max: 2 }),
      onChange,
    });

    expect(props.accessibilityActions).toEqual([
      { name: 'increment', label: '增加' },
    ]);
    props.onAccessibilityAction?.({
      nativeEvent: { actionName: 'decrement' },
    } as never);
    expect(onChange).not.toHaveBeenCalled();

    props.onAccessibilityAction?.({
      nativeEvent: { actionName: 'increment' },
    } as never);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  test('zero range exposes value/state but omits actions and handler', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 5, min: 10, max: 0 }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      accessibilityState: { disabled: true },
      accessibilityValue: { min: 10, max: 10, now: 10 },
    });
    expect(props).not.toHaveProperty('accessibilityActions');
    expect(props).not.toHaveProperty('onAccessibilityAction');
  });

  test('external disabled also omits actions and handler', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({
        value: 1,
        min: 0,
        max: 2,
        disabled: true,
      }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      accessibilityState: { disabled: true },
      accessibilityValue: { min: 0, max: 2, now: 1 },
    });
    expect(props).not.toHaveProperty('accessibilityActions');
    expect(props).not.toHaveProperty('onAccessibilityAction');
  });
});
