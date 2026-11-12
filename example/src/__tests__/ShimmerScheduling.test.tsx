import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { act, render } from '@testing-library/react-native';
import {
  MotionScope,
  ShimmerText,
  ThemeProvider,
} from '@unif/react-native-design';

beforeEach(() => {
  jest.useFakeTimers();
  // 保留真实 Animated 插值与计时，仅将设备帧时钟固定为 16ms。
  jest
    .spyOn(Animated, 'loop')
    .mockImplementation(
      jest.requireActual(
        'react-native/Libraries/Animated/AnimatedImplementation'
      ).default.loop
    );
  jest
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((callback) =>
      Number(setTimeout(() => callback(performance.now()), 16))
    );
  jest
    .spyOn(globalThis, 'cancelAnimationFrame')
    .mockImplementation((handle) => clearTimeout(handle));
});

afterEach(() => jest.useRealTimers());

test('文字恢复底色后的空闲区间不再请求动画帧，下一轮仍按原周期扫光', async () => {
  const page = await render(
    <ThemeProvider>
      <ShimmerText style={{ color: '#222222' }}>小U识别中</ShimmerText>
    </ThemeProvider>
  );
  await act(() => jest.advanceTimersByTime(1600));
  const frames = jest.mocked(requestAnimationFrame).mock.calls.length;
  expect(frames).toBeGreaterThan(0);
  await act(() => jest.advanceTimersByTime(1600));
  expect(jest.mocked(requestAnimationFrame).mock.calls).toHaveLength(frames);
  await act(() => jest.advanceTimersByTime(1000));
  expect(jest.mocked(requestAnimationFrame).mock.calls.length).toBeGreaterThan(
    frames
  );
  await page.unmount();
  const stopped = jest.mocked(requestAnimationFrame).mock.calls.length;
  await act(() => jest.advanceTimersByTime(5000));
  expect(jest.mocked(requestAnimationFrame).mock.calls).toHaveLength(stopped);
});

test('保留逐字文字、布局属性与原有线性扫光颜色', async () => {
  const page = await render(
    <ThemeProvider>
      <ShimmerText
        testID="progress"
        style={{ color: '#222222', fontSize: 16 }}
        numberOfLines={1}
        accessibilityLabel="小U识别中"
      >
        AB
      </ShimmerText>
    </ThemeProvider>
  );
  const label = page.getByTestId('progress');
  expect(label.props.numberOfLines).toBe(1);
  expect(label.props.accessibilityLabel).toBe('小U识别中');
  expect(StyleSheet.flatten(label.props.style)).toMatchObject({ fontSize: 16 });
  expect(page.getByText('A')).toBeOnTheScreen();
  expect(page.getByText('B')).toBeOnTheScreen();
  const colors = () =>
    ['A', 'B'].map(
      (text) => StyleSheet.flatten(page.getByText(text).props.style).color
    );
  expect(colors()).toEqual(['rgba(34, 34, 34, 1)', 'rgba(34, 34, 34, 1)']);
  await act(() => jest.advanceTimersByTime(400));
  expect(colors()).toEqual([
    'rgba(248, 248, 248, 1)',
    'rgba(137, 137, 137, 1)',
  ]);
  await act(() => jest.advanceTimersByTime(1200));
  expect(colors()).toEqual(['rgba(34, 34, 34, 1)', 'rgba(34, 34, 34, 1)']);
  await act(() => jest.advanceTimersByTime(2800));
  expect(colors()).toEqual([
    'rgba(248, 248, 248, 1)',
    'rgba(137, 137, 137, 1)',
  ]);
});

test.each([
  { pausedAt: 400, expectedColor: 'rgba(248, 248, 248, 1)' },
  { pausedAt: 411, expectedColor: 'rgba(248, 248, 248, 1)' },
  { pausedAt: 1800, expectedColor: 'rgba(34, 34, 34, 1)' },
  { pausedAt: 40400, expectedColor: 'rgba(248, 248, 248, 1)' },
  { pausedAt: 80400, expectedColor: 'rgba(248, 248, 248, 1)' },
])(
  '在第 $pausedAt ms 隐藏时停止帧与等待定时器，恢复后接续原相位',
  async ({ pausedAt, expectedColor }) => {
    const content = (active: boolean) => (
      <ThemeProvider>
        <MotionScope active={active}>
          <ShimmerText style={{ color: '#222222' }}>AB</ShimmerText>
        </MotionScope>
      </ThemeProvider>
    );
    const page = await render(content(true));
    await act(() => jest.advanceTimersByTime(pausedAt));
    const character = page.getByText('A');
    const color = () => StyleSheet.flatten(character.props.style).color;
    const before = color();
    expect(before).toBe(expectedColor);
    await page.rerender(content(false));
    const frames = jest.mocked(requestAnimationFrame).mock.calls.length;
    await act(() => jest.advanceTimersByTime(10000));
    expect(jest.mocked(requestAnimationFrame).mock.calls).toHaveLength(frames);
    expect(color()).toBe(before);
    await page.rerender(content(true));
    expect(page.getByText('A')).toBe(character);
    expect(color()).toBe(before);
    await act(() => jest.advanceTimersByTime(4000));
    expect(
      jest.mocked(requestAnimationFrame).mock.calls.length
    ).toBeGreaterThan(frames);
  }
);
