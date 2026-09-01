import { describe, expect, jest, test } from '@jest/globals';
import { resolveStepperDisplayValue } from '../../../../src/components/ui/Stepper/displayValue';

describe('resolveStepperDisplayValue', () => {
  test('把归一化后的安全数值交给 formatter，且默认显示行为不变', () => {
    const formatValue = jest.fn((value: number) => `${value} 箱`);

    expect(resolveStepperDisplayValue(4, formatValue)).toBe('4 箱');
    expect(formatValue).toHaveBeenCalledWith(4);
    expect(resolveStepperDisplayValue(4)).toBe(4);
  });
});
