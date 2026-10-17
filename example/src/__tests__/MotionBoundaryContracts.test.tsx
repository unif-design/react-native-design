import React from 'react';
import { act, render, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import {
  PulseDot,
  Reveal,
  Spinner,
  ThemeProvider,
  usePulse,
} from '@unif/react-native-design';
import { usePulseDriver as useNativePulse } from '../../../src/components/ui/shared/pulse/usePulseDriver';
import { usePulseDriver as useWebPulse } from '../../../src/components/ui/shared/pulse/usePulseDriver.web';
import { usePulseAnimation } from '../../../src/components/ui/shared/pulse/usePulseAnimation';
import { PULSE_DEFAULTS } from '../../../src/components/ui/Pulse/constants';
import { normalizePulseOptions } from '../../../src/components/ui/shared/pulse/normalizePulseOptions';
import { useMenuMousePress } from '../../../src/components/ui/ActionMenuContent/useMenuMousePress';

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('native motion defaults and explicit delay preserve component content and driver scheduling', () => {
  const reanimated = jest.requireMock<typeof import('react-native-reanimated')>(
    'react-native-reanimated'
  );
  const delay = jest.spyOn(reanimated, 'withDelay');
  const page = render(
    <ThemeProvider>
      <Spinner testID="spinner" />
      <PulseDot testID="pulse" />
      <Reveal testID="reveal">{null}</Reveal>
    </ThemeProvider>
  );
  expect(
    page.getByTestId('spinner', { includeHiddenElements: true })
  ).toBeTruthy();
  expect(
    page.getByTestId('pulse', { includeHiddenElements: true })
  ).toBeTruthy();
  expect(page.getByTestId('reveal')).toBeTruthy();
  renderHook(() =>
    useNativePulse(normalizePulseOptions({ delay: 55 }, PULSE_DEFAULTS))
  );
  expect(delay).toHaveBeenCalledWith(55, expect.anything());
  const pulse = renderHook(() => usePulse());
  expect(pulse.result.current).toBeDefined();
});

test('pulse diagnostics honor production mode and an omitted options object uses valid defaults', () => {
  const log = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const defaults = renderHook(() =>
    usePulseAnimation(undefined, PULSE_DEFAULTS, log)
  );
  expect(defaults.result.current).toBeDefined();
  const dev = Reflect.get(globalThis, '__DEV__');
  Reflect.set(globalThis, '__DEV__', false);
  try {
    renderHook(() => usePulseAnimation({ duration: -1 }, PULSE_DEFAULTS, log));
    expect(log.warn).not.toHaveBeenCalled();
  } finally {
    Reflect.set(globalThis, '__DEV__', dev);
  }
});

test('Web pulse released during delay never starts its interval', () => {
  jest.useFakeTimers();
  const hook = renderHook(() =>
    useWebPulse(normalizePulseOptions({ delay: 100 }, PULSE_DEFAULTS))
  );
  expect(hook.result.current.opacity).toBe(PULSE_DEFAULTS.from);
  hook.unmount();
  act(() => jest.advanceTimersByTime(1000));
  expect(jest.getTimerCount()).toBe(0);
});

test('menu mouse press only reserves left mouse focus; release, cancel, leave and disable clear its style', () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  const hook = renderHook(useMenuMousePress, { initialProps: false });
  const preventDefault = jest.fn();
  const event = (pointerType: string, button: number) =>
    ({ nativeEvent: { pointerType, button }, preventDefault }) as never;
  act(() => hook.result.current.onPointerDown(event('touch', 0)));
  act(() => hook.result.current.onPointerDown(event('mouse', 1)));
  expect(preventDefault).not.toHaveBeenCalled();
  for (const end of [
    'onPointerUp',
    'onPointerCancel',
    'onPointerLeave',
  ] as const) {
    act(() => hook.result.current.onPointerDown(event('mouse', 0)));
    expect(hook.result.current.mousePressed).toBe(true);
    act(() => hook.result.current[end]());
    expect(hook.result.current.mousePressed).toBe(false);
  }
  act(() => hook.result.current.onPointerDown(event('mouse', 0)));
  hook.rerender(true);
  expect(hook.result.current.mousePressed).toBe(false);
  act(() => hook.result.current.onPointerDown(event('mouse', 0)));
  expect(preventDefault).toHaveBeenCalledTimes(4);
});

test('invalid pulse inputs report the normalized fallback exactly once', () => {
  const log = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  expect(normalizePulseOptions(undefined, PULSE_DEFAULTS).diagnostics).toEqual(
    []
  );
  const hook = renderHook(() =>
    usePulseAnimation({ duration: -1 }, PULSE_DEFAULTS, log)
  );
  expect(hook.result.current).toBeDefined();
  expect(log.warn).toHaveBeenCalledTimes(1);
  expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('duration=-1'));
});
