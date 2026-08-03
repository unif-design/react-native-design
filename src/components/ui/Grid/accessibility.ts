import type { GridItem } from './types';
import { normalizeNonBlankText } from '../shared/accessibilityName';

type GridItemAccessibilityContent = Pick<
  GridItem,
  'accessibilityLabel' | 'badge' | 'label'
>;

export function gridItemAccessibilityLabel(
  item: GridItemAccessibilityContent
): string | undefined {
  const explicitLabel = normalizeNonBlankText(item.accessibilityLabel);
  if (explicitLabel !== undefined) {
    return explicitLabel;
  }
  const visibleLabel = normalizeNonBlankText(item.label);
  if (visibleLabel === undefined) return undefined;
  return item.badge != null
    ? `${visibleLabel}，${String(item.badge).trim()}`
    : visibleLabel;
}
