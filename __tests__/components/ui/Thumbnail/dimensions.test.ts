import { describe, expect, test } from '@jest/globals';
import { r } from '../../../../src/theme';
import { normalizeThumbnailDimensions } from '../../../../src/components/ui/Thumbnail/normalize';

describe('Thumbnail 图像框', () => {
  test.each([
    ['sm', 64, 40, 6],
    ['md', 113, 67, 8],
    ['lg', 160, 96, 10],
  ] as const)('%s 保留原阶梯', (size, width, height, borderRadius) => {
    expect(normalizeThumbnailDimensions(size).dimensions).toEqual({
      width: r(width),
      height: r(height),
      borderRadius: r(borderRadius),
    });
  });
  test('实际尺寸不二次缩放，允许零圆角', () => {
    expect(
      normalizeThumbnailDimensions({ width: 76.5, height: 51, borderRadius: 0 })
        .dimensions
    ).toEqual({ width: 76.5, height: 51, borderRadius: 0 });
    expect(
      normalizeThumbnailDimensions({ width: 76, height: 51 }).dimensions
        .borderRadius
    ).toBe(r(8));
  });
  test.each([
    null,
    {},
    { width: 76 },
    { width: 76, height: 0 },
    { width: -1, height: 20 },
    { width: NaN, height: 20 },
    { width: 20, height: Infinity },
    { width: 20, height: 20, borderRadius: -1 },
    { width: 20, height: 20, borderRadius: NaN },
  ])('非法对象整体回退，不混用部分尺寸：%j', (input) => {
    expect(normalizeThumbnailDimensions(input)).toEqual({
      dimensions: { width: r(113), height: r(67), borderRadius: r(8) },
      diagnostics: ['size'],
    });
  });
});
