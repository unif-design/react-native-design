import { describe, expect, test } from '@jest/globals';
import { fixed, space, type as t } from '../../../../src/theme';
import { sizingFor } from '../../../../src/components/ui/Segmented/styles';

describe('Segmented sizingFor — 尺寸推导(纯逻辑,无组件渲染)', () => {
  test('md(默认)保持现状:hitTarget 触控 + space[7] padding + type.xs 字号', () => {
    expect(sizingFor('md')).toEqual({
      minHeight: fixed.hitTarget,
      px: space['7'],
      fs: t.xs,
    });
  });

  test('sm(紧凑):28pt 物理高 + space[5] padding + type.xxs 字号', () => {
    expect(sizingFor('sm')).toEqual({
      minHeight: 28,
      px: space['5'],
      fs: t.xxs,
    });
  });

  test('sm 在 minHeight / px / fs 三维都严格小于 md(任意缩放比下都成立)', () => {
    const sm = sizingFor('sm');
    const md = sizingFor('md');
    // minHeight 两档都用「不缩放」物理常量(28 vs 44)→ 比例稳定,大屏不反转
    expect(sm.minHeight).toBeLessThan(md.minHeight);
    // px / fs 同走 scaled token,缩放比相同 → 基准值小者恒小
    expect(sm.px).toBeLessThan(md.px);
    expect(sm.fs).toBeLessThan(md.fs);
  });
});
