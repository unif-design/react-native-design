import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  BRAND_ORANGE,
  ICONS,
  ICON_NAMES,
  Icon,
  avatar,
  avatarGradient,
  blur,
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
import { createShowcaseStateCoverage } from './helpers/showcaseStateCoverage';

const mockIconAccessLogKey = Symbol('foundation-icon-access-log');
const mockIconAccessLog: string[] = [];

jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual<typeof DesignRuntime>(
    '@unif/react-native-design'
  );
  const iconSentinel = new Proxy(
    { ...actual.ICONS, warning: undefined },
    {
      get(target, property, receiver) {
        if (property === mockIconAccessLogKey) return mockIconAccessLog;
        if (
          typeof property === 'string' &&
          Object.prototype.hasOwnProperty.call(target, property)
        ) {
          mockIconAccessLog.push(property);
        }
        return Reflect.get(target, property, receiver);
      },
    }
  );
  return {
    ...actual,
    BRAND_ORANGE: 'magenta',
    ICONS: iconSentinel,
    ICON_NAMES: [...actual.ICON_NAMES].reverse(),
    addTransport: jest.fn(actual.addTransport),
    avatar: { ...actual.avatar, md: 37 },
    avatarGradient: ['orange', 'magenta', 'purple'],
    blur: { ...actual.blur, soft: 12, strong: 44 },
    childTestID: jest.fn(actual.childTestID),
    consoleTransport: {
      id: 'foundation-console-sentinel',
      log: actual.consoleTransport.log,
    },
    control: { ...actual.control, lg: 47 },
    createLogger: jest.fn(actual.createLogger),
    darkColors: {
      ...actual.darkColors,
      primary: 'cyan',
      background: 'navy',
    },
    darkShadow: {
      ...actual.darkShadow,
      card: { ...actual.darkShadow.card, shadowOpacity: 0.41 },
    },
    dim: { ...actual.dim, sendBtn: 35 },
    fixed: { ...actual.fixed, hitTarget: 48 },
    fontMono: 'Courier',
    fw: { ...actual.fw, semi: '800' },
    getLogLevel: jest.fn(actual.getLogLevel),
    icon: { ...actual.icon, md: 29 },
    lightColors: {
      ...actual.lightColors,
      primary: 'magenta',
      background: 'yellow',
    },
    lightShadow: {
      ...actual.lightShadow,
      card: { ...actual.lightShadow.card, shadowOpacity: 0.31 },
    },
    motion: { ...actual.motion, base: 240 },
    pressedOpacity: 0.63,
    r: jest.fn(actual.r),
    radius: { ...actual.radius, md: 13 },
    removeTransport: jest.fn(actual.removeTransport),
    rf: jest.fn(actual.rf),
    scaleFontMetric: jest.fn(actual.scaleFontMetric),
    setLogLevel: jest.fn(actual.setLogLevel),
    space: { ...actual.space, '4': 13 },
    type: { ...actual.type, body: 23, sm: 17, xxs: 11 },
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
  fireEvent.press(screen.getByRole('button', { name: /基础能力与图标/ }));
}

