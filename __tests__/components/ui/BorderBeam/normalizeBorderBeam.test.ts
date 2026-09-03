import { describe, expect, test } from '@jest/globals';

import {
  BORDER_BEAM_DEFAULTS,
  normalizeBorderBeam,
} from '../../../../src/components/ui/BorderBeam/normalizeBorderBeam';

describe('normalizeBorderBeam', () => {
  test('缺省值提供克制的通用流光描边', () => {
    expect(normalizeBorderBeam({})).toEqual(BORDER_BEAM_DEFAULTS);
  });

  test('无效数值回退默认值，极端值钳制到安全范围', () => {
    expect(
      normalizeBorderBeam({
        duration: Number.NaN,
        lineWidth: 0,
        size: Number.POSITIVE_INFINITY,
        borderRadius: -1,
      })
    ).toEqual(BORDER_BEAM_DEFAULTS);
    expect(
      normalizeBorderBeam({
        duration: 50,
        lineWidth: 20,
        size: 2,
        borderRadius: 10_000,
      })
    ).toEqual({
      duration: 300,
      lineWidth: 8,
      size: 8,
      borderRadius: 1_000,
    });
  });
});
