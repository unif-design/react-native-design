import React from 'react';
import type { ReactTestInstance } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import {
  BlurLayer,
  Empty,
  Pulse,
  PulseDot,
  Reveal,
  Skeleton,
  Spinner,
  confirm,
  r,
  space,
  toast,
  usePulse,
} from '@unif/react-native-design';
import App from '../App';
import {
  installReducedMotionMock,
  restoreNativeMocks,
} from './helpers/nativeMocks';
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

jest.mock('@unif/react-native-design', () => {
  const actual = jest.requireActual<typeof import('@unif/react-native-design')>(
    '@unif/react-native-design'
  );
  return {
    ...actual,
    confirm: jest.fn(actual.confirm),
    usePulse: jest.fn(actual.usePulse),
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

function enterFoundation(): void {
  fireEvent.press(screen.getByRole('button', { name: /基础能力与图标/ }));
}

function hostChild(node: ReactTestInstance, index: number): ReactTestInstance {
  const child = node.children[index];
  if (!child || typeof child === 'string') {
    throw new Error(`未找到第 ${index + 1} 个 host child`);
  }
  return child;
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
  const emptyCoverage = createShowcaseStateCoverage('Empty');
  const skeletonCoverage = createShowcaseStateCoverage('Skeleton');
  const spinnerCoverage = createShowcaseStateCoverage('Spinner');

  expect(screen.getByTestId('feedback-screen')).toBeOnTheScreen();
  expect(screen.UNSAFE_getByType(Empty).props).toMatchObject({
    title: '暂无反馈记录',
    desc: '触发下方动作后可在结果面板查看安全摘要。',
    icon: 'clipboard',
  });
  emptyCoverage.prove(
    'empty.title',
    'empty.description',
    'empty.custom-icon',
    () => {
      expect(screen.UNSAFE_getByType(Empty).props).toMatchObject({
        title: '暂无反馈记录',
        desc: '触发下方动作后可在结果面板查看安全摘要。',
        icon: 'clipboard',
      });
    }
  );
  emptyCoverage.expectComplete();
  expect(
    screen
      .UNSAFE_getAllByType(Skeleton)
      .filter((node) =>
        String(node.props.testID).startsWith('feedback-skeleton-')
      )
      .map((node) => node.props.shape)
  ).toEqual(['line', 'rect', 'circle']);
  skeletonCoverage.prove(
    'skeleton.line',
    'skeleton.rect',
    'skeleton.circle',
    () => {
      expect(
        screen
          .UNSAFE_getAllByType(Skeleton)
          .filter((node) =>
            String(node.props.testID).startsWith('feedback-skeleton-')
          )
          .map((node) => node.props.shape)
      ).toEqual(['line', 'rect', 'circle']);
    }
  );
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
  skeletonCoverage.expectComplete();
  expect(componentByTestID(Spinner, 'feedback-spinner').props).toMatchObject({
    size: 24,
    color: expect.any(String),
    thickness: 3,
  });
  spinnerCoverage.prove(
    'spinner.sizes',
    'spinner.color',
    'spinner.stroke-width',
    () => {
      expect(
        componentByTestID(Spinner, 'feedback-spinner').props
      ).toMatchObject({ size: 24, color: expect.any(String), thickness: 3 });
    }
  );
  expect(
    screen.getByRole('progressbar', { name: '正在加载示例' }).props
  ).toMatchObject({
    accessibilityState: { busy: true },
    accessibilityLiveRegion: 'polite',
  });
  expect(screen.getByText('加载中')).toBeOnTheScreen();
  spinnerCoverage.expectComplete();
});

test('Pulse、PulseDot、usePulse 与 Reveal 使用合法 options，并保留子内容语义', () => {
  const pulseCoverage = createShowcaseStateCoverage('Pulse');
  const pulseDotCoverage = createShowcaseStateCoverage('PulseDot');
  const revealCoverage = createShowcaseStateCoverage('Reveal');
  const { unmount } = render(<App />);
  enterFeedback();

  const defaultPulse = componentByTestID(Pulse, 'feedback-pulse-default');
  expect(defaultPulse.props.from).toBeUndefined();
  expect(defaultPulse.props.to).toBeUndefined();
  expect(defaultPulse.props.duration).toBeUndefined();
  expect(defaultPulse.props.delay).toBeUndefined();
  expect(screen.getByTestId('feedback-pulse-default')).toHaveStyle({
    opacity: 0.6,
  });
  pulseCoverage.prove('pulse.default', () => {
    expect(screen.getByTestId('feedback-pulse-default')).toHaveStyle({
      opacity: 0.6,
    });
  });
  expect(componentByTestID(Pulse, 'feedback-pulse').props).toMatchObject({
    from: 0.45,
    to: 1,
    duration: 700,
    delay: 0,
  });
  pulseCoverage.prove(
    'pulse.opacity-range',
    'pulse.duration',
    'pulse.delay',
    () => {
      expect(componentByTestID(Pulse, 'feedback-pulse').props).toMatchObject({
        from: 0.45,
        to: 1,
        duration: 700,
        delay: 0,
      });
    }
  );
  expect(componentByTestID(PulseDot, 'feedback-pulse-dot').props).toMatchObject(
    {
      from: 0.5,
      to: 1,
      duration: 500,
    }
  );
  pulseDotCoverage.prove('pulse-dot.custom-timing', () => {
    expect(
      componentByTestID(PulseDot, 'feedback-pulse-dot').props
    ).toMatchObject({ from: 0.5, to: 1, duration: 500 });
  });
  const defaultPulseDot = componentByTestID(
    PulseDot,
    'feedback-pulse-dot-default'
  );
  expect(defaultPulseDot.props.size).toBeUndefined();
  expect(defaultPulseDot.props.color).toBeUndefined();
  expect(defaultPulseDot.props.from).toBeUndefined();
  expect(defaultPulseDot.props.to).toBeUndefined();
  expect(defaultPulseDot.props.duration).toBeUndefined();
  expect(defaultPulseDot.props.delay).toBeUndefined();
  expect(
    screen.getByTestId('feedback-pulse-dot-default', {
      includeHiddenElements: true,
    })
  ).toHaveStyle({ width: r(6), height: r(6), opacity: 0.5 });
  pulseDotCoverage.prove('pulse-dot.default', () => {
    expect(
      screen.getByTestId('feedback-pulse-dot-default', {
        includeHiddenElements: true,
      })
    ).toHaveStyle({ width: r(6), height: r(6), opacity: 0.5 });
  });
  const sizeColorDot = componentByTestID(
    PulseDot,
    'feedback-pulse-dot-size-color'
  );
  expect(sizeColorDot.props).toMatchObject({
    size: 12,
    color: expect.any(String),
  });
  expect(
    screen.getByTestId('feedback-pulse-dot-size-color', {
      includeHiddenElements: true,
    })
  ).toHaveStyle({
    width: 12,
    height: 12,
    backgroundColor: sizeColorDot.props.color,
  });
  pulseDotCoverage.prove('pulse-dot.sizes', 'pulse-dot.color', () => {
    expect(sizeColorDot.props).toMatchObject({
      size: 12,
      color: expect.any(String),
    });
  });
  expect(screen.getByText('脉冲内容保持可读')).toBeOnTheScreen();
  expect(screen.getByTestId('feedback-use-pulse')).toHaveStyle({
    opacity: 0.32,
  });
  expect(screen.getByText('减少动态效果：否')).toBeOnTheScreen();
  expect(componentByTestID(Reveal, 'feedback-reveal').props.duration).toBe(200);
  expect(screen.getByTestId('feedback-reveal').props.entering).toBeDefined();
  revealCoverage.prove('reveal.enter', 'reveal.duration', () => {
    expect(componentByTestID(Reveal, 'feedback-reveal').props.duration).toBe(
      200
    );
  });
  expect(screen.getByTestId('feedback-reveal')).toHaveStyle({
    padding: space['4'],
  });
  revealCoverage.prove('reveal.container-style', () => {
    expect(screen.getByTestId('feedback-reveal')).toHaveStyle({
      padding: space['4'],
    });
  });
  expect(screen.getByText('淡入内容已显示')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('button', { name: '隐藏淡入内容' }));
  expect(screen.queryByTestId('feedback-reveal')).not.toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '显示淡入内容' }));
  expect(screen.getByTestId('feedback-reveal')).toBeOnTheScreen();

  fireEvent.press(screen.getByRole('tab', { name: '立即显示' }));
  expect(componentByTestID(Reveal, 'feedback-reveal').props.duration).toBe(0);
  fireEvent.press(screen.getByRole('tab', { name: '慢速淡入' }));
  expect(componentByTestID(Reveal, 'feedback-reveal').props.duration).toBe(500);

  unmount();
  restoreNativeMocks();
  installReducedMotionMock(true);
  render(<App />);
  enterFeedback();
  for (const testID of ['feedback-pulse-default', 'feedback-pulse'] as const) {
    expect(
      screen.getByTestId(testID, { includeHiddenElements: true })
    ).toHaveStyle({ opacity: 1 });
  }
  pulseCoverage.prove('pulse.reduced-motion', () => {
    expect(
      screen.getByTestId('feedback-pulse', { includeHiddenElements: true })
    ).toHaveStyle({ opacity: 1 });
  });
  for (const testID of [
    'feedback-pulse-dot-default',
    'feedback-pulse-dot-size-color',
    'feedback-pulse-dot',
  ] as const) {
    expect(
      screen.getByTestId(testID, { includeHiddenElements: true })
    ).toHaveStyle({ opacity: 1 });
  }
  pulseDotCoverage.prove('pulse-dot.reduced-motion', () => {
    expect(
      screen.getByTestId('feedback-pulse-dot', { includeHiddenElements: true })
    ).toHaveStyle({ opacity: 1 });
  });
  const reducedReveal = screen.getByTestId('feedback-reveal');
  expect(reducedReveal.props.entering).toBeUndefined();
  expect(reducedReveal.props.exiting).toBeUndefined();
  revealCoverage.prove('reveal.reduced-motion', () => {
    expect(reducedReveal.props.entering).toBeUndefined();
  });
  pulseCoverage.expectComplete();
  pulseDotCoverage.expectComplete();
  revealCoverage.expectComplete();
});

