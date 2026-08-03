import type { ImageSourcePropType } from 'react-native';

interface SnapshotObject {
  readonly [key: string]: SnapshotValue;
}

interface SnapshotArray extends ReadonlyArray<SnapshotValue> {}

type SnapshotValue =
  | undefined
  | null
  | string
  | number
  | boolean
  | SnapshotObject
  | SnapshotArray;

type SnapshotResult =
  | {
      valid: true;
      snapshot: SnapshotValue;
      canonical: string;
    }
  | {
      valid: false;
      canonical: string;
    };

type ResolvedImageSource = Readonly<{
  source: ImageSourcePropType;
  key: string;
}>;

const hasOwn = (value: object, key: PropertyKey): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

function valid(snapshot: SnapshotValue, canonical: string): SnapshotResult {
  return { valid: true, snapshot, canonical };
}

function invalid(kind: string): SnapshotResult {
  return { valid: false, canonical: `invalid:${kind}` };
}

function visitArray(
  value: object,
  keys: readonly string[],
  seen: WeakSet<object>
): SnapshotResult {
  if (!keys.includes('length')) return invalid('descriptor');

  const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, 'length');
  if (
    lengthDescriptor === undefined ||
    lengthDescriptor.enumerable ||
    !hasOwn(lengthDescriptor, 'value') ||
    typeof lengthDescriptor.value !== 'number' ||
    !Number.isInteger(lengthDescriptor.value) ||
    lengthDescriptor.value < 0
  ) {
    return invalid('descriptor');
  }

  const length = lengthDescriptor.value;
  if (keys.length !== length + 1) return invalid('descriptor');

  const keySet = new Set(keys);
  const parts: string[] = [];
  const snapshot: SnapshotValue[] = [];
  let allValid = true;

  for (let index = 0; index < length; index += 1) {
    const key = String(index);
    if (!keySet.has(key)) return invalid('descriptor');

    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !hasOwn(descriptor, 'value')
    ) {
      return invalid('descriptor');
    }

    const item = visit(descriptor.value, seen);
    parts.push(item.canonical);
    if (item.valid) {
      snapshot.push(item.snapshot);
    } else {
      allValid = false;
    }
  }

  const canonical = `array:[${parts.join(',')}]`;
  return allValid
    ? valid(Object.freeze(snapshot), canonical)
    : { valid: false, canonical };
}

function visitObject(
  value: object,
  keys: readonly string[],
  seen: WeakSet<object>
): SnapshotResult {
  const snapshot: Record<string, SnapshotValue> = {};
  const parts: string[] = [];
  let allValid = true;

  for (const key of [...keys].sort()) {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined) return invalid('descriptor');
    if (!descriptor.enumerable) return invalid('non-enumerable');
    if (!hasOwn(descriptor, 'value')) return invalid('accessor');

    const item = visit(descriptor.value, seen);
    parts.push(`${JSON.stringify(key)}:${item.canonical}`);
    if (item.valid) {
      Object.defineProperty(snapshot, key, {
        configurable: false,
        enumerable: true,
        value: item.snapshot,
        writable: false,
      });
    } else {
      allValid = false;
    }
  }

  const canonical = `object:{${parts.join(',')}}`;
  return allValid
    ? valid(Object.freeze(snapshot), canonical)
    : { valid: false, canonical };
}

/**
 * 只从 own data descriptor 读取一次，绝不执行 getter。snapshot 与 canonical
 * key 因而来自同一份值；任何 descriptor / Proxy 异常都失败关闭。
 */
