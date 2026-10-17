import { expect, jest, test } from '@jest/globals';
import { sanitizeSpinnerProps } from '../../../../src/components/ui/Spinner/shared';
import { normalizeCircularProgress } from '../../../../src/components/ui/CircularProgress/normalizeCircularProgress';

test.each([NaN, Infinity, -Infinity, -4, 0, 7])(
  'Spinner 非法 size %p 保留有限可见圆环',
  (size) => {
    expect(sanitizeSpinnerProps(size, 3)).toEqual({
      safeSize: 8,
      safeThickness: 3,
    });
  }
);

test.each([NaN, Infinity, -Infinity, -4, 0])(
  'Spinner 非法 thickness %p 使用安全线宽',
  (thickness) => {
    expect(sanitizeSpinnerProps(24, thickness)).toEqual({
      safeSize: 24,
      safeThickness: 2,
    });
  }
);

test('重复非法输入只诊断一次，合法边界保持不变', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  sanitizeSpinnerProps(6.25, -2.5);
  sanitizeSpinnerProps(6.25, -2.5);
  expect(warn).toHaveBeenCalledTimes(2);
  expect(sanitizeSpinnerProps(8, 0.25)).toEqual({
    safeSize: 8,
    safeThickness: 0.25,
  });
  warn.mockRestore();
});

test('CircularProgress 同一异常值重复出现不刷屏', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const input = { value: -3.25, size: 24, thickness: 2 };
  expect(normalizeCircularProgress(input).safeValue).toBe(0);
  expect(normalizeCircularProgress(input).safeValue).toBe(0);
  expect(warn).toHaveBeenCalledTimes(1);
  warn.mockRestore();
});
