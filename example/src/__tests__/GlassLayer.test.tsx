import { ChevronLeftOutlined } from '@unif/react-native-icons';
import React from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import {
  GlassLayer,
  IconButton,
  GlassStats,
  ThemeProvider,
  darkColors,
  lightColors,
  radius,
} from '@unif/react-native-design';
import { restoreNativeMocks } from './helpers/nativeMocks';

beforeEach(() => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
    .mockResolvedValue(false);
});

afterEach(() => {
  restoreNativeMocks();
  jest.restoreAllMocks();
});

test.each(['clear', 'regular'] as const)(
  '支持原生玻璃时将 %s 材质、主题和 tint 交给 LiquidGlassView',
  async (effect) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      true
    );
    const view = render(
      <ThemeProvider forceScheme="light">
        <GlassLayer effect={effect} testID="glass-layer" />
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.effect
      ).toBe(effect)
    );
    const material = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(material.props).toMatchObject({
      effect,
      colorScheme: 'light',
      tintColor: undefined,
      animated: false,
      pointerEvents: 'none',
      accessible: false,
      accessibilityElementsHidden: true,
      importantForAccessibility: 'no-hide-descendants',
    });
    expect(StyleSheet.flatten(material.props.style).backgroundColor).toBe(
      'transparent'
    );

    view.rerender(
      <ThemeProvider forceScheme="dark">
        <GlassLayer effect={effect} testID="glass-layer" />
      </ThemeProvider>
    );
    expect(
      screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props
    ).toMatchObject({
      colorScheme: 'dark',
      tintColor: undefined,
    });
  }
);

test.each([
  ['ios', 'light', 'clear'],
  ['ios', 'dark', 'regular'],
  ['android', 'light', 'regular'],
  ['android', 'dark', 'clear'],
] as const)(
  '%s 无原生材质时使用 %s 主题的 %s 半透明渐变',
  async (os, scheme, effect) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      false
    );
    jest.replaceProperty(Platform, 'OS', os);
    render(
      <ThemeProvider forceScheme={scheme}>
        <GlassLayer
          effect={effect}
          style={{ borderRadius: 14 }}
          testID="glass-layer"
        />
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('glass-layer', { includeHiddenElements: true })
      ).toHaveStyle({ backgroundColor: 'transparent' })
    );
    expect(
      screen.getByTestId('glass-layer-gradient', {
        includeHiddenElements: true,
      })
    ).toBeTruthy();
    expect(
      screen.getByTestId('glass-layer', { includeHiddenElements: true })
    ).toHaveStyle({
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: 14,
    });
  }
);

test.each([true, false])(
  '自定义 tintColor 在原生支持=%s 时覆盖主题默认色',
  async (supported) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    render(
      <ThemeProvider>
        <GlassLayer tintColor={lightColors.primary} testID="glass-layer" />
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.effect
      ).toBe(supported ? 'regular' : 'none')
    );
    expect(
      screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props
    ).toMatchObject({
      effect: supported ? 'regular' : 'none',
      tintColor: lightColors.primary,
    });
    await waitFor(() =>
      expect(
        screen.getByTestId('glass-layer', { includeHiddenElements: true })
      ).toHaveStyle({ backgroundColor: 'transparent' })
    );
  }
);

test.each([true, false])(
  'GlassStats 在原生支持=%s 时接回 clear 材质、主题和圆角',
  async (supported) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    render(
      <ThemeProvider forceScheme="dark">
        <GlassStats
          items={[
            ['12', '今日'],
            ['86', '本月'],
          ]}
        />
      </ThemeProvider>
    );
    expect(screen.getByText('12')).toBeOnTheScreen();
    expect(screen.getByText('本月')).toBeOnTheScreen();
    await waitFor(() =>
      expect(
        screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.effect
      ).toBe(supported ? 'clear' : 'none')
    );
    const material = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(material.props).toMatchObject({
      effect: supported ? 'clear' : 'none',
      colorScheme: 'dark',
      tintColor: undefined,
    });
    expect(StyleSheet.flatten(material.props.style)).toMatchObject({
      borderRadius: radius['2xl'],
    });
  }
);