test('系统减少动态效果开启时 Pulse、PulseDot 与 Reveal 真实停用非必要动画', () => {
  restoreNativeMocks();
  installReducedMotionMock(true);
  render(<App />);
  enterFeedback();

  expect(screen.getByText('减少动态效果：是')).toBeOnTheScreen();
  expect(
    screen.getByText('脉冲与淡入遵循系统设置；加载指示仍保持旋转。')
  ).toBeOnTheScreen();
  for (const [testID, opacity] of [
    ['feedback-pulse-default', 1],
    ['feedback-pulse', 1],
    ['feedback-pulse-dot-default', 1],
    ['feedback-pulse-dot-size-color', 1],
    ['feedback-pulse-dot', 1],
    ['feedback-use-pulse', 0.92],
  ] as const) {
    expect(
      screen.getByTestId(testID, { includeHiddenElements: true })
    ).toHaveStyle({ opacity });
  }
  const reducedReveal = screen.getByTestId('feedback-reveal');
  expect(reducedReveal.props.entering).toBeUndefined();
  expect(reducedReveal.props.exiting).toBeUndefined();
});

test('BlurLayer 初始不挂载，用户开启后只在有限容器中切换 soft/strong', () => {
  render(<App />);
  enterFeedback();

  expect(screen.queryByTestId('feedback-blur-layer')).not.toBeOnTheScreen();
  expect(screen.getByText('BlurLayer 组件未挂载')).toBeOnTheScreen();
  expect(
    screen.getByText(
      '自动化只证明组件是否已挂载；实际模糊效果需在已链接原生模块的真机或模拟器验证。'
    )
  ).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '挂载 BlurLayer 演示' }));
  expect(screen.getByTestId('feedback-blur-container')).toHaveStyle({
    position: 'relative',
    overflow: 'hidden',
  });
  expect(screen.getByText('BlurLayer 组件已挂载')).toBeOnTheScreen();
  expect(
    componentByTestID(BlurLayer, 'feedback-blur-layer').props
  ).toMatchObject({ intensity: 'soft', tint: expect.any(String) });
  const blurLayer = screen.getByTestId('feedback-blur-layer');
  expect(StyleSheet.flatten(hostChild(blurLayer, 1).props.style)).toMatchObject(
    {
      backgroundColor: componentByTestID(BlurLayer, 'feedback-blur-layer').props
        .tint,
    }
  );
  fireEvent.press(screen.getByRole('tab', { name: '强模糊' }));
  expect(
    componentByTestID(BlurLayer, 'feedback-blur-layer').props.intensity
  ).toBe('strong');
  fireEvent.press(screen.getByRole('button', { name: '卸载 BlurLayer 演示' }));
  expect(screen.queryByTestId('feedback-blur-layer')).not.toBeOnTheScreen();
  expect(screen.getByText('BlurLayer 组件未挂载')).toBeOnTheScreen();
});

