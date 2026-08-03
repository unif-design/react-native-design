import { describe, expect, test } from '@jest/globals';
import React from 'react';
import { Text } from 'react-native';
import {
  classifyNavBarSlot,
  isNavBarAction,
} from '../../../../src/components/ui/NavBar/isSlot';

const onPress = () => {};
const currentElementMarker = Symbol.for('react.transitional.element');

function expectTextNode(node: React.ReactNode, value: string): void {
  expect(React.isValidElement(node)).toBe(true);
  if (!React.isValidElement(node)) return;
  expect(node.type).toBe(Text);
  expect(node.props).toMatchObject({ children: value });
}

function expectTextNodeKey(
  node: React.ReactNode,
  value: string,
  key: string
): void {
  expectTextNode(node, value);
  if (!React.isValidElement(node)) return;
  expect(node.key).toBe(key);
}

type SyncThenable = {
  then(
    resolve: (value: unknown) => void,
    reject?: (reason: unknown) => void
  ): void;
};

async function expectMappedThenableSettlesNull(
  result: ReturnType<typeof classifyNavBarSlot>
): Promise<void> {
  expect(result.kind).toBe('node');
  if (result.kind !== 'node') return;

  const observation: {
    status: 'pending' | 'fulfilled' | 'rejected';
    value?: unknown;
  } = { status: 'pending' };
  (result.node as Promise<React.ReactNode>).then(
    (value) => {
      observation.status = 'fulfilled';
      observation.value = value;
    },
    (reason: unknown) => {
      observation.status = 'rejected';
      observation.value = reason;
    }
  );

  // 同步 thenable 的依赖图已在 classify 返回前完整建立；这里只让已确定的
  // Promise reaction 执行，不靠 timeout 猜测 pending 状态。
  await Promise.resolve();
  expect(observation).toEqual({ status: 'fulfilled', value: null });
}

// RN 不公开 portal creator；此 fixture 仅用 React 的公开 Children 行为刻画 portal
// 边界，production 不读取 `$$typeof` 或 renderer internals。
const portal = {
  $$typeof: Symbol.for('react.portal'),
  key: null,
  children: 'portal child',
  containerInfo: {},
  implementation: null,
} as unknown as React.ReactPortal;

