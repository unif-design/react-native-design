import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { ReactElement } from 'react';

type RevealElementProps = {
  entering?: unknown;
  exiting?: unknown;
  style?: unknown;
  testID?: string;
  children?: unknown;
};

function loadReveal(reduced: boolean) {
  jest.doMock('../../../../src/theme', () => ({
    motion: { base: 200 },
    usePrefersReducedMotion: () => reduced,
  }));
  jest.doMock('react-native-reanimated', () => ({
    __esModule: true,
    default: { View: 'Animated.View' },
    FadeIn: {
      duration: (duration: number) => ({ animation: 'FadeIn', duration }),
    },
    FadeOut: {
      duration: (duration: number) => ({ animation: 'FadeOut', duration }),
    },
  }));

  return require('../../../../src/components/ui/Reveal/Reveal')
    .Reveal as typeof import('../../../../src/components/ui/Reveal/Reveal').Reveal;
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('../../../../src/theme');
  jest.dontMock('react-native-reanimated');
  jest.resetModules();
});

describe('Reveal native', () => {
  test('reduced motion 首次 render 不挂 entering / exiting 动画', () => {
    const Reveal = loadReveal(true);
    const element = Reveal({
      children: 'content',
      duration: 320,
      style: { flex: 1 },
      testID: 'native-reveal',
    }) as ReactElement<RevealElementProps>;

    expect(element.props).toMatchObject({
      entering: undefined,
      exiting: undefined,
      style: { flex: 1 },
      testID: 'native-reveal',
      children: 'content',
    });
  });

  test('未开启 reduced motion 时保留指定时长的 FadeIn / FadeOut', () => {
    const Reveal = loadReveal(false);
    const element = Reveal({
      children: 'content',
      duration: 320,
    }) as ReactElement<RevealElementProps>;

    expect(element.props.entering).toEqual({
      animation: 'FadeIn',
      duration: 320,
    });
    expect(element.props.exiting).toEqual({
      animation: 'FadeOut',
      duration: 320,
    });
  });
});
