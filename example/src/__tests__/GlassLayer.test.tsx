import { resolveThemeColors } from '../../../src/theme/nativeFallbackColors';
import { ChevronLeftOutlined, type IconProps } from '@unif/react-native-icons';
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
  Card,
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

    expect(
      StyleSheet.flatten(material.props.style).borderWidth
    ).toBeUndefined();

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
  ['ios', 'light', 'clear', false],
  ['ios', 'dark', 'regular', false],
  ['ios', 'light', 'regular', true],
  ['ios', 'dark', 'clear', true],
  ['android', 'light', 'clear', false],
  ['android', 'dark', 'regular', false],
  ['android', 'light', 'regular', true],
  ['android', 'dark', 'clear', true],
] as const)(
  '%s 无原生玻璃时使用 %s 主题分组实色，effect=%s，自定义底色=%s',
  async (os, scheme, effect, custom) => {
    jest.replaceProperty(LiquidGlass, 'isLiquidGlassSupported', false);
    jest.replaceProperty(Platform, 'OS', os);
    const colors = scheme === 'dark' ? darkColors : lightColors;
    render(
      <ThemeProvider forceScheme={scheme}>
        <GlassLayer
          effect={effect}
          fallbackColor={custom ? colors.primaryContainer : undefined}
          style={{ borderRadius: 14 }}
          testID="grouped-surface"
        />
      </ThemeProvider>
    );
    await act(async () => {});
    const material = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(material.props.effect).toBe('none');
    expect(StyleSheet.flatten(material.props.style)).toMatchObject({
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: custom ? colors.primaryContainer : colors.surface,
      borderRadius: 14,
      overflow: 'hidden',
    });
    expect(
      StyleSheet.flatten(material.props.style).borderWidth
    ).toBeUndefined();
    expect(
      screen.queryByTestId('grouped-surface-gradient', {
        includeHiddenElements: true,
      })
    ).toBeNull();
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
      ).toHaveStyle({
        backgroundColor: supported ? 'transparent' : lightColors.surface,
      })
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
  expect(StyleSheet.flatten(material.props.style).borderWidth).toBeUndefined();
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
  'iOS 实色降级采用 fallbackColor，原生支持=%s',
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
      ).toHaveStyle({
        backgroundColor: supported
          ? 'transparent'
          : lightColors.surfaceContainerHigh,
      })
    );
    const layer = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(layer.props.tintColor).toBeUndefined();
  }
);

test.each([
  [true, false],
  [true, true],
  [false, false],
  [false, true],
])(
  '新导航按钮直接采用已知系统材质，原生支持=%s，嵌套主题=%s',
  async (supported, nested) => {
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
      ).toBe(supported ? 'transparent' : lightColors.surface)
    );
    expect(query).toHaveBeenCalledTimes(1);
    query.mockImplementation(() => new Promise(() => {}));
    view.rerender(
      <ThemeProvider>
        <GlassLayer testID="existing-glass" />
        {nested ? (
          <ThemeProvider forceScheme="dark">
            <GlassLayer testID="next-page-button" />
          </ThemeProvider>
        ) : (
          <GlassLayer testID="next-page-button" />
        )}
      </ThemeProvider>
    );
    expect(
      StyleSheet.flatten(
        screen.getByTestId('next-page-button', { includeHiddenElements: true })
          .props.style
      ).backgroundColor
    ).toBe(
      supported ? 'transparent' : (nested ? darkColors : lightColors).surface
    );
    expect(query).toHaveBeenCalledTimes(1);
  }
);

test('独立玻璃层在无主题宿主时仍读取系统偏好，不永久停在实色', async () => {
  jest.replaceProperty(
    LiquidGlass as { isLiquidGlassSupported: boolean },
    'isLiquidGlassSupported',
    true
  );
  const query = jest
    .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
    .mockResolvedValue(false);
  query.mockClear();
  render(<GlassLayer colorScheme="dark" testID="standalone-glass" />);
  await waitFor(() =>
    expect(
      StyleSheet.flatten(
        screen.getByTestId('standalone-glass', { includeHiddenElements: true })
          .props.style
      ).backgroundColor
    ).toBe('transparent')
  );
  expect(query).toHaveBeenCalledTimes(1);
  expect(
    screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.effect
  ).toBe('regular');
});

