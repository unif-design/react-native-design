import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { ReactElement } from 'react';

type AvatarElementProps = {
  style?: unknown[];
};

function loadAvatar() {
  jest.doMock('react-native', () => ({
    StyleSheet: { create: (styles: object) => styles },
    Text: 'Text',
    View: 'View',
  }));
  jest.doMock('../../../../src/theme', () => ({
    avatar: { xs: 18, sm: 28, md: 32, lg: 40, xl: 56 },
    fw: { semi: '600' },
    radius: { xs: 4, sm: 6, md: 8 },
    rf: (value: number) => value,
    scaleFontMetric: (value: number) => value,
    useColors: () => ({
      foreground: 'neutral-fg',
      info: 'info-bg',
      onInfo: 'info-fg',
      onPrimary: 'brand-fg',
      primary: 'brand-bg',
      primaryContainer: 'soft-bg',
      surfaceContainerHighest: 'neutral-bg',
    }),
    useFontScale: () => 1,
  }));

  return require('../../../../src/components/ui/Avatar/Avatar')
    .Avatar as typeof import('../../../../src/components/ui/Avatar/Avatar').Avatar;
}

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react-native');
  jest.dontMock('../../../../src/theme');
  jest.resetModules();
});

describe('Avatar shape', () => {
  test('未传 shape 时保留 md 圆形默认视觉', () => {
    const Avatar = loadAvatar();
    const element = Avatar({ label: '王' }) as ReactElement<AvatarElementProps>;

    expect(element.props.style).toContainEqual({
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'neutral-bg',
    });
  });

  test('square 在 lg 档使用 radius.sm 而非半径圆', () => {
    const Avatar = loadAvatar();
    const squareProps = {
      label: '王',
      shape: 'square',
      size: 'lg',
    } as unknown as Parameters<typeof Avatar>[0];
    const element = Avatar(squareProps) as ReactElement<AvatarElementProps>;

    expect(element.props.style).toContainEqual({
      width: 40,
      height: 40,
      borderRadius: 6,
      backgroundColor: 'neutral-bg',
    });
  });
});
