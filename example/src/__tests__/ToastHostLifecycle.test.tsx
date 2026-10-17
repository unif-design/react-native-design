import React from 'react';
import { act, cleanup, render } from '@testing-library/react-native';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import { ThemeProvider, toast, motion } from '@unif/react-native-design';
import { ToastHost as NativeToastHost } from '../../../src/components/ui/Toast/ToastHost';
import { ToastHost as WebToastHost } from '../../../src/components/ui/Toast/ToastHost.web';
import type {
  ToastKind,
  ToastPosition,
} from '../../../src/components/ui/Toast/types';

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  cleanup();
  const drain = render(
    <ThemeProvider>
      <NativeToastHost />
    </ThemeProvider>
  );
  act(() => jest.advanceTimersByTime(10000));
  drain.unmount();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe.each([
  ['native', NativeToastHost],
  ['web', WebToastHost],
] as const)('%s ToastHost', (_platform, Host) => {
  test.each([
    ['top', 'info'],
    ['center', 'success'],
    ['bottom', 'error'],
  ] as const)(
    '投递 %s/%s 的位置、读屏和自动退场',
    async (position: ToastPosition, kind: ToastKind) => {
      const announce = jest.spyOn(
        AccessibilityInfo,
        'announceForAccessibility'
      );
      const page = render(
        <ThemeProvider>
          <Host testID="toast-host" />
        </ThemeProvider>
      );
      expect(page.queryByTestId('toast-host')).toBeNull();
      await act(async () =>
        toast({ message: '操作已完成', position, kind, duration: 400 })
      );
      expect(page.getByText('操作已完成')).toBeTruthy();
      expect(announce).toHaveBeenCalledWith('操作已完成');
      const style = StyleSheet.flatten(
        page.getByTestId('toast-host').props.style
      );
      if (position === 'center')
        expect(style).toMatchObject({
          top: 0,
          bottom: 0,
          justifyContent: 'center',
        });
      else expect(style[position]).toBeGreaterThan(0);
      act(() => jest.advanceTimersByTime(32));
      act(() => jest.advanceTimersByTime(400 + motion.base));
      expect(page.queryByText('操作已完成')).toBeNull();
      page.unmount();
    }
  );

  test('没有宿主时仅补投最新消息，替换时清除旧退出计时', async () => {
    toast('等待中的旧消息');
    toast('等待中的新消息');
    const page = render(
      <ThemeProvider>
        <Host />
      </ThemeProvider>
    );
    await act(async () => {});
    expect(page.queryByText('等待中的旧消息')).toBeNull();
    expect(page.getByText('等待中的新消息')).toBeTruthy();
    act(() => jest.advanceTimersByTime(3000));
    act(() => toast({ message: '下一条', duration: 1000 }));
    act(() => jest.advanceTimersByTime(motion.base));
    expect(page.getByText('下一条')).toBeTruthy();
    page.unmount();
    act(() => jest.runOnlyPendingTimers());
  });

  test('内层接管清除外层提示，卸载后外层接收后续提示', async () => {
    const outer = render(
      <ThemeProvider>
        <Host testID="outer-toast" />
      </ThemeProvider>
    );
    await act(async () => toast({ message: '外层消息', duration: 400 }));
    act(() => jest.advanceTimersByTime(400));
    const inner = render(
      <ThemeProvider>
        <Host testID="inner-toast" />
      </ThemeProvider>
    );
    expect(outer.queryByText('外层消息')).toBeNull();
    await act(async () => toast({ message: '内层消息', duration: 400 }));
    expect(inner.getByText('内层消息')).toBeTruthy();
    inner.unmount();
    act(() => toast('归还后的消息'));
    expect(outer.getByText('归还后的消息')).toBeTruthy();
    act(() => jest.advanceTimersByTime(motion.base));
    expect(outer.getByText('归还后的消息')).toBeTruthy();
    outer.unmount();
  });
});

test('Web 已取消的双 RAF 不能将新提示提前显示', async () => {
  const frames: ((timestamp: number) => void)[] = [];
  jest
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
  const cancel = jest
    .spyOn(globalThis, 'cancelAnimationFrame')
    .mockImplementation(() => {});
  const page = render(
    <ThemeProvider>
      <WebToastHost />
    </ThemeProvider>
  );
  await act(async () => toast('旧提示'));
  const stale = frames[0];
  act(() => toast('新提示'));
  const count = frames.length;
  act(() => stale?.(0));
  expect(frames).toHaveLength(count);
  expect(page.getByText('新提示')).toBeTruthy();
  expect(cancel).toHaveBeenCalled();
  page.unmount();
  act(() => frames[count - 1]?.(0));
  expect(frames).toHaveLength(count);
});

