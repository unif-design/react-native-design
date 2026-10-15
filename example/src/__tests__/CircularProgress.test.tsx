import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import {
  CircularProgress,
  lightColors,
  ThemeProvider,
  type CircularProgressProps,
  type as typography,
} from '@unif/react-native-design';
import * as Worklets from 'react-native-worklets';
import {
  progressDriver,
  scheduleProgressOnRN,
  scheduleProgressOnUI,
} from './helpers/circularProgressDriver';

jest.mock('react-native-reanimated', () =>
  require('./helpers/circularProgressDriver').reanimatedWithProgressDriver()
);
beforeEach(() => {
  progressDriver.reset();
  jest.spyOn(Worklets, 'scheduleOnUI').mockImplementation(scheduleProgressOnUI);
  jest.spyOn(Worklets, 'scheduleOnRN').mockImplementation(scheduleProgressOnRN);
});
afterEach(() => jest.restoreAllMocks());

function mount(props: CircularProgressProps) {
  let current = props;
  const content = () => (
    <ThemeProvider fontScale={2}>
      <CircularProgress size={32} thickness={2} {...current} />
    </ThemeProvider>
  );
  const page = render(content());
  return {
    ...page,
    update(next: Partial<CircularProgressProps>) {
      current = { ...current, ...next };
      page.rerender(content());
    },
    label: () => screen.UNSAFE_getByType(Text),
    ring: () => screen.UNSAFE_getAllByProps({ strokeLinecap: 'round' })[0]!,
  };
}

function flushRN() {
  act(() => progressDriver.flushRN());
}

function queueUI() {
  const pending: Array<() => void> = [];
  jest
    .spyOn(Worklets, 'scheduleOnUI')
    .mockImplementation((worklet, ...args) => {
      pending.push(() => scheduleProgressOnUI(worklet, ...args));
    });
  return () => {
    act(() => {
      while (pending.length) pending.shift()!();
    });
  };
}

function frame(value: number) {
  act(() => {
    progressDriver.frame(value);
    progressDriver.flushRN();
  });
}

function finish() {
  act(() => {
    progressDriver.finish();
    progressDriver.flushRN();
  });
}

test('真实进度从 0 跳到 1 时，圆环与文字只采用动画当前帧，读屏立即读到真实值', () => {
  const onAnimationComplete = jest.fn();
  const page = mount({
    value: 0,
    animated: true,
    showLabel: true,
    onAnimationComplete,
  });
  onAnimationComplete.mockClear();
  page.update({ value: 1 });
  expect(page.label().props.children).toBe('0%');
  expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(
    100
  );
  frame(0.36);
  expect(page.label().props.children).toBe('36%');
  expect(page.ring().props.animatedProps.strokeDashoffset).toBeCloseTo(
    2 * Math.PI * 15 * 0.64
  );
  expect(onAnimationComplete).not.toHaveBeenCalled();
  finish();
  expect(page.label().props.children).toBe('100%');
  expect(onAnimationComplete).toHaveBeenCalledTimes(1);
  expect(onAnimationComplete).toHaveBeenLastCalledWith(1);
});

test('首次挂载直接显示当前值，保留字号、自然布局与完整无障碍百分比', () => {
  const onAnimationComplete = jest.fn();
  const page = mount({
    value: 0.421,
    size: 16,
    animated: true,
    showLabel: true,
    formatLabel: String,
    onAnimationComplete,
  });
  expect(page.label().props.children).toBe('42');
  expect(StyleSheet.flatten(page.label().props.style)).toMatchObject({
    fontSize: typography.nano * 2,
    flexShrink: 0,
  });
  expect(
    StyleSheet.flatten(page.label().props.style).lineHeight
  ).toBeUndefined();
  expect(
    StyleSheet.flatten(screen.getByRole('progressbar').props.style)
  ).toMatchObject({
    minWidth: 16,
    minHeight: 16,
    width: 'max-content',
    height: 'max-content',
  });
  expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({
    min: 0,
    max: 100,
    now: 42,
    text: '42%',
  });
  expect(page.label().parent!.props['aria-hidden']).toBe(true);
  expect(progressDriver.activeCount).toBe(0);
  flushRN();
  expect(onAnimationComplete).toHaveBeenLastCalledWith(0.421);
});

