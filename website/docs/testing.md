---
slug: /testing
sidebar_position: 9
title: 在宿主工程里测试
description: "@unif/react-native-design 的 Jest 配方：本库不发 mock 入口，要替换的是底层 peer。含可复制的 jest.config / jest.setup、逐条为什么必需、漏掉后的确切报错，以及按 role + accessible name 断言的写法。"
---

# 在宿主工程里测试

本库**不发 mock 入口**。npm tarball 里只有 `lib`、`src`、`package.json`、`README.md`、`CHANGELOG.md`、`LICENSE` 和 `docs-home.css`;`package.json#exports` 只有 `.`、`./package.json`、`./docs-home.css` 三个子路径,没有 `./mock`、`./jest-setup` 之类的东西。

原因是本库是**纯 JS**:没有 android / ios / cpp 目录,也没有自己的 TurboModule。Jest 里要替换的从来不是 design 本身,而是它依赖的那几个 peer —— 它们各自带了官方 mock,你要做的是把它们接上。

下面这份配方在 RN `0.86.2` + React `19.2.3` 基线上,用 `yarn pack` 打出的真实 tarball 装进一个干净宿主工程逐条验证过。

## 最小可用配方 {#最小可用配方}

装测试侧依赖(版本与[环境要求](/docs/getting-started#环境要求)对齐):

```sh
yarn add -D jest @react-native/jest-preset @react-native/babel-preset @babel/core \
  @testing-library/react-native react-test-renderer
```

```js
// jest.config.js
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // worklets 的 native 侧在 Jest 里不存在,换成包自带 mock
    '^react-native-worklets$': 'react-native-worklets/src/mock',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@unif/react-native-design|@sbaiahmed1/react-native-blur|react-native-(gesture-handler|reanimated|worklets|safe-area-context|svg|reanimated-carousel))/)',
  ],
};
```

```js
// jest.setup.js
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// design 的交互组件内部用 RNGH 的 Pressable;Jest 里必须换成 RN 的
jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler');
  const { Pressable } = require('react-native');
  return { ...actual, Pressable };
});

require('react-native-reanimated').setUpTests();
```

一个能直接跑的用例:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@unif/react-native-design';

test('点击保存会触发 onPress', () => {
  const onPress = jest.fn();
  render(<Button label="保存" onPress={onPress} />);

  fireEvent.press(screen.getByRole('button', { name: '保存' }));

  expect(onPress).toHaveBeenCalledTimes(1);
});
```

:::caution reanimated 不要映射到它自己的 mock
很多 RN 模板会顺手加一条 `'^react-native-reanimated$': 'react-native-reanimated/mock.js'`。**加了反而会崩** —— `react-native-reanimated@4.5.3` 的 mock 里 `useReducedMotion` 那行是注释掉的(`// useReducedMotion: ADD ME IF NEEDED`),而 design 的 Switch / Carousel / Spinner / Skeleton / Reveal / Pulse 都经 `usePrefersReducedMotion` 读它,渲染时直接 `TypeError: (0 , _reactNativeReanimated.useReducedMotion) is not a function`。

上面的配方只映射 `react-native-worklets`,保留真实 reanimated —— 这样 `useReducedMotion` 是真的。

一定要用 reanimated 的 mock 的话,别走 `moduleNameMapper`,改在 setup 文件里补齐缺的那个:

```js
// jest.setup.js —— 替代方案,不要和 reanimated 的 moduleNameMapper 同时用
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
```
:::

## 每一条为什么必需 {#每一条为什么必需}

漏掉任意一条的确切症状(都是实测结果,不是推测):

| 配方里的哪一条 | 漏掉后会看到 |
| --- | --- |
| `transformIgnorePatterns` 放行 `@unif/react-native-design` | `SyntaxError: Unexpected token 'export'`,指向 `node_modules/@unif/react-native-design/lib/module/index.js`,整个 suite 起不来 |
| `transformIgnorePatterns` 放行 RNGH / reanimated / worklets / safe-area-context / svg / carousel / blur | `SyntaxError: Cannot use import statement outside a module` —— 只放行 `@unif/react-native-design` 不够 |
| `react-native-worklets` 的 `moduleNameMapper` | `TypeError: Cannot read properties of undefined (reading 'loadUnpackersWithCode')`,suite 起不来 |
| RNGH `Pressable` 覆盖成 RN `Pressable` | `TypeError: _reanimatedWrapper.Reanimated?.useComposedEventHandler is not a function` —— **render 阶段就崩**,不是「点了没反应」 |
| safe-area-context 的 `jest/mock` | 只影响被测树里含 `SafeAreaProvider` 的用例:provider 子树整棵不渲染,查询报 `Unable to find an element with role: ...` |

本库发布的是 ESM(`lib/module/*.js`),而 `@react-native/jest-preset` 默认的
`transformIgnorePatterns` 白名单只有 `react-native` / `@react-native` / `@react-native-community`
三个前缀 —— 这就是第一行必须自己加的原因。tarball 同时带 `src` 与 sourcemap,所以报错栈会
指回 `src/**` 的 TypeScript 行号,那是 source map 的效果,不是 Jest 在编译源码。

:::tip Carousel 的用例要包一层根视图
RNGH 3 的 `GestureDetector` 会检查祖先。直接 render `<Carousel>` 会抛
`GestureDetector must be used as a descendant of GestureHandlerRootView`;把用例包进
`<GestureHandlerRootView>` 即可(配方里的 RNGH mock 保留了 `...actual`,根视图仍是真的)。
:::

## 怎么写断言 {#怎么写断言}

优先按 **role + accessible name** 查询。这样写出来的断言顺带复核了组件的 a11y 契约 ——
名称播报错了、role 掉了,测试会直接红:

```tsx
screen.getByRole('button', { name: '扫码' });   // Button / IconButton / actionable Cell
screen.getByRole('switch', { name: '接收通知' }); // Switch
screen.getByRole('tab', { name: '全部' });        // Tabs / Segmented / TabBar
```

状态断言直接读 `accessibilityState`:Checkbox / Radio / Switch 用 `checked`,
Tabs / TabBar / Segmented 用 `selected`。

```tsx
const node = screen.getByRole('switch', { name: '接收通知' });
expect(node.props.accessibilityState).toMatchObject({ checked: false });
```

### 要不要包 ThemeProvider {#要不要包-themeprovider}

**默认不用。** 缺 `ThemeProvider` 时 `useTheme()` 返回稳定的亮色 fallback,组件照常渲染,
只会在 dev 下打一条诊断:

```text
[useTheme] 缺少 ThemeProvider，已使用稳定 light fallback
```

只有验证暗色或字号档位时才包,并且用 `forceScheme` 锁死主题、不依赖测试机的系统设置:

```tsx
render(
  <ThemeProvider forceScheme="dark">
    <Demo />
  </ThemeProvider>
);
```

### 测 toast / confirm {#测-toast--confirm}

命令式 API 要求对应 host 在树里,而 `ToastHost` / `ConfirmHost` 都读安全区 context ——
所以这类用例必须包 `SafeAreaProvider`(也就必须接上 safe-area-context 的 `jest/mock`)。
toast 有自动消失定时器,**用 fake timers 推进**,别用真实等待:

```tsx
jest.useFakeTimers();

test('保存成功会弹一条 toast,到点自动消失', () => {
  render(
    <SafeAreaProvider>
      <ToastHost />
    </SafeAreaProvider>
  );

  act(() => {
    toast.success('已保存');
  });
  expect(screen.getByText('已保存')).toBeTruthy();

  act(() => {
    jest.advanceTimersByTime(10_000);
  });
  expect(screen.queryByText('已保存')).toBeNull();
});
```

## 边界 {#边界}

`setUpTests()` 不是渲染的必要条件(去掉后上述用例同样全绿),它是给 reanimated 自己的
jest matcher 用的;留着不会有副作用。

Jest 只能证明 source wiring 与合成事件后的组件状态。真实手势、reduced motion 的系统开关、
VoiceOver / TalkBack 的实际播报、图片的真实 HTTPS 与 native decode,都不在 Jest 的能力范围内 ——
这些按[常见问题](/docs/troubleshooting)排查,或在真机上人工验收。
