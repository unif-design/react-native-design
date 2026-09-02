import { describe, expect, test } from '@jest/globals';
import { avatar, radius } from '../../../../src/theme';
import { resolveAvatarBorderRadius } from '../../../../src/components/ui/Avatar/styles';

describe('resolveAvatarBorderRadius', () => {
  test('circle 始终按头像直径的一半取圆角', () => {
    expect(resolveAvatarBorderRadius('xs', 'circle')).toBe(avatar.xs / 2);
    expect(resolveAvatarBorderRadius('md', 'circle')).toBe(avatar.md / 2);
    expect(resolveAvatarBorderRadius('xl', 'circle')).toBe(avatar.xl / 2);
  });

  test('square 按尺寸档位使用 xs/sm/md 三档 token 圆角', () => {
    expect(resolveAvatarBorderRadius('xs', 'square')).toBe(radius.xs);
    expect(resolveAvatarBorderRadius('sm', 'square')).toBe(radius.xs);
    expect(resolveAvatarBorderRadius('md', 'square')).toBe(radius.sm);
    expect(resolveAvatarBorderRadius('lg', 'square')).toBe(radius.sm);
    expect(resolveAvatarBorderRadius('xl', 'square')).toBe(radius.md);
  });
});
