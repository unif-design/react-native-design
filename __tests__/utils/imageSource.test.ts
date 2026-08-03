import { describe, expect, test } from '@jest/globals';
import {
  canonicalSourceValue,
  imageSourceKey,
  isValidImageSource,
  resolveImageSource,
} from '../../src/utils/imageSource';

describe('canonicalSourceValue / imageSourceKey', () => {
  test('object 与 headers 的 key 顺序不影响 identity', () => {
    expect(
      imageSourceKey({
        uri: 'https://x/a.png',
        headers: { Authorization: 'a', Accept: 'image/png' },
      })
    ).toBe(
      imageSourceKey({
        headers: { Accept: 'image/png', Authorization: 'a' },
        uri: 'https://x/a.png',
      })
    );
  });

  test('真实 source 差异和 primitive 类型会改变 identity', () => {
    const source = {
      uri: 'https://x/a.png',
      headers: { token: '1' },
      width: 20,
      height: 30,
      scale: 2,
      cache: 'reload' as const,
    };

    expect(imageSourceKey(source)).not.toBe(
      imageSourceKey({ ...source, uri: 'https://x/b.png' })
    );
    expect(imageSourceKey(source)).not.toBe(
      imageSourceKey({ ...source, headers: { token: '2' } })
    );
    expect(imageSourceKey(source)).not.toBe(
      imageSourceKey({ ...source, width: 21 })
    );
    expect(imageSourceKey(source)).not.toBe(
      imageSourceKey({ ...source, height: 31 })
    );
    expect(imageSourceKey(source)).not.toBe(
      imageSourceKey({ ...source, scale: 3 })
    );
    expect(imageSourceKey(source)).not.toBe(
      imageSourceKey({ ...source, cache: 'force-cache' })
    );
    expect(canonicalSourceValue(1)).toBe('number:1');
    expect(canonicalSourceValue('1')).toBe('string:"1"');
  });

  test('undefined、空数组和空对象彼此不同', () => {
    expect(canonicalSourceValue(undefined)).toBe('undefined:');
    expect(canonicalSourceValue([])).toBe('array:[]');
    expect(canonicalSourceValue({})).toBe('object:{}');
    expect(
      new Set([
        canonicalSourceValue(undefined),
        canonicalSourceValue([]),
        canonicalSourceValue({}),
      ]).size
    ).toBe(3);
  });

  test('array 保留顺序，同时忽略对象引用差异', () => {
    const first = [{ uri: 'a' }, { uri: 'b' }];
    const equivalent = [{ uri: 'a' }, { uri: 'b' }];
    const reversed = [{ uri: 'b' }, { uri: 'a' }];

    expect(imageSourceKey(first)).toBe(imageSourceKey(equivalent));
    expect(imageSourceKey(first)).not.toBe(imageSourceKey(reversed));
  });

  test('本地 asset number 使用稳定且可区分的 identity', () => {
    expect(imageSourceKey(7)).toBe(imageSourceKey(7));
    expect(imageSourceKey(7)).not.toBe(imageSourceKey(8));
    expect(imageSourceKey(7)).not.toBe(imageSourceKey('7' as never));
  });

  test('cycle、function、symbol、bigint 和非有限数返回确定性 invalid 且永不抛错', () => {
    const cycle: unknown[] = [];
    cycle.push(cycle);
    const repeatedCycle: Record<string, unknown> = {};
    repeatedCycle.first = repeatedCycle;
    repeatedCycle.second = repeatedCycle;
    const invalidValues: readonly unknown[] = [
      () => undefined,
      Symbol('source'),
      1n,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];

    expect(() => canonicalSourceValue(cycle)).not.toThrow();
    expect(canonicalSourceValue(cycle)).toBe('array:[invalid:cycle]');
    expect(canonicalSourceValue(repeatedCycle)).toBe(
      'object:{"first":invalid:cycle,"second":invalid:cycle}'
    );

    for (const value of invalidValues) {
      expect(() => canonicalSourceValue(value)).not.toThrow();
      expect(() => imageSourceKey(value as never)).not.toThrow();
      expect(canonicalSourceValue(value)).toMatch(/^invalid:/u);
      expect(canonicalSourceValue(value)).toBe(canonicalSourceValue(value));
    }
  });

  test('读取属性失败或 proxy 已失效时也返回 invalid 而不抛错', () => {
    const throwingGetter = {};
    Object.defineProperty(throwingGetter, 'uri', {
      enumerable: true,
      get() {
        throw new Error('getter failed');
      },
    });
    const { proxy, revoke } = Proxy.revocable({ uri: 'a' }, {});
    revoke();

    for (const value of [throwingGetter, proxy]) {
      expect(() => canonicalSourceValue(value)).not.toThrow();
      expect(() => imageSourceKey(value as never)).not.toThrow();
      expect(canonicalSourceValue(value)).toMatch(/^invalid:/u);
    }
  });
});

