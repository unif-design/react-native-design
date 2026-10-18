import React from 'react';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { Image, StyleSheet, Text } from 'react-native';
import { SearchOutlined } from '@unif/react-native-icons';
import {
  AvatarGroup,
  AvatarWithRing,
  Button,
  Card,
  Carousel,
  Cell,
  Chip,
  IconButton,
  List,
  Logo,
  NavBar,
  PasswordInput,
  ScreenBackdrop,
  Search,
  Switch,
  Tabs,
  Tag,
  ThemeProvider,
  lightColors,
  Thumbnail,
} from '@unif/react-native-design';
import { Switch as WebSwitch } from '../../../src/components/ui/Switch/Switch.web';
import { GradientWash } from '../../../src/components/business/Decorations/GradientWash';
import { selectImageAttemptSource } from '../../../src/components/ui/shared/selectImageAttemptSource.web';

beforeEach(() => jest.clearAllMocks());
afterEach(() => jest.restoreAllMocks());

test.each([
  ['native', Switch],
  ['web', WebSwitch],
] as const)('%s 无名称开关无法提交且不暴露虚假名称', (_platform, Toggle) => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const change = jest.fn();
  const page = render(
    <ThemeProvider>
      <Toggle
        value={false}
        onChange={change}
        accessibilityLabel=" "
        testID="switch"
      />
    </ThemeProvider>
  );
  expect(page.queryByRole('switch')).toBeNull();
  expect(page.getByTestId('switch').props.accessible).toBe(false);
  fireEvent.press(page.getByTestId('switch'));
  expect(change).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledWith(
    '[Switch]',
    expect.stringContaining('不能为空白')
  );
});

test('无名称按钮被禁用，合法玻璃和实色按钮保持真实按压回调', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const press = jest.fn();
  const page = render(
    <ThemeProvider>
      <Button label=" " onPress={press} testID="blank" />
      <IconButton
        icon={SearchOutlined}
        accessibilityLabel=" "
        onPress={press}
      />
    </ThemeProvider>
  );
  expect(page.queryByRole('button')).toBeNull();
  fireEvent.press(page.getByTestId('blank'));
  expect(press).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledWith(
    '[Button]',
    expect.stringContaining('不能为空白')
  );
  expect(warn).toHaveBeenCalledWith(
    '[IconButton]',
    expect.stringContaining('不能为空白')
  );
  page.rerender(
    <ThemeProvider>
      <Button label="提交" onPress={press} />
      <IconButton
        icon={SearchOutlined}
        variant="glass"
        accessibilityLabel="搜索"
        onPress={press}
      />
    </ThemeProvider>
  );
  await userEvent.press(page.getByRole('button', { name: '提交' }));
  await userEvent.press(page.getByRole('button', { name: '搜索' }));
  expect(press).toHaveBeenCalledTimes(2);
});

test('Tabs 缺项诊断，合法 tab 与 Chip/AvatarGroup overflow 的按压只交付对应动作', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const change = jest.fn();
  const press = jest.fn();
  const page = render(
    <ThemeProvider>
      <Tabs items={[]} value="a" onChange={change} />
    </ThemeProvider>
  );
  expect(warn).toHaveBeenCalledWith(
    '[Tabs]',
    expect.stringContaining('至少需要 2 项')
  );
  page.rerender(
    <ThemeProvider>
      <Tabs
        items={[
          { id: 'a', label: '甲' },
          { id: 'b', label: '乙' },
        ]}
        value="a"
        onChange={change}
      />
      <Chip label="行动" onPress={press} />
      <Chip label="已选" selected />
      <AvatarGroup
        items={[
          { key: 'a', label: '甲' },
          { key: 'b', label: '乙' },
          { key: 'c', label: '丙' },
        ]}
        max={2}
        onOverflowPress={press}
      />
    </ThemeProvider>
  );
  await userEvent.press(page.getByRole('tab', { name: '乙' }));
  await userEvent.press(page.getByRole('button', { name: '行动' }));
  await userEvent.press(
    page.getByRole('button', { name: '查看其余 2 位成员' })
  );
  expect(change).toHaveBeenCalledWith('b');
  expect(press).toHaveBeenCalledTimes(2);
  expect(page.getByText('已选')).toBeTruthy();
});

