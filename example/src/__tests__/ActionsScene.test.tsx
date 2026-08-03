import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  Button,
  Chip,
  IconButton,
  Spinner,
  StatusDot,
  Tag,
} from '@unif/react-native-design';
import App from '../App';
import {
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';

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

const buttonVariants = [
  'primary',
  'secondary',
  'ghost',
  'neutral',
  'outline',
  'danger',
  'text',
] as const;
const buttonSizes = ['sm', 'md', 'lg'] as const;
const iconButtonVariants = buttonVariants.filter(
  (variant) => variant !== 'text'
);
const tagVariants = [
  'neutral',
  'brand',
  'success',
  'error',
  'info',
  'outline',
] as const;
const tagSizes = ['md', 'lg'] as const;
const statuses = ['pending', 'active', 'done', 'error'] as const;
const statusTones = ['flat', 'soft'] as const;

function enterActions(): void {
  fireEvent.press(screen.getByRole('button', { name: /操作与状态/ }));
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

test('Actions 展示 Button 全部 variant、size、block、左右图标与真实禁用状态', () => {
  render(<App />);
  enterActions();

  expect(screen.getByTestId('actions-screen')).toBeOnTheScreen();
  for (const variant of buttonVariants) {
    expect(
      componentByTestID(Button, `actions-button-variant-${variant}`).props
        .variant
    ).toBe(variant);
  }
  for (const size of buttonSizes) {
    expect(
      componentByTestID(Button, `actions-button-size-${size}`).props.size
    ).toBe(size);
  }
  expect(componentByTestID(Button, 'actions-button-icons').props).toMatchObject(
    {
      block: true,
      leftIcon: 'check',
      rightIcon: 'arrow-right',
    }
  );

  const disabled = screen.getByRole('button', { name: '禁用按钮' });
  const loading = screen.getByRole('button', { name: '加载按钮' });
  expect(disabled.props.accessibilityState).toMatchObject({
    disabled: true,
    busy: false,
  });
  expect(loading.props.accessibilityState).toMatchObject({
    disabled: true,
    busy: true,
  });
  fireEvent.press(disabled);
  fireEvent.press(loading);
  expect(screen.queryByTestId('result-latest')).not.toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: '运行配置按钮' }));
  expect(
    screen.getByText('最新结果：Button · 点击 · 配置按钮已触发')
  ).toBeOnTheScreen();
});

