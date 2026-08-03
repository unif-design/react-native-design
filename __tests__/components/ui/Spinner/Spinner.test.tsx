import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { ReactElement } from 'react';

type ElementProps = {
  'style'?: readonly unknown[];
  'testID'?: string;
  'accessible'?: boolean;
  'accessibilityElementsHidden'?: boolean;
  'importantForAccessibility'?: string;
  'aria-hidden'?: boolean;
  'children'?: ReactElement<ElementProps>;
};

function loadNativeSpinner() {
  const actualReact = jest.requireActual<typeof import('react')>('react');
  jest.doMock('react', () => ({
    ...actualReact,
    useEffect() {},
  }));
  jest.doMock('react-native', () => ({ View: 'View' }));
  jest.doMock('../../../../src/theme', () => ({
    r: (value: number) => value,
    useColors: () => ({ outline: 'outline', primary: 'primary' }),
  }));
  jest.doMock('react-native-reanimated', () => ({
    __esModule: true,
    default: { View: 'Animated.View' },
    cancelAnimation() {},
    Easing: { linear: 'linear' },
    ReduceMotion: { Never: 'never' },
    useAnimatedStyle: () => ({
      transform: [{ rotate: '0deg' }],
    }),
    useSharedValue: () => ({ value: 0 }),
    withRepeat: () => 0,
    withTiming: () => 0,
  }));

  return require('../../../../src/components/ui/Spinner/Spinner')
    .Spinner as typeof import('../../../../src/components/ui/Spinner/Spinner').Spinner;
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.dontMock('../../../../src/theme');
  jest.dontMock('react-native-reanimated');
  jest.resetModules();
});

describe('Spinner native structure', () => {
  test('caller layout/transform 只在 outer，固定 ring 与 rotate 只在 inner', () => {
    const Spinner = loadNativeSpinner();
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
      testID: 'native-spinner',
    }) as ReactElement<ElementProps>;
    const inner = outer.props.children;

    expect(outer.type).toBe('View');
    expect(outer.props.style).toEqual([
      { width: 24, height: 24 },
      callerStyle,
      { alignItems: 'center', justifyContent: 'center' },
    ]);
    expect(outer.props).toMatchObject({
      'testID': 'native-spinner',
      'accessible': false,
      'accessibilityElementsHidden': true,
      'importantForAccessibility': 'no-hide-descendants',
      'aria-hidden': true,
    });

    expect(inner?.type).toBe('Animated.View');
    expect(inner?.props.style).toEqual([
      {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: 'outline',
        borderTopColor: 'primary',
      },
      {
        transform: [{ rotate: '0deg' }],
      },
    ]);
    expect(inner?.props.testID).toBeUndefined();
  });
});
