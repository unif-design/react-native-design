import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { ReactElement } from 'react';

type Effect = () => void | (() => void);
type ElementProps = {
  'ref'?: { current: unknown };
  'style'?: readonly unknown[];
  'testID'?: string;
  'accessible'?: boolean;
  'accessibilityElementsHidden'?: boolean;
  'importantForAccessibility'?: string;
  'aria-hidden'?: boolean;
  'children'?: ReactElement<ElementProps>;
};

function loadWebSpinner() {
  const effects: Effect[] = [];
  const node = { style: {} as Record<string, string> };
  const ringRef = { current: node };
  const actualReact = jest.requireActual<typeof import('react')>('react');

  jest.doMock('react', () => ({
    ...actualReact,
    useEffect: (effect: Effect) => {
      effects.push(effect);
    },
    useRef: () => ringRef,
  }));
  jest.doMock('react-native', () => ({ View: 'View' }));
  jest.doMock('../../../../src/theme', () => ({
    r: (value: number) => value,
    useColors: () => ({ outline: 'outline', primary: 'primary' }),
  }));

  const Spinner = require('../../../../src/components/ui/Spinner/Spinner.web')
    .Spinner as typeof import('../../../../src/components/ui/Spinner/Spinner.web').Spinner;
  return { Spinner, effects, node, ringRef };
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.dontMock('../../../../src/theme');
  jest.resetModules();
});

describe('Spinner Web structure', () => {
  test('outer 保留 caller transform，CSS animation ref 与固定 ring 只在 inner', () => {
    const { Spinner, effects, node, ringRef } = loadWebSpinner();
    const callerStyle = {
      width: 72,
      height: 48,
      alignItems: 'flex-start',
      justifyContent: 'flex-end',
      transform: [{ translateX: 4 }, { scale: 1.4 }],
    } as const;
    const outer = Spinner({
      size: 24,
      thickness: 3,
      style: callerStyle,
      testID: 'web-spinner',
    }) as ReactElement<ElementProps>;
    const inner = outer.props.children;

    expect(outer.type).toBe('View');
    expect(outer.props.ref).toBeUndefined();
    expect(outer.props.style).toEqual([
      { width: 24, height: 24 },
      callerStyle,
      { alignItems: 'center', justifyContent: 'center' },
    ]);
    expect(outer.props).toMatchObject({
      'testID': 'web-spinner',
      'accessible': false,
      'accessibilityElementsHidden': true,
      'importantForAccessibility': 'no-hide-descendants',
      'aria-hidden': true,
    });

    expect(inner?.type).toBe('View');
    expect(inner?.props.ref).toBe(ringRef);
    expect(inner?.props.style).toEqual([
      {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: 'outline',
        borderTopColor: 'primary',
      },
    ]);
    expect(inner?.props.testID).toBeUndefined();

    effects[0]?.();
    expect(node.style.animation).toBe(
      'unif-spinner-spin 900ms linear infinite'
    );
  });
});
