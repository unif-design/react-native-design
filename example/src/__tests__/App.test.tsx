import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type {
  ReactTestRendererJSON,
  ReactTestRendererNode,
} from 'react-test-renderer';
import { ThemeProvider, normalizeFontScale } from '@unif/react-native-design';
import * as DesignRuntime from '@unif/react-native-design';
import App from '../App';
import { AppProviders } from '../app/AppProviders';
import {
  installAndroidBackHandlerMock,
  installNonAndroidBackHandlerMock,
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';
import { createShowcaseRuntimeCoverage } from './helpers/showcaseRuntimeCoverage';

jest.mock('react-native-safe-area-context', () => {
  const safeAreaMock = jest.requireActual(
    'react-native-safe-area-context/jest/mock'
  ).default;
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    ...safeAreaMock,
    SafeAreaProvider: function MockSafeAreaProvider({
      children,
      ...props
    }: React.ComponentProps<typeof safeAreaMock.SafeAreaProvider>) {
      return ReactModule.createElement(
        View,
        { testID: 'capture-safe-area-provider' },
        ReactModule.createElement(
          safeAreaMock.SafeAreaProvider,
          props,
          children
        )
      );
    },
  };
});

jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual<typeof DesignRuntime>(
    '@unif/react-native-design'
  );
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    ...actual,
    normalizeFontScale: jest.fn(actual.normalizeFontScale),
    ThemeProvider: function MockThemeProvider(
      props: React.ComponentProps<typeof actual.ThemeProvider>
    ) {
      return ReactModule.createElement(
        View,
        { testID: 'capture-theme-provider' },
        ReactModule.createElement(actual.ThemeProvider, props)
      );
    },
    ConfirmHost: function MockConfirmHost({
      children,
    }: {
      children?: React.ReactNode;
    }) {
      return ReactModule.createElement(
        View,
        { testID: 'capture-confirm-host' },
        children
      );
    },
    ToastHost: function MockToastHost({
      children,
    }: {
      children?: React.ReactNode;
    }) {
      return ReactModule.createElement(
        View,
        { testID: 'capture-toast-host' },
        children
      );
    },
  };
});

jest.mock('../state/ShowcaseProvider', () => {
  const actual = jest.requireActual('../state/ShowcaseProvider');
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    ...actual,
    ShowcaseProvider: function MockShowcaseProvider({
      children,
    }: React.ComponentProps<typeof actual.ShowcaseProvider>) {
      return ReactModule.createElement(
        View,
        { testID: 'capture-showcase-provider' },
        ReactModule.createElement(actual.ShowcaseProvider, null, children)
      );
    },
  };
});

jest.mock('../app/ExampleRouter', () => {
  const actual = jest.requireActual('../app/ExampleRouter');
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');

  return {
    ...actual,
    ExampleRouter: function MockExampleRouter() {
      return ReactModule.createElement(
        View,
        { testID: 'capture-example-router' },
        ReactModule.createElement(actual.ExampleRouter)
      );
    },
  };
});

function requireHostNode(
  node: ReactTestRendererNode | null | ReactTestRendererJSON[],
  label: string
): ReactTestRendererJSON {
  if (node === null || typeof node === 'string' || Array.isArray(node)) {
    throw new Error(`${label} 必须是唯一 host 节点`);
  }
  return node;
}

function directHostChildren(
  node: ReactTestRendererJSON
): ReactTestRendererJSON[] {
  return (node.children ?? []).map((child, index) =>
    requireHostNode(child, `${node.props.testID ?? node.type}[${index}]`)
  );
}

