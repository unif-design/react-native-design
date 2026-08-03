import { describe, expect, jest, test } from '@jest/globals';
import {
  getStepperValueAccessibilityProps,
  resolveStepperWebKey,
} from '../../../../src/components/ui/Stepper/accessibility.web';
import { normalizeStepper } from '../../../../src/components/ui/Stepper/normalizeStepper';

describe('Web Stepper accessibility driver', () => {
  test('maps normalized range to ARIA and tab order', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 1, min: 0, max: 2 }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      'aria-disabled': false,
      'aria-valuemin': 0,
      'aria-valuemax': 2,
      'aria-valuenow': 1,
      'tabIndex': 0,
    });
    expect(props.onKeyDown).toBeDefined();
  });

  test('maps every Arrow/Home/End key to the normalized capability', () => {
    const middle = normalizeStepper({ value: 1, min: 0, max: 2 });
    expect(
      ['ArrowUp', 'ArrowRight'].map((key) => resolveStepperWebKey(key, middle))
    ).toEqual([
      { handled: true, nextValue: 2 },
      { handled: true, nextValue: 2 },
    ]);
    expect(
      ['ArrowDown', 'ArrowLeft'].map((key) => resolveStepperWebKey(key, middle))
    ).toEqual([
      { handled: true, nextValue: 0 },
      { handled: true, nextValue: 0 },
    ]);
    expect(resolveStepperWebKey('Home', middle)).toEqual({
      handled: true,
      nextValue: 0,
    });
    expect(resolveStepperWebKey('End', middle)).toEqual({
      handled: true,
      nextValue: 2,
    });
    expect(resolveStepperWebKey('Escape', middle)).toEqual({
      handled: false,
    });
  });

  test('recognized boundary keys are handled but invalid directions have no next value', () => {
    const atMax = normalizeStepper({ value: 2, min: 0, max: 2 });
    expect(resolveStepperWebKey('ArrowRight', atMax)).toEqual({
      handled: true,
    });
    expect(resolveStepperWebKey('Home', atMax)).toEqual({
      handled: true,
      nextValue: 0,
    });
    expect(resolveStepperWebKey('Escape', atMax)).toEqual({
      handled: false,
    });
  });

  test('keyboard handler prevents recognized defaults and only emits real changes', () => {
    const onChange = jest.fn();
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 2, min: 0, max: 2 }),
      onChange,
    });
    const preventDefault = jest.fn();

    props.onKeyDown?.({
      nativeEvent: { key: 'ArrowRight' },
      preventDefault,
    } as never);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();

    props.onKeyDown?.({
      nativeEvent: { key: 'Home' },
      preventDefault,
    } as never);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  test('zero range is aria-disabled, leaves tab order and has no key handler', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 5, min: 10, max: 0 }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      'aria-disabled': true,
      'aria-valuemin': 10,
      'aria-valuemax': 10,
      'aria-valuenow': 10,
      'tabIndex': -1,
    });
    expect(props).not.toHaveProperty('onKeyDown');
  });

  test('external disabled keeps its range but omits the key handler', () => {
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
      'aria-disabled': true,
      'aria-valuemin': 0,
      'aria-valuemax': 2,
      'aria-valuenow': 1,
      'tabIndex': -1,
    });
    expect(props).not.toHaveProperty('onKeyDown');
  });
});
