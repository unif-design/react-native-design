/**
 * 公共 API 的**编译期** fixture —— 由根 `yarn typecheck` 执行,不进 Jest。
 *
 * 每条契约至少一个合法调用 + 一个 `@ts-expect-error` 非法调用。`@ts-expect-error`
 * 在**没有**报错时同样会让 tsc 失败,所以放宽某个类型会立刻被这里抓到 ——
 * 这正是它比注释更可靠的地方。
 *
 * 纪律:只用真实的具体值与回调。空声明 / `as any` 无法真正驱动 JSX 重载,
 * 那样的 fixture 通过了也证明不了什么。
 */
import { createRef } from 'react';
import { Pressable, Text } from 'react-native';
import {
  Button,
  Carousel,
  Cell,
  Checkbox,
  CircularProgress,
  IconButton,
  Input,
  Logo,
  NavBar,
  PasswordInput,
  Radio,
  Ribbon,
  Search,
  Stepper,
  Switch,
  Textarea,
  Thumbnail,
  VersionPill,
  type CellExtra,
  type CellLeading,
  type CellProps,
  type CellTextValue,
  type CarouselProps,
  type InputProps,
  type NavBarAction,
  type NavBarSlot,
  type RibbonProps,
  type RibbonTone,
  type StepperSize,
  type TextFieldContainerStyle,
  type TextFieldHandle,
  type TextFieldSlot,
  type ThumbnailImageStyle,
  type VersionStatus,
} from '../src';

const setText = (_value: string) => {};
const noop = () => {};
const inputRef = createRef<TextFieldHandle>();
const tooShortContainer = { height: 20 };
const safeContainerStyle = { marginTop: 8 };
const publicTextFieldContainerStyle: TextFieldContainerStyle = {
  marginTop: 8,
  paddingHorizontal: 12,
};
const publicTextFieldSlot: TextFieldSlot = {
  kind: 'icon',
  icon: 'search',
  size: 18,
};
const invalidTextFieldSlot: TextFieldSlot = {
  kind: 'text',
  // @ts-expect-error TextFieldSlot text 分支只接受 string | number
  value: { text: 'invalid' },
};
// @ts-expect-error TextFieldContainerStyle 不允许覆盖内部 height
const invalidTextFieldContainerStyle: TextFieldContainerStyle = { height: 20 };
const logoSource = { uri: 'https://example.test/logo.png' } as const;
const thumbnailContainerStyle = {
  marginLeft: 8,
  transform: [{ scale: 1.1 }],
} as const;
const legacyThumbnailStyle = { opacity: 0.5 };
const invalidThumbnailImageStyle = { width: 999 };
const invalidStepperValueStyle = { color: 'red' };
const compactStepperSize: StepperSize = 'xs';
const dangerRibbonTone: RibbonTone = 'danger';
const publicRibbonProps: RibbonProps = {
  label: '未匹配',
  tone: dangerRibbonTone,
  children: <Text>商品卡片</Text>,
};

// --- Button / IconButton / NavBar:所有操作必须显式可达 --------------------

// @ts-expect-error Button 始终是操作
<Button label="保存" />;
// @ts-expect-error IconButton 始终是操作
<IconButton icon="close" accessibilityLabel="关闭" />;
<NavBar
  title="标题"
  // @ts-expect-error NavBar action object 必须有 handler
  left={{ icon: 'arrow-left', accessibilityLabel: '返回' }}
/>;
// @ts-expect-error NavBar action object 必须有名称
<NavBar title="标题" left={{ icon: 'arrow-left', onPress: noop }} />;

<Button label="保存" onPress={noop} accessibilityState={{ expanded: false }} />;
<IconButton
  icon="close"
  accessibilityLabel="关闭"
  onPress={noop}
  accessibilityState={{ selected: false }}
/>;
// @ts-expect-error Button 禁止调用方覆盖 disabled
<Button label="保存" onPress={noop} accessibilityState={{ disabled: false }} />;
<IconButton
  icon="close"
  accessibilityLabel="关闭"
  onPress={noop}
  // @ts-expect-error IconButton 禁止调用方覆盖 busy
  accessibilityState={{ busy: false }}
