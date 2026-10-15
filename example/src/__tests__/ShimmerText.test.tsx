import React from 'react';
import { act, cleanup, render } from '@testing-library/react-native';
import { Animated, StyleSheet, Text } from 'react-native';
import {
  ShimmerText,
  ThemeProvider,
  lightColors,
} from '@unif/react-native-design';

const reanimated = jest.requireMock<typeof import('react-native-reanimated')>(
  'react-native-reanimated'
);

const realLoop = jest.requireActual(
  'react-native/Libraries/Animated/AnimatedImplementation'
).default.loop;
function controlledTiming(value: Parameters<typeof Animated.timing>[0]) {
  return {
    value,
    start: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    _isUsingNativeDriver: () => false,
    _startNativeLoop: jest.fn(),
  };
}
let animations: ReturnType<typeof controlledTiming>[];

beforeEach(() => {
  jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(false);
  animations = [];
  jest.spyOn(Animated, 'loop').mockImplementation(realLoop);
  jest.spyOn(Animated, 'timing').mockImplementation((value) => {
    const animation = controlledTiming(value);
    animations.push(animation);
    return animation;
  });
});
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

const view = (text = '思考中', active = true) => (
  <ThemeProvider fontScale={1.5}>
    <ShimmerText
      testID="status"
      active={active}
      style={{
        color: lightColors.foregroundMuted,
        fontSize: 18,
        lineHeight: 24,
      }}
      numberOfLines={1}
      accessibilityLabel={text}
    >
      {text}
    </ShimmerText>
  </ThemeProvider>
);

test('公开文字组件保留文案、原生文字参数和调用方字号，只启动一个非交互循环', () => {
  const page = render(view());
  expect(page.getByLabelText('思考中')).toBeOnTheScreen();
  const status = page.getByTestId('status');
  expect(status).toHaveTextContent('思考中');
  expect(status.props.numberOfLines).toBe(1);
  expect(StyleSheet.flatten(status.props.style)).toMatchObject({
    fontSize: 18,
    lineHeight: 24,
    color: lightColors.foregroundMuted,
  });
  expect(Animated.timing).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      duration: 4000,
      useNativeDriver: true,
      isInteraction: false,
    })
  );
  page.rerender(view());
  expect(animations).toHaveLength(1);
});

test('文字换代、结束和卸载停止各自循环，迟到帧不会重新启动旧状态', () => {
  const page = render(view());
  const first = animations[0]!;
  const finish = first.start.mock.calls[0]![0];
  page.rerender(view('小U识别中'));
  expect(first.stop).toHaveBeenCalledTimes(1);
  expect(animations[1]!.value).not.toBe(first.value);
  act(() => finish({ finished: true }));
  expect(first.start).toHaveBeenCalledTimes(1);
  page.rerender(view('已思考', false));
  expect(animations[1]!.stop).toHaveBeenCalledTimes(1);
  expect(page.getByTestId('status')).toHaveTextContent('已思考');
  expect(page.UNSAFE_queryAllByType(Animated.Text)).toHaveLength(0);
  page.rerender(view());
  const current = animations[2]!;
  page.unmount();
  expect(current.stop).toHaveBeenCalledTimes(1);
});

test('减少动态效果和空文字保持静态，恢复后从新的循环开始', () => {
  jest.mocked(reanimated.useReducedMotion).mockReturnValue(true);
  const page = render(view());
  expect(animations).toHaveLength(0);
  expect(page.getByTestId('status')).toHaveTextContent('思考中');
  jest.mocked(reanimated.useReducedMotion).mockReturnValue(false);
  page.rerender(view());
  const first = animations[0]!;
  jest.mocked(reanimated.useReducedMotion).mockReturnValue(true);
  page.rerender(view());
  expect(first.stop).toHaveBeenCalledTimes(1);
  jest.mocked(reanimated.useReducedMotion).mockReturnValue(false);
  page.rerender(view(''));
  expect(animations).toHaveLength(1);
  expect(page.getByTestId('status')).toHaveTextContent('');
});

test('可嵌入原有文字行，静态后缀不随状态文字变化结构或字号', () => {
  const page = render(
    <ThemeProvider>
      <Text testID="line" numberOfLines={1} style={{ fontSize: 15 }}>
        <ShimmerText style={{ color: lightColors.foregroundMuted }}>
          小U识别中
        </ShimmerText>
        {' · 商品甲'}
      </Text>
    </ThemeProvider>
  );
  expect(page.getByTestId('line')).toHaveTextContent('小U识别中 · 商品甲');
  expect(page.getByTestId('line').props.numberOfLines).toBe(1);
});
