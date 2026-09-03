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
  const style = {
    animation: '',
    setProperty: jest.fn(),
  };
  const rectRef = { current: { style } };
  const actualReact = jest.requireActual<typeof import('react')>('react');
  jest.doMock('react', () => ({
    ...actualReact,
    useEffect: (effect: Effect) => effects.push(effect),
    useRef: () => rectRef,
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
  return { BorderBeam, effects, style };
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
  test('用 CSS keyframes 驱动流光，不在 JS 帧循环中更新', () => {
    const { BorderBeam, effects, style } = loadWebBorderBeam();

    BorderBeam({ children: '内容', duration: 2400 });
    effects.forEach((effect) => effect());

    expect(style.setProperty).toHaveBeenCalledWith(
      '--unif-border-beam-path',
      expect.stringMatching(/px$/)
    );
    expect(style.animation).toBe(
      'unif-border-beam-flow 2400ms linear infinite'
    );
  });
});