test('BlurLayer 随 ThemeProvider 在 light/dark 间切换原生 blurType', () => {
  render(<App />);
  const stateCoverage = createShowcaseStateCoverage('BlurLayer');
  enterFoundation();
  fireEvent.press(screen.getByRole('tab', { name: '深色' }));
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterFeedback();
  fireEvent.press(screen.getByRole('button', { name: '挂载 BlurLayer 演示' }));

  const darkBlurLayer = componentByTestID(BlurLayer, 'feedback-blur-layer');
  expect(darkBlurLayer.props).toMatchObject({
    intensity: 'soft',
    tint: expect.any(String),
  });
  stateCoverage.prove('blur-layer.soft', 'blur-layer.custom-tint', () => {
    expect(darkBlurLayer.props).toMatchObject({
      intensity: 'soft',
      tint: expect.any(String),
    });
  });
  expect(
    hostChild(screen.getByTestId('feedback-blur-layer'), 0).props.blurType
  ).toBe('dark');
  fireEvent.press(screen.getByRole('tab', { name: '强模糊' }));
  expect(
    componentByTestID(BlurLayer, 'feedback-blur-layer').props.intensity
  ).toBe('strong');
  stateCoverage.prove('blur-layer.strong', () => {
    expect(
      componentByTestID(BlurLayer, 'feedback-blur-layer').props.intensity
    ).toBe('strong');
  });

  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterFoundation();
  fireEvent.press(screen.getByRole('tab', { name: '浅色' }));
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  enterFeedback();

  expect(
    hostChild(screen.getByTestId('feedback-blur-layer'), 0).props.blurType
  ).toBe('light');
  stateCoverage.prove('blur-layer.theme', () => {
    expect(
      hostChild(screen.getByTestId('feedback-blur-layer'), 0).props.blurType
    ).toBe('light');
  });
  stateCoverage.expectComplete();
});

