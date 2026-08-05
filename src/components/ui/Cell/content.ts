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

/**
 * 语义态 → 标题色。**danger 优先于 selected** —— 危险语义比选中语义更需要被看见,
 * 两者同时给时不该让「当前项」的高亮盖掉「这一项有风险」。
 * 都没给返回 undefined,由调用方回落到默认前景色。
 */
export function resolveCellTitleColor({
  danger,
  selected,
  dangerColor,
  selectedColor,
}: {
  danger?: boolean;
  selected?: boolean;
  dangerColor: string;
  selectedColor: string;
}): string | undefined {
  if (danger === true) return dangerColor;
  if (selected === true) return selectedColor;
  return undefined;
}