/>;

const navBarAction: NavBarAction = {
  icon: 'arrow-left',
  onPress: noop,
  accessibilityLabel: '返回',
};
const navBarDisplaySlot: NavBarSlot = <Text>只读</Text>;
<NavBar title="标题" left={navBarAction} right={navBarDisplaySlot} />;
<NavBar title="标题" right={<Text>只读</Text>} />;

// --- Checkbox / Radio / Switch:每个选择控件都有 accessible name ----------

<Checkbox checked={false} onChange={noop} label="同意协议" />;
<Checkbox checked={false} onChange={noop} accessibilityLabel="同意协议" />;
<Checkbox
  checked={false}
  onChange={noop}
  label="全部"
  accessibilityLabel="选择全部协议"
/>;
// @ts-expect-error 无可见 label 时 accessible name 必填
<Checkbox checked={false} onChange={noop} />;

<Radio.Group value="a" onChange={noop} accessibilityLabel="套餐">
  <Radio value="a" label="A" />
  <Radio value="b" accessibilityLabel="套餐 B" />
  <Radio value="c" label="C" accessibilityLabel="套餐 C（补充说明）" />
</Radio.Group>;
// @ts-expect-error Radio 无可见 label 时 accessible name 必填
<Radio value="a" />;
// @ts-expect-error radiogroup 自身必须命名
<Radio.Group value="a" onChange={noop}>
  <Radio value="a" label="A" />
</Radio.Group>;

<Switch value={false} onChange={noop} accessibilityLabel="接收提醒" />;
// @ts-expect-error Switch 没有内置可见 label
<Switch value={false} onChange={noop} />;

// @ts-expect-error adjustable 必须有上下文名称
<Stepper value={1} onChange={noop} />;
<Stepper value={1} onChange={noop} accessibilityLabel="商品数量" />;
<Stepper
  value={4}
  onChange={noop}
  accessibilityLabel="整箱数量"
  size={compactStepperSize}
  formatValue={(value) => `${value} 箱`}
/>;
<Stepper
  value={1}
  onChange={noop}
  accessibilityLabel="数量"
  // @ts-expect-error formatValue 必须返回可见文本
  formatValue={(value) => value}
/>;
<Stepper
  value={1}
  onChange={noop}
  accessibilityLabel="数量"
  // @ts-expect-error Stepper 不开放内部 value 样式覆盖
  valueStyle={invalidStepperValueStyle}
/>;

// --- Ribbon:业务只传文案 / tone，位置与折角由 Design 持有 -----------

<Ribbon {...publicRibbonProps} />;
<Ribbon label="数量待补充" tone="brand" accessibilityLabel="数量待补充">
  <Text>商品卡片</Text>
</Ribbon>;
// @ts-expect-error Ribbon label 必填
<Ribbon>
  <Text>商品卡片</Text>
</Ribbon>;
// @ts-expect-error Ribbon children 必填
<Ribbon label="未匹配" />;
// @ts-expect-error Ribbon 不暴露未实现的 placement
<Ribbon label="未匹配" placement="topLeft">
  <Text>商品卡片</Text>
</Ribbon>;
// @ts-expect-error Ribbon tone 只接受当前语义色
<Ribbon label="未匹配" tone="error">
  <Text>商品卡片</Text>
</Ribbon>;

<CircularProgress value={0.42} />;
<CircularProgress value={0.68} showLabel accessibilityLabel="上传进度" />;
// @ts-expect-error CircularProgress 必须显式提供 value
<CircularProgress />;
// @ts-expect-error showLabel 只接受 boolean
<CircularProgress value={0.5} showLabel="yes" />;

// --- Logo / VersionPill:展示内容显式命名 ---------------------------------

<Logo source={logoSource} accessibilityLabel="Unif" />;
<Logo source={logoSource} />;
// @ts-expect-error label alias removed
<Logo source={logoSource} label="Unif" />;

// --- Thumbnail:source exactly-one + layout / visual style 分层 -------------

