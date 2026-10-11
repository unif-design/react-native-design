import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { fireEvent, render } from '@testing-library/react-native';
import {
  Carousel,
  EntryCard,
  GlassLayer,
  NavBar,
  Stepper,
  Tabs,
  ThemeProvider,
  VersionPill,
  lightColors,
} from '@unif/react-native-design';

jest.mock('react-native-reanimated-carousel', () => {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const { View } =
    jest.requireActual<typeof import('react-native')>('react-native');
  return {
    Carousel: ({
      data,
      renderItem,
    }: {
      data: string[];
      renderItem: (value: {
        item: string;
        index: number;
        relativeProgress: { value: number };
      }) => React.ReactNode;
    }) =>
      ReactModule.createElement(
        View,
        null,
        data.map((item, index) =>
          ReactModule.createElement(
            ReactModule.Fragment,
            { key: item },
            renderItem({ item, index, relativeProgress: { value: 0 } })
          )
        )
      ),
    Pagination: () => ReactModule.createElement(View),
  };
});

const Theme = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

function expectMaterialAncestorsOpaque(layer: ReactTestInstance) {
  for (let node: ReactTestInstance | null = layer; node; node = node.parent) {
    for (const pressed of [false, true]) {
      const style =
        typeof node.props.style === 'function'
          ? node.props.style({ pressed })
          : node.props.style;
      expect(StyleSheet.flatten(style)?.opacity ?? 1).toBe(1);
    }
  }
}

test.each(['light', 'dark'] as const)(
  'NavBar %s 默认材质保持操作，brand和transparent继续原语义',
  (scheme) => {
    const onPress = jest.fn();
    const content = (variant: 'default' | 'brand' | 'transparent') => (
      <ThemeProvider forceScheme={scheme}>
        <NavBar
          title="拍摄"
          variant={variant}
          left={{ icon: 'arrow-left', accessibilityLabel: '返回', onPress }}
        />
      </ThemeProvider>
    );
    const page = render(content('default'));
    expectMaterialAncestorsOpaque(page.UNSAFE_getByType(GlassLayer));
    fireEvent.press(page.getByRole('button', { name: '返回' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    page.rerender(content('brand'));
    expect(page.UNSAFE_queryAllByType(GlassLayer)).toHaveLength(0);
    page.rerender(content('transparent'));
    expect(page.UNSAFE_queryAllByType(GlassLayer)).toHaveLength(0);
  }
);

test('Tabs 默认材质保留选中和禁用，不把前景透明度应用到玻璃', () => {
  const onChange = jest.fn();
  const page = render(
    <Tabs
      value="a"
      onChange={onChange}
      items={[
        { id: 'a', label: '全部' },
        { id: 'b', label: '待处理', disabled: true },
        { id: 'c', label: '完成' },
      ]}
    />,
    { wrapper: Theme }
  );
  expectMaterialAncestorsOpaque(page.UNSAFE_getByType(GlassLayer));
  expect(page.getByRole('tab', { name: '全部', selected: true })).toBeTruthy();
  fireEvent.press(page.getByRole('tab', { name: '待处理', disabled: true }));
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.press(page.getByRole('tab', { name: '完成' }));
  expect(onChange).toHaveBeenCalledWith('c');
});

test.each(['xs', 'sm', 'md'] as const)(
  'Stepper %s 共用视觉材质，边界禁用不影响材质与原命中框',
  (size) => {
    const onChange = jest.fn();
    const page = render(
      <Stepper
        value={0}
        min={0}
        max={3}
        onChange={onChange}
        accessibilityLabel="数量"
        size={size}
      />,
      { wrapper: Theme }
    );
    expectMaterialAncestorsOpaque(page.UNSAFE_getByType(GlassLayer));
    const minus = page.getByRole('button', { name: '数量，减少' });
    const plus = page.getByRole('button', { name: '数量，增加' });
    expect(minus).toBeDisabled();
    expect(StyleSheet.flatten(plus.props.style).height).toBeGreaterThanOrEqual(
      44
    );
    if (size !== 'xs') {
      expect(StyleSheet.flatten(plus.props.style).width).toBeGreaterThanOrEqual(
        44
      );
    }
    fireEvent.press(minus);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.press(plus);
    expect(onChange).toHaveBeenCalledWith(1);
  }
);

test('Carousel 只有媒体上的浮动分页使用材质，隐藏分页不留下表面', () => {
  const content = (
    indicatorPosition: 'bottom' | 'overlay-bottom-right',
    showIndicator = true
  ) => (
    <Carousel
      data={['第一张', '第二张']}
      keyExtractor={(item) => item}
      renderItem={({ item }) => <Text>{item}</Text>}
      height={80}
      itemSize={240}
      indicatorPosition={indicatorPosition}
      showIndicator={showIndicator}
    />
  );
  const page = render(content('bottom'), { wrapper: Theme });
  expect(page.UNSAFE_queryAllByType(GlassLayer)).toHaveLength(0);
  page.rerender(content('overlay-bottom-right'));
  expectMaterialAncestorsOpaque(page.UNSAFE_getByType(GlassLayer));
  expect(page.getByText('第一张')).toBeTruthy();
  expect(page.queryAllByRole('button')).toHaveLength(0);
  page.rerender(content('overlay-bottom-right', false));
  expect(page.UNSAFE_queryAllByType(GlassLayer)).toHaveLength(0);
});

test('EntryCard 默认材质不随按压淡化，入口仍交付一次', () => {
  const onPress = jest.fn();
  const page = render(
    <EntryCard icon="camera" title="拍照" sub="拍摄照片" onPress={onPress} />,
    { wrapper: Theme }
  );
  expectMaterialAncestorsOpaque(page.UNSAFE_getByType(GlassLayer));
  fireEvent.press(page.getByRole('button', { name: '拍照,拍摄照片' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('VersionPill 默认材质保留状态说明且不新增动作', () => {
  const page = render(
    <VersionPill
      version="1.2.3"
      status={{ label: '等待升级', color: lightColors.error }}
    />,
    { wrapper: Theme }
  );
  expectMaterialAncestorsOpaque(page.UNSAFE_getByType(GlassLayer));
  expect(page.getByLabelText(/等待升级/)).toBeTruthy();
  expect(page.queryAllByRole('button')).toHaveLength(0);
});
