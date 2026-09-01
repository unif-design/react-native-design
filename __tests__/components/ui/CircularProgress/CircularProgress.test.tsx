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
  'accessibilityLabel'?: string;
  'accessibilityRole'?: string;
  'accessibilityValue'?: {
    min: number;
    max: number;
    now: number;
    text: string;
  };
  'aria-hidden'?: boolean;
  'children'?: ReactNode;
  'strokeDasharray'?: number;
  'strokeDashoffset'?: number;
  'style'?: unknown;
};

function loadCircularProgress() {
  jest.doMock('react-native', () => ({ Text: 'Text', View: 'View' }));
  jest.doMock('react-native-svg', () => ({
    __esModule: true,
    default: 'Svg',
    Circle: 'Circle',
  }));
  jest.doMock('../../../../src/theme', () => ({
    r: (value: number) => value,
    type: { nano: 10 },
    useColors: () => ({
      foreground: 'foreground',
      outline: 'outline',
      primary: 'primary',
    }),
  }));

  return require('../../../../src/components/ui/CircularProgress/CircularProgress')
    .CircularProgress as typeof import('../../../../src/components/ui/CircularProgress/CircularProgress').CircularProgress;
}

function childrenOf(
  element: ReactElement<ElementProps>
): ReactElement<ElementProps>[] {
  const React = jest.requireActual<typeof import('react')>('react');
  return React.Children.toArray(
    element.props.children
  ) as ReactElement<ElementProps>[];
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react-native');
  jest.dontMock('react-native-svg');
  jest.dontMock('../../../../src/theme');
  jest.resetModules();
});

describe('CircularProgress', () => {
  test('默认只显示确定进度圆环并暴露 progressbar 语义', () => {
    const CircularProgress = loadCircularProgress();
    const outer = CircularProgress({
      value: 0.375,
      accessibilityLabel: '图片上传进度',
      testID: 'upload-progress',
    }) as ReactElement<ElementProps>;

    expect(outer.type).toBe('View');
    expect(outer.props).toMatchObject({
      accessibilityLabel: '图片上传进度',
      accessibilityRole: 'progressbar',
      accessibilityValue: { min: 0, max: 100, now: 38, text: '38%' },
    });

    const [visual] = childrenOf(outer);
    const [svg] = childrenOf(visual!);
    const [track, progress] = childrenOf(svg!);
    expect(track?.type).toBe('Circle');
    expect(progress?.type).toBe('Circle');
    expect(progress?.props.strokeDasharray).toBeCloseTo(2 * Math.PI * 15);
    expect(progress?.props.strokeDashoffset).toBeCloseTo(
      2 * Math.PI * 15 * 0.625
    );
    expect(childrenOf(visual!)).toHaveLength(1);
  });

  test('showLabel 显式开启时中央显示取整百分比且视觉层不重复朗读', () => {
    const CircularProgress = loadCircularProgress();
    const outer = CircularProgress({
      value: 0.421,
      showLabel: true,
    }) as ReactElement<ElementProps>;
    const [visual] = childrenOf(outer);
    const [, label] = childrenOf(visual!);

    expect(label?.type).toBe('Text');
    expect(label?.props.children).toBe('42%');
    expect(visual?.props['aria-hidden']).toBe(true);
  });
});