test('生产 AvatarGroup 不写开发诊断，内容和溢出仍正常呈现', () => {
  const dev = Reflect.get(globalThis, '__DEV__');
  Reflect.set(globalThis, '__DEV__', false);
  try {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const page = render(
      <ThemeProvider>
        <AvatarGroup items={[{ key: 'a', label: '甲' }]} max={1} />
      </ThemeProvider>
    );
    expect(page.getByText('甲')).toBeTruthy();
    expect(warn).not.toHaveBeenCalled();
  } finally {
    Reflect.set(globalThis, '__DEV__', dev);
  }
});

test('Card 显式边框保留缺省和自定义宽度，暗色表面使用同一契约', () => {
  const page = render(
    <ThemeProvider forceScheme="dark">
      <Card borderColor="red" testID="default">
        <Text>内容</Text>
      </Card>
      <Card
        variant="glass"
        borderColor="blue"
        borderWidth={3}
        padding={9}
        borderRadius={17}
        testID="glass-card"
      >
        <Text>玻璃内容</Text>
      </Card>
      <Card variant="flat" borderColor="blue" borderWidth={4} testID="custom">
        {null}
      </Card>
    </ThemeProvider>
  );
  const findStyle = (testID: string) =>
    page
      .getByTestId(testID)
      .findAll(
        (node) =>
          StyleSheet.flatten(node.props.style)?.borderColor !== undefined
      )
      .map((node) => StyleSheet.flatten(node.props.style));
  expect(findStyle('default')).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ borderColor: 'red', borderWidth: 2 }),
    ])
  );
  expect(
    StyleSheet.flatten(page.getByTestId('glass-card').props.style)
  ).toMatchObject({ backgroundColor: 'transparent', borderRadius: 17 });
  expect(findStyle('glass-card')).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        borderColor: 'blue',
        borderWidth: 3,
        padding: 9,
      }),
    ])
  );
  expect(page.getByText('玻璃内容')).toBeTruthy();
  expect(findStyle('custom')).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ borderColor: 'blue', borderWidth: 4 }),
    ])
  );
});

test('Cell display extra 单独提供读屏文本，静态名称可不传选择状态', () => {
  const page = render(
    <ThemeProvider>
      <List divider="full">
        <Cell
          title="状态甲"
          onPress={() => {}}
          extra={{
            kind: 'display',
            node: <Text>色块</Text>,
            accessibilityText: '已完成',
          }}
        />
        <Cell
          title="状态乙"
          accessibilityLabel="状态摘要"
          extra={{ kind: 'display', node: <Text>装饰</Text> }}
        />
      </List>
    </ThemeProvider>
  );
  expect(page.getByText('已完成')).toBeTruthy();
  expect(
    page.getByLabelText('状态摘要').props.accessibilityState
  ).toBeUndefined();
});

test('Logo 缺少名称诊断去重，默认尺寸与 AvatarWithRing 缺省主题环保留', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const page = render(
    <ThemeProvider>
      <Logo source={{ uri: 'logo' }} accessibilityLabel=" " />
      <AvatarWithRing label="头像" />
    </ThemeProvider>
  );
  expect(page.UNSAFE_getByType(Image).props.accessible).toBe(false);
  page.rerender(
    <ThemeProvider>
      <Logo source={{ uri: 'logo' }} accessibilityLabel=" " />
      <AvatarWithRing label="头像" />
    </ThemeProvider>
  );
  expect(warn.mock.calls.filter(([scope]) => scope === '[Logo]')).toHaveLength(
    1
  );
  expect(page.getByText('头像')).toBeTruthy();
});

test('无效 NavBar slot 诊断去重且不进入可点击树', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const props = { title: '标题', left: { invalid: true } as never };
  const page = render(
    <ThemeProvider>
      <NavBar {...props} />
    </ThemeProvider>
  );
  page.rerender(
    <ThemeProvider>
      <NavBar {...props} />
    </ThemeProvider>
  );
  expect(page.queryByRole('button')).toBeNull();
  expect(warn).toHaveBeenCalledWith(
    '[NavBar]',
    expect.stringContaining('忽略无效')
  );
  expect(
    warn.mock.calls.filter(([scope]) => scope === '[NavBar]')
  ).toHaveLength(1);
});

