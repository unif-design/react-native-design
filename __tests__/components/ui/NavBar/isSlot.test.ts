import { describe, expect, test } from '@jest/globals';
import React from 'react';
import {
  classifyNavBarSlot,
  isNavBarAction,
} from '../../../../src/components/ui/NavBar/isSlot';

const onPress = () => {};
const currentElementMarker = Symbol.for('react.transitional.element');

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
    const arrayNode = [0, React.createElement(React.Fragment, { key: 'node' })];

    expect(classifyNavBarSlot(0).kind).toBe('node');
    expect(classifyNavBarSlot(element).kind).toBe('node');
    expect(classifyNavBarSlot(arrayNode).kind).toBe('node');
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

  test('preserves React 19 broad node values without consuming them', () => {
    const generator = (function* (): Generator<React.ReactNode> {
      yield null;
      yield 0;
      yield false;
      yield 'generator node';
    })();
    const set = new Set<React.ReactNode>([null, undefined, false, 'set node']);
    const promise = Promise.resolve('deferred node');
    const nestedEmptyNodes: React.ReactNode[] = [
      null,
      undefined,
      false,
      [true, 0],
    ];

    expect(classifyNavBarSlot(1n).kind).toBe('node');
    expect(classifyNavBarSlot(set).kind).toBe('node');
    expect(classifyNavBarSlot(nestedEmptyNodes).kind).toBe('node');

    const generatorResult = classifyNavBarSlot(generator);
    const promiseResult = classifyNavBarSlot(promise);
    expect(generatorResult.kind).toBe('node');
    expect(promiseResult.kind).toBe('node');
    if (generatorResult.kind === 'node') {
      expect(generatorResult.node).toBe(generator);
      expect([...generator]).toEqual([null, 0, false, 'generator node']);
    }
    if (promiseResult.kind === 'node') {
      expect(promiseResult.node).toBe(promise);
    }
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
