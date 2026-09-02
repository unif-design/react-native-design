---
slug: /testing
sidebar_position: 9
title: 在宿主工程里测试
description: "@unif/react-native-design 的 Jest 接入：一行 preset 接好全部 peer mock。含 jest.config 一行配方、必须自己装的 devDependencies、入口替你做的每一条与漏掉后的确切报错、入口管不到的那条 babel worklets 插件、按 role + accessible name 断言的写法，以及不用入口时的手工等价物。"
---

# 在宿主工程里测试

本库发布两个受支持的 Jest 接线入口,消费者不必再自己推导要 mock 哪些 peer:

| 子路径 | 内容 | 什么时候用 |
| --- | --- | --- |
| `@unif/react-native-design/jest-preset` | RN 官方 preset + 组合 resolver + `transformIgnorePatterns` + 自动挂上下面那个 setup | **默认用这个**,一行接完 |
| `@unif/react-native-design/jest-setup` | 只有 peer mock 接线(不含 resolver 与 transform 放行) | 工程已有自己的 preset,只想借用接线时放进 `setupFilesAfterEnv` |

之所以由本库提供:这份接线**完全由本库的 peer 集决定** —— RNGH、reanimated、worklets 的版本范围一变,接线就得跟着变。放在各消费仓自己维护,结果是 N 个仓 N 种写法,并且各自独立踩同一批坑。

本库是**纯 JS**(没有 android / ios / cpp,也没有自己的 TurboModule),所以入口里换掉的从来不是 design 本身,而是它依赖的那几个 peer —— 用的都是各家**官方**的 mock。

下面这份配方在 RN `0.87.1` + React `19.2.3` 基线上,用 `yarn pack` 打出的真实 tarball 装进一个干净宿主工程验证过:一行 preset,不加任何 mapper / transform / setup,11 个组件(Button / Cell / IconButton / Switch / Segmented / Carousel / Icon / Spinner / Skeleton / Reveal / ToastHost)的用例全绿。本仓 `example/` 的 15 个 suite 吃的也是同一个 preset。

## 最小可用配方 {#最小可用配方}

