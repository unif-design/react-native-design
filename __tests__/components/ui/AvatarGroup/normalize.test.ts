import { describe, expect, test } from '@jest/globals';
import { normalizeAvatarGroup } from '../../../../src/components/ui/AvatarGroup/normalize';

const items = Array.from({ length: 7 }, (_, index) => ({
  key: String(index + 1),
  label: `成员 ${index + 1}`,
}));

describe('normalizeAvatarGroup', () => {
  test('未设置、未超限或刚好等于 max 时保留全部成员', () => {
    expect(normalizeAvatarGroup(items, undefined)).toEqual({
      visibleItems: items,
      overflowCount: 0,
      invalidMax: false,
    });
    expect(normalizeAvatarGroup(items.slice(0, 4), 5)).toEqual({
      visibleItems: items.slice(0, 4),
      overflowCount: 0,
      invalidMax: false,
    });
    expect(normalizeAvatarGroup(items.slice(0, 5), 5)).toEqual({
      visibleItems: items.slice(0, 5),
      overflowCount: 0,
      invalidMax: false,
    });
  });

  test('max 包含溢出位，7 人 max 5 只保留前 4 人并显示 +3', () => {
    expect(normalizeAvatarGroup(items, 5)).toEqual({
      visibleItems: items.slice(0, 4),
      overflowCount: 3,
      invalidMax: false,
    });
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, 1.5, 1, 0, -1])(
    '非法 max=%s 不隐藏成员并标记诊断',
    (max) => {
      expect(normalizeAvatarGroup(items, max)).toEqual({
        visibleItems: items,
        overflowCount: 0,
        invalidMax: true,
      });
    }
  );
});
