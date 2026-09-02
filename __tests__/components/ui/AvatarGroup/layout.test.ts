import { describe, expect, test } from '@jest/globals';
import { avatar, r, space } from '../../../../src/theme';
import { resolveAvatarGroupLayout } from '../../../../src/components/ui/AvatarGroup/layout';

describe('resolveAvatarGroupLayout', () => {
  test.each([
    ['xs', avatar.xs, space['1'], r(1)],
    ['sm', avatar.sm, space['2'], r(1)],
    ['md', avatar.md, space['3'], r(1)],
    ['lg', avatar.lg, space['4'], r(2)],
    ['xl', avatar.xl, space['6'], r(2)],
  ] as const)(
    '%s 映射到固定直径、重叠、分隔边和 44pt hitSlop',
    (size, box, overlap, borderWidth) => {
      const layout = resolveAvatarGroupLayout(size);
      expect(layout).toMatchObject({
        box,
        overlap,
        borderWidth,
      });
      expect(layout.hitSlop.top).toBe(layout.hitSlop.right);
      expect(layout.hitSlop.top).toBe(layout.hitSlop.bottom);
      expect(layout.hitSlop.top).toBe(layout.hitSlop.left);
      expect(layout.hitSlop.top).toBeGreaterThanOrEqual(0);
      expect(box + layout.hitSlop.left + layout.hitSlop.right).toBe(
        Math.max(44, box)
      );
    }
  );
});
