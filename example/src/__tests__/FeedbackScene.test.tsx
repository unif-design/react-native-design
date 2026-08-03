import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import {
  BlurLayer,
  Pulse,
  PulseDot,
  Reveal,
  Skeleton,
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

jest.mock('@sbaiahmed1/react-native-blur', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View: NativeView } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    BlurView: function MockBlurView(
      props: React.ComponentProps<typeof NativeView>
    ) {
      return ReactModule.createElement(NativeView, props);
    },
  };
});

jest.mock('react-native-reanimated', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const reanimatedMock = jest.requireActual<
    typeof import('react-native-reanimated')
  >('react-native-reanimated');
  return {
    ...reanimatedMock,
    useReducedMotion: () => reanimatedMock.useReducedMotion?.() ?? false,
    useSharedValue: <Value,>(initialValue: Value) => {
      const ref = ReactModule.useRef<{ value: Value } | null>(null);
      if (ref.current === null) ref.current = { value: initialValue };
      return ref.current;
    },
  };
});

const toastCases = [
  ['信息', '顶部'],
  ['信息', '居中'],
  ['信息', '底部'],
  ['成功', '顶部'],
  ['成功', '居中'],
  ['成功', '底部'],
  ['错误', '顶部'],
  ['错误', '居中'],
  ['错误', '底部'],
] as const;

function enterFeedback(): void {
  fireEvent.press(screen.getByRole('button', { name: /反馈与浮层/ }));
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
  jest.useRealTimers();
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test('Feedback 展示 Empty、三种 Skeleton 与具备外层加载语义的 Spinner', () => {
  render(<App />);
  enterFeedback();

  expect(screen.getByTestId('feedback-screen')).toBeOnTheScreen();
  expect(screen.getByText('暂无反馈记录')).toBeOnTheScreen();
  expect(
    screen
      .UNSAFE_getAllByType(Skeleton)
      .filter((node) =>
        String(node.props.testID).startsWith('feedback-skeleton-')
      )
      .map((node) => node.props.shape)
  ).toEqual(['line', 'rect', 'circle']);
  for (const id of ['line', 'rect', 'circle']) {
    expect(
      screen.getByTestId(`feedback-skeleton-${id}`, {
        includeHiddenElements: true,
      }).props
    ).toMatchObject({
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
  }
  expect(
    screen.getByRole('progressbar', { name: '正在加载示例' }).props
      .accessibilityState
  ).toMatchObject({ busy: true });
  expect(screen.getByText('加载中')).toBeOnTheScreen();
});

test('Pulse、PulseDot、usePulse 与 Reveal 使用合法 options，并保留子内容语义', () => {
  render(<App />);
  enterFeedback();

  expect(componentByTestID(Pulse, 'feedback-pulse').props).toMatchObject({
    from: 0.45,
    to: 1,
    duration: 700,
    delay: 0,
  });
  expect(componentByTestID(PulseDot, 'feedback-pulse-dot').props).toMatchObject(
    {
      from: 0.5,
      to: 1,
      duration: 500,
    }
  );
  expect(screen.getByText('脉冲内容保持可读')).toBeOnTheScreen();
  expect(screen.getByTestId('feedback-use-pulse')).toHaveStyle({
    opacity: 0.32,
  });
  expect(screen.getByText('减少动态效果：否')).toBeOnTheScreen();
  expect(componentByTestID(Reveal, 'feedback-reveal').props.duration).toBe(200);
  expect(screen.getByText('淡入内容已显示')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: '隐藏淡入内容' }));
  expect(screen.queryByTestId('feedback-reveal')).not.toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '显示淡入内容' }));
  expect(screen.getByTestId('feedback-reveal')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('tab', { name: '立即显示' }));
  expect(componentByTestID(Reveal, 'feedback-reveal').props.duration).toBe(0);
  fireEvent.press(screen.getByRole('tab', { name: '慢速淡入' }));
  expect(componentByTestID(Reveal, 'feedback-reveal').props.duration).toBe(500);
});

test('系统减少动态效果开启时如实展示，不宣称 Spinner 会停止', () => {
  restoreNativeMocks();
  installReducedMotionMock(true);
  render(<App />);
  enterFeedback();

  expect(screen.getByText('减少动态效果：是')).toBeOnTheScreen();
  expect(
    screen.getByText('脉冲与淡入遵循系统设置；加载指示仍保持旋转。')
  ).toBeOnTheScreen();
});

