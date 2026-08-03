import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ConfirmHost,
  ThemeProvider,
  ToastHost,
} from '@unif/react-native-design';
import App from '../App';
import { AppProviders } from '../app/AppProviders';
import { ExampleRouter } from '../app/ExampleRouter';
import { ShowcaseProvider } from '../state/ShowcaseProvider';
import {
  installAndroidBackHandlerMock,
  installNonAndroidBackHandlerMock,
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';

jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual('@unif/react-native-design');
  return {
    ...actual,
    ConfirmHost: function MockConfirmHost() {
      return null;
    },
    ToastHost: function MockToastHost() {
      return null;
    },
  };
});

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('根装配保持指定 Provider 顺序且两个 Host 各唯一一份', () => {
  installReducedMotionMock(false);
  render(<App />);

  const gestureRoot = screen.UNSAFE_getByType(GestureHandlerRootView);
  const safeArea = gestureRoot.findByType(SafeAreaProvider);
  const showcase = safeArea.findByType(ShowcaseProvider);
  const theme = showcase.findByType(ThemeProvider);

  expect(theme.findAllByType(ExampleRouter)).toHaveLength(1);
  expect(theme.findAllByType(ConfirmHost)).toHaveLength(1);
  expect(theme.findAllByType(ToastHost)).toHaveLength(1);
  expect(screen.UNSAFE_getAllByType(AppProviders)).toHaveLength(1);
});

test('ThemeProvider 将 system 映射为 undefined，并窄化三档主题与四档字号', () => {
  installReducedMotionMock(false);
  render(<App />);

  expect(screen.UNSAFE_getByType(ThemeProvider).props).toMatchObject({
    forceScheme: undefined,
    fontScale: 1,
  });

  fireEvent.press(screen.getByRole('button', { name: /基础能力与图标/ }));
  expect(screen.getByTestId('foundation-screen')).toBeOnTheScreen();

  const themeCases = [
    ['浅色', 'light'],
    ['深色', 'dark'],
    ['跟随系统', undefined],
  ] as const;
  for (const [label, forceScheme] of themeCases) {
    fireEvent.press(screen.getByRole('tab', { name: label }));
    expect(screen.UNSAFE_getByType(ThemeProvider).props.forceScheme).toBe(
      forceScheme
    );
    expect(
      screen.getByRole('tab', { name: label }).props.accessibilityState
    ).toMatchObject({ selected: true });
    expect(
      screen.getByText(`当前主题：${forceScheme === 'dark' ? '深色' : '浅色'}`)
    ).toBeOnTheScreen();
  }

  const fontScaleCases = [
    ['标准字号', 1],
    ['较大字号', 1.25],
    ['大字号', 1.5],
    ['超大字号', 2],
  ] as const;
  for (const [label, fontScale] of fontScaleCases) {
    fireEvent.press(screen.getByRole('tab', { name: label }));
    expect(screen.UNSAFE_getByType(ThemeProvider).props.fontScale).toBe(
      fontScale
    );
    expect(
      screen.getByRole('tab', { name: label }).props.accessibilityState
    ).toMatchObject({ selected: true });
  }
});

test('Home 只挂八个中文 scene 入口，并在前进与返回时互斥挂载 screen', () => {
  installReducedMotionMock(false);
  render(<App />);

  const sceneButtons = screen
    .getAllByRole('button')
    .filter((node) => String(node.props.accessibilityLabel).includes('个组件'));
  expect(sceneButtons).toHaveLength(8);
  expect(screen.getByText('设计系统示例')).toBeOnTheScreen();
  expect(
    screen.getByText('主题模式：跟随系统；当前主题：浅色')
  ).toBeOnTheScreen();
  expect(screen.getByText('字号倍率：1')).toBeOnTheScreen();
  expect(screen.getByText('减少动态效果：否')).toBeOnTheScreen();
  expect(screen.queryByTestId('foundation-screen')).not.toBeOnTheScreen();
  expect(screen.queryByTestId('pending-screen')).not.toBeOnTheScreen();
  expect(screen.queryByTestId(/^foundation-icons-/)).not.toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: /基础能力与图标/ }));
  expect(screen.queryByText('设计系统示例')).not.toBeOnTheScreen();
  expect(screen.getByTestId('foundation-screen')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  expect(screen.getByText('设计系统示例')).toBeOnTheScreen();
  expect(screen.queryByTestId('foundation-screen')).not.toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: /操作与状态/ }));
  expect(screen.getByTestId('pending-screen')).toBeOnTheScreen();
  expect(screen.queryByText('设计系统示例')).not.toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  expect(screen.getByText('设计系统示例')).toBeOnTheScreen();
});

test('Android BackHandler 只订阅一次，child consume、Home 不 consume，卸载只 remove 一次', () => {
  installReducedMotionMock(false);
  const nativeBack = installAndroidBackHandlerMock();
  const mounted = render(<App />);

  expect(nativeBack.addEventListener).toHaveBeenCalledTimes(1);
  const handler = nativeBack.getHandler();
  expect(handler()).toBe(false);

  fireEvent.press(screen.getByRole('button', { name: /基础能力与图标/ }));
  expect(screen.getByTestId('foundation-screen')).toBeOnTheScreen();
  expect(nativeBack.addEventListener).toHaveBeenCalledTimes(1);

  act(() => {
    expect(handler()).toBe(true);
  });
  expect(screen.getByText('设计系统示例')).toBeOnTheScreen();
  expect(screen.queryByTestId('foundation-screen')).not.toBeOnTheScreen();
  expect(nativeBack.addEventListener).toHaveBeenCalledTimes(1);
  expect(handler()).toBe(false);

  mounted.unmount();
  expect(nativeBack.remove).toHaveBeenCalledTimes(1);
});

test('非 Android 根不建立 BackHandler subscription', () => {
  installReducedMotionMock(false);
  const addEventListener = installNonAndroidBackHandlerMock();

  render(<App />);

  expect(addEventListener).not.toHaveBeenCalled();
});
