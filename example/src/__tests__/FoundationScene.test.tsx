import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  ICON_NAMES,
  consoleTransport,
  darkColors,
  lightColors,
} from '@unif/react-native-design';
import * as DesignRuntime from '@unif/react-native-design';
import App from '../App';
import {
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';

jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual<typeof DesignRuntime>(
    '@unif/react-native-design'
  );
  return {
    ...actual,
    addTransport: jest.fn(actual.addTransport),
    getLogLevel: jest.fn(actual.getLogLevel),
    removeTransport: jest.fn(actual.removeTransport),
    setLogLevel: jest.fn(actual.setLogLevel),
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

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('Foundation 展示真实 theme、token、palette、scale、blur 与 Icon 事实', () => {
  installReducedMotionMock(false);
  render(<App />);
  enterFoundation();

  expect(screen.getByText('当前主题：浅色')).toBeOnTheScreen();
  expect(screen.getByText('字号倍率：1')).toBeOnTheScreen();
  expect(screen.getByText('减少动态效果：否')).toBeOnTheScreen();
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
  expect(screen.getByTestId('foundation-token-metrics')).toBeOnTheScreen();
  expect(screen.getByTestId('foundation-shadow-metrics')).toBeOnTheScreen();
  expect(screen.getByTestId('foundation-palette-metrics')).toBeOnTheScreen();
  expect(screen.getByTestId('foundation-scale-metrics')).toBeOnTheScreen();
  expect(
    screen.getByText(`控制台传输器：${consoleTransport.id}`)
  ).toBeOnTheScreen();
  expect(
    screen.getByText(`图标诊断：${ICON_NAMES.length} / 数据完整`)
  ).toBeOnTheScreen();
});

test('Icon catalog 初始 24 个、每次多 24 个，并由大小写不敏感搜索与 Empty 驱动', () => {
  installReducedMotionMock(false);
  render(<App />);
  enterFoundation();

  expect(screen.getAllByTestId(/^foundation-icons-/)).toHaveLength(24);
  fireEvent.press(screen.getByRole('button', { name: '加载更多图标' }));
  expect(screen.getAllByTestId(/^foundation-icons-/)).toHaveLength(
    Math.min(48, ICON_NAMES.length)
  );

  fireEvent.changeText(screen.getByPlaceholderText('搜索图标名称'), 'ARROW');
  const arrowCount = ICON_NAMES.filter((name) =>
    name.toLowerCase().includes('arrow')
  ).length;
  expect(screen.getAllByTestId(/^foundation-icons-/)).toHaveLength(arrowCount);
  expect(screen.getByText('arrow-left')).toBeOnTheScreen();

  fireEvent.changeText(
    screen.getByPlaceholderText('搜索图标名称'),
    'not-a-real-icon'
  );
  expect(screen.getByText('没有匹配的图标')).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: '加载更多图标' })
  ).not.toBeOnTheScreen();
});

test('Icon query 与 loadedCount 跨路由保留，scene reset 只重置 Foundation draft', () => {
  installReducedMotionMock(false);
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
  installReducedMotionMock(false);
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
