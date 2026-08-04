import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DrawerHeader,
  Input,
  NavBar,
  Segmented,
  TabBar,
} from '@unif/react-native-design';
import App from '../App';
import {
  installAndroidBackHandlerMock,
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';
import { createShowcaseStateCoverage } from './helpers/showcaseStateCoverage';

const LOCAL_DRAWER_SOURCE = require('../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');

jest.mock(
  '../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
  () => 1
);

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

function enterNavigation(): void {
  fireEvent.press(screen.getByRole('button', { name: /导航组件/ }));
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
  installReducedMotionMock(false);
});

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('NavBar 展示三种 variant、action/display slot，DrawerHeader 保持纯展示 fallback', () => {
  render(<App />);
  enterNavigation();
  const navBarCoverage = createShowcaseStateCoverage('NavBar');
  const drawerCoverage = createShowcaseStateCoverage('DrawerHeader');

  expect(screen.getByTestId('navigation-screen')).toBeOnTheScreen();
  expect(
    componentByTestID(NavBar, 'navigation-navbar-default').props
  ).toMatchObject({
    variant: 'default',
    left: {
      icon: 'arrow-left',
      accessibilityLabel: '演示返回动作',
    },
    right: {
      icon: 'more-h',
      accessibilityLabel: '演示更多动作',
    },
  });
  navBarCoverage.prove('nav-bar.title', 'nav-bar.back', () => {
    expect(
      componentByTestID(NavBar, 'navigation-navbar-default').props
    ).toMatchObject({
      variant: 'default',
      left: { icon: 'arrow-left', accessibilityLabel: '演示返回动作' },
    });
  });
  expect(
    componentByTestID(NavBar, 'navigation-navbar-brand').props.variant
  ).toBe('brand');
  expect(
    componentByTestID(NavBar, 'navigation-navbar-transparent').props.variant
  ).toBe('transparent');

  fireEvent.press(screen.getByRole('button', { name: '演示更多动作' }));
  expect(
    screen.getByText('最新结果：NavBar · 操作 · 更多动作已触发')
  ).toBeOnTheScreen();
  navBarCoverage.prove('nav-bar.actions', () => {
    expect(
      screen.getByText('最新结果：NavBar · 操作 · 更多动作已触发')
    ).toBeOnTheScreen();
  });
  expect(screen.getByText('展示槽')).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: '展示槽' })
  ).not.toBeOnTheScreen();
  const sceneSafeArea = screen
    .UNSAFE_getAllByType(SafeAreaView)
    .find(
      (candidate) =>
        candidate.findAllByProps({ testID: 'navigation-screen' }).length > 0
    );
  expect(sceneSafeArea?.props.edges).toEqual(['top', 'left', 'right']);
  navBarCoverage.prove('nav-bar.safe-area', () => {
    expect(sceneSafeArea?.props.edges).toEqual(['top', 'left', 'right']);
  });
  navBarCoverage.expectComplete();

  expect(
    componentByTestID(DrawerHeader, 'navigation-drawer-header').props
  ).toMatchObject({
    name: '王小明',
    subtitle: '华东区 · 管理员',
  });
  drawerCoverage.prove('drawer-header.name', 'drawer-header.subtitle', () => {
    expect(
      componentByTestID(DrawerHeader, 'navigation-drawer-header').props
    ).toMatchObject({ name: '王小明', subtitle: '华东区 · 管理员' });
  });
  expect(
    componentByTestID(DrawerHeader, 'navigation-drawer-header').props
  ).not.toHaveProperty('source');
  expect(
    screen.getByText('王', { includeHiddenElements: true })
  ).toBeOnTheScreen();
  drawerCoverage.prove('drawer-header.initial-fallback', () => {
    expect(
      screen.getByText('王', { includeHiddenElements: true })
    ).toBeOnTheScreen();
  });
  expect(
    componentByTestID(DrawerHeader, 'navigation-drawer-header-source').props
      .source
  ).toBe(LOCAL_DRAWER_SOURCE);
  drawerCoverage.prove('drawer-header.avatar-source', () => {
    expect(
      componentByTestID(DrawerHeader, 'navigation-drawer-header-source').props
        .source
    ).toBe(LOCAL_DRAWER_SOURCE);
  });
  expect(
    screen.queryByRole('button', { name: /王小明/ })
  ).not.toBeOnTheScreen();
  drawerCoverage.expectComplete();
});

test('NavBar 输出真实标题，且所在 scene 由 top/left/right SafeAreaView 包裹', () => {
  render(<App />);
  enterNavigation();

  expect(screen.getByText('默认导航')).toBeOnTheScreen();
  expect(
    componentByTestID(NavBar, 'navigation-navbar-default').props.title
  ).toBe('默认导航');

  const sceneSafeArea = screen
    .UNSAFE_getAllByType(SafeAreaView)
    .find(
      (candidate) =>
        candidate.findAllByProps({ testID: 'navigation-screen' }).length > 0
    );
  expect(sceneSafeArea).toBeDefined();
  expect(sceneSafeArea?.props.edges).toEqual(['top', 'left', 'right']);
  expect(
    sceneSafeArea
      ?.findAllByType(NavBar)
      .some((navBar) => navBar.props.testID === 'navigation-navbar-default')
  ).toBe(true);
});

