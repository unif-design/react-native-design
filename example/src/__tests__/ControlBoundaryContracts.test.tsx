import React from 'react';
import {
  act,
  fireEvent,
  render,
  userEvent,
} from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import type { ReactTestInstance } from 'react-test-renderer';
import { SendOutlined } from '@unif/react-native-icons';
import {
  Checkbox,
  Radio,
  Segmented,
  Grid,
  List,
  Cell,
  Stepper,
  ThemeProvider,
} from '@unif/react-native-design';
import { colWidth } from '../../../src/components/ui/Grid/styles';

afterEach(() => jest.restoreAllMocks());

function pressHandler(node: ReactTestInstance): () => void {
  if (typeof node.props.onPress === 'function') return node.props.onPress;
  if (node.parent) return pressHandler(node.parent);
  throw new Error('Missing press callback');
}

test('复选框名称缺失时不提交，补上独立名称后可提交并处理按压状态', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const change = jest.fn();
  const page = render(
    <Checkbox
      checked={false}
      onChange={change}
      testID="checkbox"
      accessibilityLabel={undefined as unknown as string}
    />
  );
  expect(page.getByTestId('checkbox').props.accessible).toBe(false);
  fireEvent.press(page.getByTestId('checkbox'));
  expect(change).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledWith(
    '[Checkbox]',
    expect.stringContaining('需要非空')
  );
  page.rerender(
    <Checkbox
      checked={false}
      onChange={change}
      accessibilityLabel="确认条款"
      shape="circle"
    />
  );
  await userEvent.press(page.getByRole('checkbox', { name: '确认条款' }));
  expect(change).toHaveBeenCalledWith(true);
});

test('Radio 没有 Group 时诊断去重，缺少名称时拒绝选择', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const first = render(<Radio value="orphan-boundary" label="未接入分组" />);
  expect(first.queryByRole('radio')).toBeNull();
  first.unmount();
  const second = render(<Radio value="orphan-boundary" label="未接入分组" />);
  expect(warn).toHaveBeenCalledTimes(1);
  second.unmount();
  const change = jest.fn();
  const group = render(
    <Radio.Group value="a" onChange={change} accessibilityLabel=" ">
      <Radio
        value="a"
        testID="unnamed-radio"
        accessibilityLabel={undefined as unknown as string}
      />
    </Radio.Group>
  );
  expect(group.getByTestId('unnamed-radio').props.accessible).toBe(false);
  fireEvent.press(group.getByTestId('unnamed-radio'));
  expect(change).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledTimes(3);
});

test('Radio 独立名称不产生可见标签，触摸选择仍回交给 Group', async () => {
  const change = jest.fn();
  const page = render(
    <Radio.Group value="a" onChange={change} accessibilityLabel="选项">
      <Radio value="b" accessibilityLabel="选项乙" />
    </Radio.Group>
  );
  expect(page.queryByText('选项乙')).toBeNull();
  await userEvent.press(page.getByRole('radio', { name: '选项乙' }));
  expect(change).toHaveBeenCalledWith('b');
});

test.each(['light', 'dark'] as const)(
  'Segmented solid 在 %s 主题保留选择与禁用语义',
  async (scheme) => {
    const change = jest.fn();
    const items = [
      { id: 'a', label: '甲' },
      { id: 'b', label: '乙' },
      { id: 'c', label: '丙', disabled: true },
    ];
    const page = render(
      <ThemeProvider forceScheme={scheme}>
        <Segmented surface="solid" items={items} value="a" onChange={change} />
      </ThemeProvider>
    );
    await userEvent.press(page.getByRole('tab', { name: '乙' }));
    expect(change).toHaveBeenCalledWith('b');
    fireEvent.press(page.getByRole('tab', { name: '丙' }));
    expect(change).toHaveBeenCalledTimes(1);
    act(() => pressHandler(page.getByRole('tab', { name: '丙' }))());
    expect(change).toHaveBeenCalledTimes(1);
  }
);

test.each([
  [1, '100%'],
  [2, '50%'],
  [3, '33.333%'],
  [4, '25%'],
  [5, '20%'],
  [6, '16.666%'],
] as const)('Grid %d 列提供确定列宽', (columns, width) => {
  expect(StyleSheet.flatten(colWidth(columns))).toEqual({ width });
});