describe('NavBar slot classification', () => {
  test('accepts only generated icon names for action objects', () => {
    expect(
      isNavBarAction({
        icon: 'arrow-left',
        onPress,
        accessibilityLabel: '返回',
      })
    ).toBe(true);
    expect(
      isNavBarAction({
        icon: 'not-generated-icon',
        onPress,
        accessibilityLabel: '伪图标',
      })
    ).toBe(false);
  });

  test.each([
    [{ icon: 'arrow-left' }, '缺 handler'],
    [{ icon: 'arrow-left', onPress }, '缺可访问名称'],
    [
      { icon: 'arrow-left', onPress, accessibilityLabel: '   ' },
      '空可访问名称',
    ],
    [
      { $$typeof: Symbol.for('react.element') },
      '伪造 React 标记的 plain object',
    ],
  ])('classifies %s as invalid', (slot, _description) => {
    expect(classifyNavBarSlot(slot).kind).toBe('invalid');
  });

  test('classifies a complete action object as an action', () => {
    expect(
      classifyNavBarSlot({
        icon: 'arrow-left',
        onPress,
        accessibilityLabel: '返回',
      }).kind
    ).toBe('action');
  });

  test('keeps renderable React nodes instead of treating zero as empty', () => {
    const element = React.createElement(React.Fragment, null, '只读');

    const zero = classifyNavBarSlot(0);
    expect(zero.kind).toBe('node');
    if (zero.kind === 'node') expectTextNode(zero.node, '0');
    expect(classifyNavBarSlot(element).kind).toBe('node');
  });

  test.each([
    ['只读', '只读'],
    [0, '0'],
    [12n, '12'],
  ])(
    'wraps top-level primitive display node %s in native Text',
    (node, text) => {
      const result = classifyNavBarSlot(node);

      expect(result.kind).toBe('node');
      if (result.kind === 'node') expectTextNode(result.node, text);
    }
  );

  test('wraps primitive leaves in arrays and normalized iterables', () => {
    const generator = (function* (): Generator<React.ReactNode> {
      yield 'generator';
      yield 2n;
    })();
    const result = classifyNavBarSlot([1, ['nested'], generator]);

    expect(result.kind).toBe('node');
    if (result.kind !== 'node' || !Array.isArray(result.node)) return;
    expectTextNode(result.node[0], '1');
    const nested = result.node[1];
    expect(Array.isArray(nested)).toBe(true);
    if (Array.isArray(nested)) expectTextNode(nested[0], 'nested');
    const iterable = result.node[2];
    expect(Array.isArray(iterable)).toBe(true);
    if (Array.isArray(iterable)) {
      expectTextNode(iterable[0], 'generator');
      expectTextNode(iterable[1], '2');
    }
  });

  test('recursively wraps Fragment primitives while preserving Fragment semantics', () => {
    const fragment = React.createElement(
      React.Fragment,
      { key: 'outer' },
      'fragment',
      React.createElement(React.Fragment, { key: 'inner' }, ['nested', 2n])
    );

    const result = classifyNavBarSlot(fragment);

    expect(result.kind).toBe('node');
    if (result.kind !== 'node' || !React.isValidElement(result.node)) return;
    expect(result.node.type).toBe(React.Fragment);
    expect(result.node.key).toBe('outer');
    const children = (result.node.props as { children?: React.ReactNode })
      .children;
    expect(Array.isArray(children)).toBe(true);
    if (!Array.isArray(children)) return;
    expectTextNodeKey(children[0], 'fragment', 'slot.fragment.0');
    const nestedFragment = children[1];
    expect(React.isValidElement(nestedFragment)).toBe(true);
    if (!React.isValidElement(nestedFragment)) return;
    expect(nestedFragment.type).toBe(React.Fragment);
    expect(nestedFragment.key).toBe('inner');
    const nestedChildren = (
      nestedFragment.props as { children?: React.ReactNode }
    ).children;
    expect(Array.isArray(nestedChildren)).toBe(true);
    if (!Array.isArray(nestedChildren)) return;
    expectTextNode(nestedChildren[0], 'nested');
    expectTextNode(nestedChildren[1], '2');
  });

  test('keeps primitive wrapper keys stable across repeated normalization', () => {
    const first = classifyNavBarSlot([0, ['nested', 1n]]);
    const second = classifyNavBarSlot([0, ['nested', 1n]]);

    for (const result of [first, second]) {
      expect(result.kind).toBe('node');
      if (result.kind !== 'node' || !Array.isArray(result.node)) continue;
      expectTextNodeKey(result.node[0], '0', 'slot.0');
      const nested = result.node[1];
      expect(Array.isArray(nested)).toBe(true);
      if (!Array.isArray(nested)) continue;
      expectTextNodeKey(nested[0], 'nested', 'slot.1.0');
      expectTextNodeKey(nested[1], '1', 'slot.1.1');
    }
  });

  test('assigns unique path keys to nested primitive siblings', () => {
    const result = classifyNavBarSlot([
      ['left', 'right'],
      ['left', 'right'],
    ]);

    expect(result.kind).toBe('node');
    if (result.kind !== 'node' || !Array.isArray(result.node)) return;
    const first = result.node[0];
    const second = result.node[1];
    expect(Array.isArray(first)).toBe(true);
    expect(Array.isArray(second)).toBe(true);
    if (!Array.isArray(first) || !Array.isArray(second)) return;

    const nodes = [...first, ...second];
    const keys = nodes.map((node) =>
      React.isValidElement(node) ? node.key : null
    );
    expect(keys).toEqual(['slot.0.0', 'slot.0.1', 'slot.1.0', 'slot.1.1']);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('treats only React intrinsic non-render values as empty', () => {
    expect(classifyNavBarSlot(undefined).kind).toBe('empty');
    expect(classifyNavBarSlot(null).kind).toBe('empty');
    expect(classifyNavBarSlot(false).kind).toBe('empty');
  });

  test('rejects a marker-only React 19 element-shaped object', () => {
    const malformed = { $$typeof: currentElementMarker };

    // React public API confirms the marker alone passes its shallow element test.
    expect(React.isValidElement(malformed)).toBe(true);
    expect(classifyNavBarSlot(malformed).kind).toBe('invalid');
  });

  test('requires own type and props on React 19 element-shaped objects', () => {
    const inheritedElement = Object.create({ type: 'View', props: {} }) as {
      $$typeof: symbol;
    };
    inheritedElement.$$typeof = currentElementMarker;

    expect(React.isValidElement(inheritedElement)).toBe(true);
    expect(classifyNavBarSlot(inheritedElement).kind).toBe('invalid');
  });

  test('normalizes one-shot iterables into an equivalent renderable array', () => {
    const generator = (function* (): Generator<React.ReactNode> {
      yield null;
      yield 0;
      yield false;
      yield 'generator node';
    })();
    const promise = Promise.resolve('deferred node');

    const generatorResult = classifyNavBarSlot(generator);
    const promiseResult = classifyNavBarSlot(promise);
    expect(generatorResult.kind).toBe('node');
    expect(promiseResult.kind).toBe('node');
    if (generatorResult.kind === 'node') {
      expect(Array.isArray(generatorResult.node)).toBe(true);
      if (Array.isArray(generatorResult.node)) {
        expect(generatorResult.node[0]).toBeNull();
        expectTextNode(generatorResult.node[1], '0');
        expect(generatorResult.node[2]).toBe(false);
        expectTextNode(generatorResult.node[3], 'generator node');
      }
      expect(generatorResult.node).not.toBe(generator);
      expect([...generator]).toEqual([]);
    }
    if (promiseResult.kind === 'node') {
      expect(promiseResult.node).not.toBe(promise);
    }
  });

  test('normalizes a thenable primitive once and reuses the mapped thenable', async () => {
    const promise = Promise.resolve('deferred primitive');

    const first = classifyNavBarSlot(promise);
    const second = classifyNavBarSlot(promise);

    expect(first.kind).toBe('node');
    expect(second.kind).toBe('node');
    if (first.kind !== 'node' || second.kind !== 'node') return;
    expect(second.node).toBe(first.node);
    const resolved = await (first.node as Promise<React.ReactNode>);
    expectTextNode(resolved, 'deferred primitive');
  });

  test('fails closed when a thenable resolves to an invalid node', async () => {
    const invalid = Promise.resolve({ plain: 'object' });
    const result = classifyNavBarSlot(invalid);

    expect(result.kind).toBe('node');
    if (result.kind !== 'node') return;
    await expect(result.node as Promise<React.ReactNode>).resolves.toBeNull();
  });

  test('fails closed when a synchronous thenable resolves to itself', async () => {
    const selfThenable = {
      then(resolve: (value: unknown) => void) {
        resolve(selfThenable);
      },
    };
    const result = classifyNavBarSlot(selfThenable);

    expect(result.kind).toBe('node');
    if (result.kind !== 'node') return;
    await expect(result.node as Promise<React.ReactNode>).resolves.toBeNull();
  });

  test('fails closed for a two-record A to B to A thenable cycle', async () => {
    let a!: SyncThenable;
    let b!: SyncThenable;
    a = { then: (resolve) => resolve(b) };
    b = { then: (resolve) => resolve(a) };

    await expectMappedThenableSettlesNull(classifyNavBarSlot(a));
  });

  test('fails closed for a three-record A to B to C to A thenable cycle', async () => {
    let a!: SyncThenable;
    let b!: SyncThenable;
    let c!: SyncThenable;
    a = { then: (resolve) => resolve(b) };
    b = { then: (resolve) => resolve(c) };
    c = { then: (resolve) => resolve(a) };

    await expectMappedThenableSettlesNull(classifyNavBarSlot(a));
  });

  test('fails closed when a thenable resolves to an Array containing itself', async () => {
    let selfInArray!: SyncThenable;
    selfInArray = { then: (resolve) => resolve([selfInArray]) };

    await expectMappedThenableSettlesNull(classifyNavBarSlot(selfInArray));
  });

  test('fails closed when a thenable resolves to a Fragment containing itself', async () => {
    let selfInFragment!: SyncThenable;
    selfInFragment = {
      then: (resolve) =>
        resolve(
          React.createElement(
            React.Fragment,
            null,
            selfInFragment as unknown as React.ReactNode
          )
        ),
    };

    await expectMappedThenableSettlesNull(classifyNavBarSlot(selfInFragment));
  });

  test('preserves acyclic thenable chains and nested collections', async () => {
    const leaf: SyncThenable = {
      then: (resolve) => resolve('leaf'),
    };
    const chain: SyncThenable = {
      then: (resolve) => resolve(leaf),
    };
    const collection: SyncThenable = {
      then: (resolve) =>
        resolve([
          leaf,
          React.createElement(React.Fragment, null, 'fragment leaf'),
        ]),
    };

    const chainResult = classifyNavBarSlot(chain);
    expect(chainResult.kind).toBe('node');
    if (chainResult.kind === 'node') {
      expectTextNode(
        await (chainResult.node as Promise<React.ReactNode>),
        'leaf'
      );
    }

    const collectionResult = classifyNavBarSlot(collection);
    expect(collectionResult.kind).toBe('node');
    if (collectionResult.kind !== 'node') return;
    const resolved = await (collectionResult.node as Promise<React.ReactNode>);
    expect(Array.isArray(resolved)).toBe(true);
    if (!Array.isArray(resolved)) return;
    expectTextNode(await (resolved[0] as Promise<React.ReactNode>), 'leaf');
    const fragment = resolved[1];
    expect(React.isValidElement(fragment)).toBe(true);
    if (React.isValidElement(fragment)) {
      expect(fragment.type).toBe(React.Fragment);
      expectTextNode(
        (fragment.props as { children?: React.ReactNode }).children,
        'fragment leaf'
      );
    }
  });

  test('preserves a thenable rejection reason', async () => {
    const reason = new Error('deferred failure');
    const rejected = Promise.reject(reason);
    const result = classifyNavBarSlot(rejected);

    expect(result.kind).toBe('node');
    if (result.kind !== 'node') return;
    await expect(result.node as Promise<React.ReactNode>).rejects.toBe(reason);
  });

  test('normalizes nested legal ReactNode collections', () => {
    const promise = Promise.resolve('deferred node');
    const element = React.createElement(React.Fragment, null, 'element node');
    const nested = new Set<React.ReactNode>([
      1n,
      promise,
      element,
      portal,
      null,
      [undefined, false, 'nested node'],
    ]);
    const result = classifyNavBarSlot(nested);

    expect(result.kind).toBe('node');
    if (result.kind === 'node') {
      expect(Array.isArray(result.node)).toBe(true);
      if (Array.isArray(result.node)) {
        expectTextNode(result.node[0], '1');
        expect(result.node[1]).not.toBe(promise);
        expect(result.node[2]).not.toBe(element);
        expect(React.isValidElement(result.node[2])).toBe(true);
        if (React.isValidElement(result.node[2])) {
          expect(result.node[2].type).toBe(React.Fragment);
          expectTextNode(
            (result.node[2].props as { children?: React.ReactNode }).children,
            'element node'
          );
        }
        expect(result.node[3]).toBe(portal);
        expect(result.node[4]).toBeNull();
        const nestedNodes = result.node[5];
        expect(Array.isArray(nestedNodes)).toBe(true);
        if (Array.isArray(nestedNodes)) {
          expect(nestedNodes[0]).toBeUndefined();
          expect(nestedNodes[1]).toBe(false);
          expectTextNode(nestedNodes[2], 'nested node');
        }
      }
      expect(result.node).not.toBe(nested);
    }
  });

  test('validates Array and Iterable hybrids before treating them as thenables', () => {
    const arrayThenable = Object.assign([{}], { then: () => {} });
    const iterableThenable = {
      then: () => {},
      *[Symbol.iterator](): Generator<unknown> {
        yield {};
      },
    };

    expect(classifyNavBarSlot(arrayThenable).kind).toBe('invalid');
    expect(classifyNavBarSlot(iterableThenable).kind).toBe('invalid');
  });

  test('rejects callable thenables and iterables outside the ReactNode object boundary', () => {
    const callableThenable = Object.assign(() => {}, { then: () => {} });
    const callableIterable = Object.assign(() => {}, {
      *[Symbol.iterator](): Generator<React.ReactNode> {
        yield 'not a ReactNode iterable';
      },
    });

    expect(classifyNavBarSlot(callableThenable).kind).toBe('invalid');
    expect(classifyNavBarSlot(callableIterable).kind).toBe('invalid');
  });

  test('accepts a Promise when a non-function iterator property is incidental', async () => {
    const promise = Object.assign(Promise.resolve('deferred node'), {
      [Symbol.iterator]: 1,
    });
    const result = classifyNavBarSlot(promise);

    expect(result.kind).toBe('node');
    if (result.kind === 'node') {
      expect(result.node).not.toBe(promise);
      expectTextNode(
        await (result.node as Promise<React.ReactNode>),
        'deferred node'
      );
    }
  });

  test.each([
    [[{}], 'array plain object'],
    [new Set([{}]), 'Set plain object'],
    [{ [Symbol.iterator]: () => 123 }, 'bad iterator factory'],
    [
      {
        [Symbol.iterator]: () => ({
          next() {
            throw new Error('iterator failure');
          },
        }),
      },
      'throwing iterator',
    ],
  ])('rejects %s from an untyped iterable boundary', (slot, _description) => {
    expect(classifyNavBarSlot(slot).kind).toBe('invalid');
  });

  test('rejects self-referential collections instead of recursing forever', () => {
    const cycle: unknown[] = [];
    cycle.push(cycle);

    expect(classifyNavBarSlot(cycle).kind).toBe('invalid');
  });

  test('closes an iterator when a child fails validation', () => {
    let finalized = false;
    function* invalidChildGenerator(): Generator<unknown> {
      try {
        yield {};
      } finally {
        finalized = true;
      }
    }

    expect(classifyNavBarSlot(invalidChildGenerator()).kind).toBe('invalid');
    expect(finalized).toBe(true);
  });

  test('uses Iterator protocol ToBoolean semantics for done', () => {
    const iterable = {
      [Symbol.iterator]: () => ({
        next: () => ({ done: 1, value: {} }),
      }),
    };

    expect(classifyNavBarSlot(iterable)).toEqual({ kind: 'node', node: [] });
  });

  test('accepts portals only when React public Children treats them as a child', () => {
    expect(React.Children.count(portal)).toBe(1);
    expect(classifyNavBarSlot(portal).kind).toBe('node');
  });

  test('rejects a marker-only portal even when React Children counts it', () => {
    const markerOnlyPortal = {
      $$typeof: Symbol.for('react.portal'),
    } as unknown as React.ReactPortal;

    expect(React.Children.count(markerOnlyPortal)).toBe(1);
    expect(classifyNavBarSlot(markerOnlyPortal).kind).toBe('invalid');
  });
});
