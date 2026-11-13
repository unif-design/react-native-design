import { afterEach, expect, jest, test } from '@jest/globals';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  fireEvent,
  render,
  waitFor,
} from '../../example/node_modules/@testing-library/react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import {
  Button,
  Card,
  Search,
  Tag,
  ThemeProvider,
  darkColors,
  lightColors,
} from '@unif/react-native-design';

const glassSupport: { isLiquidGlassSupported: boolean } = LiquidGlass;

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ['ios', false, 'light', true],
  ['android', false, 'light', true],
  ['ios', false, 'dark', false],
  ['ios', true, 'light', false],
  ['web', false, 'light', false],
] as const)(
  'Tag 配色覆盖仅作用于目标降级：%s/%s/%s',
  (os, supported, scheme, override) => {
    jest.replaceProperty(Platform, 'OS', os);
    jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', supported);
    const page = render(
      <ThemeProvider forceScheme={scheme}>
        <Tag testID="baseline" variant="outline" label="原标签" />
        <Tag
          testID="custom"
          variant="outline"
          label="客户类型"
          fallbackPalette={{ color: '#54BCEF', borderColor: '#54BCEF' }}
        />
        <Tag testID="level" variant="brand" label="等级" />
      </ThemeProvider>
    );
    const baseline = page.getByTestId('baseline');
    const custom = page.getByTestId('custom');
    const baselineStyle = StyleSheet.flatten(baseline.props.style);
    expect(StyleSheet.flatten(custom.props.style)).toMatchObject({
      height: baselineStyle.height,
      paddingHorizontal: baselineStyle.paddingHorizontal,
      borderWidth: 1,
      backgroundColor: 'transparent',
      borderColor: override ? '#54BCEF' : baselineStyle.borderColor,
    });
    expect(
      StyleSheet.flatten(page.getByText('客户类型').props.style)
    ).toMatchObject({
      color: override
        ? '#54BCEF'
        : StyleSheet.flatten(page.getByText('原标签').props.style).color,
    });
    expect(
      StyleSheet.flatten(page.getByTestId('level').props.style)
    ).toMatchObject({ borderWidth: 0 });
  }
);

test('Tag 降级配色不改变 variant 边宽，显式容器样式仍优先', () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', false);
  const page = render(
    <ThemeProvider forceScheme="light">
      <Tag
        testID="custom"
        variant="brand"
        label="客户状态"
        fallbackPalette={{
          backgroundColor: '#FFF8F0',
          color: '#EB6E00',
          borderColor: '#EB6E00',
        }}
        style={{ backgroundColor: '#FFFFFF' }}
      />
      <Tag testID="level" variant="brand" label="等级" />
    </ThemeProvider>
  );
  expect(
    StyleSheet.flatten(page.getByTestId('custom').props.style)
  ).toMatchObject({
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
  });
  expect(
    StyleSheet.flatten(page.getByText('客户状态').props.style)
  ).toMatchObject({ color: '#EB6E00' });
  expect(
    StyleSheet.flatten(page.getByTestId('level').props.style)
  ).toMatchObject({
    backgroundColor: '#FFF5EB',
    borderWidth: 0,
  });
});

test.each([
  ['ios', false, 'light', false, true, '#FFFFFF', '#FFFFFF'],
  ['android', false, 'light', false, true, '#FFFFFF', '#FFFFFF'],
  [
    'ios',
    false,
    'dark',
    false,
    false,
    darkColors.surfaceContainerHigh,
    darkColors.surface,
  ],
  ['ios', true, 'light', false, false, 'transparent', 'transparent'],
  [
    'ios',
    true,
    'light',
    true,
    false,
    lightColors.surfaceContainerHigh,
    lightColors.surface,
  ],
  [
    'web',
    false,
    'light',
    false,
    false,
    lightColors.surfaceContainerHigh,
    lightColors.surface,
  ],
] as const)(
  'secondary/glass 文字按钮仅目标浅色原生降级有新控件边界：%s/%s/%s/reduced=%s',
  async (
    os,
    supported,
    scheme,
    reduced,
    decorated,
    secondaryBackground,
    glassBackground
  ) => {
    jest.replaceProperty(Platform, 'OS', os);
    jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', supported);
    jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockResolvedValue(reduced);
    const secondaryPress = jest.fn();
    const glassPress = jest.fn();
    const page = render(
      <ThemeProvider forceScheme={scheme}>
        <Button label="查看客户" variant="secondary" onPress={secondaryPress} />
        <Button label="查看详情" variant="glass" onPress={glassPress} />
      </ThemeProvider>
    );
    await waitFor(() => {
      const materials = page.UNSAFE_getAllByType(LiquidGlass.LiquidGlassView);
      expect(materials).toHaveLength(2);
      for (const [index, [name, backgroundColor]] of [
        ['查看客户', secondaryBackground],
        ['查看详情', glassBackground],
      ].entries()) {
        const button = page.getByRole('button', { name });
        const style = StyleSheet.flatten(button.props.style);
        expect((style?.shadowOpacity ?? 0) > 0).toBe(decorated);
        const material = materials[index]!;
        expect(material.props.effect).toBe(
          supported && !reduced ? 'regular' : 'none'
        );
        expect(StyleSheet.flatten(material.props.style).backgroundColor).toBe(
          backgroundColor
        );
      }
    });
    fireEvent.press(page.getByRole('button', { name: '查看客户' }));
    fireEvent.press(page.getByRole('button', { name: '查看详情' }));
    expect(secondaryPress).toHaveBeenCalledTimes(1);
    expect(glassPress).toHaveBeenCalledTimes(1);
  }
);

