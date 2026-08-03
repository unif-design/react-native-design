import type { ImageSourcePropType } from 'react-native';

type CanonicalResult = {
  value: string;
  valid: boolean;
};

const INVALID_EXCEPTION: CanonicalResult = {
  value: 'invalid:exception',
  valid: false,
};

function invalid(kind: string): CanonicalResult {
  return { value: `invalid:${kind}`, valid: false };
}

/**
 * 递归生成 source 的语义 identity。类型前缀防止 primitive 冲突，对象 key
 * 排序而数组保留顺序；任何非类型安全值只会产生 invalid 片段，不能逃逸异常。
 */
function visit(value: unknown, seen: WeakSet<object>): CanonicalResult {
  if (value === undefined) return { value: 'undefined:', valid: true };
  if (value === null) return { value: 'null:', valid: true };

  switch (typeof value) {
    case 'string':
      return { value: `string:${JSON.stringify(value)}`, valid: true };
    case 'number':
      return Number.isFinite(value)
        ? { value: `number:${value}`, valid: true }
        : invalid('number');
    case 'boolean':
      return { value: `boolean:${String(value)}`, valid: true };
    case 'function':
    case 'symbol':
    case 'bigint':
      return invalid(typeof value);
    case 'object':
      break;
    case 'undefined':
      return { value: 'undefined:', valid: true };
  }

  try {
    if (seen.has(value)) return invalid('cycle');
    seen.add(value);
  } catch {
    return INVALID_EXCEPTION;
  }

  try {
    if (Array.isArray(value)) {
      const parts: string[] = [];
      let valid = true;
      for (let index = 0; index < value.length; index += 1) {
        const item = visit(value[index], seen);
        parts.push(item.value);
        valid = valid && item.valid;
      }
      return { value: `array:[${parts.join(',')}]`, valid };
    }

    const parts: string[] = [];
    let valid = true;
    for (const key of Object.keys(value).sort()) {
      const item = visit((value as Record<string, unknown>)[key], seen);
      parts.push(`${JSON.stringify(key)}:${item.value}`);
      valid = valid && item.valid;
    }
    return { value: `object:{${parts.join(',')}}`, valid };
  } catch {
    return INVALID_EXCEPTION;
  } finally {
    seen.delete(value);
  }
}

function canonicalize(value: unknown): CanonicalResult {
  try {
    return visit(value, new WeakSet<object>());
  } catch {
    return INVALID_EXCEPTION;
  }
}

export function canonicalSourceValue(value: unknown): string {
  return canonicalize(value).value;
}

export function imageSourceKey(
  source: ImageSourcePropType | undefined
): string {
  return `image-source:${canonicalSourceValue(source)}`;
}

const URI_STRING_FIELDS = ['bundle', 'method', 'body'] as const;
const CACHE_POLICIES = new Set([
  'default',
  'reload',
  'force-cache',
  'only-if-cached',
]);

function isValidHeaders(value: unknown): boolean {
  if (value === undefined) return true;
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.keys(value).every(
    (key) => typeof (value as Record<string, unknown>)[key] === 'string'
  );
}

function isValidUriSource(value: unknown): boolean {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const uri = record.uri;
  if (typeof uri !== 'string' || uri.trim().length === 0) return false;

  for (const field of URI_STRING_FIELDS) {
    const fieldValue = record[field];
    if (fieldValue !== undefined && typeof fieldValue !== 'string')
      return false;
  }

  if (!isValidHeaders(record.headers)) return false;

  const cache = record.cache;
  if (cache !== undefined && !CACHE_POLICIES.has(cache as string)) return false;

  for (const field of ['width', 'height', 'scale'] as const) {
    const fieldValue = record[field];
    if (
      fieldValue !== undefined &&
      (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue))
    ) {
      return false;
    }
  }

  return true;
}

/**
 * JS 消费者可能绕过类型系统。只有合法 asset id、URI object 或 URI object
 * 数组能进入 Image；循环引用及不可序列化的 nested value 一律失败关闭。
 */
export function isValidImageSource(
  source: unknown
): source is ImageSourcePropType {
  try {
    if (!canonicalize(source).valid) return false;

    if (typeof source === 'number') {
      return Number.isFinite(source) && source > 0 && Number.isInteger(source);
    }

    if (Array.isArray(source)) {
      if (source.length === 0) return false;
      for (let index = 0; index < source.length; index += 1) {
        if (!(index in source) || !isValidUriSource(source[index]))
          return false;
      }
      return true;
    }

    return isValidUriSource(source);
  } catch {
    return false;
  }
}
