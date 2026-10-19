import { CloseOutlined } from '@unif/react-native-icons';
import React from 'react';
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
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as LiquidGlass from '@callstack/liquid-glass';
import {
  Button,
  Card,
  Cell,
  FormGroup,
  FormRow,
  Input,
  List,
  Textarea,
  lightColors,
  darkColors,
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

test.each(['light', 'dark'] as const)(
  '输入、分组表单和列表在 %s 下使用独立玻璃且禁用不隐藏材质',
  async (scheme) => {
    const action = jest.fn();
    const page = render(
      <ThemeProvider forceScheme={scheme}>
        <Input disabled accessibilityLabel="客户名称" defaultValue="门店" />
        <Textarea disabled accessibilityLabel="备注" defaultValue="拜访备注" />
        <FormGroup label="信息">
          <FormRow label="说明">
            <Text>说明内容</Text>
          </FormRow>
        </FormGroup>
        <List>
          <Cell title="客户" onPress={action} disabled />
        </List>
        <Card variant="glass" bare>
          <List flush>
            <Cell title="设置" />
          </List>
        </Card>
      </ThemeProvider>
    );
    await expectVisibleMaterial(5);
    fireEvent.press(page.getByRole('button', { name: '客户' }));
    expect(action).not.toHaveBeenCalled();
    expect(page.getByLabelText('客户名称')).toHaveProp('editable', false);
    expect(page.getByLabelText('备注')).toHaveProp('editable', false);
  }
);

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
        icon={CloseOutlined}
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

describe.each(['light', 'dark'] as const)('Chip 在 %s 聊天表面', (scheme) => {
  test.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])(
    '原生支持=%s、减少透明度=%s 时保留可区分的材质与交互状态',
    async (supported, reduced) => {
      jest.replaceProperty(Platform, 'OS', 'ios');
      jest.replaceProperty(
        LiquidGlass as { isLiquidGlassSupported: boolean },
        'isLiquidGlassSupported',
        supported
      );
      jest
        .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
        .mockResolvedValue(reduced);
      const colors = scheme === 'dark' ? darkColors : lightColors;
      const press = jest.fn();
      render(
        <ThemeProvider forceScheme={scheme}>
          <View style={{ backgroundColor: colors.chatBackground }}>
            <Chip label="今日安排" selected onPress={press} />
            <Chip label="正在处理" busy onPress={press} />
            <Chip label="不可操作" disabled onPress={press} />
            <Chip label="客户标签" testID="static-chip" />
          </View>
        </ThemeProvider>
      );
      const native = supported && !reduced;
      await waitFor(() => {
        const materials = screen.UNSAFE_getAllByType(
          LiquidGlass.LiquidGlassView
        );
        expect(materials).toHaveLength(3);
        for (const material of materials) {
          expect(material.props.effect).toBe(native ? 'regular' : 'none');
          expect(StyleSheet.flatten(material.props.style).backgroundColor).toBe(
            native ? 'transparent' : colors.surfaceContainerHigh
          );
          expect(material.props.tintColor).toBeUndefined();
          if (!native) {
            expect(
              StyleSheet.flatten(material.props.style).backgroundColor
            ).not.toBe(colors.chatBackground);
          }
        }
      });
      const selected = screen.getByRole('button', { name: '今日安排' });
      expect(selected.props.accessibilityState.selected).toBe(true);
      expect(
        selected
          .findAllByType(View)
          .map((node) => StyleSheet.flatten(node.props.style))
      ).toContainEqual(
        expect.objectContaining({ borderColor: colors.primary })
      );
      fireEvent.press(selected);
      fireEvent.press(screen.getByRole('button', { name: '正在处理' }));
      fireEvent.press(screen.getByRole('button', { name: '不可操作' }));
      expect(press).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('static-chip')).toHaveStyle({
        backgroundColor: colors.surface,
        borderColor: colors.outline,
      });
    }
  );
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
  await expectVisibleMaterial();
  fireEvent.press(screen.getByRole('button', { name: '清除搜索内容' }));
  expect(screen.getByTestId('search-input').props.value).toBe('');
  await expectVisibleMaterial();
  fireEvent.changeText(screen.getByTestId('search-input'), '门店');
  fireEvent(screen.getByTestId('search-input'), 'submitEditing', {
    nativeEvent: { text: '门店' },
  });
  expect(submit).toHaveBeenCalledWith('门店');
  await expectVisibleMaterial();
});

test.each(['light', 'dark'] as const)(
  'secondary 在 %s 减少透明度时保留可区分的主题底色',
  async (scheme) => {
    jest.replaceProperty(
      LiquidGlass as { isLiquidGlassSupported: boolean },
      'isLiquidGlassSupported',
      false
    );
    jest
      .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
      .mockResolvedValue(true);
    const colors = scheme === 'dark' ? darkColors : lightColors;
    const press = jest.fn();
    render(
      <ThemeProvider forceScheme={scheme}>
        <Button variant="secondary" label="AI识别" onPress={press} />
      </ThemeProvider>
    );
    const layer = screen.UNSAFE_getByType(LiquidGlass.LiquidGlassView);
    expect(StyleSheet.flatten(layer.props.style).backgroundColor).toBe(
      colors.surfaceContainerHigh
    );
    expect(StyleSheet.flatten(layer.props.style).backgroundColor).not.toBe(
      colors.surface
    );
    fireEvent.press(screen.getByRole('button', { name: 'AI识别' }));
    expect(press).toHaveBeenCalledTimes(1);
  }
);