test('白卡阴影不被自己的裁剪层截断，bare 与显式表面/边框保留', () => {
  jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', false);
  const page = render(
    <ThemeProvider forceScheme="light">
      <Card
        variant="glass"
        bare
        fallbackColor="#123456"
        borderColor="#654321"
        borderWidth={2}
        testID="card"
      >
        <Text>客户信息</Text>
      </Card>
    </ThemeProvider>
  );
  const card = page.getByTestId('card');
  expect(StyleSheet.flatten(card.props.style)).toMatchObject({
    backgroundColor: '#123456',
    shadowOpacity: 0.04,
  });
  expect(StyleSheet.flatten(card.props.style).overflow).not.toBe('hidden');
  const clip = card
    .findAllByType(View)
    .find(
      (node) => StyleSheet.flatten(node.props.style)?.overflow === 'hidden'
    );
  expect(StyleSheet.flatten(clip?.props.style)).toMatchObject({
    borderColor: '#654321',
    borderWidth: 2,
  });
  expect(StyleSheet.flatten(clip?.props.style).padding).toBeUndefined();
  expect(
    StyleSheet.flatten(
      page.UNSAFE_getByType(LiquidGlass.LiquidGlassView).props.style
    ).backgroundColor
  ).toBe('#123456');
});

test.each(['ios', 'android'] as const)(
  '搜索在 %s 的背景不通过 elevation 盖住输入，边线与44pt命中保持',
  (os) => {
    jest.replaceProperty(Platform, 'OS', os);
    jest.replaceProperty(glassSupport, 'isLiquidGlassSupported', false);
    const content = (error?: string) => (
      <ThemeProvider forceScheme="light">
        <Search testID="search" error={error} />
      </ThemeProvider>
    );
    const page = render(content());
    const surface = () =>
      page
        .getByTestId('search')
        .findAllByType(View)
        .find(
          (node) =>
            StyleSheet.flatten(node.props.style)?.borderRadius &&
            StyleSheet.flatten(node.props.style)?.position === 'absolute' &&
            StyleSheet.flatten(node.props.style)?.borderWidth === 1
        )!;
    expect(StyleSheet.flatten(surface().props.style)).toMatchObject({
      borderColor: 'rgba(0,0,0,0.08)',
    });
    expect(StyleSheet.flatten(surface().props.style)?.elevation ?? 0).toBe(0);
    expect(
      StyleSheet.flatten(page.getByTestId('search').props.style)
    ).toMatchObject({ minHeight: 44 });
    const shadowHost = page
      .getByTestId('search')
      .findAllByType(View)
      .find((node) => StyleSheet.flatten(node.props.style)?.elevation === 2)!;
    expect(StyleSheet.flatten(shadowHost.props.style)).toMatchObject({
      height: 44,
      elevation: 2,
      shadowOpacity: 0.06,
      backgroundColor: 'transparent',
    });
    const input = page.getByTestId('search-input');
    expect(shadowHost.findAll((node) => node === input)).toHaveLength(1);
    fireEvent(input, 'focus');
    expect(StyleSheet.flatten(surface().props.style)).toMatchObject({
      borderColor: '#EB6E00',
    });
    page.rerender(content('查询有误'));
    expect(StyleSheet.flatten(surface().props.style)).toMatchObject({
      borderColor: '#F4511E',
    });
  }
);
