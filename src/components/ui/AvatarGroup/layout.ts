import { avatar, fixed, r, space } from '../../../theme';
import type { AvatarSize } from '../Avatar';

export type AvatarGroupHitSlop = Readonly<{
  top: number;
  right: number;
  bottom: number;
  left: number;
}>;

export type ResolvedAvatarGroupLayout = Readonly<{
  box: number;
  overlap: number;
  borderWidth: number;
  hitSlop: AvatarGroupHitSlop;
}>;

/** 五档尺寸共享的重叠、分隔边与 44pt 命中区几何。 */
export function resolveAvatarGroupLayout(
  size: AvatarSize
): ResolvedAvatarGroupLayout {
  const box = avatar[size];
  let overlap: number;
  let borderWidth: number;

  switch (size) {
    case 'xs':
      overlap = space['1'];
      borderWidth = r(1);
      break;
    case 'sm':
      overlap = space['2'];
      borderWidth = r(1);
      break;
    case 'md':
      overlap = space['3'];
      borderWidth = r(1);
      break;
    case 'lg':
      overlap = space['4'];
      borderWidth = r(2);
      break;
    case 'xl':
      overlap = space['6'];
      borderWidth = r(2);
      break;
  }

  const inset = Math.max(0, (fixed.hitTarget - box) / 2);
  return {
    box,
    overlap,
    borderWidth,
    hitSlop: { top: inset, right: inset, bottom: inset, left: inset },
  };
}
