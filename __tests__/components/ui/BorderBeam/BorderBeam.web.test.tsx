import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';

type Effect = () => void | (() => void);

function loadWebBorderBeam() {
  const effects: Effect[] = [];
  const styles = Array.from({ length: 4 }, () => ({
    animation: '',
    setProperty: jest.fn(),
  }));
  const rectRefs = { current: styles.map((style) => ({ style })) };
  const actualReact = jest.requireActual<typeof import('react')>('react');
  jest.doMock('react', () => ({
    ...actualReact,
    useEffect: (effect: Effect) => effects.push(effect),
    useRef: () => rectRefs,
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
  jest.doMock('../../../../src/theme', () => ({
    radius: { md: 12 },
    useColors: () => ({ primary: 'primary' }),
    usePrefersReducedMotion: () => false,
  }));

  const BorderBeam =
    require('../../../../src/components/ui/BorderBeam/BorderBeam.web')
      .BorderBeam as typeof import('../../../../src/components/ui/BorderBeam/BorderBeam.web').BorderBeam;
  return { BorderBeam, effects, styles };
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.dontMock('react-native-svg');
  jest.dontMock('../../../../src/theme');
  jest.resetModules();
});

describe('BorderBeam web', () => {
  test('用默认节奏的 CSS keyframes 驱动流光，不在 JS 帧循环中更新', () => {
    const { BorderBeam, effects, styles } = loadWebBorderBeam();

    BorderBeam({ children: '内容' });
    effects.forEach((effect) => effect());

    styles.forEach((style) => {
      expect(style.setProperty).toHaveBeenCalledWith(
        '--unif-border-beam-path',
        expect.stringMatching(/px$/)
      );
      expect(style.animation).toBe(
        'unif-border-beam-flow 2400ms linear infinite'
      );
    });
  });

  test('调用方可以覆盖流光时长', () => {
    const { BorderBeam, effects, styles } = loadWebBorderBeam();

    BorderBeam({ children: '内容', duration: 1800 });
    effects.forEach((effect) => effect());

    styles.forEach((style) => {
      expect(style.animation).toBe(
        'unif-border-beam-flow 1800ms linear infinite'
      );
    });
  });
});