function visit(value: unknown, seen: WeakSet<object>): SnapshotResult {
  if (value === undefined) return valid(undefined, 'undefined:');
  if (value === null) return valid(null, 'null:');

  switch (typeof value) {
    case 'string':
      return valid(value, `string:${JSON.stringify(value)}`);
    case 'number':
      return Number.isFinite(value)
        ? valid(value, `number:${value}`)
        : invalid('number');
    case 'boolean':
      return valid(value, `boolean:${String(value)}`);
    case 'function':
    case 'symbol':
    case 'bigint':
      return invalid(typeof value);
    case 'object':
      break;
    case 'undefined':
      return valid(undefined, 'undefined:');
  }

  try {
    if (seen.has(value)) return invalid('cycle');

    const isArray = Array.isArray(value);
    const prototype = Object.getPrototypeOf(value);
    if (isArray) {
      if (prototype !== Array.prototype) return invalid('prototype');
    } else if (prototype !== Object.prototype && prototype !== null) {
      return invalid('prototype');
    }

    const ownKeys = Reflect.ownKeys(value);
    const keys: string[] = [];
    for (const key of ownKeys) {
      if (typeof key === 'symbol') return invalid('symbol-key');
      keys.push(key);
    }

    seen.add(value);
    try {
      return isArray
        ? visitArray(value, keys, seen)
        : visitObject(value, keys, seen);
    } finally {
      seen.delete(value);
    }
  } catch {
    return invalid('exception');
  }
}

function snapshotValue(value: unknown): SnapshotResult {
  try {
    return visit(value, new WeakSet<object>());
  } catch {
    return invalid('exception');
  }
}

export function canonicalSourceValue(value: unknown): string {
  return snapshotValue(value).canonical;
}

const URI_STRING_FIELDS = ['bundle', 'method', 'body'] as const;
const CACHE_POLICIES = new Set([
  'default',
  'reload',
  'force-cache',
  'only-if-cached',
]);

function isSnapshotObject(value: SnapshotValue): value is SnapshotObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isValidHeaders(value: SnapshotValue): boolean {
  if (value === undefined) return true;
  if (!isSnapshotObject(value)) return false;
  return Object.keys(value).every((key) => typeof value[key] === 'string');
}

function isValidUriSource(value: SnapshotValue): boolean {
  if (!isSnapshotObject(value) || !hasOwn(value, 'uri')) return false;

  const uri = value.uri;
  if (typeof uri !== 'string' || uri.trim().length === 0) return false;

  for (const field of URI_STRING_FIELDS) {
    const fieldValue = value[field];
    if (fieldValue !== undefined && typeof fieldValue !== 'string') {
      return false;
    }
  }

  if (!isValidHeaders(value.headers)) return false;

  const cache = value.cache;
  if (cache !== undefined && !CACHE_POLICIES.has(cache as string)) return false;

  for (const field of ['width', 'height', 'scale'] as const) {
    const fieldValue = value[field];
    if (
      fieldValue !== undefined &&
      (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue))
    ) {
      return false;
    }
  }

  return true;
}

function asImageSource(
  snapshot: SnapshotValue
): ImageSourcePropType | undefined {
  if (typeof snapshot === 'number') {
    return Number.isFinite(snapshot) &&
      snapshot > 0 &&
      Number.isInteger(snapshot)
      ? snapshot
      : undefined;
  }

  if (Array.isArray(snapshot)) {
    return snapshot.length > 0 && snapshot.every(isValidUriSource)
      ? (snapshot as ImageSourcePropType)
      : undefined;
  }

  return isValidUriSource(snapshot)
    ? (snapshot as ImageSourcePropType)
    : undefined;
}

/**
 * 组件唯一入口：一次读取完成 runtime validation、deep-frozen plain snapshot
 * 与 semantic key。调用方必须把同一返回值里的 source / key 一起交给 attempt。
 */
export function resolveImageSource(
  source: unknown
): ResolvedImageSource | undefined {
  const result = snapshotValue(source);
  if (!result.valid) return undefined;

  const snapshot = asImageSource(result.snapshot);
  if (snapshot === undefined) return undefined;

  return Object.freeze({
    source: snapshot,
    key: `image-source:${result.canonical}`,
  });
}

export function imageSourceKey(
  source: ImageSourcePropType | undefined
): string {
  return `image-source:${snapshotValue(source).canonical}`;
}

/**
 * JS 消费者可能绕过类型系统。只有能安全 snapshot 的 asset id、URI object 或
 * URI object 数组能进入 Image；accessor、异常 descriptor 与非法 nested value
 * 一律失败关闭。
 */
export function isValidImageSource(
  source: unknown
): source is ImageSourcePropType {
  return resolveImageSource(source) !== undefined;
}
