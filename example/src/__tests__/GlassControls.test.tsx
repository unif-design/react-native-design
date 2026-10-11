import React from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import {
  Chip,
  IconButton,
  Search,
  ThemeProvider,
} from '@unif/react-native-design';

beforeEach(() => {
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

async function expectVisibleMaterial(count = 1) {
  await waitFor(() => {
    const materials = screen.UNSAFE_getAllByType(LiquidGlass.LiquidGlassView);
    expect(materials).toHaveLength(count);
    expect(
      materials.every((material) => material.props.effect === 'regular')
    ).toBe(true);
  });
  for (const material of screen.UNSAFE_getAllByType(
    LiquidGlass.LiquidGlassView
  )) {
    expect(material.props.tintColor).toBeUndefined();
    let node = material;
    while (node.parent) {
      node = node.parent;
      const style =
        typeof node.props.style === 'function'
          ? undefined
          : StyleSheet.flatten(node.props.style);
      expect(style?.opacity ?? 1).toBe(1);
    }
  }
}

// 插槽允许任意公共组件，禁用 Chip 不能让插槽按钮的原生玻璃消失。
test.each(['leading', 'trailing'] as const)(
  '不可用 Chip 的 %s 插槽保持自己的材质',
  async (slot) => {
    const content = (
      <IconButton
        icon="close"
        variant="secondary"
        onPress={jest.fn()}
        disabled
        accessibilityLabel="移除标签"
      />
    );
    render(
      <ThemeProvider>
        <Chip
          label="标签"
          onPress={jest.fn()}
          disabled
          {...{ [slot]: content }}
        />
      </ThemeProvider>
    );
    await expectVisibleMaterial(2);
    expect(screen.getByText('标签')).toBeOnTheScreen();
  }
);

test.each([{ disabled: true }, { busy: true }, { disabled: true, busy: true }])(
  '不可用 Chip %p 保持可见材质、文案与状态并阻止重复动作',
  async (state) => {
    const press = jest.fn();
    render(
      <ThemeProvider>
        <Chip label="筛选客户" selected onPress={press} {...state} />
      </ThemeProvider>
    );
    await expectVisibleMaterial();
    const chip = screen.getByRole('button', { name: '筛选客户' });
    expect(chip.props.accessibilityState).toMatchObject({
      selected: true,
      disabled: true,
      busy: state.busy === true,
    });
    expect(screen.getByText('筛选客户')).toBeOnTheScreen();
    fireEvent.press(chip);
    expect(press).not.toHaveBeenCalled();
  }
);

test('交互 Chip 只交付一次点击，静态标签不创建控制材质', async () => {
  const press = jest.fn();
  const view = render(
    <ThemeProvider>
      <Chip label="筛选客户" onPress={press} />
    </ThemeProvider>
  );
  await expectVisibleMaterial();
  fireEvent.press(screen.getByRole('button', { name: '筛选客户' }));
  expect(press).toHaveBeenCalledTimes(1);
  view.rerender(
    <ThemeProvider>
      <Chip label="客户标签" />
    </ThemeProvider>
  );
  expect(screen.queryByRole('button')).toBeNull();
  expect(
    screen.UNSAFE_queryAllByType(LiquidGlass.LiquidGlassView)
  ).toHaveLength(0);
});

test('Search 禁用时材质仍可见；恢复编辑后清除和提交使用同一值', async () => {
  const submit = jest.fn();
  const view = render(
    <ThemeProvider>
      <Search defaultValue="客户" disabled onSubmit={submit} testID="search" />
    </ThemeProvider>
  );
  await expectVisibleMaterial();
  expect(screen.getByTestId('search-input').props.editable).toBe(false);
  expect(screen.queryByRole('button', { name: '清除搜索内容' })).toBeNull();
  view.rerender(
    <ThemeProvider>
      <Search defaultValue="客户" onSubmit={submit} testID="search" />
    </ThemeProvider>
  );
  fireEvent.press(screen.getByRole('button', { name: '清除搜索内容' }));
  expect(screen.getByTestId('search-input').props.value).toBe('');
  fireEvent.changeText(screen.getByTestId('search-input'), '门店');
  fireEvent(screen.getByTestId('search-input'), 'submitEditing', {
    nativeEvent: { text: '门店' },
  });
  expect(submit).toHaveBeenCalledWith('门店');
  await expectVisibleMaterial();
});