test('默认静态与无标签占用保持不变，更新后及时通知视觉到达', () => {
  const onAnimationComplete = jest.fn();
  const page = mount({ value: 0.375, onAnimationComplete });
  expect(screen.UNSAFE_queryByType(Text)).toBeNull();
  expect(
    StyleSheet.flatten(screen.getByRole('progressbar').props.style)
  ).toMatchObject({ width: 32, height: 32 });
  expect(page.ring().props.animatedProps.strokeDashoffset).toBeCloseTo(
    2 * Math.PI * 15 * 0.625
  );
  page.update({ value: 1 });
  flushRN();
  expect(progressDriver.activeCount).toBe(0);
  expect(onAnimationComplete).toHaveBeenLastCalledWith(1);
});

test('value 下降立即归位，即使它仍高于正在显示的帧', () => {
  const onAnimationComplete = jest.fn();
  const page = mount({
    value: 0,
    animated: true,
    showLabel: true,
    onAnimationComplete,
  });
  page.update({ value: 1 });
  frame(0.1);
  page.update({ value: 0.25 });
  flushRN();
  expect(page.label().props.children).toBe('25%');
  expect(page.ring().props.animatedProps.strokeDashoffset).toBeCloseTo(
    2 * Math.PI * 15 * 0.75
  );
  expect(progressDriver.activeCount).toBe(0);
  expect(onAnimationComplete).toHaveBeenLastCalledWith(0.25);
});

test('已排队的旧帧和完成回调不能跨重置后再次出现的相同目标生效', () => {
  const onAnimationComplete = jest.fn();
  const page = mount({
    value: 0,
    animated: true,
    showLabel: true,
    onAnimationComplete,
  });
  page.update({ value: 1 });
  act(() => progressDriver.finish());
  page.update({ value: 0 });
  page.update({ value: 1 });
  onAnimationComplete.mockClear();
  act(() => progressDriver.flushRN());
  expect(page.label().props.children).toBe('0%');
  expect(onAnimationComplete).not.toHaveBeenCalled();
  frame(0.27);
  expect(page.label().props.children).toBe('27%');
  finish();
  expect(onAnimationComplete).toHaveBeenCalledTimes(1);
  expect(onAnimationComplete).toHaveBeenCalledWith(1);
});

test('卸载取消动画资源，并丢弃已经排队的完成通知', () => {
  const onAnimationComplete = jest.fn();
  const page = mount({
    value: 0,
    animated: true,
    showLabel: true,
    onAnimationComplete,
  });
  page.update({ value: 0.5 });
  act(() => progressDriver.finish());
  page.update({ value: 1 });
  onAnimationComplete.mockClear();
  page.unmount();
  act(() => progressDriver.flushRN());
  expect(progressDriver.activeCount).toBe(0);
  expect(onAnimationComplete).not.toHaveBeenCalled();
});

test.each(['reduced motion', '关闭 animated'] as const)(
  '%s 会及时停在真实目标并交付当前完成值',
  (mode) => {
    const onAnimationComplete = jest.fn();
    const page = mount({
      value: 0,
      animated: true,
      showLabel: true,
      onAnimationComplete,
    });
    page.update({ value: 1 });
    frame(0.2);
    if (mode === 'reduced motion') progressDriver.setReducedMotion(true);
    page.update(mode === '关闭 animated' ? { animated: false } : {});
    flushRN();
    expect(page.label().props.children).toBe('100%');
    expect(progressDriver.activeCount).toBe(0);
    expect(onAnimationComplete).toHaveBeenLastCalledWith(1);
  }
);