describe('isValidImageSource', () => {
  test.each([
    undefined,
    null,
    0,
    -1,
    1.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    '1',
    {},
    [],
    { uri: '   ' },
    { uri: 1 },
    [{ uri: 'a' }, { uri: '   ' }],
    [1],
    () => undefined,
    Symbol('source'),
    1n,
  ])('拒绝 invalid source %#', (source) => {
    expect(isValidImageSource(source)).toBe(false);
  });

  test('接受有限正整数本地 asset', () => {
    expect(isValidImageSource(1)).toBe(true);
    expect(isValidImageSource(42)).toBe(true);
  });

  test('接受 trim 后非空的 URI object', () => {
    expect(isValidImageSource({ uri: 'https://x/a.png' })).toBe(true);
    expect(isValidImageSource({ uri: '  file:///avatar.png  ' })).toBe(true);
  });

  test('只接受非空且每项都是有效 URI object 的 source array', () => {
    expect(
      isValidImageSource([{ uri: 'a' }, { uri: 'b', headers: { token: 'x' } }])
    ).toBe(true);
    expect(isValidImageSource([{ uri: 'a' }, {}])).toBe(false);
  });

  test('URI 外壳合法但 nested runtime value 非类型安全时仍拒绝', () => {
    const cyclicSource: Record<string, unknown> = { uri: 'a' };
    cyclicSource.self = cyclicSource;

    for (const source of [
      { uri: 'a', extra: () => undefined },
      { uri: 'a', extra: Symbol('source') },
      { uri: 'a', extra: 1n },
      { uri: 'a', width: Number.NaN },
      { uri: 'a', height: Number.POSITIVE_INFINITY },
      { uri: 'a', headers: { token: Symbol('token') } },
      cyclicSource,
    ]) {
      expect(() => isValidImageSource(source)).not.toThrow();
      expect(isValidImageSource(source)).toBe(false);
    }
  });

  test('cycle、throwing getter 和失效 proxy 等无类型安全输入永不抛错', () => {
    const cycle: unknown[] = [];
    cycle.push(cycle);
    const throwingGetter = {};
    Object.defineProperty(throwingGetter, 'uri', {
      enumerable: true,
      get() {
        throw new Error('getter failed');
      },
    });
    const { proxy, revoke } = Proxy.revocable({ uri: 'a' }, {});
    revoke();

    for (const source of [cycle, throwingGetter, proxy]) {
      expect(() => isValidImageSource(source)).not.toThrow();
      expect(isValidImageSource(source)).toBe(false);
    }
  });

  test('只认可 own enumerable data uri，不接受继承、隐藏或动态读取', () => {
    const inheritedUri = Object.create({ uri: 'https://x/inherited.png' });
    const nonEnumerableUri = {};
    Object.defineProperty(nonEnumerableUri, 'uri', {
      configurable: true,
      enumerable: false,
      value: 'https://x/hidden.png',
      writable: true,
    });
    let getterReads = 0;
    const dynamicUri = {};
    Object.defineProperty(dynamicUri, 'uri', {
      configurable: true,
      enumerable: true,
      get() {
        getterReads += 1;
        return getterReads === 1 ? 'https://x/a.png' : 'https://x/b.png';
      },
    });
    const ownKeysHiddenUri = new Proxy(
      { uri: 'https://x/proxy.png' },
      { ownKeys: () => [] }
    );

    for (const source of [
      inheritedUri,
      nonEnumerableUri,
      dynamicUri,
      ownKeysHiddenUri,
    ]) {
      expect(isValidImageSource(source)).toBe(false);
    }
    expect(getterReads).toBe(0);
  });
});

