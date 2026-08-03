import { StyleSheet } from 'react-native';
import type { StyleProp } from 'react-native';
import type { ThumbnailImageStyle } from './types';

const RESERVED_IMAGE_STYLE_KEYS = [
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
] as const;

type SanitizedThumbnailImageStyle = {
  style: ThumbnailImageStyle;
  diagnostics: readonly string[];
};

function invalidStyle(): SanitizedThumbnailImageStyle {
  return { style: {}, diagnostics: ['style'] };
}

function isEmptyStyleInput(value: unknown): boolean {
  if (value === undefined || value === null || value === false) return true;
  if (!Array.isArray(value)) return false;
  return value.every(isEmptyStyleInput);
}

/**
 * 先 flatten 再复制允许字段，兼容 registered / array style，同时不修改 caller。
 * 任意异常或非对象产物都失败关闭，避免宽类型 JS 值穿透到原生 Image。
 */
export function sanitizeThumbnailImageStyle(
  style: StyleProp<ThumbnailImageStyle> | undefined
): SanitizedThumbnailImageStyle {
  try {
    if (isEmptyStyleInput(style)) {
      return { style: {}, diagnostics: [] };
    }
    if (typeof style !== 'object' && typeof style !== 'number') {
      return invalidStyle();
    }

    const flattened = StyleSheet.flatten(style) as unknown;
    if (flattened === undefined || flattened === null || flattened === false) {
      return invalidStyle();
    }
    if (typeof flattened !== 'object' || Array.isArray(flattened)) {
      return invalidStyle();
    }

    const source = flattened as Record<string, unknown>;
    const reserved = new Set<string>(RESERVED_IMAGE_STYLE_KEYS);
    const foundReserved = new Set<string>();
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(source)) {
      if (reserved.has(key)) {
        foundReserved.add(key);
      } else {
        sanitized[key] = value;
      }
    }

    return {
      style: sanitized as ThumbnailImageStyle,
      diagnostics: RESERVED_IMAGE_STYLE_KEYS.filter((key) =>
        foundReserved.has(key)
      ),
    };
  } catch {
    return invalidStyle();
  }
}
