import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { usePrefersReducedMotion } from '../../../src/theme/usePrefersReducedMotion.web';
import { useReducedTransparency } from '../../../src/theme/useReducedTransparency';

const originalMatchMedia = Object.getOwnPropertyDescriptor(
  globalThis,
  'matchMedia'
);

afterEach(() => {
  if (originalMatchMedia) {
    Object.defineProperty(globalThis, 'matchMedia', originalMatchMedia);
  } else {
    Reflect.deleteProperty(globalThis, 'matchMedia');
  }
  jest.restoreAllMocks();
});

test('Web 无 matchMedia 时安全返回默认偏好', () => {
  Reflect.deleteProperty(globalThis, 'matchMedia');
  const hook = renderHook(usePrefersReducedMotion);
  expect(hook.result.current).toBe(false);
  hook.unmount();
});

test('Web 系统减少动效的初始值、变更及取消订阅使用同一个查询', () => {
  let notify: (() => void) | undefined;
  const query = {
    matches: true,
    addEventListener: jest.fn((_event: string, listener: () => void) => {
      notify = listener;
    }),
    removeEventListener: jest.fn(),
  };
  const matchMedia = jest.fn(() => query);
  Object.defineProperty(globalThis, 'matchMedia', {
    configurable: true,
    value: matchMedia,
  });
  const hook = renderHook(usePrefersReducedMotion);
  expect(hook.result.current).toBe(true);
  expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  act(() => {
    query.matches = false;
    notify?.();
  });
  expect(hook.result.current).toBe(false);
  hook.unmount();
  expect(query.removeEventListener).toHaveBeenCalledWith('change', notify);
});

test('系统透明度查询拒绝后维持实色，卸载释放监听', async () => {
  const remove = jest.fn();
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockReturnValue({ remove });
  jest
    .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
    .mockRejectedValue(new Error('系统设置暂不可读'));
  const hook = renderHook(useReducedTransparency);
  await act(async () => {});
  expect(hook.result.current).toBe(true);
  hook.unmount();
  expect(remove).toHaveBeenCalledTimes(1);
});

test('没有强制主题时实际跟随系统深色偏好', () => {
  const RN = require('react-native') as typeof import('react-native');
  const React = require('react') as typeof import('react');
  const { ThemeProvider, useTheme } =
    require('@unif/react-native-design') as typeof import('@unif/react-native-design');
  jest.spyOn(RN, 'useColorScheme').mockReturnValue('dark');
  const hook = renderHook(useTheme, {
    wrapper: ({ children }) =>
      React.createElement(ThemeProvider, null, children),
  });
  expect(hook.result.current.scheme).toBe('dark');
});
