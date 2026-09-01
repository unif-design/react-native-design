import { describe, expect, test } from '@jest/globals';
import { normalizeCircularProgress } from '../../../../src/components/ui/CircularProgress/normalizeCircularProgress';

describe('normalizeCircularProgress', () => {
  test('按 0..1 归一化进度并生成确定圆环几何', () => {
    const result = normalizeCircularProgress({
      value: 0.375,
      size: 32,
      thickness: 2,
    });

    expect(result.safeValue).toBe(0.375);
    expect(result.percentage).toBe(38);
    expect(result.safeSize).toBe(32);
    expect(result.safeThickness).toBe(2);
    expect(result.radius).toBe(15);
    expect(result.circumference).toBeCloseTo(2 * Math.PI * 15);
    expect(result.dashOffset).toBeCloseTo(2 * Math.PI * 15 * 0.625);
  });

  test.each([
    { value: -0.5, expected: 0 },
    { value: 1.5, expected: 1 },
    { value: Number.NaN, expected: 0 },
    { value: Number.POSITIVE_INFINITY, expected: 0 },
  ])('异常 value=$value 收敛为 $expected', ({ value, expected }) => {
    expect(
      normalizeCircularProgress({ value, size: 32, thickness: 2 }).safeValue
    ).toBe(expected);
  });

  test('尺寸和描边始终生成正半径', () => {
    expect(
      normalizeCircularProgress({ value: 0.5, size: 4, thickness: 99 })
    ).toMatchObject({
      safeSize: 16,
      safeThickness: 8,
      radius: 4,
    });

    expect(
      normalizeCircularProgress({
        value: 0.5,
        size: Number.NaN,
        thickness: Number.NaN,
      })
    ).toMatchObject({
      safeSize: 16,
      safeThickness: 2,
      radius: 7,
    });
  });
});