const publicThumbnailImageStyle: ThumbnailImageStyle = {
  opacity: 0.5,
  tintColor: 'red',
};
<Thumbnail
  uri="https://example.test/thumbnail.png"
  containerStyle={thumbnailContainerStyle}
  imageStyle={publicThumbnailImageStyle}
/>;
<Thumbnail source={logoSource} />;
// @ts-expect-error exactly one source
<Thumbnail />;
// @ts-expect-error uri/source mutually exclusive
<Thumbnail uri="a" source={logoSource} />;
// @ts-expect-error old style alias removed
<Thumbnail uri="a" style={legacyThumbnailStyle} />;
// @ts-expect-error imageStyle cannot change geometry
<Thumbnail uri="a" imageStyle={invalidThumbnailImageStyle} />;

const publicVersionStatus: VersionStatus = { label: '测试中' };
<VersionPill version="1.0.0" status={publicVersionStatus} />;
// @ts-expect-error color-only status removed
<VersionPill version="1.0.0" statusColor="red" />;

// --- Cell:文本 / 展示 / control 三分联合 -------------------------------

const publicCellTextValue: CellTextValue = 0n;
const publicCellLeading: CellLeading = {
  kind: 'display',
  node: <Text>自定义前导</Text>,
};
const publicCellExtra: CellExtra = { kind: 'text', value: 0 };
const publicCellProps: CellProps = {
  title: publicCellTextValue,
  leading: publicCellLeading,
  extra: publicCellExtra,
};
const staticDisplayCellProps = {
  title: '设备',
  extra: {
    kind: 'display',
    node: <Text>在线</Text>,
    accessibilityText: '在线',
  },
} as const;
const actionableDisplayCellProps = {
  ...staticDisplayCellProps,
  onPress: noop,
};

<Cell {...publicCellProps} />;
<Cell title="设置" onPress={noop} arrow />;
<Cell title="状态" extra={{ kind: 'text', value: 0 }} />;
<Cell {...actionableDisplayCellProps} />;
// @ts-expect-error static display 是装饰内容，不能声明 accessibilityText
<Cell {...staticDisplayCellProps} />;
<Cell
  title="通知"
  extra={{
    kind: 'control',
    node: <Switch value={false} onChange={noop} accessibilityLabel="通知" />,
  }}
/>;
// @ts-expect-error control Cell 禁止外层 action
<Cell
  title="通知"
  onPress={noop}
  extra={{ kind: 'control', node: <Text /> }}
/>;
// @ts-expect-error static Cell 不能画 action arrow
<Cell title="只读" arrow />;
// @ts-expect-error title 不再接受任意 element
<Cell title={<Text>标题</Text>} />;
// @ts-expect-error desc 不再接受任意 element
<Cell title="标题" desc={<Text>描述</Text>} />;
// @ts-expect-error 不兼容 legacy raw extra，必须选择显式 kind
<Cell title="旧调用" extra="文本" />;

// --- Input / Textarea:受控 vs 非受控 -------------------------------------

<Input value="ok" onChangeText={setText} />;
<Input defaultValue="seed" />;
<Input value={undefined} defaultValue="seed" onChangeText={setText} />;
<Input ref={inputRef} defaultValue="seed" />;
<Input
  defaultValue=""
  editable={false}
  returnKeyType="done"
  containerStyle={safeContainerStyle}
/>;
<Textarea value="ok" onChangeText={setText} />;
<Textarea defaultValue="seed" minHeight={120} maxHeight={200} />;
<Textarea
  value={undefined}
  defaultValue="seed"
  onChangeText={setText}
  minHeight={120}
/>;
inputRef.current?.focus();
inputRef.current?.blur();

// @ts-expect-error controlled Input 必须有更新入口
<Input value="locked" />;
// @ts-expect-error value/defaultValue 互斥
<Input value="x" defaultValue="y" onChangeText={setText} />;
// @ts-expect-error controlled Textarea 必须有更新入口
<Textarea value="locked" />;
// @ts-expect-error Textarea 的 value/defaultValue 互斥
<Textarea value="x" defaultValue="y" onChangeText={setText} />;
// @ts-expect-error readOnly 已删除，使用 editable={false}
<Input readOnly />;
<Input
  defaultValue=""
  {...({
    // @ts-expect-error aria-disabled 已删除，使用 disabled / accessibilityState
    'aria-disabled': true,
  } satisfies InputProps)}