describe('resolveImageSource', () => {
  test('拒绝 inherited、non-enumerable 和 accessor uri，且不执行 getter', () => {
    const inheritedUri = Object.create({ uri: 'https://x/inherited.png' });
    const nonEnumerableUri = {};
    Object.defineProperty(nonEnumerableUri, 'uri', {
      configurable: true,
      enumerable: false,
      value: 'https://x/hidden.png',
      writable: true,
    });
    let getterReads = 0;
    const accessorUri = {};
    Object.defineProperty(accessorUri, 'uri', {
      configurable: true,
      enumerable: true,
      get() {
        getterReads += 1;
        throw new Error('uri getter 不得执行');
      },
    });

    for (const source of [inheritedUri, nonEnumerableUri, accessorUri]) {
      expect(() => resolveImageSource(source)).not.toThrow();
      expect(resolveImageSource(source)).toBeUndefined();
      expect(isValidImageSource(source)).toBe(false);
    }
    expect(getterReads).toBe(0);
  });

  test('拒绝 symbol、non-enumerable、accessor nested field 和非 plain object', () => {
    const symbolField = {
      uri: 'https://x/a.png',
      [Symbol('hidden')]: 'value',
    };
    const nonEnumerableField = { uri: 'https://x/a.png' };
    Object.defineProperty(nonEnumerableField, 'hidden', {
      configurable: true,
      enumerable: false,
      value: 'value',
      writable: true,
    });
    let nestedGetterReads = 0;
    const accessorField = { uri: 'https://x/a.png' };
    Object.defineProperty(accessorField, 'dynamic', {
      configurable: true,
      enumerable: true,
      get() {
        nestedGetterReads += 1;
        return 'value';
      },
    });
    class ClassSource {
      uri = 'https://x/a.png';
    }

    for (const source of [
      symbolField,
      nonEnumerableField,
      accessorField,
      new ClassSource(),
    ]) {
      expect(resolveImageSource(source)).toBeUndefined();
      expect(isValidImageSource(source)).toBe(false);
    }
    expect(nestedGetterReads).toBe(0);
  });

  test('ownKeys 隐藏 uri 或返回 invalid descriptor 时失败关闭', () => {
    const hiddenUri = new Proxy(
      { uri: 'https://x/hidden.png' },
      {
        ownKeys: () => [],
      }
    );
    const missingDescriptor = new Proxy(
      {},
      {
        ownKeys: () => ['uri'],
        getOwnPropertyDescriptor: () => undefined,
        get: (_target, key) =>
          key === 'uri' ? 'https://x/descriptor.png' : undefined,
      }
    );

    for (const source of [hiddenUri, missingDescriptor]) {
      expect(() => resolveImageSource(source)).not.toThrow();
      expect(resolveImageSource(source)).toBeUndefined();
      expect(isValidImageSource(source)).toBe(false);
    }
  });

  test('ownKeys、prototype 和 descriptor 异常永不逃逸', () => {
    const ownKeysThrows = new Proxy(
      {},
      {
        ownKeys() {
          throw new Error('ownKeys failed');
        },
      }
    );
    const prototypeThrows = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw new Error('prototype failed');
        },
      }
    );
    const descriptorThrows = new Proxy(
      {},
      {
        ownKeys: () => ['uri'],
        getOwnPropertyDescriptor() {
          throw new Error('descriptor failed');
        },
      }
    );

    for (const source of [ownKeysThrows, prototypeThrows, descriptorThrows]) {
      expect(() => resolveImageSource(source)).not.toThrow();
      expect(resolveImageSource(source)).toBeUndefined();
      expect(isValidImageSource(source)).toBe(false);
    }
  });

  test('Proxy descriptor 只读取一次，snapshot 与 key 使用同一份值', () => {
    let descriptorReads = 0;
    const dynamicDescriptor = new Proxy(
      {},
      {
        ownKeys: () => ['uri'],
        getOwnPropertyDescriptor: () => {
          descriptorReads += 1;
          return {
            configurable: true,
            enumerable: true,
            value:
              descriptorReads === 1 ? 'https://x/a.png' : 'https://x/b.png',
            writable: true,
          };
        },
      }
    );

    const resolved = resolveImageSource(dynamicDescriptor);

    expect(descriptorReads).toBe(1);
    expect(resolved).toEqual({
      source: { uri: 'https://x/a.png' },
      key: imageSourceKey({ uri: 'https://x/a.png' }),
    });
    expect(Object.isFrozen(resolved?.source)).toBe(true);
  });

  test('普通 URI source 的 headers 与 unknown JSON-safe 字段被深拷贝并冻结', () => {
    const source = {
      uri: 'https://x/a.png',
      headers: { Authorization: 'token' },
      cache: 'reload',
      width: 20,
      metadata: {
        retry: 2,
        flags: ['primary', null, true],
      },
      optional: undefined,
    };
    const expectedKey = imageSourceKey(source as never);

    const resolved = resolveImageSource(source);
    const snapshot = resolved?.source as typeof source | undefined;

    expect(resolved?.key).toBe(expectedKey);
    expect(snapshot).toEqual(source);
    expect(snapshot).not.toBe(source);
    expect(snapshot?.headers).not.toBe(source.headers);
    expect(snapshot?.metadata).not.toBe(source.metadata);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot?.headers)).toBe(true);
    expect(Object.isFrozen(snapshot?.metadata)).toBe(true);
    expect(Object.isFrozen(snapshot?.metadata.flags)).toBe(true);

    source.uri = 'https://x/mutated.png';
    source.headers.Authorization = 'mutated';
    source.metadata.flags[0] = 'mutated';

    expect(snapshot).toEqual({
      uri: 'https://x/a.png',
      headers: { Authorization: 'token' },
      cache: 'reload',
      width: 20,
      metadata: {
        retry: 2,
        flags: ['primary', null, true],
      },
      optional: undefined,
    });
    expect(resolved?.key).toBe(expectedKey);
  });

  test('URI source array 保留顺序并冻结 array、item 与 headers', () => {
    const source = [
      { uri: 'https://x/a.png', headers: { token: 'a' } },
      { uri: 'https://x/b.png', custom: { priority: 2 } },
    ];
    const resolved = resolveImageSource(source);
    const snapshot = resolved?.source as typeof source | undefined;

    expect(snapshot).toEqual(source);
    expect(snapshot).not.toBe(source);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot?.[0])).toBe(true);
    expect(Object.isFrozen(snapshot?.[0]?.headers)).toBe(true);
    expect(Object.isFrozen(snapshot?.[1]?.custom)).toBe(true);
    expect(resolved?.key).toBe(imageSourceKey(source));
  });

  test('本地 asset snapshot 保留有限正整数及对应 key', () => {
    expect(resolveImageSource(7)).toEqual({
      source: 7,
      key: imageSourceKey(7),
    });
  });
});