test.each(toastCases)(
  'Toast 真实展示%s提示与%s位置并写入请求事实',
  (kind, position) => {
    jest.useFakeTimers();
    const infoSpy = jest.spyOn(toast, 'info');
    const successSpy = jest.spyOn(toast, 'success');
    const errorSpy = jest.spyOn(toast, 'error');
    const spies = {
      信息: infoSpy,
      成功: successSpy,
      错误: errorSpy,
    } as const;
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
    expect(spies[kind]).toHaveBeenCalledTimes(1);
    expect(spies[kind]).toHaveBeenCalledWith({
      message: `${kind}提示 · ${position}`,
      position:
        position === '顶部' ? 'top' : position === '居中' ? 'center' : 'bottom',
      duration: 10_000,
    });
    for (const [otherKind, spy] of Object.entries(spies)) {
      if (otherKind !== kind) expect(spy).not.toHaveBeenCalled();
    }
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

test('用户显式卸载 Host 后 Confirm 安全返回 false，Toast 在重挂后补投', async () => {
  jest.useFakeTimers();
  render(<App />);
  enterFeedback();

  expect(screen.getByTestId('feedback-host-status')).toHaveTextContent(
    '全局 Host：已挂载'
  );
  fireEvent.press(screen.getByTestId('feedback-hosts-unmount'));
  expect(screen.getByTestId('feedback-host-status')).toHaveTextContent(
    '全局 Host：已卸载'
  );

  fireEvent.press(screen.getByTestId('feedback-confirm-no-host'));
  await waitFor(() => {
    expect(
      screen.getByText(
        '最新结果：ConfirmHost · 无 Host · 未挂载时安全返回 false'
      )
    ).toBeOnTheScreen();
  });
  expect(screen.queryByText('无 Host 确认不会显示')).not.toBeOnTheScreen();

  fireEvent.press(screen.getByTestId('feedback-toast-pre-host'));
  expect(screen.queryByText('Host 重挂后补投的提示')).not.toBeOnTheScreen();
  fireEvent.press(screen.getByTestId('feedback-hosts-remount'));
  expect(screen.getByTestId('feedback-host-status')).toHaveTextContent(
    '全局 Host：已挂载'
  );
  expect(screen.getByText('Host 重挂后补投的提示')).toBeOnTheScreen();

  act(() => {
    jest.advanceTimersByTime(10_000);
  });
});

test('重置与返回会恢复 Hosts，pre-host 静态提示在返回时如实补投', () => {
  jest.useFakeTimers();
  render(<App />);
  enterFeedback();

  fireEvent.press(screen.getByTestId('feedback-hosts-unmount'));
  fireEvent.press(screen.getByRole('button', { name: '重置本场景' }));
  expect(screen.getByTestId('feedback-host-status')).toHaveTextContent(
    '全局 Host：已挂载'
  );

  fireEvent.press(screen.getByTestId('feedback-hosts-unmount'));
  fireEvent.press(screen.getByTestId('feedback-toast-pre-host'));
  fireEvent.press(screen.getByRole('button', { name: '返回首页' }));
  expect(screen.getByText('设计系统示例')).toBeOnTheScreen();
  expect(screen.getByText('Host 重挂后补投的提示')).toBeOnTheScreen();

  enterFeedback();
  expect(screen.getByTestId('feedback-host-status')).toHaveTextContent(
    '全局 Host：已挂载'
  );
  act(() => {
    jest.advanceTimersByTime(10_000);
  });
});

test('连续调用 Confirm 时第二个请求返回 false，第一个仍由用户结算', async () => {
  render(<App />);
  enterFeedback();

  fireEvent.press(screen.getByTestId('feedback-confirm-reentrant'));

  expect(screen.getByText('第一个连续确认')).toBeOnTheScreen();
  expect(screen.queryByText('第二个连续确认')).not.toBeOnTheScreen();
  await waitFor(() => {
    expect(
      screen.getByText(
        '最新结果：ConfirmHost · 重入保护 · 第二个请求已返回 false；第一个仍待处理'
      )
    ).toBeOnTheScreen();
  });

  fireEvent.press(screen.getByRole('button', { name: '完成第一个请求' }));
  await waitFor(() => {
    expect(
      screen.getByText('最新结果：ConfirmHost · 重入结算 · 第一个请求已确认')
    ).toBeOnTheScreen();
  });
});

test('ConfirmHost 与 ToastHost 的全部公开状态都由真实命令结果证明', async () => {
  jest.useFakeTimers();
  const infoSpy = jest.spyOn(toast, 'info');
  const successSpy = jest.spyOn(toast, 'success');
  const errorSpy = jest.spyOn(toast, 'error');
  const toastSpies = {
    信息: infoSpy,
    成功: successSpy,
    错误: errorSpy,
  } as const;
  render(<App />);
  enterFeedback();
  const confirmCoverage = createShowcaseStateCoverage('ConfirmHost');
  const toastCoverage = createShowcaseStateCoverage('ToastHost');
  const runtimeCoverage = createShowcaseRuntimeCoverage('feedback');

  runtimeCoverage.prove('usePulse', () => {
    expect(jest.mocked(usePulse)).toHaveBeenCalledWith({
      from: 0.32,
      to: 0.92,
      duration: 700,
      delay: 0,
    });
    expect(screen.getByTestId('feedback-use-pulse')).toHaveStyle({
      opacity: 0.32,
    });
  });

  for (const [kind, position] of [
    ['信息', '顶部'],
    ['成功', '居中'],
    ['错误', '底部'],
  ] as const) {
    fireEvent.press(
      screen.getByRole('button', { name: `展示${kind}${position}提示` })
    );
    expect(screen.getByText(`${kind}提示 · ${position}`)).toBeOnTheScreen();
    expect(toastSpies[kind]).toHaveBeenLastCalledWith({
      message: `${kind}提示 · ${position}`,
      position:
        position === '顶部' ? 'top' : position === '居中' ? 'center' : 'bottom',
      duration: 10_000,
    });
  }
  toastCoverage.prove(
    'toast-host.kinds',
    'toast-host.positions',
    'toast-host.duration',
    () => {
      expect(errorSpy).toHaveBeenLastCalledWith({
        message: '错误提示 · 底部',
        position: 'bottom',
        duration: 10_000,
      });
    }
  );
  runtimeCoverage.prove('toast', () => {
    expect(errorSpy).toHaveBeenLastCalledWith({
      message: '错误提示 · 底部',
      position: 'bottom',
      duration: 10_000,
    });
  });

  fireEvent.press(screen.getByRole('button', { name: '展示信息顶部提示' }));
  fireEvent.press(screen.getByRole('button', { name: '展示错误底部提示' }));
  expect(screen.getByText('错误提示 · 底部')).toBeOnTheScreen();
  expect(screen.queryByText('信息提示 · 顶部')).not.toBeOnTheScreen();
  toastCoverage.prove('toast-host.latest-wins', () => {
    expect(screen.queryByText('信息提示 · 顶部')).not.toBeOnTheScreen();
  });

  fireEvent.press(screen.getByTestId('feedback-hosts-unmount'));
  fireEvent.press(screen.getByTestId('feedback-confirm-no-host'));
  await waitFor(() => {
    expect(
      screen.getByText(
        '最新结果：ConfirmHost · 无 Host · 未挂载时安全返回 false'
      )
    ).toBeOnTheScreen();
  });
  expect(screen.queryByText('无 Host 确认不会显示')).not.toBeOnTheScreen();
  confirmCoverage.prove('confirm-host.no-host', () => {
    expect(screen.queryByText('无 Host 确认不会显示')).not.toBeOnTheScreen();
  });

  fireEvent.press(screen.getByTestId('feedback-toast-pre-host'));
  expect(screen.queryByText('Host 重挂后补投的提示')).not.toBeOnTheScreen();
  fireEvent.press(screen.getByTestId('feedback-hosts-remount'));
  expect(screen.getByText('Host 重挂后补投的提示')).toBeOnTheScreen();
  toastCoverage.prove('toast-host.pre-host', () => {
    expect(screen.getByText('Host 重挂后补投的提示')).toBeOnTheScreen();
  });
  toastCoverage.expectComplete();

  fireEvent.press(screen.getByRole('button', { name: '打开普通确认' }));
  expect(screen.getByText('继续当前操作？')).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '确认继续' }));
  await waitFor(() => {
    expect(
      screen.getByText('最新结果：Confirm · 普通确认 · 已确认')
    ).toBeOnTheScreen();
  });
  confirmCoverage.prove('confirm-host.confirm', () => {
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
  confirmCoverage.prove('confirm-host.cancel', () => {
    expect(
      screen.getByText('最新结果：Confirm · 普通确认 · 已取消')
    ).toBeOnTheScreen();
  });

  fireEvent.press(screen.getByRole('button', { name: '打开破坏性确认' }));
  expect(screen.getByText('删除示例记录？')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: '确认删除' })).toBeOnTheScreen();
  fireEvent.press(screen.getByRole('button', { name: '保留内容' }));
  await waitFor(() => {
    expect(
      screen.getByText('最新结果：Confirm · 破坏性确认 · 已取消')
    ).toBeOnTheScreen();
  });
  confirmCoverage.prove('confirm-host.destructive', () => {
    expect(
      screen.getByText('最新结果：Confirm · 破坏性确认 · 已取消')
    ).toBeOnTheScreen();
  });

  fireEvent.press(screen.getByTestId('feedback-confirm-reentrant'));
  expect(screen.getByText('第一个连续确认')).toBeOnTheScreen();
  expect(screen.queryByText('第二个连续确认')).not.toBeOnTheScreen();
  await waitFor(() => {
    expect(
      screen.getByText(
        '最新结果：ConfirmHost · 重入保护 · 第二个请求已返回 false；第一个仍待处理'
      )
    ).toBeOnTheScreen();
  });
  fireEvent.press(screen.getByRole('button', { name: '完成第一个请求' }));
  await waitFor(() => {
    expect(
      screen.getByText('最新结果：ConfirmHost · 重入结算 · 第一个请求已确认')
    ).toBeOnTheScreen();
  });
  confirmCoverage.prove('confirm-host.reentrant', () => {
    expect(
      screen.getByText('最新结果：ConfirmHost · 重入结算 · 第一个请求已确认')
    ).toBeOnTheScreen();
  });
  confirmCoverage.expectComplete();
  runtimeCoverage.prove('confirm', () => {
    expect(jest.mocked(confirm)).toHaveBeenCalledWith(
      expect.objectContaining({ title: '继续当前操作？' })
    );
    expect(
      screen.getByText('最新结果：ConfirmHost · 重入结算 · 第一个请求已确认')
    ).toBeOnTheScreen();
  });
  runtimeCoverage.expectComplete();

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
  fireEvent.press(screen.getByRole('button', { name: '挂载 BlurLayer 演示' }));
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
  fireEvent.press(screen.getByRole('button', { name: '挂载 BlurLayer 演示' }));
  expect(
    componentByTestID(BlurLayer, 'feedback-blur-layer').props.intensity
  ).toBe('soft');
});
