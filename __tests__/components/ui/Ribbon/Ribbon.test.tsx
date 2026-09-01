import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import React, { type ReactElement } from 'react';

type ElementProps = {
  'children'?: ReactElement<ElementProps> | ReactElement<ElementProps>[] | null;
  'pointerEvents'?: string;
  'style'?: unknown;
  'accessible'?: boolean;
  'accessibilityElementsHidden'?: boolean;
  'importantForAccessibility'?: string;
  'aria-hidden'?: boolean;
  'accessibilityLabel'?: string;
};

function loadRibbon() {
  const paletteFor = jest.fn((_tone: string, _colors: object) => ({
    bg: 'danger-bg',
    fg: 'danger-fg',
    fold: 'danger-fold',
  }));
  jest.doMock('react-native', () => ({ Text: 'Text', View: 'View' }));
  jest.doMock('../../../../src/theme', () => ({
    r: (value: number) => value,
    space: { '3': 8 },
    type: { micro: 11 },
    scaleFontMetric: (value: number) => value,
    useColors: () => ({}),
    useFontScale: () => 1,
    useThemedStyles: () => ({
      root: 'root',
      overlay: 'overlay',
      bar: 'bar',
      text: 'text',
      fold: 'fold',
    }),
  }));
  jest.doMock('../../../../src/components/ui/Ribbon/styles', () => ({
    makeStyles: () => ({}),
    paletteFor,
  }));

  return {
    Ribbon: require('../../../../src/components/ui/Ribbon/Ribbon')
      .Ribbon as typeof import('../../../../src/components/ui/Ribbon/Ribbon').Ribbon,
    paletteFor,
  };
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react-native');
  jest.dontMock('../../../../src/theme');
  jest.dontMock('../../../../src/components/ui/Ribbon/styles');
  jest.resetModules();
});

describe('Ribbon structure', () => {
  test('保留 child 交互树，右上 overlay 不拦截事件且视觉子树不重复播报', () => {
    const { Ribbon, paletteFor } = loadRibbon();
    const child = React.createElement('Child', { testID: 'card' });
    const root = Ribbon({
      label: '未匹配',
      tone: 'danger',
      accessibilityLabel: '该商品未匹配',
      children: child,
    }) as ReactElement<ElementProps>;
    const children = root.props.children as ReactElement<ElementProps>[];
    const renderedChild = children[0]!;
    const overlay = children[1]!;
    const overlayChildren = overlay.props
      .children as ReactElement<ElementProps>[];
    const visual = overlayChildren[0]!;
    const a11yText = overlayChildren[1]!;
    const visualChildren = visual.props
      .children as ReactElement<ElementProps>[];
    const bar = visualChildren[0]!;
    const fold = visualChildren[1]!;
    const visibleLabel = bar.props.children as ReactElement<ElementProps>;

    expect(renderedChild).toBe(child);
    expect(overlay.props.pointerEvents).toBe('none');
    expect(overlay.props.style).toEqual({
      position: 'absolute',
      top: 8,
      right: 0,
      zIndex: 1,
      alignItems: 'flex-end',
    });
    expect(paletteFor).toHaveBeenCalledWith('danger', {});
    expect(bar.props.style).toEqual([
      'bar',
      { height: 20 },
      { backgroundColor: 'danger-bg' },
    ]);
    expect(visibleLabel.props.style).toEqual([
      'text',
      { color: 'danger-fg', fontSize: 11 },
    ]);
    expect(fold.props.style).toEqual([
      'fold',
      { width: 0, height: 0, borderWidth: 3 },
      {
        borderTopColor: 'danger-fold',
        borderLeftColor: 'danger-fold',
      },
    ]);
    expect(visibleLabel.props.children).toBe('未匹配');
    expect(visual.props).toMatchObject({
      'accessible': false,
      'accessibilityElementsHidden': true,
      'importantForAccessibility': 'no-hide-descendants',
      'aria-hidden': true,
    });
    expect(a11yText.props.accessibilityLabel).toBe('该商品未匹配');
  });

  test('未传读屏文案时不会从视觉 label 自动派生第二份语义', () => {
    const { Ribbon, paletteFor } = loadRibbon();
    const root = Ribbon({
      label: '未匹配',
      children: React.createElement('Child'),
    }) as ReactElement<ElementProps>;
    const children = root.props.children as ReactElement<ElementProps>[];
    const overlay = children[1]!;
    const overlayChildren = overlay.props.children as [
      ReactElement<ElementProps>,
      null,
    ];
    const a11yText = overlayChildren[1];

    expect(a11yText).toBeNull();
    expect(paletteFor).toHaveBeenCalledWith('brand', {});
  });
});