describe.each([
  ['native', NativeToastHost],
  ['web', WebToastHost],
] as const)('%s stale callback isolation', (_platform, Host) => {
  test('already queued dismiss and exit callbacks cannot erase a replacement or write after unmount', () => {
    const callbacks: (() => void)[] = [];
    const schedule = globalThis.setTimeout;
    jest.spyOn(globalThis, 'setTimeout').mockImplementation(((
      callback: (...parameters: unknown[]) => void,
      delay: number,
      ...args: unknown[]
    ) => {
      if (delay === 400 || delay === motion.base) callbacks.push(callback);
      return schedule(() => callback(...args), delay);
    }) as typeof setTimeout);
    const page = render(
      <ThemeProvider>
        <Host />
      </ThemeProvider>
    );
    act(() => toast({ message: 'first', duration: 400 }));
    act(() => jest.advanceTimersByTime(400));
    const stale = [...callbacks];
    act(() => toast({ message: 'replacement', duration: 1000 }));
    act(() => stale.forEach((callback) => callback()));
    expect(page.getByText('replacement')).toBeTruthy();
    page.unmount();
    expect(() =>
      act(() => stale.forEach((callback) => callback()))
    ).not.toThrow();
  });

  test('a reentrant owner takeover during installation leaves the displaced host inert', () => {
    const runtime =
      require('../../../src/components/ui/Toast/toast') as typeof import('../../../src/components/ui/Toast/toast');
    const finalLease = {
      current: null as ReturnType<typeof runtime.registerToastHost>,
    };
    const firstLease = runtime.registerToastHost(
      () => {},
      () => {
        finalLease.current = runtime.registerToastHost((delivery) =>
          runtime.completeToast(
            delivery.ownerToken,
            delivery.leaseId,
            delivery.entry.id
          )
        );
      }
    );
    const page = render(
      <ThemeProvider>
        <Host testID="inert" />
      </ThemeProvider>
    );
    act(() => toast('a later owner receives this'));
    expect(page.queryByTestId('inert')).toBeNull();
    page.unmount();
    finalLease.current?.release();
    firstLease?.release();
  });

  test('completion reported by the store invalidates both timeout stages before they touch UI', () => {
    const runtime =
      require('../../../src/components/ui/Toast/toast') as typeof import('../../../src/components/ui/Toast/toast');
    const register = runtime.registerToastHost;
    let delivered:
      | import('../../../src/components/ui/Toast/store').ToastDelivery
      | undefined;
    jest
      .spyOn(runtime, 'registerToastHost')
      .mockImplementation((subscriber, clear) =>
        register((delivery) => {
          delivered = delivery;
          subscriber(delivery);
        }, clear)
      );
    const page = render(
      <ThemeProvider>
        <Host />
      </ThemeProvider>
    );
    act(() => toast({ message: 'early completion', duration: 400 }));
    expect(delivered).toBeDefined();
    const complete = () => {
      const delivery = delivered!;
      runtime.completeToast(
        delivery.ownerToken,
        delivery.leaseId,
        delivery.entry.id
      );
    };
    act(complete);
    act(() => jest.advanceTimersByTime(400 + motion.base));
    expect(page.getByText('early completion')).toBeTruthy();
    act(() => toast({ message: 'during exit', duration: 400 }));
    act(() => jest.advanceTimersByTime(400));
    act(complete);
    act(() => jest.advanceTimersByTime(motion.base));
    expect(page.getByText('during exit')).toBeTruthy();
    page.unmount();
  });
});

test('Web cancellation after the first frame prevents the already queued inner frame from showing a stale toast', () => {
  const frames: ((timestamp: number) => void)[] = [];
  jest
    .spyOn(globalThis, 'requestAnimationFrame')
    .mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });
  const page = render(
    <ThemeProvider>
      <WebToastHost />
    </ThemeProvider>
  );
  act(() => toast('first frame'));
  act(() => frames[0]?.(0));
  const inner = frames[1];
  act(() => toast('new delivery'));
  act(() => inner?.(0));
  const div = page.UNSAFE_root.findByType('div' as never);
  expect(div.props.style.opacity).toBe(0);
  page.unmount();
});

test('Web 新投递与已排队退场同批发生时保留新消息', () => {
  const callbacks: (() => void)[] = [];
  const schedule = globalThis.setTimeout;
  jest.spyOn(globalThis, 'setTimeout').mockImplementation(((
    callback: (...parameters: unknown[]) => void,
    delay: number,
    ...args: unknown[]
  ) => {
    if (delay === motion.base) callbacks.push(callback);
    return schedule(() => callback(...args), delay);
  }) as typeof setTimeout);
  const page = render(
    <ThemeProvider>
      <WebToastHost />
    </ThemeProvider>
  );
  act(() => toast({ message: 'exiting', duration: 400 }));
  act(() => jest.advanceTimersByTime(400));
  expect(callbacks).toHaveLength(1);
  act(() => {
    toast('replacement in same batch');
    callbacks[0]!();
  });
  expect(page.getByText('replacement in same batch')).toBeTruthy();
});

test('Web 系统减少动效时关闭 CSS 转场且保留自动退出', () => {
  const reanimated =
    require('react-native-reanimated') as typeof import('react-native-reanimated');
  jest.spyOn(reanimated, 'useReducedMotion').mockReturnValue(true);
  const page = render(
    <ThemeProvider>
      <WebToastHost />
    </ThemeProvider>
  );
  act(() => toast({ message: 'reduce motion', duration: 400 }));
  expect(
    page.UNSAFE_root.findByType('div' as never).props.style.transition
  ).toBe('none');
  act(() => jest.advanceTimersByTime(400 + motion.base));
  expect(page.queryByText('reduce motion')).toBeNull();
});