test('轮播缺 action 配对或名称时保留纯展示内容并给出诊断', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const props = {
    data: ['甲'],
    renderItem: ({ item }: { item: string }) => <Text>{item}</Text>,
    height: 100,
  };
  const page = render(
    <ThemeProvider>
      <Carousel
        {...props}
        {...({ onPressItem: jest.fn() } as unknown as React.ComponentProps<
          typeof Carousel<string>
        >)}
      />
    </ThemeProvider>
  );
  expect(warn).toHaveBeenCalledWith(
    '[Carousel]',
    expect.stringContaining('同时提供')
  );
  page.rerender(
    <ThemeProvider>
      <Carousel
        {...props}
        onPressItem={jest.fn()}
        getAccessibilityLabel={() => ' '}
      />
    </ThemeProvider>
  );
  expect(warn).toHaveBeenCalledWith(
    '[Carousel]',
    expect.stringContaining('名称无效')
  );
  expect(page.queryByRole('button')).toBeNull();
});

test('PasswordInput 和 Search 拒绝调用方覆盖自管别名', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const password = {
    value: 1,
    onChangeText: null,
    placeholder: '输入口令',
    defaultValue: 'bad',
  } as unknown as React.ComponentProps<typeof PasswordInput>;
  const page = render(
    <ThemeProvider>
      <PasswordInput {...password} testID="password" />
      <Search
        testID="search"
        {...({
          leading: 'bad',
          role: 'button',
        } as unknown as React.ComponentProps<typeof Search>)}
        disabled
        onSubmit={jest.fn()}
      />
    </ThemeProvider>
  );
  expect(page.getByTestId('password-input').props.value).toBe('');
  expect(page.getByTestId('password-input').props.placeholder).toBe('输入口令');
  expect(warn).toHaveBeenCalledWith(
    '[PasswordInput]',
    expect.stringContaining('自管 props')
  );
  expect(warn).toHaveBeenCalledWith(
    '[Search]',
    expect.stringContaining('自管 props')
  );
  fireEvent(page.getByTestId('search-input'), 'submitEditing', {});
});

test('未配置背景只保留内容，暗色自定义渐变和默认 Tag 保持公开选择', () => {
  const page = render(
    <ThemeProvider forceScheme="dark">
      <ScreenBackdrop>
        <Text>正文</Text>
      </ScreenBackdrop>
      <Tag label="标签" />
    </ThemeProvider>
  );
  expect(page.queryByTestId('gradient')).toBeNull();
  expect(page.getByText('正文')).toBeTruthy();
  page.rerender(
    <ThemeProvider forceScheme="dark">
      <ScreenBackdrop
        stops={{
          light: [{ offset: 0, color: 'white' }],
          dark: [{ offset: 0, color: 'black' }],
        }}
      />
    </ThemeProvider>
  );
  expect(page.UNSAFE_getByType(GradientWash).props.stops).toEqual([
    { offset: 0, color: 'black' },
  ]);
});

test('Thumbnail 无效 source 保留占位，受管和非法 imageStyle 保持诊断且 Web source 选择使用实际实现', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const page = render(
    <ThemeProvider>
      <Thumbnail
        source={undefined as never}
        accessibilityLabel="图"
        imageStyle={{ width: 999 } as never}
      />
    </ThemeProvider>
  );
  expect(page.UNSAFE_queryByType(Image)).toBeNull();
  expect(warn).toHaveBeenCalledWith(
    '[Thumbnail]',
    expect.stringContaining('imageStyle.width')
  );
  page.rerender(
    <ThemeProvider>
      <Thumbnail
        source={undefined as never}
        accessibilityLabel="图"
        imageStyle={'invalid' as never}
      />
    </ThemeProvider>
  );
  expect(warn).toHaveBeenCalledWith(
    '[Thumbnail]',
    expect.stringContaining('imageStyle')
  );
  expect(selectImageAttemptSource({ source: { uri: 'a' }, key: 'a' })).toEqual({
    uri: 'a',
  });
});