装测试侧依赖(版本与[环境要求](getting-started.md#环境要求)对齐):

```sh
yarn add -D jest @react-native/jest-preset @react-native/babel-preset @babel/core \
  @testing-library/react-native react-test-renderer
```

```js
// jest.config.js
module.exports = { preset: '@unif/react-native-design/jest-preset' };
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

:::danger `@react-native/jest-preset` 必须由你自己装
它**不是**本库的 dependency —— 本库的 preset 文件在运行时 `require` 它。漏装后本库会直接把可执行的那句话报出来:

```text
Validation Error: An unknown error occurred in @unif/react-native-design/jest-preset:

@unif/react-native-design/jest-preset 需要宿主工程自行安装 @react-native/jest-preset(它不是本包的依赖):yarn add -D @react-native/jest-preset
```

(preset 文件把 `MODULE_NOT_FOUND` 换成了自己的错误。裸 `require` 的话,jest-config 只看报错文本里有没有 preset 路径,而 Node 的 Require stack 恰好带着 `.../@unif/react-native-design/jest-preset.js`,真因会被判成「preset 模块本身畸形」。)

如果看到的是下面这句,那是**另一个成因**:本包 `exports` 里的 `./jest-preset/jest-preset` 别名缺失 —— 只会在改动本包自身时出现,装 npm 包用碰不到。

```text
Validation Error: Module @unif/react-native-design/jest-preset should have "jest-preset.js" or "jest-preset.json" file at the root.
```

上面那条 `yarn add -D` 里的六个包一个都不能省:`@react-native/babel-preset` 是你 `babel.config.js` 里的 preset,`react-test-renderer` 是 RNTL 的渲染后端,版本都跟着 `react-native` / `react` 走。
:::

## 入口替你做了什么 {#入口替你做了什么}

`jest-preset` 在 RN 官方 preset 之上加三样东西:

- **组合 resolver** —— RN 官方 resolver(临时剥掉 `react-native` 的 package exports,jest 才能解析 / mock 它的深路径)+ worklets 的 `.native.*` extension 过滤(让 worklets 走 web 实现,不触发 native init)。jest 的 `resolver` 是标量,两个不能并存,所以本库把它们组合在一个文件里。
- **`transformIgnorePatterns`** —— 放行本库与 7 个发 ESM / TS 源码的 peer。
- **`setupFilesAfterEnv`** —— 挂上本库的 `jest-setup`。RN 官方 preset 没有自己的 `setupFilesAfterEnv`(它只有 `setupFiles`),所以这里实际就这一条,preset 源码里的 `?? []` 只是防御。你在 config 里写自己的 `setupFilesAfterEnv` 不会顶掉它,jest 会前置拼接。

`jest-setup` 接的是 9 个 runtime peer 里在 Jest 中需要接线的那 4 个:

- `react-native-gesture-handler/jestSetup`(官方桩)+ 把包根 `Pressable` 换成 RN 的 `Pressable`、`GestureDetector` 换成透传壳;
- `react-native-worklets` → 官方 mock;
- `react-native-safe-area-context` → 官方 `jest/mock`;
- `react-native-reanimated` 保持**真实模块**,只调官方 `setUpTests()`。

## 每一条为什么必需 {#每一条为什么必需}

入口替你做的每一条,以及自己写时漏掉的确切症状(都是实测结果,不是推测):

| 入口替你做的这一条 | 自己写时漏了会看到 |
| --- | --- |
| `transformIgnorePatterns` 放行 `@unif/react-native-design` | `SyntaxError: Unexpected token 'export'`,指向 `node_modules/@unif/react-native-design/lib/module/index.js`,整个 suite 起不来 |
| `transformIgnorePatterns` 放行 RNGH / reanimated / worklets / safe-area-context / svg / carousel / blur | `SyntaxError: Cannot use import statement outside a module` —— 只放行 `@unif/react-native-design` 不够 |
| `react-native-worklets` 换成官方 mock | `TypeError: Cannot read properties of undefined (reading 'loadUnpackersWithCode')`,suite 起不来 |
| RNGH `Pressable` 换成 RN `Pressable` | `TypeError: _reanimatedWrapper.Reanimated?.useComposedEventHandler is not a function` —— **render 阶段就崩**,不是「点了没反应」 |
| RNGH `GestureDetector` 换成透传壳 | 测 Carousel 抛 `GestureDetector must be used as a descendant of GestureHandlerRootView`,每个用例都得自己包一层根视图 |
| safe-area-context 的官方 `jest/mock` | 只影响被测树里含 `SafeAreaProvider` 的用例:provider 子树整棵不渲染,查询报 `Unable to find an element with role: ...` |
| 组合 resolver 里 RN 那半 | `react-native` 深路径(如 `react-native/Libraries/Utilities/Dimensions`)解析不到,`jest.mock` 打不上 |
| 组合 resolver 里 worklets 那半 | worklets 走到 `.native.*` 实现,报 "Native part not initialized" 或启动明显变慢 |

本库发布的是 ESM(`lib/module/*.js`),而 `@react-native/jest-preset` 默认的
`transformIgnorePatterns` 白名单只有 `react-native` / `@react-native` / `@react-native-community`
三个前缀 —— 这就是第一行必须加的原因。tarball 同时带 `src` 与 sourcemap,所以报错栈会
指回 `src/**` 的 TypeScript 行号,那是 source map 的效果,不是 Jest 在编译源码。

:::caution reanimated 不要映射到它自己的 mock
很多 RN 模板会顺手加一条 `'^react-native-reanimated$': 'react-native-reanimated/mock.js'`。**加了反而会崩** —— Reanimated 4.x 的便利 mock 不提供本库所需的完整运行时行为,其中 `useReducedMotion` 缺失会让 design 的 Switch / Carousel / Spinner / Skeleton / Reveal / Pulse 经 `usePrefersReducedMotion` 读取时报错。同一份 mock 还缺 RNGH 3 `Pressable` 要用的 `useComposedEventHandler`。

**入口用的是真实 reanimated + 官方 `setUpTests()`**,只把 `react-native-worklets` 换成它的官方 mock —— 这样 `useReducedMotion` 是真的。

还有一个不会立刻报错的坑:那份 mock 的 `useSharedValue` 每次 render 返回新的 `Proxy`,引用不稳定;把 shared value 放进 effect 依赖数组的组件(本库 `ToastHost` 即是)会每次 render 重跑 effect,在 fake timers 下堆到内存耗尽。

真要用 reanimated 的 mock,别走 `moduleNameMapper`,改在 setup 文件里把缺的补回来(不推荐,上面那条内存问题依旧在):

```js
// jest.setup.js —— 下策,不要和 reanimated 的 moduleNameMapper 同时用
jest.mock('react-native-reanimated', () => ({
  ...jest.requireActual('react-native-reanimated/mock'),
  useReducedMotion: () => false,
}));
```
:::

:::tip Carousel 的用例不用再包根视图
RNGH 3 的 `GestureDetector` 会检查祖先,直接 render `<Carousel>` 本来会抛
`GestureDetector must be used as a descendant of GestureHandlerRootView`。入口把
`GestureDetector` 换成了透传壳,所以用了 preset 就不必逐个用例包
`<GestureHandlerRootView>`;手工接线时仍然要包。
:::

### 入口管不到的一条:babel 的 worklets 插件 {#babel-worklets-插件}

上面那张表全是入口替你做掉的。还有一条它**做不到** —— 因为它不在 jest config 层,而在你的
babel 配置里:

> 真正转译 `node_modules/@unif/react-native-design/**` 的那份 babel 配置,必须带
> `react-native-worklets/plugin`。

本库发布产物里有**不带依赖数组**的 `useAnimatedStyle`,靠这个插件在编译期补齐。缺插件时
reanimated 4 在 **render 阶段**抛(不是 import 阶段,所以 suite 起得来、用例一个个红):

```text
useAnimatedStyle was used without a dependency array or Babel plugin.
```

一个消费仓迁移时实测是 **106 条同型红**,全部指向 design 组件的 render。

RN app 的标准 `babel.config.js`(见[快速开始 → 安装依赖](getting-started.md#安装依赖)第 3 步)
本来就带这个插件,所以多数工程照着[最小可用配方](#最小可用配方)接完就没事。会缺的是这两类:

- **jest 走的不是 app 那份 `babel.config.js`** —— `BABEL_ENV` / `NODE_ENV=test` 分支、单独的
  `babel.config.test.js`、或 jest `transform` 直接指到自定义 babel;这些分支常常只抄了
  `presets`,`plugins` 掉了。
- **只给 `node_modules` 单开了一份 babel 配置** —— 比如 jest `transform` 里给
  `node_modules/**` 指一个带独立 `configFile`(或 `babelrc: false`)的 babel-jest。
  `transformIgnorePatterns` 放行本库之后,`lib/module` 就是由**那份**配置转译的,判据只看
  它有没有这个插件。

本仓自己测不到这条:根 Jest 是 **node 环境**、不 render 组件;`example/` 虽然 render,但它直读根
`src/`,且自己那份 `babel.config.js` 显式列着这个插件。两条路都碰不到「消费仓 babel × 已发布
`lib/module`」这个组合 —— 所以它在这里单列一节,而不是靠本仓的 gate 兜住。

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

### 纯视觉组件要开 includeHiddenElements {#纯视觉组件要开-includehiddenelements}

`Icon` / `Spinner` / `Skeleton` 这类纯装饰组件按本库的 a11y 契约**整棵子树对读屏隐藏**
(`accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`)。
RNTL 默认跳过隐藏元素,所以拿 `testID` 查它们要显式打开:

```tsx
screen.getByTestId('save-icon', { includeHiddenElements: true });
```

查不到时别急着怀疑组件没渲染 —— 先确认是不是这条。

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
所以这类用例必须包 `SafeAreaProvider`(入口已经接好了 safe-area-context 的官方 mock)。
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

## 不使用入口时的手工等价物 {#不使用入口时的手工等价物}

只有在你的工程已经有一份不能替换的 preset、又不想用 `jest-setup` 时才需要照抄下面这些。
**这三段就是本库仓根 `jest-preset.js` / `jest-resolver.js` / `jest-setup.js` 的内容** ——
接线随 peer range 漂移,以仓根那三个文件为准,本页只是抄写。

```js
// jest.config.js
module.exports = {
  preset: '@react-native/jest-preset',
  resolver: '<rootDir>/jest-resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@unif/react-native-design|@sbaiahmed1/react-native-blur|react-native-(gesture-handler|reanimated|worklets|safe-area-context|svg|reanimated-carousel))/)',
  ],
};
```

```js
// jest-resolver.js —— jest 的 resolver 是标量,RN 与 worklets 两家的必须自己合并
const reactNativeResolver = require('@react-native/jest-preset/jest/resolver.js');

module.exports = (request, options) => {
  if (
    options.basedir.includes('react-native-worklets') ||
    request.includes('react-native-worklets')
  ) {
    options = {
      ...options,
      extensions: options.extensions?.filter((ext) => !ext.includes('native')),
    };
  }
  return reactNativeResolver(request, options);
};
```

```js
// jest.setup.js
require('react-native-gesture-handler/jestSetup');

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock')
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// design 的交互组件内部用 RNGH 的 Pressable;Jest 里必须换成 RN 的。
// GestureDetector 换成透传壳,用例才不必逐个包 GestureHandlerRootView。
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  Pressable: require('react-native').Pressable,
  GestureDetector: ({ children }) => children,
}));

require('react-native-reanimated').setUpTests();
```

只想借用接线、其余自己配的话,把最后这段换成一行即可:

```js
// jest.config.js
setupFilesAfterEnv: ['@unif/react-native-design/jest-setup'],
```

注意 `jest-setup` **不含** `transformIgnorePatterns` 与 resolver —— 那两样是 config 层的,
进不了 setup 文件,仍要自己写。

## 边界 {#边界}

`setUpTests()` 不是渲染的必要条件,它是给 reanimated 自己的 jest matcher 用的;入口里留着
不会有副作用。

跑起来会在 console 看到一条 `An update to ItemRenderer inside a test was not wrapped in
act(...)`:那是 `react-native-reanimated-carousel` 5 自己的 item 渲染在 worklets mock 的回调里
setState,属上游行为,不影响断言,可以忽略。

Jest 只能证明 source wiring 与合成事件后的组件状态。真实手势、reduced motion 的系统开关、
VoiceOver / TalkBack 的实际播报、图片的真实 HTTPS 与 native decode,都不在 Jest 的能力范围内 ——
这些按[常见问题](troubleshooting.md)排查,或在真机上人工验收。
