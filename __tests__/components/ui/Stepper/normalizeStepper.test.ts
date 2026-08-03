import { describe, expect, test } from '@jest/globals';
import {
  nextStepperValue,
  normalizeStepper,
} from '../../../../src/components/ui/Stepper/normalizeStepper';

describe('normalizeStepper — 范围与值归一化', () => {
  test('min > max 折叠为零范围且不暴露 action', () => {
    expect(
      normalizeStepper({ value: 5, min: 10, max: 0, step: 1 })
    ).toMatchObject({
      safeMin: 10,
      safeMax: 10,
      safeValue: 10,
      rangeDisabled: true,
      canDecrement: false,
      canIncrement: false,
      accessibilityActions: [],
    });
  });

  test.each([
    ['NaN', Number.NaN, 0],
    ['+Infinity', Number.POSITIVE_INFINITY, 2],
    ['-Infinity', Number.NEGATIVE_INFINITY, 0],
  ])('%s value 使用 min/max 安全范围', (_name, value, safeValue) => {
    expect(normalizeStepper({ value, min: 0, max: 2, step: 1 }).safeValue).toBe(
      safeValue
    );
  });

  test('非有限 min 回退 0，非有限 max 折叠到 safeMin', () => {
    expect(
      normalizeStepper({
        value: 1,
        min: Number.POSITIVE_INFINITY,
        max: 2,
        step: 1,
      })
    ).toMatchObject({
      safeMin: 0,
      safeMax: 2,
      safeValue: 1,
      rangeDisabled: false,
    });
    expect(
      normalizeStepper({
        value: 1,
        min: 1,
        max: Number.NEGATIVE_INFINITY,
        step: 1,
      })
    ).toMatchObject({
      safeMin: 1,
      safeMax: 1,
      safeValue: 1,
      rangeDisabled: true,
      accessibilityActions: [],
    });
    expect(
      normalizeStepper({
        value: 1,
        min: 1,
        max: Number.NaN,
        step: 1,
      }).safeMax
    ).toBe(1);
  });
});

describe('normalizeStepper — step 与外部 disabled', () => {
  test.each([
    ['0', 0],
    ['负数', -1],
    ['NaN', Number.NaN],
    ['+Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('%s step 回退 1', (_name, step) => {
    expect(normalizeStepper({ value: 1, min: 0, max: 2, step }).safeStep).toBe(
      1
    );
  });

  test('外部 disabled 保留安全值但移除所有 action', () => {
    expect(
      normalizeStepper({
        value: 1,
        min: 0,
        max: 2,
        step: 1,
        disabled: true,
      })
    ).toEqual({
      safeMin: 0,
      safeMax: 2,
      safeStep: 1,
      safeValue: 1,
      rangeDisabled: true,
      canDecrement: false,
      canIncrement: false,
      accessibilityActions: [],
    });
  });
});

describe('normalizeStepper — 边界 accessibilityActions', () => {
  test('到 min 只保留 increment，到 max 只保留 decrement', () => {
    expect(
      normalizeStepper({ value: 0, min: 0, max: 2, step: 1 })
        .accessibilityActions
    ).toEqual([{ name: 'increment', label: '增加' }]);
    expect(
      normalizeStepper({ value: 2, min: 0, max: 2, step: 1 })
        .accessibilityActions
    ).toEqual([{ name: 'decrement', label: '减少' }]);
  });

  test('缺省入口只由 normalizer 定义 0–99 / step 1', () => {
    expect(normalizeStepper({ value: 42 })).toEqual({
      safeMin: 0,
      safeMax: 99,
      safeStep: 1,
      safeValue: 42,
      rangeDisabled: false,
      canDecrement: true,
      canIncrement: true,
      accessibilityActions: [
        { name: 'increment', label: '增加' },
        { name: 'decrement', label: '减少' },
      ],
    });
  });

  test('nextStepperValue 只返回 capability 允许的新值', () => {
    const atMin = normalizeStepper({ value: 0, min: 0, max: 2, step: 1 });
    expect(nextStepperValue(atMin, 'decrement')).toBeUndefined();
    expect(nextStepperValue(atMin, 'increment')).toBe(1);

    const wideStep = normalizeStepper({ value: 1, min: 0, max: 2, step: 8 });
    expect(nextStepperValue(wideStep, 'increment')).toBe(2);
  });
});
