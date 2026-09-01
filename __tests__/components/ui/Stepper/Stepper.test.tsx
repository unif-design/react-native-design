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
  children?: ReactElement<ElementProps> | ReactElement<ElementProps>[] | string;
  hitSlop?: unknown;
  style?: unknown;
  accessibilityValue?: { now?: number };
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
  numberOfLines?: number;
};

function loadStepper() {
  const actualReact = jest.requireActual<typeof import('react')>('react');
  jest.doMock('react', () => ({ ...actualReact, useEffect() {} }));
  jest.doMock('react-native', () => ({ Text: 'Text', View: 'View' }));
  jest.doMock('../../../../src/theme', () => ({
    fixed: { hitTarget: 44 },
    pressedOpacity: 0.7,
    scaleFontMetric: (value: number) => value,
    useFontScale: () => 1,
    useThemedStyles: () => ({
      wrap: 'wrap',
      actionFrame: 'actionFrame',
      valueFrame: 'valueFrame',
      cell: 'cell',
      btnLeft: 'btnLeft',
      btnRight: 'btnRight',
      btnText: 'btnText',
      valueText: 'valueText',
    }),
  }));
  jest.doMock('../../../../src/utils/logger', () => ({
    createLogger: () => ({ warn() {} }),
  }));
  jest.doMock('../../../../src/components/ui/Stepper/styles', () => ({
    makeStyles: () => ({}),
    sizingFor: () => ({ h: 24, btn: 24, w: 40, fs: 11 }),
  }));
  jest.doMock('../../../../src/components/ui/Stepper/StepperPressable', () => ({
    StepperPressable: 'StepperPressable',
  }));

  return require('../../../../src/components/ui/Stepper/Stepper')
    .Stepper as typeof import('../../../../src/components/ui/Stepper/Stepper').Stepper;
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.dontMock('../../../../src/theme');
  jest.dontMock('../../../../src/utils/logger');
  jest.dontMock('../../../../src/components/ui/Stepper/styles');
  jest.dontMock('../../../../src/components/ui/Stepper/StepperPressable');
  jest.resetModules();
});

describe('Stepper public display behavior', () => {
  test('xs 显示格式化后的安全值，且三块 dense frame 不注入重叠 hitSlop', () => {
    const Stepper = loadStepper();
    const root = Stepper({
      value: 8,
      max: 4,
      onChange: () => {},
      accessibilityLabel: '整箱数量',
      size: 'xs',
      formatValue: (value) => `${value} 箱`,
    }) as ReactElement<ElementProps>;
    const children = root.props.children as ReactElement<ElementProps>[];
    const decrement = children[0]!;
    const valueFrame = children[1]!;
    const increment = children[2]!;
    const valueVisual = valueFrame.props.children as ReactElement<ElementProps>;
    const valueText = valueVisual.props.children as ReactElement<ElementProps>;

    expect(valueText.props.children).toBe('4 箱');
    expect(valueText.props).toMatchObject({
      adjustsFontSizeToFit: true,
      minimumFontScale: 0.75,
      numberOfLines: 1,
    });
    expect(valueFrame.props.accessibilityValue?.now).toBe(4);
    expect(decrement.props).not.toHaveProperty('hitSlop');
    expect(
      (decrement.props.style as (state: { pressed: boolean }) => unknown[])({
        pressed: false,
      })[1]
    ).toEqual({ width: 24, height: 44, alignItems: 'flex-end' });
    expect(valueFrame.props.style).toEqual([
      'valueFrame',
      { width: 40, height: 44 },
    ]);
    expect(
      (increment.props.style as (state: { pressed: boolean }) => unknown[])({
        pressed: false,
      })[1]
    ).toEqual({ width: 24, height: 44, alignItems: 'flex-start' });
    expect(root.props.style).toBe('wrap');
  });
});
