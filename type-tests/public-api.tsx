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
import { Pressable } from 'react-native';
import {
  Input,
  PasswordInput,
  Search,
  Textarea,
  type TextFieldHandle,
} from '../src';

const setText = (_value: string) => {};
const inputRef = createRef<TextFieldHandle>();
const tooShortContainer = { height: 20 };

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