test('独立入口、静态状态名称和实色导航保持缺省行为与按压回交', async () => {
  const { DrawerHeader, EntryCard, Grid, StatusDot, TabBar } =
    require('@unif/react-native-design') as typeof import('@unif/react-native-design');
  const press = jest.fn();
  const change = jest.fn();
  const page = render(
    <ThemeProvider>
      <DrawerHeader name=" " />
      <EntryCard icon={SearchOutlined} title="入口" onPress={press} />
      <Grid
        items={[{ id: 'a', label: '功能', icon: SearchOutlined }]}
        onPress={press}
      />
      <StatusDot status="done" accessibilityLabel="已处理" />
      <StatusDot
        status="pending"
        accessibilityLabel=""
        testID="decorative-status"
      />
      <TabBar
        surface="solid"
        active="a"
        onChange={change}
        items={[
          { id: 'a', label: '首页', icon: SearchOutlined },
          { id: 'b', label: '设置', icon: SearchOutlined },
        ]}
      />
    </ThemeProvider>
  );
  expect(page.getByText('?', { includeHiddenElements: true })).toBeTruthy();
  expect(page.getByLabelText('已处理')).toBeTruthy();
  expect(page.getByTestId('decorative-status').props.accessible).toBe(false);
  await userEvent.press(page.getByRole('button', { name: '入口' }));
  await userEvent.press(page.getByRole('button', { name: '功能' }));
  await userEvent.press(page.getByRole('tab', { name: '设置' }));
  expect(press).toHaveBeenCalledTimes(2);
  expect(change).toHaveBeenCalledWith('b');
});

test.each(['auto', 'NaN%'])(
  'Sheet 无效 top padding %s 不使 overlay 高度失效，solid footer 保持内容',
  (paddingTop) => {
    const { Sheet } =
      require('@unif/react-native-design') as typeof import('@unif/react-native-design');
    const { ScrollView } =
      require('react-native') as typeof import('react-native');
    const page = render(
      <ThemeProvider>
        <Sheet
          header={<Text>标题</Text>}
          headerMode="overlay"
          contentMode="scroll"
          footer={<Text>页尾</Text>}
          footerSurface="solid"
          contentContainerStyle={{ paddingTop: paddingTop as never }}
        >
          <Text>正文</Text>
        </Sheet>
      </ThemeProvider>
    );
    const scroll = page.UNSAFE_getByType(ScrollView);
    fireEvent(scroll, 'layout', {
      nativeEvent: { layout: { width: 200, height: 100, x: 0, y: 0 } },
    });
    expect(
      StyleSheet.flatten(scroll.props.contentContainerStyle).paddingTop
    ).toBe(0);
    expect(page.getByText('页尾')).toBeTruthy();
  }
);

test('simple GradientWash uses default endpoint opacity and preset stops retain all four positions', () => {
  const { LinearGradient } = require('../../../node_modules/react-native-svg');
  const page = render(
    <ThemeProvider>
      <GradientWash height={100} color={lightColors.primary} />
    </ThemeProvider>
  );
  expect(
    page
      .UNSAFE_getByType(LinearGradient)
      .props.children.map(
        (node: React.ReactElement<{ stopOpacity: number }>) =>
          node.props.stopOpacity
      )
  ).toEqual([0.1, 0]);
  page.rerender(
    <ThemeProvider>
      <ScreenBackdrop preset="warmOrange" />
    </ThemeProvider>
  );
  expect(
    page
      .UNSAFE_getByType(GradientWash)
      .props.stops.map((stop: { offset: number }) => stop.offset)
  ).toEqual([0, 0.35, 0.75, 1]);
});

test('status default name, unnamed display text containers and conflicting thumbnail sources stay deterministic', () => {
  const { FormGroup, StatusDot } =
    require('@unif/react-native-design') as typeof import('@unif/react-native-design');
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  const page = render(
    <ThemeProvider>
      <StatusDot status="pending" />
      <List flush>{'静态列表内容'}</List>
      <FormGroup>{42}</FormGroup>
      <Thumbnail
        {...({
          uri: 'a',
          source: { uri: 'b' },
        } as unknown as React.ComponentProps<typeof Thumbnail>)}
        testID="conflict"
      />
    </ThemeProvider>
  );
  expect(page.getByLabelText('pending')).toBeTruthy();
  expect(page.UNSAFE_queryByType(Image)).toBeNull();
  expect(page.toJSON()).toBeTruthy();
});
