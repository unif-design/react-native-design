import type { AvatarGroupItem } from './types';

export type NormalizedAvatarGroup = Readonly<{
  visibleItems: readonly AvatarGroupItem[];
  overflowCount: number;
  invalidMax: boolean;
}>;

/** AvatarGroup 唯一的 max 与可见成员归一化入口。 */
export function normalizeAvatarGroup(
  items: readonly AvatarGroupItem[],
  max: number | undefined
): NormalizedAvatarGroup {
  const invalidMax =
    max !== undefined &&
    (!Number.isFinite(max) || !Number.isInteger(max) || max < 2);

  if (max === undefined || invalidMax || items.length <= max) {
    return { visibleItems: items, overflowCount: 0, invalidMax };
  }

  const visibleCount = max - 1;
  return {
    visibleItems: items.slice(0, visibleCount),
    overflowCount: items.length - visibleCount,
    invalidMax: false,
  };
}
