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
  Checkbox,
  IconButton,
  Input,
  NavBar,
  PasswordInput,
  Radio,
  Search,
  Switch,
  Textarea,
  type NavBarAction,
  type NavBarSlot,
  type TextFieldHandle,
} from '../src';

const setText = (_value: string) => {};
const noop = () => {};
const inputRef = createRef<TextFieldHandle>();
const tooShortContainer = { height: 20 };

// --- Button / IconButton / NavBar:所有操作必须显式可达 --------------------

// @ts-expect-error Button 始终是操作
<Button label="保存" />;
// @ts-expect-error IconButton 始终是操作
<IconButton icon="close" accessibilityLabel="关闭" />;
// @ts-expect-error NavBar action object 必须有 handler 和名称
<NavBar title="标题" left={{ icon: 'arrow-left' }} />;

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

// --- Input / Textarea:受控 vs 非受控 -------------------------------------

<Input value="ok" onChangeText={setText} />;
<Input defaultValue="seed" />;
<Input ref={inputRef} defaultValue="seed" />;
<Textarea value="ok" onChangeText={setText} />;
<Textarea defaultValue="seed" minHeight={120} maxHeight={200} />;

// @ts-expect-error controlled Input 必须有更新入口
<Input value="locked" />;
// @ts-expect-error value/defaultValue 互斥
<Input value="x" defaultValue="y" onChangeText={setText} />;
// @ts-expect-error readOnly 已删除，使用 editable={false}
<Input readOnly />;
// @ts-expect-error 原生 clear 不能从公开 handle 取得
inputRef.current?.clear();
// @ts-expect-error 任意 ReactElement 不再是 slot
<Input trailing={<Pressable />} />;
// @ts-expect-error containerStyle 不能改最小 frame
<Input containerStyle={tooShortContainer} />;

// --- slot 判别联合 --------------------------------------------------------

<Input defaultValue="" leading={{ kind: 'icon', icon: 'search' }} />;
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
// @ts-expect-error controlled Search 必须有 updater
<Search value="query" />;
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
