import React from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import * as Reanimated from 'react-native-reanimated';
import {
  Switch,
  ThemeProvider,
  darkColors,
  lightColors,
  r,
} from '@unif/react-native-design';
import { Switch as WebSwitch } from '../../../src/components/ui/Switch/Switch.web';
import { setReducedMotion } from './helpers/reducedMotion';

jest.mock('react-native-reanimated', () =>
  require('./helpers/reducedMotion').reanimatedWithReducedMotion()
);

const hidden = { includeHiddenElements: true };

beforeEach(() => {
  jest.clearAllMocks();
  setReducedMotion(false);
  jest.spyOn(Reanimated, 'interpolate');
  jest.spyOn(Reanimated, 'interpolateColor');
  jest.spyOn(Reanimated, 'withTiming');
  jest.spyOn(Reanimated, 'cancelAnimation');
  jest
    .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
    .mockResolvedValue(false);
  jest.replaceProperty(
    LiquidGlass as { isLiquidGlassSupported: boolean },
    'isLiquidGlassSupported',
    true
  );
});

afterEach(() => jest.restoreAllMocks());

function expectOpaqueMaterialAncestors() {
  let node = screen.getByTestId('setting-thumb-glass', hidden);
  while (node) {
    if (typeof node.type === 'string') {
      expect(StyleSheet.flatten(node.props.style)?.opacity ?? 1).toBe(1);
    }
    if (!node.parent) break;
    node = node.parent;
  }
}

