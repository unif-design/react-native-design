import { describe, expect, test } from '@jest/globals';

import { borderBeamTrail } from '../../../../src/components/ui/BorderBeam/shared';

describe('borderBeamTrail', () => {
  test('生成由淡到亮、由长到短的四层流光尾迹', () => {
    const trail = borderBeamTrail(56);

    expect(trail).toHaveLength(4);
    expect(trail.map((layer) => layer.length)).toEqual([56, 42, 28, 14]);
    expect(trail.map((layer) => layer.opacity)).toEqual([
      0.12, 0.24, 0.42, 0.88,
    ]);
  });

  test('空路径不生成负数线段', () => {
    expect(borderBeamTrail(0).every((layer) => layer.length === 0)).toBe(true);
  });
});
