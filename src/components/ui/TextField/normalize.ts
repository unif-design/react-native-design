import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { fixed } from '../../../theme';
import type { TextFieldContainerStyle } from './types';

/**
 * TextField 家族的**纯布局归一化** —— 无 React 依赖,可直接单测。
 *
 * 纪律与 Pulse 一致:非法值**整体回退默认值并记诊断**,不做 clamp、不做取整。
 * 悄悄把 `height: 20` 夹成 44 会让调用方永远发现不了自己传了一个碰不到的输入框。
 */

/** slot 图标的默认与合法上界。18 是 body 字号下视觉平衡的取值;>32 会撑破 44pt frame。 */
const DEFAULT_SLOT_ICON_SIZE = 18;
const MAX_SLOT_ICON_SIZE = 32;
/** Textarea 默认最小高度(约 5 行)。 */
const DEFAULT_TEXTAREA_MIN_HEIGHT = 96;

/** 这六个字段会破坏 TextField 自持的最小命中框,一律从 containerStyle 剥离。 */
const RESERVED_CONTAINER_KEYS = [
  'height',
  'minHeight',
  'maxHeight',
  'minWidth',
  'maxWidth',
  'overflow',
] as const;

const isFiniteAtLeast = (value: unknown, min: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min;

const isFiniteWithin = (
  value: unknown,
  min: number,
  max: number
): value is number =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= min &&
  value <= max;

export type NormalizedNumber = {
  value: number;
  diagnostics: readonly string[];
};

/** 单行高度 —— 不得低于 `fixed.hitTarget`(44pt),否则整行都碰不满一个手指。 */
export function normalizeInputHeight(value: unknown): NormalizedNumber {
  return isFiniteAtLeast(value, fixed.hitTarget)
    ? { value, diagnostics: [] }
    : { value: fixed.hitTarget, diagnostics: ['height'] };
}

export type NormalizedTextareaHeights = {
  minHeight: number;
  maxHeight: number | undefined;
  diagnostics: readonly string[];
};

/** 多行高度 —— `maxHeight` 只有在有限且不小于归一化后的 `minHeight` 时才保留。 */
export function normalizeTextareaHeights(
  minHeight: unknown,
  maxHeight: unknown
): NormalizedTextareaHeights {
  const diagnostics: string[] = [];
  let safeMin: number;
  if (minHeight === undefined) {
    safeMin = DEFAULT_TEXTAREA_MIN_HEIGHT;
  } else if (isFiniteAtLeast(minHeight, fixed.hitTarget)) {
    safeMin = minHeight;
  } else {
    safeMin = DEFAULT_TEXTAREA_MIN_HEIGHT;
    diagnostics.push('minHeight');
  }
  if (maxHeight === undefined) {
    return { minHeight: safeMin, maxHeight: undefined, diagnostics };
  }
  // 注意用**归一化后**的 min 比较:min 被回退时 max 必须跟着重新判定,
  // 否则会留下一个比实际 min 还小的 max,直接把内容压没。
  if (isFiniteAtLeast(maxHeight, safeMin)) {
    return { minHeight: safeMin, maxHeight, diagnostics };
  }
  diagnostics.push('maxHeight');
  return { minHeight: safeMin, maxHeight: undefined, diagnostics };
}

/** slot 图标尺寸 —— 只接受有限的 `[1, 32]`。 */
export function normalizeSlotIconSize(value: unknown): NormalizedNumber {
  return isFiniteWithin(value, 1, MAX_SLOT_ICON_SIZE)
    ? { value, diagnostics: [] }
    : { value: DEFAULT_SLOT_ICON_SIZE, diagnostics: ['slot.size'] };
}

export type SanitizedContainerStyle = {
  style: TextFieldContainerStyle;
  diagnostics: readonly string[];
};

/**
 * 剥掉 containerStyle 里会覆盖最小 frame 的六个字段。
 *
 * 先 `StyleSheet.flatten` 再解构到新对象 —— 绝不原地修改调用方对象或已注册的
 * StyleSheet 条目(那会污染同一 sheet 的其他使用者)。
 */
export function sanitizeTextFieldContainerStyle(
  style: StyleProp<ViewStyle> | undefined
): SanitizedContainerStyle {
  const flattened = (StyleSheet.flatten(style) ?? {}) as Record<
    string,
    unknown
  >;
  const reserved: readonly string[] = RESERVED_CONTAINER_KEYS;
  const sanitized: Record<string, unknown> = {};
  const diagnostics: string[] = [];
  for (const [key, entry] of Object.entries(flattened)) {
    if (reserved.includes(key)) {
      diagnostics.push(key);
      continue;
    }
    sanitized[key] = entry;
  }
  return { style: sanitized as TextFieldContainerStyle, diagnostics };
}