// 若异步初始查询覆盖了后来的系统事件，会重新打开用户已禁用的透明效果。
test('固定深色材质在减少透明度事件后保持实色，迟到查询不能重新打开玻璃', async () => {
  jest.replaceProperty(
    LiquidGlass as { isLiquidGlassSupported: boolean },
    'isLiquidGlassSupported',
    true
  );
  let resolveInitial!: (value: boolean) => void;
  jest.spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled').mockReturnValue(
    new Promise((resolve) => {
      resolveInitial = resolve;
    })
  );
  let onChange!: (enabled: boolean) => void;
  const remove = jest.fn();
  jest
    .spyOn(AccessibilityInfo, 'addEventListener')
    .mockImplementation((event, listener) => {
      if (event === 'reduceTransparencyChanged')
        onChange = listener as (enabled: boolean) => void;
      return { remove };
    });
  const view = render(
    <ThemeProvider forceScheme="light">
      <GlassLayer colorScheme="dark" testID="glass" />
    </ThemeProvider>
  );
  await act(async () => {
    onChange(true);
    resolveInitial(false);
  });
  const material = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
  expect(material.props).toMatchObject({ effect: 'none', colorScheme: 'dark' });
  expect(StyleSheet.flatten(material.props.style).backgroundColor).toBe(
    darkColors.surface
  );
  act(() => onChange(false));
  expect(material.props.effect).toBe('regular');
  view.unmount();
  expect(remove).toHaveBeenCalled();
});

// 原生材质不能由祖先 opacity 淡化；禁用只淡化前景且仍禁止动作。
test.each([
  ['glass', false],
  ['glass', true],
  ['secondary', false],
  ['secondary', true],
] as const)(
  '%s 图标按钮 loading=%s 时材质宿主保持全不透明并阻止操作',
  (variant, loading) => {
    const press = jest.fn();
    render(
      <ThemeProvider>
        <IconButton
          variant={variant}
          icon={ChevronLeftOutlined}
          accessibilityLabel="玻璃返回"
          disabled={!loading}
          loading={loading}
          onPress={press}
        />
      </ThemeProvider>
    );
    const button = screen.getByRole('button', { name: '玻璃返回' });
    expect(StyleSheet.flatten(button.props.style).opacity).toBe(1);
    fireEvent.press(button);
    expect(press).not.toHaveBeenCalled();
  }
);

test.each([true, false])(
  '减少透明度时才采用 fallbackColor，原生支持=%s',
  async (supported) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    render(
      <ThemeProvider>
        <GlassLayer
          fallbackColor={lightColors.surfaceContainerHigh}
          testID="custom-fallback"
        />
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.effect
      ).toBe(supported ? 'regular' : 'none')
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('custom-fallback', { includeHiddenElements: true })
      ).toHaveStyle({ backgroundColor: 'transparent' })
    );
    const layer = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(layer.props.tintColor).toBeUndefined();
  }
);

test.each([true, false])(
  '主题已读取系统偏好后，新导航按钮不先闪实色，原生支持=%s',
  async (supported) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    const query = jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockResolvedValue(false);
    query.mockClear();
    const view = render(
      <ThemeProvider>
        <GlassLayer testID="existing-glass" />
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        StyleSheet.flatten(
          screen.getByTestId('existing-glass', { includeHiddenElements: true })
            .props.style
        ).backgroundColor
      ).toBe('transparent')
    );
    expect(query).toHaveBeenCalledTimes(1);
    query.mockImplementation(() => new Promise(() => {}));
    view.rerender(
      <ThemeProvider>
        <GlassLayer testID="existing-glass" />
        <GlassLayer testID="next-page-button" />
      </ThemeProvider>
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId('next-page-button', { includeHiddenElements: true })
          .props.style
      ).backgroundColor
    ).toBe('transparent');
    expect(query).toHaveBeenCalledTimes(1);
  }
);
