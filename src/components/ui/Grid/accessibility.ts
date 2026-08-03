import type { GridItem } from './types';

type GridItemAccessibilityContent = Pick<
  GridItem,
  'accessibilityLabel' | 'badge' | 'label'
>;

export function gridItemAccessibilityLabel(
  item: GridItemAccessibilityContent
): string {
  const explicitLabel = item.accessibilityLabel?.trim();
  if (explicitLabel) {
    return explicitLabel;
  }
  return item.badge != null ? `${item.label}，${item.badge}` : item.label;
}