function onlyDirectHostChild(
  node: ReactTestRendererJSON
): ReactTestRendererJSON {
  const children = directHostChildren(node);
  expect(children).toHaveLength(1);
  return children[0];
}

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('根装配保持指定 Provider 顺序且两个 Host 各唯一一份', () => {
  installReducedMotionMock(false);
  const mounted = render(<App />);

  const gestureRoot = requireHostNode(mounted.toJSON(), 'App root');
  expect(gestureRoot.props.testID).toBe('capture-gesture-root');

  const safeArea = onlyDirectHostChild(gestureRoot);
  expect(safeArea.props.testID).toBe('capture-safe-area-provider');
  const showcase = onlyDirectHostChild(safeArea);
  expect(showcase.props.testID).toBe('capture-showcase-provider');
  const theme = onlyDirectHostChild(showcase);
  expect(theme.props.testID).toBe('capture-theme-provider');
  expect(directHostChildren(theme).map((child) => child.props.testID)).toEqual([
    'capture-example-router',
    'capture-confirm-host',
    'capture-toast-host',
  ]);
  expect(screen.getAllByTestId('capture-gesture-root')).toHaveLength(1);
  expect(screen.getAllByTestId('capture-safe-area-provider')).toHaveLength(1);
  expect(screen.getAllByTestId('capture-showcase-provider')).toHaveLength(1);
  expect(screen.getAllByTestId('capture-theme-provider')).toHaveLength(1);
  expect(screen.getAllByTestId('capture-example-router')).toHaveLength(1);
  expect(screen.getAllByTestId('capture-confirm-host')).toHaveLength(1);
  expect(screen.getAllByTestId('capture-toast-host')).toHaveLength(1);
  expect(screen.UNSAFE_getAllByType(AppProviders)).toHaveLength(1);
});

test('ThemeProvider 将 system 映射为 undefined，并窄化三档主题与四档字号', () => {
  installReducedMotionMock(false);
  render(<App />);
  const runtimeCoverage = createShowcaseRuntimeCoverage('app');

  runtimeCoverage.prove('ThemeProvider', () => {
    expect(screen.UNSAFE_getByType(ThemeProvider).props).toMatchObject({
      forceScheme: undefined,
      fontScale: 1,
    });
  });
  runtimeCoverage.prove('normalizeFontScale', () => {
    expect(jest.mocked(normalizeFontScale)).toHaveBeenCalledTimes(1);
    expect(jest.mocked(normalizeFontScale)).toHaveBeenCalledWith(1);
    expect(screen.UNSAFE_getByType(ThemeProvider).props.fontScale).toBe(1);
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
  runtimeCoverage.expectComplete();
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
  expect(screen.getByTestId('actions-screen')).toBeOnTheScreen();
  expect(screen.queryByText('设计系统示例')).not.toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  expect(screen.getByText('设计系统示例')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: /反馈与浮层/ }));
  expect(screen.getByTestId('feedback-screen')).toBeOnTheScreen();
  expect(screen.queryByTestId('actions-screen')).not.toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));

  fireEvent.press(screen.getByRole('button', { name: /表单与输入/ }));
  expect(screen.getByTestId('forms-screen')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  fireEvent.press(screen.getByRole('button', { name: /导航组件/ }));
  expect(screen.getByTestId('navigation-screen')).toBeOnTheScreen();
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

test('Android back 离开 Feedback 时恢复默认唯一 Hosts', () => {
  installReducedMotionMock(false);
  const nativeBack = installAndroidBackHandlerMock();
  render(<App />);

  fireEvent.press(screen.getByRole('button', { name: /反馈与浮层/ }));
  fireEvent.press(screen.getByTestId('feedback-hosts-unmount'));
  expect(screen.queryByTestId('capture-confirm-host')).not.toBeOnTheScreen();
  expect(screen.queryByTestId('capture-toast-host')).not.toBeOnTheScreen();

  act(() => {
    expect(nativeBack.getHandler()()).toBe(true);
  });
  expect(screen.getByText('设计系统示例')).toBeOnTheScreen();
  expect(screen.getAllByTestId('capture-confirm-host')).toHaveLength(1);
  expect(screen.getAllByTestId('capture-toast-host')).toHaveLength(1);
});

test('非 Android 根不建立 BackHandler subscription', () => {
  installReducedMotionMock(false);
  const addEventListener = installNonAndroidBackHandlerMock();

  render(<App />);

  expect(addEventListener).not.toHaveBeenCalled();
});

test('系统减少动态效果开启时 Home 与 Foundation 均展示真实事实', () => {
  installReducedMotionMock(true);
  render(<App />);

  expect(screen.getByText('减少动态效果：是')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: /基础能力与图标/ }));
  expect(screen.getByTestId('foundation-screen')).toBeOnTheScreen();
  expect(screen.getByText('减少动态效果：是')).toBeOnTheScreen();
});
