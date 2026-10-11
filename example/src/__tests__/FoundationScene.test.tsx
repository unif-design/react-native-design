import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  BRAND_ORANGE,
  avatar,
  avatarGradient,
  consoleTransport,
  control,
  darkColors,
  darkShadow,
  dim,
  fixed,
  fontMono,
  fw,
  icon,
  lightColors,
  lightShadow,
  motion,
  pressedOpacity,
  radius,
  space,
  type,
  warmOrangePalette,
} from '@unif/react-native-design';
import * as DesignRuntime from '@unif/react-native-design';
import App from '../App';
import { restoreNativeMocks } from './helpers/nativeMocks';
import { createShowcaseRuntimeCoverage } from './helpers/showcaseRuntimeCoverage';
jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual<typeof DesignRuntime>(
    '@unif/react-native-design'
  );
  return {
    ...actual,
    BRAND_ORANGE: 'magenta',
    addTransport: jest.fn(actual.addTransport),
    avatar: {
      ...actual.avatar,
      md: 37,
    },
    avatarGradient: ['orange', 'magenta', 'purple'],
    childTestID: jest.fn(actual.childTestID),
    consoleTransport: {
      id: 'foundation-console-sentinel',
      log: actual.consoleTransport.log,
    },
    control: {
      ...actual.control,
      lg: 47,
    },
    createLogger: jest.fn(actual.createLogger),
    darkColors: {
      ...actual.darkColors,
      primary: 'cyan',
      background: 'navy',
    },
    darkShadow: {
      ...actual.darkShadow,
      card: {
        ...actual.darkShadow.card,
        shadowOpacity: 0.41,
      },
    },
    dim: {
      ...actual.dim,
      sendBtn: 35,
    },
    fixed: {
      ...actual.fixed,
      hitTarget: 48,
    },
    fontMono: 'Courier',
    fw: {
      ...actual.fw,
      semi: '800',
    },
    getLogLevel: jest.fn(actual.getLogLevel),
    icon: {
      ...actual.icon,
      md: 29,
    },
    lightColors: {
      ...actual.lightColors,
      primary: 'magenta',
      background: 'yellow',
    },
    lightShadow: {
      ...actual.lightShadow,
      card: {
        ...actual.lightShadow.card,
        shadowOpacity: 0.31,
      },
    },
    motion: {
      ...actual.motion,
      base: 240,
    },
    pressedOpacity: 0.63,
    r: jest.fn(actual.r),
    radius: {
      ...actual.radius,
      md: 13,
    },
    removeTransport: jest.fn(actual.removeTransport),
    rf: jest.fn(actual.rf),
    scaleFontMetric: jest.fn(actual.scaleFontMetric),
    setLogLevel: jest.fn(actual.setLogLevel),
    space: {
      ...actual.space,
      '4': 13,
    },
    type: {
      ...actual.type,
      body: 23,
      sm: 17,
      xxs: 11,
    },
    useColors: jest.fn(actual.useColors),
    useFontScale: jest.fn(actual.useFontScale),
    usePrefersReducedMotion: jest.fn(actual.usePrefersReducedMotion),
    useShadow: jest.fn(actual.useShadow),
    useTheme: jest.fn(actual.useTheme),
    useThemedStyles: jest.fn(actual.useThemedStyles),
    warmOrangePalette: {
      light: ['orange', 'yellow', 'white'],
      dark: ['black', 'purple'],
    },
    ConfirmHost: function MockConfirmHost() {
      return null;
    },
    ToastHost: function MockToastHost() {
      return null;
    },
  };
});
beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
});
function enterFoundation(): void {
  fireEvent.press(
    screen.getByRole('button', {
      name: /主题与基础能力/,
    })
  );
}
function escapeRegExp(value: string | number): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});
test('Foundation 展示真实 theme、token、palette、scale 与尺寸令牌事实', () => {
  render(<App />);
  const callableMocks = [
    DesignRuntime.childTestID,
    DesignRuntime.r,
    DesignRuntime.rf,
    DesignRuntime.scaleFontMetric,
    DesignRuntime.useColors,
    DesignRuntime.useFontScale,
    DesignRuntime.usePrefersReducedMotion,
    DesignRuntime.useShadow,
    DesignRuntime.useTheme,
    DesignRuntime.useThemedStyles,
  ].map((callable) => jest.mocked(callable));
  for (const callable of callableMocks) callable.mockClear();
  enterFoundation();
  const runtimeCoverage = createShowcaseRuntimeCoverage('foundation');
  runtimeCoverage.prove('useTheme', () => {
    expect(jest.mocked(DesignRuntime.useTheme)).toHaveBeenCalledTimes(1);
    expect(screen.getByText('当前主题：浅色')).toBeOnTheScreen();
  });
  runtimeCoverage.prove('useFontScale', () => {
    expect(jest.mocked(DesignRuntime.useFontScale)).toHaveBeenCalledTimes(1);
    expect(screen.getByText('字号倍率：1')).toBeOnTheScreen();
  });
  runtimeCoverage.prove('usePrefersReducedMotion', () => {
    expect(
      jest.mocked(DesignRuntime.usePrefersReducedMotion)
    ).toHaveBeenCalledTimes(1);
    expect(screen.getByText('减少动态效果：否')).toBeOnTheScreen();
  });
  runtimeCoverage.prove(
    'useColors',
    'useThemedStyles',
    'lightColors',
    'darkColors',
    () => {
      const useColors = jest.mocked(DesignRuntime.useColors);
      const useThemedStyles = jest.mocked(DesignRuntime.useThemedStyles);
      expect(useColors).toHaveBeenCalledTimes(1);
      expect(useThemedStyles).toHaveBeenCalledTimes(8);
      expect(
        useThemedStyles.mock.calls.every(
          ([maker]) => typeof maker === 'function'
        )
      ).toBe(true);
      expect(
        screen.getByText(
          `配对色板：浅色 ${lightColors.primary} / 深色 ${darkColors.primary}`
        )
      ).toBeOnTheScreen();
      expect(
        screen.getByTestId('foundation-swatch-light', {
          includeHiddenElements: true,
        })
      ).toHaveStyle({
        backgroundColor: lightColors.background,
      });
      expect(
        screen.getByTestId('foundation-swatch-dark', {
          includeHiddenElements: true,
        })
      ).toHaveStyle({
        backgroundColor: darkColors.background,
      });
      expect(
        screen.getByText(
          `当前 primary：${String(useColors.mock.results[0]?.value.primary)}`
        )
      ).toBeOnTheScreen();
    }
  );
  runtimeCoverage.prove('useShadow', 'lightShadow', 'darkShadow', () => {
    const useShadow = jest.mocked(DesignRuntime.useShadow);
    expect(useShadow).toHaveBeenCalledTimes(1);
    const shadowMetrics = screen.getByTestId('foundation-shadow-metrics');
    expect(shadowMetrics).toHaveTextContent(
      new RegExp(`浅色 card ${escapeRegExp(lightShadow.card.shadowOpacity)}`)
    );
    expect(shadowMetrics).toHaveTextContent(
      new RegExp(`深色 card ${escapeRegExp(darkShadow.card.shadowOpacity)}`)
    );
    expect(shadowMetrics).toHaveTextContent(
      new RegExp(
        `当前 subtle ${escapeRegExp(String(useShadow.mock.results[0]?.value.subtle.shadowOpacity))}`
      )
    );
  });
  runtimeCoverage.prove(
    'warmOrangePalette',
    'BRAND_ORANGE',
    'avatarGradient',
    () => {
      const paletteMetrics = screen.getByTestId('foundation-palette-metrics');
      expect(paletteMetrics).toHaveTextContent(
        new RegExp(
          `暖橙 ${escapeRegExp(warmOrangePalette.light.length)}/${escapeRegExp(warmOrangePalette.dark.length)}`
        )
      );
      expect(paletteMetrics).toHaveTextContent(
        new RegExp(`品牌 ${escapeRegExp(BRAND_ORANGE)}`)
      );
      expect(paletteMetrics).toHaveTextContent(
        new RegExp(`头像渐变 ${avatarGradient.length} stops`)
      );
    }
  );
  runtimeCoverage.prove(
    'fontMono',
    'type',
    'fw',
    'space',
    'radius',
    'avatar',
    'icon',
    'control',
    'dim',
    'fixed',
    'motion',
    'pressedOpacity',
    () => {
      const tokenMetrics = screen.getByTestId('foundation-token-metrics');
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(escapeRegExp(fontMono ?? '系统默认'))
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`body ${escapeRegExp(type.body)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`semi ${escapeRegExp(fw.semi)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`space ${escapeRegExp(space['4'])}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`radius ${escapeRegExp(radius.md)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`avatar ${escapeRegExp(avatar.md)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`icon ${escapeRegExp(icon.md)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`control ${escapeRegExp(control.lg)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`dim ${escapeRegExp(dim.sendBtn)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`fixed ${escapeRegExp(fixed.hitTarget)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`motion ${escapeRegExp(motion.base)}`)
      );
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(`opacity ${escapeRegExp(pressedOpacity)}`)
      );
    }
  );
  runtimeCoverage.prove('scaleFontMetric', 'r', 'rf', () => {
    const rMock = jest.mocked(DesignRuntime.r);
    const rfMock = jest.mocked(DesignRuntime.rf);
    const scaleFontMetricMock = jest.mocked(DesignRuntime.scaleFontMetric);
    expect(rMock).toHaveBeenCalledTimes(1);
    expect(rMock).toHaveBeenCalledWith(8);
    expect(rfMock).toHaveBeenCalledTimes(1);
    expect(rfMock).toHaveBeenCalledWith(15);
    expect(scaleFontMetricMock).toHaveBeenCalledTimes(1);
    expect(scaleFontMetricMock).toHaveBeenCalledWith(type.body, 1);
    const scaleMetrics = screen.getByTestId('foundation-scale-metrics');
    expect(scaleMetrics).toHaveTextContent(
      new RegExp(
        `r\\(8\\)=${escapeRegExp(String(rMock.mock.results[0]?.value))}`
      )
    );
    expect(scaleMetrics).toHaveTextContent(
      new RegExp(
        `rf\\(15\\)=${escapeRegExp(String(rfMock.mock.results[0]?.value))}`
      )
    );
    expect(scaleMetrics).toHaveTextContent(
      new RegExp(
        `dynamic body=${escapeRegExp(String(scaleFontMetricMock.mock.results[0]?.value))}`
      )
    );
  });
  runtimeCoverage.prove('childTestID', () => {
    const childTestIDMock = jest.mocked(DesignRuntime.childTestID);
    for (const child of ['light', 'dark']) {
      expect(childTestIDMock).toHaveBeenCalledWith('foundation-swatch', child);
      const index = childTestIDMock.mock.calls.findIndex(
        ([parent, id]) => parent === 'foundation-swatch' && id === child
      );
      const id = childTestIDMock.mock.results[index]?.value;
      expect(id).toBeTruthy();
      expect(
        screen.getByTestId(id!, { includeHiddenElements: true })
      ).toBeOnTheScreen();
    }
  });
  runtimeCoverage.prove('consoleTransport', () => {
    expect(
      screen.getByText(`控制台传输器：${consoleTransport.id}`)
    ).toBeOnTheScreen();
  });
  runtimeCoverage.prove('createLogger', () => {
    expect(jest.mocked(DesignRuntime.createLogger)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(DesignRuntime.createLogger)).toHaveBeenCalledWith(
      'FoundationScene'
    );
  });
  const addTransport = jest.mocked(DesignRuntime.addTransport);
  const getLogLevel = jest.mocked(DesignRuntime.getLogLevel);
  const removeTransport = jest.mocked(DesignRuntime.removeTransport);
  const setLogLevel = jest.mocked(DesignRuntime.setLogLevel);
  addTransport.mockClear();
  getLogLevel.mockClear();
  removeTransport.mockClear();
  setLogLevel.mockClear();
  fireEvent.press(
    screen.getByRole('button', {
      name: '记录主题诊断',
    })
  );
  runtimeCoverage.prove(
    'setLogLevel',
    'getLogLevel',
    'addTransport',
    'removeTransport',
    () => {
      expect(getLogLevel).toHaveBeenCalled();
      expect(getLogLevel).toHaveBeenCalledTimes(2);
      expect(setLogLevel).toHaveBeenCalledWith('info');
      expect(setLogLevel).toHaveBeenCalledTimes(2);
      expect(addTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'foundation-scene-one-shot',
        })
      );
      expect(addTransport).toHaveBeenCalledTimes(1);
      expect(removeTransport).toHaveBeenCalledWith('foundation-scene-one-shot');
      expect(removeTransport).toHaveBeenCalledTimes(1);
      expect(
        screen.getByText('最新结果：Logger · 记录 · 主题诊断示例已记录')
      ).toBeOnTheScreen();
    }
  );
  runtimeCoverage.expectComplete();
});
test('logger action 通过真实 transport 进入最新结果，历史默认不展开且按需限制详情', () => {
  render(<App />);
  enterFoundation();
  DesignRuntime.setLogLevel('error');
  const addTransport = jest.mocked(DesignRuntime.addTransport);
  const getLogLevel = jest.mocked(DesignRuntime.getLogLevel);
  const removeTransport = jest.mocked(DesignRuntime.removeTransport);
  const setLogLevel = jest.mocked(DesignRuntime.setLogLevel);
  addTransport.mockClear();
  getLogLevel.mockClear();
  removeTransport.mockClear();
  setLogLevel.mockClear();
  expect(screen.queryByTestId('result-latest')).not.toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole('button', {
      name: '记录主题诊断',
    })
  );
  expect(addTransport).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'foundation-scene-one-shot',
    })
  );
  expect(removeTransport).toHaveBeenLastCalledWith('foundation-scene-one-shot');
  expect(setLogLevel).toHaveBeenNthCalledWith(1, 'info');
  expect(setLogLevel).toHaveBeenNthCalledWith(2, 'error');
  expect(DesignRuntime.getLogLevel()).toBe('error');
  expect(screen.getByTestId('result-latest').props).toMatchObject({
    accessibilityLiveRegion: 'polite',
  });
  expect(screen.getByTestId('result-latest').props.accessibilityRole).toBe(
    undefined
  );
  expect(
    screen.getByText('最新结果：Logger · 记录 · 主题诊断示例已记录')
  ).toBeOnTheScreen();
  expect(screen.queryByTestId(/^result-history-/)).not.toBeOnTheScreen();
  for (let index = 0; index < 12; index += 1) {
    fireEvent.press(
      screen.getByRole('button', {
        name: '记录主题诊断',
      })
    );
  }
  expect(screen.queryByTestId(/^result-history-/)).not.toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole('button', {
      name: /查看历史记录/,
    })
  );
  expect(screen.getAllByTestId(/^result-history-/)).toHaveLength(10);
  expect(screen.getByText('仅展示最近 10 条记录')).toBeOnTheScreen();
  fireEvent.press(
    screen.getByRole('button', {
      name: '返回首页',
    })
  );
  expect(
    screen.getByRole('button', {
      name: /主题与基础能力.*最近：主题诊断示例已记录/,
    })
  ).toBeOnTheScreen();
});
