import React from 'react';
import { act, render } from '@testing-library/react-native';
import {
  ThemeProvider,
  ToastHost,
  toast,
  motion,
} from '@unif/react-native-design';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('原生提示退场完成后卸载背景和内容，不依赖 worklet 回传 JS 投递对象', async () => {
  const page = render(
    <ThemeProvider>
      <ToastHost testID="toast" />
    </ThemeProvider>
  );
  await act(async () => {
    toast({ message: '已复制', duration: 1000 });
  });
  expect(page.getByText('已复制')).toBeTruthy();
  act(() => jest.advanceTimersByTime(1000 + motion.base));
  expect(page.queryByTestId('toast')).toBeNull();
});

test('旧提示退场时出现新提示，不会被旧定时器移除', async () => {
  const page = render(
    <ThemeProvider>
      <ToastHost testID="toast" />
    </ThemeProvider>
  );
  await act(async () => {
    toast({ message: '旧提示', duration: 1000 });
  });
  act(() => jest.advanceTimersByTime(1000));
  act(() => toast({ message: '新提示', duration: 1000 }));
  act(() => jest.advanceTimersByTime(motion.base));
  expect(page.getByText('新提示')).toBeTruthy();
  act(() => jest.advanceTimersByTime(1000));
  expect(page.queryByTestId('toast')).toBeNull();
});
