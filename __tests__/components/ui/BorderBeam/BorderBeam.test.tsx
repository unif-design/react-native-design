import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { ReactElement, ReactNode } from 'react';

type ElementProps = {
  'children'?: ReactNode;
  'pointerEvents'?: string;
  'testID'?: string;
  'accessibilityElementsHidden'?: boolean;
  'importantForAccessibility'?: string;
  'aria-hidden'?: boolean;
};

function loadBorderBeam() {
  const actualReact = jest.requireActual<typeof import('react')>('react');
  jest.doMock('react', () => ({
    ...actualReact,
    useEffect() {},
    useState: () => [{ width: 76, height: 76 }, jest.fn()],
  }));
  jest.doMock('react-native', () => ({
    StyleSheet: {
      absoluteFillObject: { position: 'absolute' },
      create: (value: unknown) => value,
    },
    View: 'View',
  }));
  jest.doMock('react-native-svg', () => ({
    __esModule: true,
    default: 'Svg',
    Rect: 'Rect',
  }));
  jest.doMock('react-native-reanimated', () => ({
    __esModule: true,
    default: { createAnimatedComponent: (component: unknown) => component },
    cancelAnimation() {},
    Easing: { linear: 'linear' },
    ReduceMotion: { System: 'system' },
    useAnimatedProps: () => ({ strokeDashoffset: 0 }),
    useSharedValue: () => ({ value: 0 }),
    withRepeat: () => 0,
    withTiming: () => 0,
  }));
  jest.doMock('../../../../src/theme', () => ({
    radius: { md: 12 },
    useColors: () => ({ primary: 'primary' }),
    usePrefersReducedMotion: () => false,
  }));

  return require('../../../../src/components/ui/BorderBeam/BorderBeam')
    .BorderBeam as typeof import('../../../../src/components/ui/BorderBeam/BorderBeam').BorderBeam;
}

function childrenOf(element: ReactElement<ElementProps>): ReactNode[] {
  const React = jest.requireActual<typeof import('react')>('react');
  return React.Children.toArray(element.props.children);
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.dontMock('react-native-svg');
  jest.dontMock('react-native-reanimated');
  jest.dontMock('../../../../src/theme');
  jest.resetModules();
});

describe('BorderBeam', () => {
  test('保留 children，并把流光视觉从交互和读屏树隐藏', () => {
    const BorderBeam = loadBorderBeam();
    const outer = BorderBeam({
      children: '内容',
      testID: 'upload-beam',
    }) as ReactElement<ElementProps>;
    const [content, visual] = childrenOf(outer) as [
      ReactNode,
      ReactElement<ElementProps>,
    ];

    expect(content).toBe('内容');
    expect(outer.props.testID).toBe('upload-beam');
    expect(visual.props).toMatchObject({
      'pointerEvents': 'none',
      'accessibilityElementsHidden': true,
      'importantForAccessibility': 'no-hide-descendants',
      'aria-hidden': true,
    });

    const [svg] = childrenOf(visual) as [ReactElement<ElementProps>];
    const layers = childrenOf(svg) as ReactElement<{
      strokeDasharray: [number, number];
      strokeOpacity: number;
    }>[];
    expect(layers).toHaveLength(4);
    expect(layers.map((layer) => layer.props.strokeOpacity)).toEqual([
      0.12, 0.24, 0.42, 0.88,
    ]);
    expect(layers.map((layer) => layer.props.strokeDasharray[0])).toEqual([
      40, 30, 20, 10,
    ]);
  });

  test('active=false 时不渲染装饰层', () => {
    const BorderBeam = loadBorderBeam();
    const outer = BorderBeam({
      children: '内容',
      active: false,
    }) as ReactElement<ElementProps>;

    expect(childrenOf(outer)).toEqual(['内容']);
  });
});
