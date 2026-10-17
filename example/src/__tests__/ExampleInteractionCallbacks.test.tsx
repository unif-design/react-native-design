import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react-native';
import * as Design from '@unif/react-native-design';
import App from '../App';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default
);
jest.mock(
  '../../../node_modules/react-native-safe-area-context',
  () =>
    jest.requireActual(
      '../../../node_modules/react-native-safe-area-context/jest/mock'
    ).default
);

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.useRealTimers();
});

function enter(name: RegExp) {
  const page = render(<App />);
  fireEvent.press(page.getByRole('button', { name }));
  return page;
}

// Scene-owned callback contracts at the real Design component boundary. Existing
// owner suites independently assert that disabled/loading controls block UI events.
function byID(
  page: ReturnType<typeof render>,
  Component: React.ComponentType<never>,
  id: string
) {
  const node = page
    .UNSAFE_getAllByType(Component as React.ComponentType<never>)
    .find((item) => item.props.testID === id);
  if (!node) throw new Error(`Missing rendered specimen: ${id}`);
  return node;
}

test('操作场景的矩阵回调交付具名结果，菜单与原位确认走真实交互', () => {
  const page = enter(/操作与状态/);
  for (const Component of [Design.Button, Design.IconButton, Design.Chip]) {
    const nodes = page
      .UNSAFE_getAllByType(Component as React.ComponentType<never>)
      .filter(
        (node) =>
          node.props.testID?.startsWith('actions-') &&
          typeof node.props.onPress === 'function'
      );
    for (const node of nodes) {
      act(() => node.props.onPress());
      expect(page.getByTestId('result-latest')).toBeTruthy();
    }
  }
  const blockedChip = page
    .UNSAFE_getAllByType(Design.Chip)
    .find((node) => node.props.label === '禁用处理中标签')!;
  act(() => blockedChip.props.onPress());
  expect(
    page.getByText('最新结果：Chip · 点击 · 禁用处理中标签已触发')
  ).toBeTruthy();
  fireEvent.press(page.getByRole('button', { name: '删除第二条示例' }));
  fireEvent.press(page.getByRole('button', { name: '确认删除' }));
  expect(
    page.getByText('最新结果：IconButton · 删除 · 已确认第二条')
  ).toBeTruthy();
  fireEvent.press(page.getByRole('button', { name: '区域内其他操作' }));
  fireEvent.press(page.getByRole('button', { name: '复制示例' }));
  expect(
    page.getByText('最新结果：ActionMenuContent · 复制 · 已选择复制')
  ).toBeTruthy();
  fireEvent.press(page.getByRole('button', { name: '圆形返回演示' }));
  expect(
    page.getByText('最新结果：IconButton · 返回 · 已点击返回')
  ).toBeTruthy();
  const menu = byID(page, Design.ActionMenuContent, 'actions-menu');
  act(() =>
    menu.props.actions
      .find((action: { id: string }) => action.id === 'busy')
      .onPress()
  );
  const loading = page
    .UNSAFE_getAllByType(Design.IconButton)
    .find((node) => node.props.accessibilityLabel === '定位加载演示')!;
  act(() => loading.props.onPress());
  for (const node of page.UNSAFE_getAllByType(Design.Segmented))
    act(() => node.props.onChange('invalid'));
  fireEvent.press(page.getByRole('button', { name: '可选择标签' }));
  fireEvent.press(page.getByRole('button', { name: '可选择标签' }));
  expect(page.getByText(/最新结果：Chip · 选择/)).toBeTruthy();
});

test('表单场景保留输入草稿并交付全部输入及选择边界', () => {
  const page = enter(/表单与输入/);
  for (const Component of [
    Design.Input,
    Design.Textarea,
    Design.PasswordInput,
    Design.Search,
  ]) {
    for (const node of page.UNSAFE_getAllByType(
      Component as React.ComponentType<never>
    )) {
      if (node.props.onChangeText)
        act(() => node.props.onChangeText('边界输入'));
    }
  }
  expect(byID(page, Design.Input, 'forms-input-controlled').props.value).toBe(
    '边界输入'
  );
  expect(
    byID(page, Design.Textarea, 'forms-textarea-consumer').props.value
  ).toBe('边界输入');
  for (const id of ['forms-text-entry', 'forms-text-entry-compact']) {
    const node = byID(page, Design.TextEntryContent, id);
    act(() => node.props.onChangeText('编辑后的内容'));
    act(() => node.props.onSubmit());
    act(() => node.props.onCancel());
  }
  expect(page.getByText(/最新结果：TextEntryContent · 紧凑取消/)).toBeTruthy();
  fireEvent.press(page.getByRole('button', { name: '结束演示冷却' }));
  for (const name of ['填入多行', '聚焦多行输入', '外部清空'])
    fireEvent.press(page.getByRole('button', { name }));
  expect(
    byID(page, Design.Textarea, 'forms-textarea-consumer').props.value
  ).toBe('');
  act(() =>
    byID(page, Design.Input, 'forms-input-disabled').props.trailing.onPress()
  );
  for (const Component of [Design.Checkbox, Design.Switch]) {
    for (const node of page.UNSAFE_getAllByType(
      Component as React.ComponentType<never>
    )) {
      act(() => node.props.onChange(false));
      act(() => node.props.onChange(true));
    }
  }
  const radio = byID(page, Design.Radio.Group, 'forms-radio-group');
  act(() => radio.props.onChange(1));
  act(() => radio.props.onChange('first'));
  expect(page.getByText('最新结果：Radio · 选择 · 已选择电话')).toBeTruthy();
  for (const node of page.UNSAFE_getAllByType(Design.Stepper))
    act(() => node.props.onChange(4));
  expect(
    page.getByText('最新结果：Stepper · 调整 · 禁用步进已触发')
  ).toBeTruthy();
  const input = byID(page, Design.Input, 'forms-ref-input');
  act(() => input.props.onFocus({}));
  expect(page.getByText('引用状态：已聚焦')).toBeTruthy();
  act(() => input.props.onBlur({}));
  expect(page.getByText('引用状态：已失焦')).toBeTruthy();
});

