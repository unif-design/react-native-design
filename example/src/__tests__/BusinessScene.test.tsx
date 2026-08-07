import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  AvatarWithRing,
  GlassStats,
  GradientWash,
  RadialHalo,
  ScreenBackdrop,
  VersionPill,
} from '@unif/react-native-design';
import * as DesignRuntime from '@unif/react-native-design';
import App from '../App';
import { restoreNativeMocks } from './helpers/nativeMocks';
import { createShowcaseRuntimeCoverage } from './helpers/showcaseRuntimeCoverage';
import { createShowcaseStateCoverage } from './helpers/showcaseStateCoverage';

jest.mock('react-native-safe-area-context', () => {
  const safeAreaMock = jest.requireActual(
    'react-native-safe-area-context/jest/mock'
  ).default;
  return {
    ...safeAreaMock,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('../../../node_modules/react-native-safe-area-context', () => {
  return jest.requireActual(
    '../../../node_modules/react-native-safe-area-context/jest/mock'
  ).default;
});

jest.mock('@sbaiahmed1/react-native-blur', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    BlurView: function MockBlurView(props: React.ComponentProps<typeof View>) {
      return ReactModule.createElement(View, props);
    },
  };
});

jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual<typeof DesignRuntime>(
    '@unif/react-native-design'
  );
  return {
    ...actual,
    useSvgId: jest.fn(actual.useSvgId),
  };
});

function enterBusiness(): void {
  fireEvent.press(screen.getByRole('button', { name: /业务复合组件/ }));
}

function componentByTestID<T extends React.ComponentType<never>>(
  component: T,
  testID: string
) {
  const found = screen
    .UNSAFE_getAllByType(component)
    .find((node) => node.props.testID === testID);
  if (!found) throw new Error(`未找到组件：${testID}`);
  return found;
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {
  render(<App />);
  enterBusiness();
  const runtimeCoverage = createShowcaseRuntimeCoverage('business');

  expect(screen.getByTestId('business-screen')).toBeOnTheScreen();
  const simpleWrapper = screen.getByTestId('business-gradient-simple', {
    includeHiddenElements: true,
  });
  const haloWrapper = screen.getByTestId('business-halo-circle', {
    includeHiddenElements: true,
  });
  const linearDefinitions = simpleWrapper.findAll(
    (node) => typeof node.props.id === 'string'
  );
  const radialDefinitions = haloWrapper.findAll(
    (node) => typeof node.props.id === 'string'
  );
  expect(linearDefinitions).toHaveLength(1);
  expect(radialDefinitions).toHaveLength(1);
  const linearId = linearDefinitions[0]?.props.id;
  const radialId = radialDefinitions[0]?.props.id;
  expect(linearId).toMatch(/^[A-Za-z_][A-Za-z0-9_.-]*$/);
  expect(radialId).toMatch(/^[A-Za-z_][A-Za-z0-9_.-]*$/);
  expect(linearId).not.toBe(radialId);
  expect(simpleWrapper.findByType(GradientWash).props.gradientId).toBe(
    linearId
  );
  expect(haloWrapper.findByType(RadialHalo).props.gradientId).toBe(radialId);
  expect(
    simpleWrapper.findAll((node) => node.props.fill === `url(#${linearId})`)
  ).toHaveLength(1);
  expect(
    haloWrapper.findAll((node) => node.props.fill === `url(#${radialId})`)
  ).toHaveLength(1);
  for (const wrapper of [simpleWrapper, haloWrapper]) {
    expect(wrapper.props).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
  }
  runtimeCoverage.prove('useSvgId', () => {
    expect(jest.mocked(DesignRuntime.useSvgId).mock.calls).toEqual([
      ['business-wash'],
      ['business-halo'],
    ]);
    expect(linearId).not.toBe(radialId);
    expect(simpleWrapper.findByType(GradientWash).props.gradientId).toBe(
      linearId
    );
    expect(haloWrapper.findByType(RadialHalo).props.gradientId).toBe(radialId);
  });
  runtimeCoverage.expectComplete();
});