describe.each([
  { platform: 'native', Component: Switch },
  { platform: 'web', Component: WebSwitch },
])('$platform Switch', ({ Component, platform }) => {
  test.each([
    { scheme: 'light', value: false },
    { scheme: 'light', value: true },
    { scheme: 'dark', value: false },
    { scheme: 'dark', value: true },
  ] as const)(
    '$scheme value=$value keeps geometry, controlled state and an undimmed material',
    async ({ scheme, value }) => {
      const onChange = jest.fn();
      const content = (disabled = false) => (
        <ThemeProvider forceScheme={scheme}>
          <Component
            value={value}
            onChange={onChange}
            disabled={disabled}
            accessibilityLabel="同步设置"
            testID="setting"
          />
        </ThemeProvider>
      );
      const view = render(content());
      await waitFor(() =>
        expect(
          screen.getByTestId('setting-thumb-glass', hidden).props.effect
        ).toBe('regular')
      );
      expect(
        screen.getByTestId('setting-thumb-glass', hidden).props.tintColor
      ).toBeUndefined();
      expect(screen.getByTestId('setting')).toHaveStyle({
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
      });
      expect(screen.getByTestId('setting-visual', hidden)).toHaveStyle({
        width: r(32),
        height: r(20),
      });
      expect(screen.getByTestId('setting-thumb', hidden)).toHaveStyle({
        width: r(16),
        height: r(16),
        top: r(2),
        left: 0,
      });
      expect(
        StyleSheet.flatten(
          screen.getByTestId('setting-thumb', hidden).props.style
        ).backgroundColor
      ).toBeUndefined();
      const colors = scheme === 'dark' ? darkColors : lightColors;
      if (platform === 'native') {
        expect(Reanimated.interpolate).toHaveBeenCalledWith(
          value ? 1 : 0,
          [0, 1],
          [r(2), r(14)]
        );
        expect(Reanimated.interpolateColor).toHaveBeenCalledWith(
          value ? 1 : 0,
          [0, 1],
          [colors.surfaceContainerHighest, colors.primary]
        );
      } else {
        expect(screen.getByTestId('setting-thumb', hidden)).toHaveStyle({
          transform: [{ translateX: r(value ? 14 : 2) }],
        });
        expect(screen.getByTestId('setting-track', hidden)).toHaveStyle({
          backgroundColor: value
            ? colors.primary
            : colors.surfaceContainerHighest,
        });
      }
      expectOpaqueMaterialAncestors();
      fireEvent.press(screen.getByRole('switch', { name: '同步设置' }));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(!value);
      expect(
        screen.getByRole('switch', { name: '同步设置' }).props
          .accessibilityState.checked
      ).toBe(value);

      view.rerender(content(true));
      expectOpaqueMaterialAncestors();
      expect(screen.getByTestId('setting-track', hidden)).toHaveStyle({
        opacity: 0.5,
      });
      expect(
        screen.getByRole('switch', { name: '同步设置' }).props
          .accessibilityState
      ).toMatchObject({ checked: value, disabled: true });
      fireEvent.press(screen.getByRole('switch', { name: '同步设置' }));
      expect(onChange).toHaveBeenCalledTimes(1);
    }
  );
  test.each([false, true])(
    '轨道显示布尔值对应文案并保留独立的控件名称，value=%s',
    async (value) => {
      const onChange = jest.fn();
      const label = value ? '异常' : '正常';
      render(
        <ThemeProvider forceScheme="light">
          <Component
            value={value}
            stateLabels={{ on: ' 异常 ', off: '正常' }}
            accessibilityLabel="异常状态"
            onChange={onChange}
            testID="setting"
          />
        </ThemeProvider>
      );
      const owner = screen.getByRole('switch', { name: '异常状态' });
      expect(owner.props.accessibilityValue).toEqual({ text: label });
      expect(owner).toHaveStyle({ minHeight: 44, minWidth: 44 });
      expect(screen.getByText(label, hidden)).toHaveStyle({
        color: value ? lightColors.onPrimary : lightColors.foreground,
      });
      expect(screen.queryByText(value ? '正常' : '异常', hidden)).toBeNull();
      if (platform === 'native') {
        expect(Reanimated.interpolate).toHaveBeenCalledWith(
          value ? 1 : 0,
          [0, 1],
          [r(2), -r(18)]
        );
      } else {
        expect(screen.getByTestId('setting-thumb', hidden)).toHaveStyle({
          left: value ? '100%' : '0%',
          transform: [{ translateX: value ? -r(18) : r(2) }],
        });
      }
      fireEvent.press(owner);
      expect(onChange).toHaveBeenCalledWith(!value);
      await waitFor(() =>
        expect(
          screen.getByTestId('setting-thumb-glass', hidden).props.effect
        ).toBe('regular')
      );
    }
  );
  test('当前状态文案为空白时沿用默认轨道与布尔读屏状态', async () => {
    render(
      <ThemeProvider>
        <Component
          value={false}
          stateLabels={{ off: '   ', on: '异常' }}
          accessibilityLabel="异常状态"
          onChange={jest.fn()}
          testID="setting"
        />
      </ThemeProvider>
    );
    const owner = screen.getByRole('switch', { name: '异常状态' });
    await waitFor(() =>
      expect(
        screen.getByTestId('setting-thumb-glass', hidden).props.effect
      ).toBe('regular')
    );
    expect(owner.props.accessibilityValue?.text).toBeUndefined();
    expect(owner).toHaveStyle({ width: 44, height: 44 });
    expect(screen.getByTestId('setting-visual', hidden)).toHaveStyle({
      width: r(32),
      height: r(20),
    });
  });
  test('reduced motion keeps the settled position without starting a transition', async () => {
    setReducedMotion(true);
    render(
      <ThemeProvider>
        <Component
          value
          onChange={jest.fn()}
          accessibilityLabel="同步设置"
          testID="setting"
        />
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('setting-thumb-glass', hidden).props.effect
      ).toBe('regular')
    );
    expectOpaqueMaterialAncestors();
    if (platform === 'native') {
      expect(Reanimated.withTiming).not.toHaveBeenCalled();
      expect(Reanimated.cancelAnimation).toHaveBeenCalled();
    } else {
      for (const part of ['track', 'thumb']) {
        const style = StyleSheet.flatten(
          screen.getByTestId(`setting-${part}`, hidden).props.style
        );
        expect(style).not.toHaveProperty('transitionProperty');
        expect(style).not.toHaveProperty('transitionDuration');
        expect(style).not.toHaveProperty('transitionTimingFunction');
      }
      expect(screen.getByTestId('setting-thumb', hidden)).toHaveStyle({
        transform: [{ translateX: r(14) }],
      });
    }
  });
});

test.each(['unsupported', 'reduced-transparency'] as const)(
  '%s uses the theme surface without a white thumb override',
  async (mode) => {
    if (mode === 'unsupported') {
      jest.replaceProperty(
        LiquidGlass as { isLiquidGlassSupported: boolean },
        'isLiquidGlassSupported',
        false
      );
    } else {
      jest
        .mocked(AccessibilityInfo.isReduceTransparencyEnabled)
        .mockResolvedValue(true);
    }
    render(
      <ThemeProvider forceScheme="dark">
        <Switch
          value
          onChange={jest.fn()}
          accessibilityLabel="同步设置"
          testID="setting"
        />
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('setting-thumb-glass', hidden).props.effect
      ).toBe('none')
    );
    await waitFor(() =>
      expect(screen.getByTestId('setting-thumb-glass', hidden)).toHaveStyle({
        backgroundColor: darkColors.surface,
      })
    );
    expect(
      screen.queryByTestId('setting-thumb-glass-gradient', hidden)
    ).toBeNull();
    expectOpaqueMaterialAncestors();
  }
);
