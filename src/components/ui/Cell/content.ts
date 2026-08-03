import type { CellExtra, CellTextValue } from './types';
import { normalizeNonBlankText } from '../shared/accessibilityName';

type CellAccessibilityExtra = Exclude<CellExtra, { kind: 'control' }>;

export function stringifyCellText(value: CellTextValue): string {
  return String(value);
}

function appendNonBlank(parts: string[], value: string): void {
  const normalized = normalizeNonBlankText(value);
  if (normalized !== undefined) parts.push(normalized);
}

export function buildCellAccessibilityLabel({
  title,
  desc,
  extra,
}: {
  title: CellTextValue;
  desc?: CellTextValue;
  extra?: CellAccessibilityExtra;
}): string {
  const parts: string[] = [];
  appendNonBlank(parts, stringifyCellText(title));

  if (desc !== undefined) {
    appendNonBlank(parts, stringifyCellText(desc));
  }

  if (extra?.kind === 'text') {
    appendNonBlank(parts, stringifyCellText(extra.value));
  } else if (extra?.kind === 'display') {
    appendNonBlank(parts, extra.accessibilityText ?? '');
  }

  return parts.join('，');
}

export function resolveCellActionAccessibilityLabel({
  accessibilityLabel,
  ...content
}: {
  accessibilityLabel?: unknown;
  title: CellTextValue;
  desc?: CellTextValue;
  extra?: CellAccessibilityExtra;
}): string | undefined {
  return (
    normalizeNonBlankText(accessibilityLabel) ??
    normalizeNonBlankText(buildCellAccessibilityLabel(content))
  );
}