test('Grid 非法列数回退且诊断去重，缺名项保留为展示内容', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const press = jest.fn();
  const item = { id: 'missing-name', label: '', icon: SendOutlined };
  const first = render(
    <Grid
      items={[item]}
      columns={0 as never}
      onPress={press}
      testID="grid"
      card={false}
    />
  );
  expect(StyleSheet.flatten(colWidth(0))).toEqual({ width: '25%' });
  expect(first.queryByRole('button')).toBeNull();
  expect(first.getByTestId('grid-missing-name').props.onPress).toBeUndefined();
  expect(press).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledTimes(2);
  first.unmount();
  render(<Grid items={[]} columns={0 as never} />);
  expect(warn).toHaveBeenCalledTimes(2);
});

test.each([false, true])(
  'Cell 前导图标在 flush=%s 下保留危险色和展示内容',
  (flush) => {
    const page = render(
      <List flush={flush} divider="none">
        <Cell title="普通项" leading={SendOutlined} />
        <Cell title="危险项" leading={SendOutlined} danger />
        <Cell
          title="展示项"
          leading={{ kind: 'display', node: <Text>徽记</Text> }}
        />
      </List>
    );
    expect(page.getByText('普通项')).toBeTruthy();
    expect(page.getByText('危险项')).toBeTruthy();
    expect(
      page.getByText('徽记', { includeHiddenElements: true })
    ).toBeTruthy();
    const icons = page.UNSAFE_getAllByType(SendOutlined);
    expect(icons).toHaveLength(2);
    expect(icons[0]?.props.color).not.toBe(icons[1]?.props.color);
    expect(icons[0]?.props.size).toBeGreaterThan(0);
    if (flush) {
      expect(
        StyleSheet.flatten(icons[0]?.parent?.props.style).backgroundColor
      ).toBe(StyleSheet.flatten(icons[1]?.parent?.props.style).backgroundColor);
    }
  }
);

test('Stepper 无名称时禁止操作，非法步长与倒置范围诊断只记录一次', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const change = jest.fn();
  const content = () => (
    <ThemeProvider>
      <Stepper
        value={5}
        min={7}
        max={3}
        step={-0.25}
        onChange={change}
        accessibilityLabel=" "
        testID="stepper"
      />
    </ThemeProvider>
  );
  const first = render(content());
  expect(first.queryByRole('button')).toBeNull();
  fireEvent.press(first.getByTestId('stepper-increment'));
  expect(change).not.toHaveBeenCalled();
  expect(
    warn.mock.calls.filter(([scope]) => scope === '[Stepper]')
  ).toHaveLength(3);
  first.unmount();
  render(content());
  expect(
    warn.mock.calls.filter(([scope]) => scope === '[Stepper]')
  ).toHaveLength(4);
});

test('Stepper 两端动作回交数值，按压期间仍保留格式化读数', async () => {
  const change = jest.fn();
  const page = render(
    <ThemeProvider>
      <Stepper
        value={1}
        min={0}
        max={2}
        onChange={change}
        accessibilityLabel="件数"
        formatValue={(value) => `${value}件`}
      />
    </ThemeProvider>
  );
  expect(page.getByText('1件', { includeHiddenElements: true })).toBeTruthy();
  await userEvent.press(page.getByRole('button', { name: '件数，减少' }));
  await userEvent.press(page.getByRole('button', { name: '件数，增加' }));
  expect(change.mock.calls).toEqual([[0], [2]]);
});

test('Cell 显式静态名称合并读屏状态，禁用和缺名 action 都不提交', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const press = jest.fn();
  const page = render(
    <ThemeProvider>
      <List flush>
        <Cell
          title="权限"
          desc="已允许"
          accessibilityLabel="权限状态"
          selected
        />
        <Cell title="禁用项" onPress={press} disabled arrow />
        <Cell title="" onPress={press} testID="unnamed-cell" />
        <Cell
          title="打开详情"
          onPress={press}
          arrow
          desc="说明"
          titleLines={2}
        />
      </List>
    </ThemeProvider>
  );
  expect(page.getByLabelText('权限状态').props.accessibilityState).toEqual({
    selected: true,
  });
  fireEvent.press(page.getByRole('button', { name: '禁用项' }));
  expect(page.getByTestId('unnamed-cell').props.onPress).toBeUndefined();
  expect(press).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledWith(
    '[Cell]',
    expect.stringContaining('缺少非空业务名称')
  );
  await userEvent.press(page.getByRole('button', { name: '打开详情，说明' }));
  expect(press).toHaveBeenCalledTimes(1);
});
