import { describe, expect, test } from '@jest/globals';
import React from 'react';
import {
  classifyNavBarSlot,
  isNavBarAction,
} from '../../../../src/components/ui/NavBar/isSlot';

const onPress = () => {};

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
});