/>;
// @ts-expect-error role 已删除，使用 accessibilityRole
<Textarea role="textbox" />;
// @ts-expect-error enterKeyHint 已删除，使用 returnKeyType
<Search enterKeyHint="search" />;
// @ts-expect-error clearTextOnFocus 已删除，由受控值状态管理
<Input clearTextOnFocus />;
// @ts-expect-error 原生 clear 不能从公开 handle 取得
inputRef.current?.clear();
// @ts-expect-error 原生 setNativeProps 不能从公开 handle 取得
inputRef.current?.setNativeProps({ text: 'bypass' });
// @ts-expect-error 任意 ReactElement 不再是 slot
<Input trailing={<Pressable />} />;
// @ts-expect-error containerStyle 不能改最小 frame
<Input containerStyle={tooShortContainer} />;

// --- slot 判别联合 --------------------------------------------------------

<Input defaultValue="" leading={{ kind: 'icon', icon: 'search' }} />;
<Input
  defaultValue=""
  leading={publicTextFieldSlot}
  containerStyle={publicTextFieldContainerStyle}
/>;
<Input
  defaultValue=""
  leading={invalidTextFieldSlot}
  containerStyle={invalidTextFieldContainerStyle}
/>;
<Input defaultValue="" trailing={{ kind: 'text', value: 10 }} />;
<Input
  defaultValue=""
  trailing={{
    kind: 'action',
    icon: 'close',
    onPress: () => setText(''),
    accessibilityLabel: '清除',
  }}
/>;
<Input
  defaultValue=""
  // @ts-expect-error action slot 必须有 accessibilityLabel
  trailing={{ kind: 'action', icon: 'close', onPress: () => setText('') }}
/>;

// --- Search / PasswordInput:单一值来源 -----------------------------------

<Search defaultValue="seed" onSubmit={setText} />;
<Search value="query" onChangeText={setText} />;
<Search
  value={undefined}
  defaultValue="seed"
  onChangeText={setText}
  onSubmit={setText}
/>;
// @ts-expect-error controlled Search 必须有 updater
<Search value="query" />;
// @ts-expect-error Search 的 value/defaultValue 互斥
<Search value="query" defaultValue="seed" onChangeText={setText} />;
// @ts-expect-error Search owns leading slot
<Search leading={{ kind: 'icon', icon: 'search' }} />;
// @ts-expect-error Search 不公开原生 clearButtonMode
<Search clearButtonMode="always" />;

<PasswordInput
  value="secret"
  onChangeText={setText}
  autoComplete="current-password"
/>;
<PasswordInput
  value="secret"
  onChangeText={setText}
  // @ts-expect-error 删除嵌套 inputProps
  inputProps={{ maxLength: 20 }}
/>;
// @ts-expect-error 密码输入不接收 defaultValue
<PasswordInput value="secret" onChangeText={setText} defaultValue="x" />;

// --- Carousel:展示与动作 slide 互斥 --------------------------------------

type CarouselItem = { id: string; label: string };
const carouselItems: CarouselItem[] = [{ id: 'one', label: '第一项' }];
const carouselRenderItem: CarouselProps<CarouselItem>['renderItem'] = ({
  item,
}) => <Text>{item.label}</Text>;

<Carousel data={carouselItems} renderItem={carouselRenderItem} height={120} />;
<Carousel
  data={carouselItems}
  renderItem={carouselRenderItem}
  height={120}
  onPressItem={noop}
  getAccessibilityLabel={(item) => item.label}
/>;
// @ts-expect-error actionable slide 必须有业务名称
<Carousel
  data={carouselItems}
  renderItem={carouselRenderItem}
  height={120}
  onPressItem={noop}
/>;
// @ts-expect-error display slide 不能单独提供 action label resolver
<Carousel
  data={carouselItems}
  renderItem={carouselRenderItem}
  height={120}
  getAccessibilityLabel={() => 'x'}
/>;