test('无标签也能完成过渡；替换回调不重启动画或重复通知', () => {
  const first = jest.fn();
  const latest = jest.fn();
  const page = mount({ value: 0, animated: true, onAnimationComplete: first });
  first.mockClear();
  page.update({ value: 1 });
  frame(0.4);
  page.update({ onAnimationComplete: latest });
  finish();
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledTimes(1);
  expect(latest).toHaveBeenCalledWith(1);
  page.update({ color: lightColors.foreground });
  expect(latest).toHaveBeenCalledTimes(1);
});

test('完成通知使用归一化比例，减少动态效果从首次挂载开始生效', () => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  progressDriver.setReducedMotion(true);
  const onAnimationComplete = jest.fn();
  const page = mount({
    value: 2,
    animated: true,
    showLabel: true,
    onAnimationComplete,
  });
  expect(page.label().props.children).toBe('100%');
  flushRN();
  expect(onAnimationComplete).toHaveBeenLastCalledWith(1);
  page.update({ value: 0 });
  page.update({ value: 0.42 });
  flushRN();
  expect(page.label().props.children).toBe('42%');
  expect(onAnimationComplete).toHaveBeenLastCalledWith(0.42);
  expect(progressDriver.activeCount).toBe(0);
});

test.each([
  { mode: '静态', initial: 0, target: 1, animated: false, reduced: false },
  {
    mode: '减少动态效果',
    initial: 0,
    target: 1,
    animated: true,
    reduced: true,
  },
  {
    mode: '数值下降',
    initial: 0.8,
    target: 0.25,
    animated: true,
    reduced: false,
  },
])('$mode 完成通知等待 UI 应用真实目标，再通过 RN 队列交付', (scenario) => {
  const flushUI = queueUI();
  progressDriver.setReducedMotion(scenario.reduced);
  const onAnimationComplete = jest.fn();
  const page = mount({
    value: scenario.initial,
    animated: scenario.animated,
    showLabel: true,
    onAnimationComplete,
  });
  expect(onAnimationComplete).not.toHaveBeenCalled();
  flushUI();
  flushRN();
  onAnimationComplete.mockClear();

  page.update({ value: scenario.target });
  expect(page.label().props.children).toBe(
    `${Math.round(scenario.initial * 100)}%`
  );
  expect(page.ring().props.animatedProps.strokeDashoffset).toBeCloseTo(
    2 * Math.PI * 15 * (1 - scenario.initial)
  );
  flushRN();
  expect(onAnimationComplete).not.toHaveBeenCalled();

  flushUI();
  expect(page.ring().props.animatedProps.strokeDashoffset).toBeCloseTo(
    2 * Math.PI * 15 * (1 - scenario.target)
  );
  expect(progressDriver.activeCount).toBe(0);
  expect(onAnimationComplete).not.toHaveBeenCalled();
  flushRN();
  expect(page.label().props.children).toBe(
    `${Math.round(scenario.target * 100)}%`
  );
  expect(onAnimationComplete).toHaveBeenCalledTimes(1);
  expect(onAnimationComplete).toHaveBeenCalledWith(scenario.target);
});

test.each(['新目标', '卸载'] as const)(
  '非动画完成已经排进 RN 队列时，%s 使旧通知失效',
  (action) => {
    const flushUI = queueUI();
    const onAnimationComplete = jest.fn();
    const page = mount({ value: 0, showLabel: true, onAnimationComplete });
    flushUI();
    flushRN();
    onAnimationComplete.mockClear();

    page.update({ value: 0.5 });
    flushUI();
    if (action === '卸载') page.unmount();
    else page.update({ value: 1 });
    flushRN();
    expect(onAnimationComplete).not.toHaveBeenCalled();

    if (action === '新目标') {
      flushUI();
      flushRN();
      expect(page.label().props.children).toBe('100%');
      expect(onAnimationComplete).toHaveBeenCalledTimes(1);
      expect(onAnimationComplete).toHaveBeenCalledWith(1);
    }
  }
);
