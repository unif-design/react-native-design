import { describe, expect, test } from '@jest/globals';
import { darkColors, lightColors } from '../../../../src/theme/colors';
import { paletteFor } from '../../../../src/components/ui/Ribbon/styles';

describe('Ribbon paletteFor', () => {
  test.each([
    [
      'brand',
      lightColors.primary,
      lightColors.onPrimary,
      lightColors.primaryPressed,
    ],
    ['danger', lightColors.error, lightColors.onError, lightColors.error],
  ] as const)('%s tone 使用亮色语义 token', (tone, bg, fg, fold) => {
    expect(paletteFor(tone, lightColors)).toEqual({ bg, fg, fold });
  });

  test('danger tone 跟随暗色主题 token', () => {
    expect(paletteFor('danger', darkColors)).toEqual({
      bg: darkColors.error,
      fg: darkColors.onError,
      fold: darkColors.error,
    });
  });
});
