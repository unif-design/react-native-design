import { describe, expect, jest, test } from '@jest/globals';
import { lightColors } from '../../../../src/theme/colors';
import { lightShadow } from '../../../../src/theme/shadow';
import { makeAvatarStyles } from '../../../../src/components/business/AvatarWithRing/styles';

describe('AvatarWithRing makeAvatarStyles', () => {
  test.each([true, false])(
    '非法尺寸在开发模式=%s 都保持可见圆心',
    (development) => {
      const original = Reflect.get(globalThis, '__DEV__');
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      Reflect.set(globalThis, '__DEV__', development);
      try {
        const invalid = makeAvatarStyles(NaN, 'red', {}, lightColors, 1);
        const minimum = makeAvatarStyles(5, 'red', {}, lightColors, 1);
        expect(invalid).toEqual(minimum);
        expect(invalid.inner).toBeGreaterThan(0);
        expect(warn).toHaveBeenCalledTimes(development ? 1 : 0);
      } finally {
        Reflect.set(globalThis, '__DEV__', original);
        warn.mockRestore();
      }
    }
  );
  test('fontScale 只缩放 label metric，不改变 ring 与容器几何', () => {
    const normal = makeAvatarStyles(
      64,
      lightColors.avatarRing,
      lightShadow.brandAvatar,
      lightColors,
      1
    );
    const large = makeAvatarStyles(
      64,
      lightColors.avatarRing,
      lightShadow.brandAvatar,
      lightColors,
      1.5
    );

    expect(large.styles.label.fontSize).toBe(
      normal.styles.label.fontSize! * 1.5
    );
    expect(large.styles.label.letterSpacing).toBe(-0.75);
    expect(large.styles.label).not.toHaveProperty('lineHeight');
    expect({
      avatarCore: large.styles.avatarCore,
      dim: large.dim,
      inner: large.inner,
      ringWidth: large.ringWidth,
      shell: large.styles.shell,
    }).toEqual({
      avatarCore: normal.styles.avatarCore,
      dim: normal.dim,
      inner: normal.inner,
      ringWidth: normal.ringWidth,
      shell: normal.styles.shell,
    });
  });
});