function escapeRegExp(value: string | number): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('Foundation 展示真实 theme、token、palette、scale、blur 与 Icon 事实', () => {
  render(<App />);
  const iconAccessLog = (
    ICONS as typeof ICONS & { [mockIconAccessLogKey]: string[] }
  )[mockIconAccessLogKey];
  iconAccessLog.length = 0;
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
      expect(useColors).toHaveBeenCalledTimes(2);
      expect(useThemedStyles).toHaveBeenCalledTimes(10);
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
      ).toHaveStyle({ backgroundColor: lightColors.background });
      expect(
        screen.getByTestId('foundation-swatch-dark', {
          includeHiddenElements: true,
        })
      ).toHaveStyle({ backgroundColor: darkColors.background });
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
          `暖橙 ${escapeRegExp(
            warmOrangePalette.light.length
          )}/${escapeRegExp(warmOrangePalette.dark.length)}`
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
    'blur',
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
      expect(tokenMetrics).toHaveTextContent(
        new RegExp(
          `blur ${escapeRegExp(blur.soft)}-${escapeRegExp(blur.strong)}`
        )
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
  runtimeCoverage.prove('ICONS', 'ICON_NAMES', () => {
    const warningIndex = ICON_NAMES.indexOf('warning');
    const firstWarningAccess = iconAccessLog.indexOf('warning');
    expect(warningIndex).toBeGreaterThanOrEqual(0);
    expect(firstWarningAccess).toBe(warningIndex);
    expect(iconAccessLog.slice(0, firstWarningAccess + 1)).toEqual(
      ICON_NAMES.slice(0, warningIndex + 1)
    );
    expect(
      screen.getByText(`图标诊断：${ICON_NAMES.length} / 数据缺失`)
    ).toBeOnTheScreen();
    expect(screen.getByText(ICON_NAMES[0] ?? '')).toBeOnTheScreen();
  });
  runtimeCoverage.prove('childTestID', () => {
    const firstIconName = ICON_NAMES[0];
    if (!firstIconName) throw new Error('Icon catalog 必须至少包含一个名称');
    const childTestIDMock = jest.mocked(DesignRuntime.childTestID);
    expect(childTestIDMock).toHaveBeenCalledTimes(24);
    expect(childTestIDMock).toHaveBeenCalledWith(
      'foundation-icons',
      firstIconName
    );
    const firstCallIndex = childTestIDMock.mock.calls.findIndex(
      ([parent, child]) =>
        parent === 'foundation-icons' && child === firstIconName
    );
    const iconTestID = childTestIDMock.mock.results[firstCallIndex]?.value;
    if (!iconTestID) throw new Error('childTestID 必须生成非空 ID');
    expect(screen.getByTestId(iconTestID)).toBeOnTheScreen();
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
  fireEvent.press(screen.getByRole('button', { name: '记录主题诊断' }));
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
        expect.objectContaining({ id: 'foundation-scene-one-shot' })
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

test('Icon catalog 初始 24 个、每次多 24 个，并由大小写不敏感搜索与 Empty 驱动', () => {
  render(<App />);
  enterFoundation();
  const stateCoverage = createShowcaseStateCoverage('Icon');

  expect(screen.getAllByTestId(/^foundation-icons-/)).toHaveLength(24);
  for (let loaded = 24; loaded < ICON_NAMES.length; loaded += 24) {
    fireEvent.press(screen.getByRole('button', { name: '加载更多图标' }));
  }
  stateCoverage.prove('icon.all-icons', () => {
    expect(screen.getAllByTestId(/^foundation-icons-/)).toHaveLength(
      ICON_NAMES.length
    );
    expect(
      screen.queryByRole('button', { name: '加载更多图标' })
    ).not.toBeOnTheScreen();
  });

  fireEvent.press(screen.getByRole('tab', { name: '32 点图标' }));
  const iconWrappers = screen.getAllByTestId(/^foundation-icons-/);
  stateCoverage.prove('icon.sizes', () => {
    expect(
      iconWrappers.map((wrapper) => wrapper.findByType(Icon).props.size)
    ).toEqual(Array.from({ length: ICON_NAMES.length }, () => 32));
  });
  const firstIcon = iconWrappers[0]?.findByType(Icon);
  stateCoverage.prove('icon.color', () => {
    const renderedColors = jest
      .mocked(DesignRuntime.useColors)
      .mock.results.at(-1)?.value;
    expect(firstIcon?.props.color).toBe(renderedColors?.primary);
  });
  stateCoverage.prove('icon.a11y-hidden', () => {
    expect(
      firstIcon?.findByProps({
        importantForAccessibility: 'no-hide-descendants',
      }).props
    ).toMatchObject({ accessibilityElementsHidden: true });
  });

  fireEvent.changeText(screen.getByPlaceholderText('搜索图标名称'), 'ARROW');
  const arrowCount = ICON_NAMES.filter((name) =>
    name.toLowerCase().includes('arrow')
  ).length;
  stateCoverage.prove('icon.name-search', () => {
    expect(screen.getAllByTestId(/^foundation-icons-/)).toHaveLength(
      arrowCount
    );
    expect(screen.getByText('arrow-left')).toBeOnTheScreen();
  });

  fireEvent.changeText(
    screen.getByPlaceholderText('搜索图标名称'),
    'not-a-real-icon'
  );
  expect(screen.getByText('没有匹配的图标')).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: '加载更多图标' })
  ).not.toBeOnTheScreen();
  stateCoverage.expectComplete();
});

test('Icon query 与 loadedCount 跨路由保留，scene reset 只重置 Foundation draft', () => {
  render(<App />);
  enterFoundation();

  fireEvent.press(screen.getByRole('button', { name: '加载更多图标' }));
  fireEvent.changeText(screen.getByPlaceholderText('搜索图标名称'), 'arrow');
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterFoundation();

  expect(screen.getByPlaceholderText('搜索图标名称').props.value).toBe('arrow');
  fireEvent.changeText(screen.getByPlaceholderText('搜索图标名称'), '');
  expect(screen.getAllByTestId(/^foundation-icons-/)).toHaveLength(
    Math.min(48, ICON_NAMES.length)
  );

  fireEvent.press(screen.getByRole('button', { name: '重置本场景' }));
  expect(screen.getByPlaceholderText('搜索图标名称').props.value).toBe('');
  expect(screen.getAllByTestId(/^foundation-icons-/)).toHaveLength(24);
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
  fireEvent.press(screen.getByRole('button', { name: '记录主题诊断' }));

  expect(addTransport).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'foundation-scene-one-shot' })
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
    fireEvent.press(screen.getByRole('button', { name: '记录主题诊断' }));
  }
  expect(screen.queryByTestId(/^result-history-/)).not.toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: /查看历史记录/ }));
  expect(screen.getAllByTestId(/^result-history-/)).toHaveLength(10);
  expect(screen.getByText('仅展示最近 10 条记录')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  expect(
    screen.getByRole('button', {
      name: /基础能力与图标.*最近：主题诊断示例已记录/,
    })
  ).toBeOnTheScreen();
});