test('BlurLayer 初始不挂载，用户开启后只在有限容器中切换 soft/strong', () => {
  render(<App />);
  enterFeedback();

  expect(screen.queryByTestId('feedback-blur-layer')).not.toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '加载真实模糊演示' }));
  expect(screen.getByTestId('feedback-blur-container')).toHaveStyle({
    position: 'relative',
    overflow: 'hidden',
  });
  expect(
    componentByTestID(BlurLayer, 'feedback-blur-layer').props.intensity
  ).toBe('soft');
  fireEvent.press(screen.getByRole('tab', { name: '强模糊' }));
  expect(
    componentByTestID(BlurLayer, 'feedback-blur-layer').props.intensity
  ).toBe('strong');
  fireEvent.press(screen.getByRole('button', { name: '卸载真实模糊演示' }));
  expect(screen.queryByTestId('feedback-blur-layer')).not.toBeOnTheScreen();
});

test.each(toastCases)(
  'Toast 真实展示%s提示与%s位置并写入请求事实',
  (kind, position) => {
    jest.useFakeTimers();
    render(<App />);
    enterFeedback();

    fireEvent.press(
      screen.getByRole('button', { name: `展示${kind}${position}提示` })
    );

    expect(screen.getByText(`${kind}提示 · ${position}`)).toBeOnTheScreen();
    expect(
      screen.getByText(
        `最新结果：Toast · 请求展示 · 已请求展示：${kind}、${position}`
      )
    ).toBeOnTheScreen();
    act(() => {
      jest.advanceTimersByTime(10_000);
    });
  }
);

test('Toast 连续调用遵守 latest-wins，页面不把 void API 伪称为 settled', () => {
  jest.useFakeTimers();
  render(<App />);
  enterFeedback();

  fireEvent.press(screen.getByRole('button', { name: '展示信息顶部提示' }));
  fireEvent.press(screen.getByRole('button', { name: '展示错误底部提示' }));

  expect(screen.getByText('错误提示 · 底部')).toBeOnTheScreen();
  expect(screen.queryByText('信息提示 · 顶部')).not.toBeOnTheScreen();
  expect(
    screen.getByText('最新结果：Toast · 请求展示 · 已请求展示：错误、底部')
  ).toBeOnTheScreen();
  expect(screen.queryByText(/Toast.*已完成/)).not.toBeOnTheScreen();
  act(() => {
    jest.advanceTimersByTime(10_000);
  });
});

test('普通 Confirm 的确认与取消均在 Promise settled 后写真实结果', async () => {
  render(<App />);
  enterFeedback();

  fireEvent.press(screen.getByRole('button', { name: '打开普通确认' }));
  expect(screen.getByText('继续当前操作？')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '确认继续' }));
  await waitFor(() => {
    expect(
      screen.getByText('最新结果：Confirm · 普通确认 · 已确认')
    ).toBeOnTheScreen();
  });

  fireEvent.press(screen.getByRole('button', { name: '打开普通确认' }));
  fireEvent.press(screen.getByRole('button', { name: '取消操作' }));
  await waitFor(() => {
    expect(
      screen.getByText('最新结果：Confirm · 普通确认 · 已取消')
    ).toBeOnTheScreen();
  });
});

test('破坏性 Confirm 的确认与取消均在 Promise settled 后写真实结果', async () => {
  render(<App />);
  enterFeedback();

  fireEvent.press(screen.getByRole('button', { name: '打开破坏性确认' }));
  expect(screen.getByText('删除示例记录？')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '确认删除' }));
  await waitFor(() => {
    expect(
      screen.getByText('最新结果：Confirm · 破坏性确认 · 已确认')
    ).toBeOnTheScreen();
  });

  fireEvent.press(screen.getByRole('button', { name: '打开破坏性确认' }));
  fireEvent.press(screen.getByRole('button', { name: '保留内容' }));
  await waitFor(() => {
    expect(
      screen.getByText('最新结果：Confirm · 破坏性确认 · 已取消')
    ).toBeOnTheScreen();
  });
});

test('Reveal 与 Blur draft 跨路由保留，重置只影响 Feedback', () => {
  render(<App />);
  enterFeedback();

  fireEvent.press(screen.getByRole('button', { name: '隐藏淡入内容' }));
  fireEvent.press(screen.getByRole('button', { name: '加载真实模糊演示' }));
  fireEvent.press(screen.getByRole('tab', { name: '强模糊' }));
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterFeedback();

  expect(screen.queryByTestId('feedback-reveal')).not.toBeOnTheScreen();
  expect(
    componentByTestID(BlurLayer, 'feedback-blur-layer').props.intensity
  ).toBe('strong');

  fireEvent.press(screen.getByRole('button', { name: '重置本场景' }));
  expect(screen.getByTestId('feedback-reveal')).toBeOnTheScreen();
  expect(screen.queryByTestId('feedback-blur-layer')).not.toBeOnTheScreen();
});
