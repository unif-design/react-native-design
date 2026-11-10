import React from 'react';
import { AccessibilityInfo, Platform, StyleSheet } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import { SearchOutlined, PlusOutlined } from '@unif/react-native-icons';
import {
  IconGroup,
  IconButton,
  ThemeProvider,
  lightColors,
  darkColors,
} from '@unif/react-native-design';

afterEach(() => jest.restoreAllMocks());

test.each(['ios', 'android'] as const)(
  '%s 无原生玻璃时，按钮组与独立图标按钮共用清晰底色',
  async (platform) => {
    jest.replaceProperty(Platform, 'OS', platform);
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      false
    );
    render(
      <ThemeProvider forceScheme="light">
        <IconGroup testID="navigation">
          <IconButton
            icon={SearchOutlined}
            variant="neutral"
            accessibilityLabel="导航"
            onPress={() => {}}
          />
        </IconGroup>
        <IconButton
          icon={PlusOutlined}
          accessibilityLabel="新会话"
          onPress={() => {}}
        />
      </ThemeProvider>
    );
    const group = screen.getByTestId('navigation-glass', {
      includeHiddenElements: true,
    });
    const button = screen
      .getByRole('button', { name: '新会话' })
      .findByType(LiquidGlass.LiquidGlassView);
    expect(group).toHaveStyle({
      backgroundColor: StyleSheet.flatten(button.props.style).backgroundColor,
    });
    expect(group).toHaveStyle({ backgroundColor: '#FAFAFC' });
  }
);

test.each([
  { supported: true, reduced: false, effect: 'regular', scheme: 'light' },
  { supported: false, reduced: false, effect: 'none', scheme: 'light' },
  { supported: false, reduced: false, effect: 'none', scheme: 'dark' },
  { supported: true, reduced: true, effect: 'none', scheme: 'light' },
] as const)(
  '共用材质与原降级，平台支持=$supported，减少透明度=$reduced，主题=$scheme',
  async ({ supported, reduced, effect, scheme }) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      supported
    );
    jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockResolvedValue(reduced);
    const search = jest.fn();
    const add = jest.fn();
    const view = render(
      <ThemeProvider forceScheme={scheme}>
        <IconGroup testID="actions">
          <IconButton
            icon={SearchOutlined}
            variant="neutral"
            accessibilityLabel="搜索"
            onPress={search}
          />
          <IconButton
            icon={PlusOutlined}
            variant="neutral"
            accessibilityLabel="新增"
            disabled
            onPress={add}
          />
        </IconGroup>
      </ThemeProvider>
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('actions-glass', { includeHiddenElements: true })
          .props.effect
      ).toBe(effect)
    );
    const surfaces = view.UNSAFE_queryAllByType(LiquidGlass.LiquidGlassView);
    expect(surfaces).toHaveLength(1);
    expect(
      screen.getByTestId('actions-glass', { includeHiddenElements: true })
    ).toHaveStyle({
      backgroundColor:
        supported && !reduced
          ? 'transparent'
          : scheme === 'dark'
            ? darkColors.surfaceContainerHigh
            : supported
              ? lightColors.surfaceContainerHigh
              : '#FAFAFC',
    });
    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.press(screen.getByRole('button', { name: '搜索' }));
    fireEvent.press(screen.getByRole('button', { name: '新增' }));
    expect(search).toHaveBeenCalledTimes(1);
    expect(add).not.toHaveBeenCalled();
  }
);

test('未提供组标识时仍暴露子按钮名称与动作', () => {
  const onPress = jest.fn();
  render(
    <ThemeProvider>
      <IconGroup>
        <IconButton
          icon={PlusOutlined}
          variant="neutral"
          accessibilityLabel="无组标识操作"
          onPress={onPress}
        />
      </IconGroup>
    </ThemeProvider>
  );
  fireEvent.press(screen.getByRole('button', { name: '无组标识操作' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
