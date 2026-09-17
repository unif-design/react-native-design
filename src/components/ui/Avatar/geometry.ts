import { avatar, radius, rf } from '../../../theme';
import type { AvatarGeometry, AvatarShape, AvatarSize } from './types';

/** Avatar 尺寸推导:5 档 size → { box, fs }。box 走 avatar.<size> token。
 *  新增 size 在 types.ts 加 union + 这里加 case + tokens.ts 补 avatar.<key>。 */
export function sizingFor(size: AvatarSize): AvatarGeometry {
  switch (size) {
    case 'xs':
      return { box: avatar.xs, fs: rf(10) };
    case 'sm':
      return { box: avatar.sm, fs: rf(12) };
    case 'md':
      return { box: avatar.md, fs: rf(13) };
    case 'lg':
      return { box: avatar.lg, fs: rf(15) };
    case 'xl':
      return { box: avatar.xl, fs: rf(20) };
  }
}

/** circle 保留直径一半的现有视觉；square 按尺寸使用既有圆角 token。 */
export function resolveAvatarBorderRadius(
  size: AvatarSize,
  shape: AvatarShape
): number {
  if (shape === 'circle') return sizingFor(size).box / 2;
  if (size === 'xs' || size === 'sm') return radius.xs;
  if (size === 'xl') return radius.md;
  return radius.sm;
}
