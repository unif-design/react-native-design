import { StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { fixed } from '../../../theme';
import { ICONS, type IconName } from '../../../icons';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import type {
  SearchFieldLayout,
  TextFieldContainerStyle,
  TextFieldSlot,
} from './types';

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
const DEFAULT_SEARCH_VISIBLE_HEIGHT = 36;

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

export type NormalizedTextFieldSlot = {
  slot: TextFieldSlot | undefined;
  diagnostics: readonly string[];
};

function isIconName(value: unknown): value is IconName {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(ICONS, value)
  );
}

/** 未类型化 JS 必须完整匹配一个受支持分支，不能靠 discriminant 后 cast 绕过校验。 */
export function normalizeTextFieldSlot(slot: unknown): NormalizedTextFieldSlot {
  if (slot === undefined) {
    return { slot: undefined, diagnostics: [] };
  }
  if (typeof slot !== 'object' || slot === null) {
    return { slot: undefined, diagnostics: ['slot'] };
  }
  const candidate = slot as Record<string, unknown>;
  switch (candidate.kind) {
    case 'icon': {
      const size =
        typeof candidate.size === 'number' && Number.isFinite(candidate.size)
          ? candidate.size
          : undefined;
      const color =
        typeof candidate.color === 'string' ? candidate.color : undefined;
      const hasValidSize = candidate.size === undefined || size !== undefined;
      const hasValidColor =
        candidate.color === undefined || color !== undefined;
      if (!isIconName(candidate.icon) || !hasValidSize || !hasValidColor) {
        return { slot: undefined, diagnostics: ['slot.icon'] };
      }
      return {
        slot: {
          kind: 'icon',
          icon: candidate.icon,
          ...(size !== undefined && { size }),
          ...(color !== undefined && { color }),
        },
        diagnostics: [],
      };
    }
    case 'text':
      if (
        typeof candidate.value !== 'string' &&
        typeof candidate.value !== 'number'
      ) {
        return { slot: undefined, diagnostics: ['slot.text'] };
      }
      return {
        slot: { kind: 'text', value: candidate.value },
        diagnostics: [],
      };
    case 'action': {
      const accessibilityLabel = normalizeNonBlankText(
        candidate.accessibilityLabel
      );
      const hasValidDisabled =
        candidate.disabled === undefined ||
        typeof candidate.disabled === 'boolean';
      const slotDisabled =
        typeof candidate.disabled === 'boolean'
          ? candidate.disabled
          : undefined;
      if (
        !isIconName(candidate.icon) ||
        typeof candidate.onPress !== 'function' ||
        accessibilityLabel === undefined ||
        !hasValidDisabled
      ) {
        return { slot: undefined, diagnostics: ['slot.action'] };
      }
      return {
        slot: {
          kind: 'action',
          icon: candidate.icon,
          onPress: candidate.onPress as () => void,
          accessibilityLabel,
          ...(slotDisabled !== undefined && { disabled: slotDisabled }),
        },
        diagnostics: [],
      };
    }
    default:
      return { slot: undefined, diagnostics: ['slot.kind'] };
  }
}

export type NormalizedSearchLayout = SearchFieldLayout & {
  diagnostics: readonly string[];
};

/** 搜索框的可见面可为 36pt,但承载输入/操作的实际行永远不得小于 44pt。 */
export function normalizeSearchLayout(
  interactiveHeight: unknown,
  visibleHeight: unknown
): NormalizedSearchLayout {
  const diagnostics: string[] = [];
  const safeInteractive = isFiniteAtLeast(interactiveHeight, fixed.hitTarget)
    ? interactiveHeight
    : fixed.hitTarget;
  if (safeInteractive !== interactiveHeight) {
    diagnostics.push('interactiveHeight');
  }
  const safeVisible =
    typeof visibleHeight === 'number' &&
    Number.isFinite(visibleHeight) &&
    visibleHeight > 0 &&
    visibleHeight <= safeInteractive
      ? visibleHeight
      : DEFAULT_SEARCH_VISIBLE_HEIGHT;
  if (safeVisible !== visibleHeight) {
    diagnostics.push('visibleHeight');
  }
  return {
    interactiveHeight: safeInteractive,
    visibleHeight: safeVisible,
    verticalInset: (safeInteractive - safeVisible) / 2,
    diagnostics,
  };
}

export type SanitizedContainerStyle = {
  style: TextFieldContainerStyle;
  diagnostics: readonly string[];
};

export type SanitizedTextFieldWrapperProps = {
  props: Record<string, unknown>;
  diagnostics: readonly string[];
};

/**
 * 公开 Input / Textarea 不允许未类型化 JS 覆盖内部 layout 开关。
 *
 * 返回新对象而不是 delete 原 props，既不改变调用方对象，也让 wrapper 能在安全 spread
 * 后由可信边界写入自己的 `multiline`。
 */
export function sanitizeTextFieldWrapperProps(
  props: Record<string, unknown>
): SanitizedTextFieldWrapperProps {
  const { multiline, searchLayout, ...safeProps } = props;
  const diagnostics: string[] = [];
  if (multiline !== undefined) {
    diagnostics.push('multiline');
  }
  if (searchLayout !== undefined) {
    diagnostics.push('searchLayout');
  }
  return { props: safeProps, diagnostics };
}

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