test('DrawerHeader source specimen 渲染真实 Image，加载失败后回退姓名首字', () => {
  render(<App />);
  enterNavigation();

  const sourceHeader = componentByTestID(
    DrawerHeader,
    'navigation-drawer-header-source'
  );
  expect(sourceHeader.props.source).toBe(LOCAL_DRAWER_SOURCE);
  const avatarImage = screen.UNSAFE_getByType(Image);
  expect(avatarImage.props.source).toBe(LOCAL_DRAWER_SOURCE);
  expect(
    screen.queryByText('李', { includeHiddenElements: true })
  ).not.toBeOnTheScreen();

  fireEvent(avatarImage, 'error');
  expect(
    screen.getByText('李', { includeHiddenElements: true })
  ).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: /李晓雨/ })
  ).not.toBeOnTheScreen();
});

test('Tabs 与 Segmented 使用 tablist/tab 的 selected、item disabled、global disabled 语义', () => {
  render(<App />);
  enterNavigation();
  const tabsCoverage = createShowcaseStateCoverage('Tabs');
  const segmentedCoverage = createShowcaseStateCoverage('Segmented');

  for (const testID of [
    'navigation-tabs',
    'navigation-tabs-global-disabled',
    'navigation-segmented-md',
    'navigation-segmented-sm',
    'navigation-segmented-disabled',
    'navigation-tabbar',
  ]) {
    expect(screen.getByTestId(testID).props.accessibilityRole).toBe('tablist');
  }
  const overview = screen.getByRole('tab', { name: '概览' });
  expect(overview.props.accessibilityState).toMatchObject({
    selected: true,
    disabled: false,
  });
  tabsCoverage.prove('tabs.selected', () => {
    expect(overview.props.accessibilityState).toMatchObject({
      selected: true,
      disabled: false,
    });
  });
  fireEvent.press(screen.getByRole('tab', { name: '详情' }));
  expect(
    screen.getByRole('tab', { name: '详情' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    screen.getByText('最新结果：Tabs · 选择 · 已选择详情')
  ).toBeOnTheScreen();
  tabsCoverage.prove('tabs.change', () => {
    expect(
      screen.getByRole('tab', { name: '详情' }).props.accessibilityState
    ).toMatchObject({ selected: true });
  });

  const disabledTab = screen.getByRole('tab', { name: '禁用页签' });
  expect(disabledTab.props.accessibilityState).toMatchObject({
    disabled: true,
  });
  tabsCoverage.prove('tabs.item-disabled', () => {
    expect(disabledTab.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });
  fireEvent.press(disabledTab);
  expect(
    screen.getByRole('tab', { name: '详情' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  fireEvent.press(screen.getByRole('tab', { name: '全局乙' }));
  expect(
    screen.getByText('最新结果：Tabs · 选择 · 已选择详情')
  ).toBeOnTheScreen();
  for (const label of ['全局甲', '全局乙']) {
    expect(
      screen.getByRole('tab', { name: label }).props.accessibilityState
    ).toMatchObject({ disabled: true });
  }
  tabsCoverage.prove('tabs.all-disabled', () => {
    expect(
      screen.getByRole('tab', { name: '全局乙' }).props.accessibilityState
    ).toMatchObject({ disabled: true });
  });
  tabsCoverage.expectComplete();

  expect(
    componentByTestID(Segmented, 'navigation-segmented-md').props.size
  ).toBe('md');
  expect(
    componentByTestID(Segmented, 'navigation-segmented-sm').props.size
  ).toBe('sm');
  segmentedCoverage.prove('segmented.sizes', () => {
    expect(
      componentByTestID(Segmented, 'navigation-segmented-sm').props.size
    ).toBe('sm');
  });
  fireEvent.press(screen.getByRole('tab', { name: '第二段' }));
  expect(
    screen.getByRole('tab', { name: '第二段' }).props.accessibilityState
  ).toMatchObject({ selected: true, disabled: false });
  segmentedCoverage.prove('segmented.selected', () => {
    expect(
      screen.getByRole('tab', { name: '第二段' }).props.accessibilityState
    ).toMatchObject({ selected: true, disabled: false });
  });
  expect(
    screen.getByRole('tab', { name: '禁用分段' }).props.accessibilityState
  ).toMatchObject({ disabled: true });
  fireEvent.press(screen.getByRole('tab', { name: '禁用分段' }));
  expect(
    screen.getByRole('tab', { name: '第二段' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    screen.getByText('最新结果：Segmented · 选择 · 已选择第二段')
  ).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('tab', { name: '锁定乙' }));
  expect(
    screen.getByText('最新结果：Segmented · 选择 · 已选择第二段')
  ).toBeOnTheScreen();
  for (const label of ['锁定甲', '锁定乙']) {
    expect(
      screen.getByRole('tab', { name: label }).props.accessibilityState
    ).toMatchObject({ disabled: true });
  }
  segmentedCoverage.prove('segmented.disabled', () => {
    expect(
      screen.getByRole('tab', { name: '禁用分段' }).props.accessibilityState
    ).toMatchObject({ disabled: true });
  });
  segmentedCoverage.expectComplete();
});

test('TabBar selected 与数字/99+ badge 进入可访问名称，选择仅更新 specimen', () => {
  render(<App />);
  enterNavigation();
  const stateCoverage = createShowcaseStateCoverage('TabBar');

  expect(componentByTestID(TabBar, 'navigation-tabbar').props.active).toBe(
    'home'
  );
  expect(
    screen.getByRole('tab', { name: '首页' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  stateCoverage.prove('tab-bar.selected', () => {
    expect(
      screen.getByRole('tab', { name: '首页' }).props.accessibilityState
    ).toMatchObject({ selected: true });
  });
  expect(screen.getByRole('tab', { name: '消息,3条未读' })).toBeOnTheScreen();
  stateCoverage.prove('tab-bar.numeric-badge', () => {
    expect(screen.getByRole('tab', { name: '消息,3条未读' })).toBeOnTheScreen();
  });
  expect(screen.getByRole('tab', { name: '任务,99+条未读' })).toBeOnTheScreen();
  stateCoverage.prove('tab-bar.overflow-badge', 'tab-bar.a11y', () => {
    expect(
      screen.getByRole('tab', { name: '任务,99+条未读' })
    ).toBeOnTheScreen();
  });

  fireEvent.press(screen.getByRole('tab', { name: '消息,3条未读' }));
  expect(
    screen.getByRole('tab', { name: '消息,3条未读' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(screen.getByTestId('navigation-screen')).toBeOnTheScreen();
  expect(screen.queryByText('设计系统示例')).not.toBeOnTheScreen();
  expect(
    screen.getByText('最新结果：TabBar · 选择 · 已选择消息')
  ).toBeOnTheScreen();
  stateCoverage.expectComplete();
});

test('specimen 选择跨路由保留，重置 Navigation 不改变 Forms draft 或当前 route', () => {
  render(<App />);
  enterNavigation();

  fireEvent.press(screen.getByRole('tab', { name: '详情' }));
  fireEvent.press(screen.getByRole('tab', { name: '第二段' }));
  fireEvent.press(screen.getByRole('tab', { name: '任务,99+条未读' }));
  expect(screen.getByTestId('navigation-screen')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  fireEvent.press(screen.getByRole('button', { name: /表单与输入/ }));
  fireEvent.changeText(
    screen.getByTestId('forms-input-controlled-input'),
    '保留的姓名草稿'
  );
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterNavigation();

  expect(
    screen.getByRole('tab', { name: '详情' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    screen.getByRole('tab', { name: '第二段' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    screen.getByRole('tab', { name: '任务,99+条未读' }).props.accessibilityState
  ).toMatchObject({ selected: true });

  fireEvent.press(screen.getByRole('button', { name: '重置本场景' }));
  expect(screen.getByTestId('navigation-screen')).toBeOnTheScreen();
  expect(
    screen.getByRole('tab', { name: '概览' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    screen.getByRole('tab', { name: '第一段' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    screen.getByRole('tab', { name: '首页' }).props.accessibilityState
  ).toMatchObject({ selected: true });

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  fireEvent.press(screen.getByRole('button', { name: /表单与输入/ }));
  expect(componentByTestID(Input, 'forms-input-controlled').props.value).toBe(
    '保留的姓名草稿'
  );
});

test('Android hardware back 仍只有 App 一次订阅，specimen 不消费 typed route', () => {
  restoreNativeMocks();
  installReducedMotionMock(false);
  const nativeBack = installAndroidBackHandlerMock();
  render(<App />);

  expect(nativeBack.addEventListener).toHaveBeenCalledTimes(1);
  enterNavigation();
  fireEvent.press(screen.getByRole('tab', { name: '详情' }));
  fireEvent.press(screen.getByRole('tab', { name: '消息,3条未读' }));
  expect(nativeBack.addEventListener).toHaveBeenCalledTimes(1);

  act(() => {
    expect(nativeBack.getHandler()()).toBe(true);
  });
  expect(screen.getByText('设计系统示例')).toBeOnTheScreen();
  expect(screen.queryByTestId('navigation-screen')).not.toBeOnTheScreen();
  expect(nativeBack.addEventListener).toHaveBeenCalledTimes(1);
  expect(nativeBack.getHandler()()).toBe(false);
});