test('GradientWash、RadialHalo 与 ScreenBackdrop 覆盖互斥 simple/custom 与暖橙/custom', () => {
  render(<App />);
  enterBusiness();
  const gradientCoverage = createShowcaseStateCoverage('GradientWash');
  const haloCoverage = createShowcaseStateCoverage('RadialHalo');
  const backdropCoverage = createShowcaseStateCoverage('ScreenBackdrop');

  const washes = screen.UNSAFE_getAllByType(GradientWash);
  const simpleWash = washes.find((node) => node.props.color !== undefined);
  const customWash = washes.find((node) => node.props.stops !== undefined);
  expect(simpleWash?.props).toMatchObject({
    height: 120,
    fromOpacity: 0.2,
    toOpacity: 0,
    color: expect.any(String),
  });
  gradientCoverage.prove(
    'gradient-wash.color-opacity',
    'gradient-wash.height',
    'gradient-wash.gradient-id',
    () => {
      expect(simpleWash?.props).toMatchObject({
        height: 120,
        fromOpacity: 0.2,
        toOpacity: 0,
        color: expect.any(String),
        gradientId: expect.stringMatching(/^[A-Za-z_][A-Za-z0-9_.-]*$/),
      });
    }
  );
  expect(customWash?.props.stops).toHaveLength(3);
  gradientCoverage.prove('gradient-wash.custom-stops', () => {
    expect(customWash?.props.stops).toHaveLength(3);
  });
  gradientCoverage.expectComplete();
  const halos = screen.UNSAFE_getAllByType(RadialHalo);
  const circleHalo = halos.find(
    (node) => node.props.height === undefined && node.props.stops === undefined
  );
  const ellipseHalo = halos.find(
    (node) => node.props.height !== undefined && node.props.stops !== undefined
  );
  expect(circleHalo?.props).toMatchObject({
    size: 120,
    maxOpacity: 0.22,
  });
  haloCoverage.prove(
    'radial-halo.circle',
    'radial-halo.max-opacity',
    'radial-halo.gradient-id',
    () => {
      expect(circleHalo?.props).toMatchObject({
        size: 120,
        maxOpacity: 0.22,
        gradientId: expect.stringMatching(/^[A-Za-z_][A-Za-z0-9_.-]*$/),
      });
    }
  );
  expect(ellipseHalo?.props).toMatchObject({
    size: 180,
    height: 96,
    stops: expect.any(Array),
  });
  haloCoverage.prove('radial-halo.ellipse', 'radial-halo.custom-stops', () => {
    expect(ellipseHalo?.props).toMatchObject({
      size: 180,
      height: 96,
      stops: expect.any(Array),
    });
  });
  haloCoverage.expectComplete();

  expect(screen.UNSAFE_getAllByType(ScreenBackdrop)).toHaveLength(1);
  expect(screen.UNSAFE_getByType(ScreenBackdrop).props.preset).toBe(
    'warmOrange'
  );
  expect(screen.UNSAFE_getByType(ScreenBackdrop).props.stops).toBeUndefined();
  backdropCoverage.prove('screen-backdrop.preset', () => {
    expect(screen.UNSAFE_getByType(ScreenBackdrop).props.preset).toBe(
      'warmOrange'
    );
  });
  fireEvent.press(screen.getByRole('tab', { name: '自定义背景' }));
  expect(screen.UNSAFE_getAllByType(ScreenBackdrop)).toHaveLength(1);
  backdropCoverage.prove(
    'screen-backdrop.custom-halo',
    'screen-backdrop.theme',
    () => {
      expect(screen.UNSAFE_getByType(ScreenBackdrop).props.halos).toEqual([
        expect.objectContaining({ maxOpacity: 0.18, centerX: true }),
      ]);
      expect(screen.UNSAFE_getByType(ScreenBackdrop).props.stops).toEqual({
        light: expect.any(Array),
        dark: expect.any(Array),
      });
      expect(
        screen.UNSAFE_getByType(ScreenBackdrop).props.preset
      ).toBeUndefined();
    }
  );
  const backdropWrapper = screen.getByTestId('business-backdrop-wrapper', {
    includeHiddenElements: true,
  });
  expect(backdropWrapper).toHaveStyle({
    position: 'relative',
    overflow: 'hidden',
  });
  expect(backdropWrapper.props).toMatchObject({
    accessibilityElementsHidden: true,
    importantForAccessibility: 'no-hide-descendants',
  });

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterBusiness();
  expect(
    screen.getByRole('tab', { name: '自定义背景' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  backdropCoverage.expectComplete();
});

test('GlassStats 覆盖 2/3/4 列，AvatarWithRing 使用受控尺寸与 token ringColor', () => {
  render(<App />);
  enterBusiness();
  const statsCoverage = createShowcaseStateCoverage('GlassStats');
  const avatarCoverage = createShowcaseStateCoverage('AvatarWithRing');

  expect(
    ['business-stats-2', 'business-stats-3', 'business-stats-4'].map(
      (testID) => componentByTestID(GlassStats, testID).props.items.length
    )
  ).toEqual([2, 3, 4]);
  statsCoverage.prove(
    'glass-stats.columns-2',
    'glass-stats.columns-3',
    'glass-stats.columns-4',
    () => {
      expect(
        ['business-stats-2', 'business-stats-3', 'business-stats-4'].map(
          (testID) => componentByTestID(GlassStats, testID).props.items.length
        )
      ).toEqual([2, 3, 4]);
    }
  );
  expect(screen.getByText('¥2,016')).toBeOnTheScreen();
  expect(screen.getByText('98%')).toBeOnTheScreen();
  statsCoverage.prove('glass-stats.formatted-value', () => {
    expect(screen.getByText('¥2,016')).toBeOnTheScreen();
  });
  statsCoverage.expectComplete();
  expect(
    ['business-avatar-48', 'business-avatar-64', 'business-avatar-88'].map(
      (testID) => componentByTestID(AvatarWithRing, testID).props.size
    )
  ).toEqual([48, 64, 88]);
  avatarCoverage.prove('avatar-with-ring.sizes', () => {
    expect(
      ['business-avatar-48', 'business-avatar-64', 'business-avatar-88'].map(
        (testID) => componentByTestID(AvatarWithRing, testID).props.size
      )
    ).toEqual([48, 64, 88]);
  });
  expect(
    ['business-avatar-48', 'business-avatar-64', 'business-avatar-88'].map(
      (testID) => componentByTestID(AvatarWithRing, testID).props.label
    )
  ).toEqual(['小', '中', '大']);
  avatarCoverage.prove('avatar-with-ring.characters', () => {
    expect(
      ['business-avatar-48', 'business-avatar-64', 'business-avatar-88'].map(
        (testID) => componentByTestID(AvatarWithRing, testID).props.label
      )
    ).toEqual(['小', '中', '大']);
  });
  for (const testID of [
    'business-avatar-48',
    'business-avatar-64',
    'business-avatar-88',
  ]) {
    expect(componentByTestID(AvatarWithRing, testID).props.ringColor).toEqual(
      expect.any(String)
    );
  }
  avatarCoverage.prove('avatar-with-ring.ring-color', () => {
    expect(
      componentByTestID(AvatarWithRing, 'business-avatar-64').props.ringColor
    ).toEqual(expect.any(String));
  });
  avatarCoverage.expectComplete();
});

test('VersionPill 覆盖 build、默认/自定义/空白 fallback，并使用中文构建前缀', () => {
  render(<App />);
  enterBusiness();
  const stateCoverage = createShowcaseStateCoverage('VersionPill');

  expect(screen.getByLabelText('版本 0.20.0，正常')).toBeOnTheScreen();
  expect(
    screen.getByLabelText('版本 0.20.0，构建 20260803，正常')
  ).toBeOnTheScreen();
  stateCoverage.prove('version-pill.version-text', () => {
    expect(
      screen.getByLabelText('版本 0.20.0，构建 20260803，正常')
    ).toBeOnTheScreen();
  });
  fireEvent.changeText(screen.getByLabelText('版本状态文案'), '内测');
  expect(
    screen.getByLabelText('版本 0.20.0，构建 20260803，内测')
  ).toBeOnTheScreen();
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  fireEvent.changeText(screen.getByLabelText('版本状态文案'), '   ');
  expect(
    screen.getByLabelText('版本 0.20.0，构建 20260803，状态未知')
  ).toBeOnTheScreen();
  expect(warnSpy).toHaveBeenCalledWith(
    '[VersionPill]',
    'VersionPill status.label 不能为空白，已回退为“状态未知”。'
  );
  expect(
    componentByTestID(VersionPill, 'business-version-configured').props
      .buildPrefix
  ).toBe('构建 ');
  stateCoverage.prove('version-pill.status', () => {
    expect(
      screen.getByLabelText('版本 0.20.0，构建 20260803，状态未知')
    ).toBeOnTheScreen();
  });
  stateCoverage.expectComplete();
});
