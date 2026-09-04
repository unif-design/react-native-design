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
  BorderBeam,
  BlurLayer,
  CircularProgress,
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
import { restoreNativeMocks } from './helpers/nativeMocks';
import { setReducedMotion } from './helpers/reducedMotion';
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
    toast: {
      ...actual.toast,
      error: jest.fn(actual.toast.error),
      info: jest.fn(actual.toast.info),
      success: jest.fn(actual.toast.success),
    },
    usePulse: jest.fn(actual.usePulse),
  };
});

jest.mock('react-native-reanimated', () =>
  require('./helpers/reducedMotion').reanimatedWithReducedMotion()
);

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
  setReducedMotion(false);
});

afterEach(() => {
  jest.useRealTimers();
  restoreNativeMocks();
  setReducedMotion(false);
  jest.restoreAllMocks();
});

test('Feedback 展示 Empty、Skeleton、确定进度与具备外层加载语义的 Spinner', () => {
  render(<App />);
  enterFeedback();
  const emptyCoverage = createShowcaseStateCoverage('Empty');
  const skeletonCoverage = createShowcaseStateCoverage('Skeleton');
  const circularProgressCoverage =
    createShowcaseStateCoverage('CircularProgress');
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
    'empty.data-boundary',
    () => {
      expect(
        componentByTestID(Empty, 'feedback-empty-data-boundary').props
      ).toMatchObject({
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
  expect(
    componentByTestID(CircularProgress, 'feedback-circular-progress-ring').props
  ).toMatchObject({
    value: 0.42,
    accessibilityLabel: '文件上传进度',
  });
  expect(
    componentByTestID(CircularProgress, 'feedback-circular-progress-label')
      .props
  ).toMatchObject({ value: 0.68, showLabel: true });
  expect(
    screen.getByRole('progressbar', { name: '文件上传进度' }).props
      .accessibilityValue
  ).toMatchObject({ min: 0, max: 100, now: 42, text: '42%' });
  circularProgressCoverage.prove(
    'circular-progress.determinate',
    'circular-progress.label',
    'circular-progress.a11y-value',
    () => {
      expect(
        componentByTestID(CircularProgress, 'feedback-circular-progress-label')
          .props.showLabel
      ).toBe(true);
    }
  );
  circularProgressCoverage.expectComplete();
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

test('BorderBeam 展示默认、停用和自定义边框流光，业务加载语义由外层承载', () => {
  render(<App />);
  enterFeedback();
  const coverage = createShowcaseStateCoverage('BorderBeam');

  expect(
    componentByTestID(BorderBeam, 'feedback-border-beam-default').props
  ).toMatchObject({});
  coverage.prove('border-beam.default', () => {
    expect(screen.getByText('默认流光')).toBeOnTheScreen();
  });

  expect(
    componentByTestID(BorderBeam, 'feedback-border-beam-inactive').props
  ).toMatchObject({ active: false });
  coverage.prove('border-beam.inactive', () => {
    expect(screen.getByText('已停用')).toBeOnTheScreen();
  });

  expect(
    componentByTestID(BorderBeam, 'feedback-border-beam-custom').props
  ).toMatchObject({
    color: expect.any(String),
    duration: 1800,
    lineWidth: 3,
    size: 56,
    borderRadius: expect.any(Number),
  });
  coverage.prove(
    'border-beam.color',
    'border-beam.duration',
    'border-beam.line-width',
    'border-beam.size',
    'border-beam.radius',
    () => {
      expect(screen.getByText('图片处理中')).toBeOnTheScreen();
    }
  );
  expect(
    screen.getByRole('progressbar', { name: '图片处理示例' }).props
  ).toMatchObject({ accessibilityState: { busy: true } });
  coverage.prove('border-beam.reduced-motion', () => {
    expect(
      screen.getByText('流光遵循系统减少动态效果设置。')
    ).toBeOnTheScreen();
  });
  coverage.expectComplete();
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
  setReducedMotion(true);
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
  setReducedMotion(true);
  render(<App />);
  enterFeedback();

  expect(screen.getByText('减少动态效果：是')).toBeOnTheScreen();
  expect(
    screen.getByText('脉冲、流光与淡入遵循系统设置；加载指示仍保持旋转。')
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

test('Feedback 不暴露根级 ConfirmHost 与 ToastHost 的生命周期控制', () => {
  render(<App />);
  enterFeedback();

  expect(screen.queryByTestId('feedback-host-status')).not.toBeOnTheScreen();
  expect(screen.queryByTestId('feedback-hosts-unmount')).not.toBeOnTheScreen();
  expect(screen.queryByTestId('feedback-hosts-remount')).not.toBeOnTheScreen();
  expect(
    screen.queryByTestId('feedback-confirm-no-host')
  ).not.toBeOnTheScreen();
  expect(screen.queryByTestId('feedback-toast-pre-host')).not.toBeOnTheScreen();
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
  const infoSpy = jest.mocked(toast.info);
  const successSpy = jest.mocked(toast.success);
  const errorSpy = jest.mocked(toast.error);
  const assertToastErrorProof = () => {
    const input = errorSpy.mock.calls[0]?.[0];
    if (
      errorSpy.mock.calls.length !== 1 ||
      typeof input !== 'object' ||
      input === null ||
      !('message' in input) ||
      input.message !== '错误提示 · 底部'
    ) {
      throw new Error('SHOWCASE_TOAST_ERROR_PROOF');
    }
  };
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
    if (kind === '错误') assertToastErrorProof();
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
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(successSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenLastCalledWith({
      message: '信息提示 · 顶部',
      position: 'top',
      duration: 10_000,
    });
    expect(successSpy).toHaveBeenLastCalledWith({
      message: '成功提示 · 居中',
      position: 'center',
      duration: 10_000,
    });
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
    expect(jest.mocked(confirm)).toHaveBeenCalledTimes(5);
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
