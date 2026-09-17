import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import {
  Pulse,
  PulseDot,
  Skeleton,
  ThemeProvider,
} from '@unif/react-native-design';

let mockReducedMotion = false;
// 临时消费者没有相邻 library src，内部平台替身从真实公开入口定位。
function mockLibraryPath(segment: string): string {
  const path = require('node:path');
  return path.join(
    path.dirname(require.resolve('@unif/react-native-design')),
    segment
  );
}
jest.mock(mockLibraryPath('theme'), () => ({
  ...jest.requireActual(mockLibraryPath('theme')),
  usePrefersReducedMotion: () => mockReducedMotion,
}));
// 测真实 Web 驱动的计时/释放，平台偏好是唯一事实替身；不声称验证 native worklet。
jest.mock(mockLibraryPath('components/ui/shared/pulse/usePulseDriver'), () =>
  jest.requireActual(
    mockLibraryPath('components/ui/shared/pulse/usePulseDriver.web')
  )
);

beforeEach(() => {
  jest.useFakeTimers();
  mockReducedMotion = false;
});
afterEach(() => {
  jest.useRealTimers();
});
const opacity = (id: string) =>
  StyleSheet.flatten(
    screen.getByTestId(id, { includeHiddenElements: true }).props.style
  ).opacity;

test('Pulse、圆点和 Skeleton 独立默认值通过共享驱动显示，卸载释放计时', () => {
  const view = render(
    <ThemeProvider>
      <Pulse testID="pulse">
        <Text>内容</Text>
      </Pulse>
      <PulseDot testID="dot" />
      <Skeleton testID="skeleton" />
    </ThemeProvider>
  );
  expect(opacity('pulse')).toBe(0.6);
  expect(opacity('dot')).toBe(0.5);
  expect(opacity('skeleton')).toBe(0.5);
  act(() => jest.advanceTimersByTime(700));
  expect(opacity('pulse')).toBe(1);
  expect(opacity('dot')).toBe(1);
  expect(opacity('skeleton')).toBe(1);
  act(() => jest.advanceTimersByTime(700));
  expect(opacity('pulse')).toBe(0.6);
  expect(opacity('dot')).toBe(0.5);
  view.unmount();
  expect(jest.getTimerCount()).toBe(0);
});

test('显式参数更新、延迟、减弱动效恢复不沿用旧周期', () => {
  const view = render(
    <ThemeProvider>
      <PulseDot testID="dot" from={0.2} to={0.8} duration={100} delay={50} />
    </ThemeProvider>
  );
  act(() => jest.advanceTimersByTime(149));
  expect(opacity('dot')).toBe(0.2);
  // 相同参数的新 props 对象不能把尚未结束的半周期重新计时。
  view.rerender(
    <ThemeProvider>
      <PulseDot testID="dot" from={0.2} to={0.8} duration={100} delay={50} />
    </ThemeProvider>
  );
  act(() => jest.advanceTimersByTime(1));
  expect(opacity('dot')).toBe(0.8);
  view.rerender(
    <ThemeProvider>
      <PulseDot testID="dot" from={0.3} to={0.9} duration={200} />
    </ThemeProvider>
  );
  expect(opacity('dot')).toBe(0.3);
  act(() => jest.advanceTimersByTime(100));
  expect(opacity('dot')).toBe(0.3);
  mockReducedMotion = true;
  view.rerender(
    <ThemeProvider>
      <PulseDot testID="dot" from={0.3} to={0.9} duration={200} />
    </ThemeProvider>
  );
  expect(opacity('dot')).toBe(0.9);
  expect(jest.getTimerCount()).toBe(0);
  mockReducedMotion = false;
  view.rerender(
    <ThemeProvider>
      <PulseDot testID="dot" from={0.3} to={0.9} duration={200} />
    </ThemeProvider>
  );
  expect(opacity('dot')).toBe(0.3);
  act(() => jest.advanceTimersByTime(200));
  expect(opacity('dot')).toBe(0.9);
  view.unmount();
  expect(jest.getTimerCount()).toBe(0);
});