test('Button 配置切换后跨路由保留，返回 Actions 仍使用同一 draft', () => {
  render(<App />);
  enterActions();

  fireEvent.press(screen.getByRole('tab', { name: '危险' }));
  fireEvent.press(screen.getByRole('tab', { name: '大尺寸' }));
  expect(
    componentByTestID(Button, 'actions-configured-button').props
  ).toMatchObject({
    variant: 'danger',
    size: 'lg',
  });

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterActions();
  expect(
    screen.getByRole('tab', { name: '危险' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    screen.getByRole('tab', { name: '大尺寸' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    componentByTestID(Button, 'actions-configured-button').props
  ).toMatchObject({
    variant: 'danger',
    size: 'lg',
  });
});

test('IconButton 覆盖公开 variant/size/color 且每个实例都有中文可访问名称', () => {
  render(<App />);
  enterActions();

  const specimens = screen
    .UNSAFE_getAllByType(IconButton)
    .filter((node) =>
      String(node.props.testID).startsWith('actions-icon-button-')
    );
  expect(
    specimens
      .filter((node) => String(node.props.testID).includes('variant'))
      .map((node) => node.props.variant)
  ).toEqual(iconButtonVariants);
  expect(
    specimens
      .filter((node) => String(node.props.testID).includes('size'))
      .map((node) => node.props.size)
  ).toEqual(buttonSizes);
  for (const specimen of specimens) {
    expect(specimen.props.accessibilityLabel).toEqual(expect.any(String));
    expect(specimen.props.accessibilityLabel.trim()).not.toBe('');
    expect(specimen.props.accessibilityLabel).toMatch(
      /^[\u3400-\u9fff，。：、]+$/
    );
  }
  expect(
    componentByTestID(IconButton, 'actions-icon-button-color').props.color
  ).toEqual(expect.any(String));

  expect(
    screen.getByRole('button', { name: '禁用图标按钮' }).props
      .accessibilityState
  ).toMatchObject({ disabled: true, busy: false });
  expect(
    screen.getByRole('button', { name: '加载图标按钮' }).props
      .accessibilityState
  ).toMatchObject({ disabled: true, busy: true });
  fireEvent.press(screen.getByRole('button', { name: '禁用图标按钮' }));
  fireEvent.press(screen.getByRole('button', { name: '加载图标按钮' }));
  expect(screen.queryByTestId('result-latest')).not.toBeOnTheScreen();
});

test('Chip 覆盖静态、selected、disabled、busy 与前后插槽，只有真实点击写结果', () => {
  render(<App />);
  enterActions();

  expect(screen.getByText('静态标签')).toBeOnTheScreen();
  expect(
    screen.queryByRole('button', { name: '静态标签' })
  ).not.toBeOnTheScreen();
  expect(
    screen.getByRole('button', { name: '可选择标签' }).props.accessibilityState
  ).toMatchObject({ selected: false, disabled: false, busy: false });

  fireEvent.press(screen.getByRole('button', { name: '可选择标签' }));
  expect(
    screen.getByRole('button', { name: '可选择标签' }).props.accessibilityState
  ).toMatchObject({ selected: true });
  expect(
    screen.getByText('最新结果：Chip · 选择 · 标签已选中')
  ).toBeOnTheScreen();

  const disabled = screen.getByRole('button', { name: '禁用标签' });
  const busy = screen.getByRole('button', { name: '处理中标签' });
  const busyDisabled = screen.getByRole('button', {
    name: '禁用处理中标签',
  });
  expect(disabled.props.accessibilityState).toMatchObject({
    disabled: true,
    busy: false,
  });
  expect(busy.props.accessibilityState).toMatchObject({
    disabled: true,
    busy: true,
  });
  expect(busyDisabled.props.accessibilityState).toMatchObject({
    disabled: true,
    busy: true,
  });
  fireEvent.press(disabled);
  fireEvent.press(busy);
  fireEvent.press(busyDisabled);
  expect(
    screen.getByText('最新结果：Chip · 选择 · 标签已选中')
  ).toBeOnTheScreen();
  const busyDisabledSpecimen = screen
    .UNSAFE_getAllByType(Chip)
    .find((node) => node.props.label === '禁用处理中标签');
  expect(busyDisabledSpecimen).toBeDefined();
  expect(busyDisabledSpecimen?.findAllByType(Spinner)).toHaveLength(1);
  expect(componentByTestID(Chip, 'actions-chip-slots').props).toMatchObject({
    leading: expect.anything(),
    trailing: expect.anything(),
  });
});

test('Tag 展示 6×2 纯展示矩阵，StatusDot 展示 4×2 且只使用中文状态名称', () => {
  render(<App />);
  enterActions();

  const tagSpecimens = screen
    .UNSAFE_getAllByType(Tag)
    .filter((node) => String(node.props.testID).startsWith('actions-tag-'));
  expect(tagSpecimens).toHaveLength(tagVariants.length * tagSizes.length);
  expect(
    tagSpecimens.map((node) => [node.props.variant, node.props.size])
  ).toEqual(
    tagVariants.flatMap((variant) => tagSizes.map((size) => [variant, size]))
  );

  const statusSpecimens = screen
    .UNSAFE_getAllByType(StatusDot)
    .filter((node) => String(node.props.testID).startsWith('actions-status-'));
  expect(statusSpecimens).toHaveLength(statuses.length * statusTones.length);
  expect(
    statusSpecimens.map((node) => [node.props.status, node.props.tone])
  ).toEqual(
    statuses.flatMap((status) => statusTones.map((tone) => [status, tone]))
  );
  for (const specimen of statusSpecimens) {
    expect(specimen.props.accessibilityLabel).toMatch(
      /^[\u3400-\u9fff，。：、]+$/
    );
  }
});