test('显式浅色覆盖深色主题，支持材质融合时提供无材质主题宿主', async () => {
  jest.replaceProperty(
    LiquidGlass as { isLiquidGlassSupported: boolean },
    'isLiquidGlassSupported',
    true
  );
  const {
    GlassGroup,
  } = require('../../../src/components/ui/GlassLayer/GlassGroup');
  const page = render(
    <ThemeProvider forceScheme="dark">
      <GlassGroup testID="group">
        <GlassLayer colorScheme="light" testID="layer" />
      </GlassGroup>
    </ThemeProvider>
  );
  await waitFor(() =>
    expect(
      page.getByTestId('layer', { includeHiddenElements: true }).props
        .colorScheme
    ).toBe('light')
  );
  expect(
    page.getByTestId('group', { includeHiddenElements: true }).props
  ).toMatchObject({ effect: 'none', colorScheme: 'dark', animated: false });
});

test.each([
  ['ios', 'light', 'glass', false],
  ['ios', 'dark', 'secondary', false],
  ['android', 'light', 'secondary', false],
  ['android', 'dark', 'glass', false],
  ['ios', 'light', 'glass', true],
  ['ios', 'dark', 'secondary', true],
] as const)(
  '%s %s 图标按钮 %s 使用统一降级底色且保留原生玻璃=%s',
  async (os, scheme, variant, supported) => {
    jest.replaceProperty(Platform, 'OS', os);
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    const colors = scheme === 'dark' ? darkColors : lightColors;
    const press = jest.fn();
    render(
      <ThemeProvider forceScheme={scheme}>
        <IconButton
          icon={ChevronLeftOutlined}
          variant={variant}
          accessibilityLabel="返回"
          onPress={press}
        />
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        StyleSheet.flatten(
          screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.style
        ).backgroundColor
      ).toBe(
        supported
          ? 'transparent'
          : scheme === 'light'
            ? resolveThemeColors('light').surfaceContainerHigh
            : colors.surfaceContainerHigh
      )
    );
    expect(
      screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.effect
    ).toBe(supported ? 'regular' : 'none');
    fireEvent.press(screen.getByRole('button', { name: '返回' }));
    expect(press).toHaveBeenCalledTimes(1);
  }
);

test.each([false, true])(
  '卡片可区分白色聊天背景，原生玻璃支持=%s 时保留系统材质',
  async (supported) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    render(
      <ThemeProvider forceScheme="light">
        <Card variant="glass" fallbackColor={lightColors.surfaceContainerHigh}>
          <IconButton
            icon={ChevronLeftOutlined}
            accessibilityLabel="选择客户"
            onPress={() => {}}
          />
        </Card>
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        StyleSheet.flatten(
          screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.style
        ).backgroundColor
      ).toBe(supported ? 'transparent' : lightColors.surfaceContainerHigh)
    );
    expect(screen.getByRole('button', { name: '选择客户' })).toBeOnTheScreen();
  }
);

test.each([false, true])(
  '原生支持=%s 时初始透明度偏好就绪不重新绘制图标',
  async (supported) => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    let resolvePreference!: (value: boolean) => void;
    jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockReturnValue(
        new Promise((resolve) => {
          resolvePreference = resolve;
        })
      );
    const Glyph = jest.fn((_props: IconProps) => null);
    render(
      <ThemeProvider>
        <IconButton
          icon={Glyph}
          iconSize={21}
          variant="glass"
          accessibilityLabel="返回"
          onPress={jest.fn()}
        />
      </ThemeProvider>
    );
    expect(Glyph).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolvePreference(false);
    });
    expect(Glyph).toHaveBeenCalledTimes(1);
    expect(Glyph.mock.calls[0]?.[0]).toMatchObject({ size: 21 });
    const material = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(material.props.effect).toBe(supported ? 'regular' : 'none');
    expect(StyleSheet.flatten(material.props.style).backgroundColor).toBe(
      supported
        ? 'transparent'
        : resolveThemeColors('light').surfaceContainerHigh
    );
  }
);