test('集合场景配置、列表动作、网格和轮播边界保留实际结果', () => {
  const page = enter(/容器与集合/);
  const segments = page.UNSAFE_getAllByType(Design.Segmented);
  for (const node of segments) {
    act(() => node.props.onChange('invalid'));
    for (const item of node.props.items)
      act(() => node.props.onChange(item.id));
  }
  for (const node of page.UNSAFE_getAllByType(Design.Switch)) {
    act(() => node.props.onChange(true));
    act(() => node.props.onChange(false));
  }
  for (const node of page.UNSAFE_getAllByType(Design.Cell)) {
    if (node.props.onPress) act(() => node.props.onPress());
  }
  expect(page.getByText('最新结果：Cell · 点击 · 禁用行不应触发')).toBeTruthy();
  for (const node of page.UNSAFE_getAllByType(Design.Grid)) {
    if (node.props.onPress) act(() => node.props.onPress(node.props.items[0]));
  }
  expect(page.getByText(/最新结果：Grid · 选择/)).toBeTruthy();
  fireEvent.press(page.getByRole('button', { name: /挂载轮播演示/ }));
  for (const node of page.UNSAFE_getAllByType(Design.Carousel)) {
    expect(node.props.keyExtractor(node.props.data[0])).toBe(
      node.props.data[0].id
    );
    if (node.props.onPressItem)
      act(() => node.props.onPressItem(node.props.data[0], 0));
  }
  expect(page.getByText(/最新结果：Carousel · 点击/)).toBeTruthy();
  const read = page.getByRole('button', { name: '读取当前页' });
  const callback = page
    .UNSAFE_getAllByType(Design.Button)
    .find((node) => node.props.label === '读取当前页')!.props.onPress;
  fireEvent.press(read);
  fireEvent.press(page.getByRole('button', { name: /卸载轮播演示/ }));
  act(() => callback());
  expect(
    page.getByText('最新结果：Carousel · 读取 · 轮播尚未挂载')
  ).toBeTruthy();
});

test('媒体场景配置器覆盖合法选择与非法事件，原图操作保留草稿', () => {
  const page = enter(/媒体展示/);
  for (const node of page.UNSAFE_getAllByType(Design.Segmented)) {
    act(() => node.props.onChange('invalid'));
    for (const item of node.props.items)
      act(() => node.props.onChange(item.id));
  }
  for (const node of page.UNSAFE_getAllByType(Design.Switch))
    act(() => node.props.onChange(true));
  fireEvent.press(page.getByRole('button', { name: '定位第一张' }));
  fireEvent.press(page.getByRole('button', { name: '恢复预览图片' }));
  expect(page.getByTestId('media-image-preview')).toBeTruthy();
  expect(
    page.UNSAFE_getAllByType(Design.Logo).some((node) => node.props.size === 88)
  ).toBe(true);
});

test('导航场景拒绝未知 id，边界回调保留原始选择摘要', () => {
  const page = enter(/导航组件/);
  fireEvent.press(page.getByRole('button', { name: '演示返回动作' }));
  expect(
    page.getByText('最新结果：NavBar · 操作 · 返回动作已触发')
  ).toBeTruthy();
  for (const Component of [Design.Tabs, Design.Segmented, Design.TabBar]) {
    for (const node of page.UNSAFE_getAllByType(
      Component as React.ComponentType<never>
    )) {
      act(() => node.props.onChange('invalid'));
      for (const item of node.props.items)
        act(() => node.props.onChange(item.id));
    }
  }
  expect(page.getByText(/最新结果：TabBar · 选择/)).toBeTruthy();
});

test('基础与业务场景拒绝非法配置，logger 重入不会丢失安全结果', () => {
  const page = enter(/主题与基础能力/);
  for (const node of page.UNSAFE_getAllByType(Design.Segmented))
    act(() => node.props.onChange('invalid'));
  let entered = false;
  Design.addTransport({
    id: 'boundary-reentrant',
    log(record) {
      if (record.scope !== 'FoundationScene' || entered) return;
      entered = true;
      Design.createLogger('other').info('unrelated');
      Design.createLogger('FoundationScene').info('different message');
      Design.createLogger('FoundationScene').info('主题诊断示例已记录');
    },
  });
  try {
    fireEvent.press(page.getByRole('button', { name: '记录主题诊断' }));
    expect(page.getByText(/主题诊断示例已记录/)).toBeTruthy();
  } finally {
    Design.removeTransport('boundary-reentrant');
  }
  page.unmount();
  const business = enter(/业务复合组件/);
  for (const node of business.UNSAFE_getAllByType(Design.Segmented))
    act(() => node.props.onChange('invalid'));
  expect(business.getByTestId('business-screen')).toBeTruthy();
});

test('导航配置拒绝原型属性名称，不把非选项 id 写入草稿', () => {
  const page = enter(/导航组件/);
  for (const [Component, id, prop] of [
    [Design.Tabs, 'navigation-tabs', 'value'],
    [Design.Segmented, 'navigation-segmented-md', 'value'],
    [Design.TabBar, 'navigation-tabbar', 'active'],
  ] as const) {
    const before = byID(page, Component, id).props[prop];
    for (const invalid of ['toString', '__proto__', 'unknown'])
      act(() => byID(page, Component, id).props.onChange(invalid));
    expect(byID(page, Component, id).props[prop]).toBe(before);
  }
});
