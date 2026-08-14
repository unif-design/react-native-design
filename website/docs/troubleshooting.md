---
slug: /troubleshooting
sidebar_position: 10
title: 常见问题
description: "@unif/react-native-design 排障决策树（症状 → 因 → 解）：Web / 文档站点击无响应与动画崩溃、主题样式不切换 / useThemedStyles 缓存失效、peerDeps 缺失与 iOS 链接错误、Jest 缺 worklets babel 插件与没走 jest-preset 入口时的 transform / RNGH Pressable / useReducedMotion 报错。"
---

# 常见问题

按**症状 → 原因 → 解法**排查。多数问题集中在「peer 缺失」「颜色没走 token / 主题不切」「web 环境特性」「Jest 没走本库的接线入口」四类。

---

## Web / 文档站 {#web--文档站}

### 症状:LiveDemo 里 Button / Cell 点击无响应 {#rngh-pressable-web-点击无响应}

**原因。** `react-native-gesture-handler` 的 `Pressable` 在 `react-native-web` 运行时不触发 `onPress` —— RNGH 依赖原生手势驱动,浏览器里不存在。

**解法。** 文档站 webpack 插件(`website/src/plugins/docusaurus-rnw/index.js`)用 `NormalModuleReplacementPlugin` 把 RNGH 的 `Pressable` 替换成 `react-native-web` 原生 `Pressable`。如果你改了插件或引入新的 Pressable 来源,确保替换规则覆盖到新路径。

> 业务侧(真机)恰恰相反:可点区域要用 **RNGH 的 `Pressable`**,RN 原生 `Pressable` 在 web 上才不触发 `onPress`。

---

### 症状:含动画的页面在文档站崩溃 / 白屏 {#useanimatedstyle--layout-动画在文档站崩溃}

**原因。** 当前 `react-native-web` 组合中，Reanimated 的部分
`useAnimatedStyle` / layout animation 路径会在 `_updatePropsJS` 处理更新值时抛错；
不能假设 native worklet 实现可原样运行在浏览器。

**解法。** 使用 design 包公开的跨平台封装，不要导入内部 driver：

- Pulse 统一从 `usePulse.ts` 进入；native 解析到 `usePulseDriver.ts` 的
  Reanimated worklet，Web 解析到 `usePulseDriver.web.ts` 的 CSS transition +
  timer。
- Reveal 的 native 实现使用 Reanimated `FadeIn` / `FadeOut`，Web 的
  `Reveal.web.tsx` 使用本地 `View` + CSS opacity transition + 双 RAF。
- Spinner 的 native 实现使用 Reanimated，Web 的 `Spinner.web.tsx` 使用静态 CSS
  keyframes。

文档站 MDX 和其他共享代码优先使用 `<Pulse>` / `usePulse` / `<Reveal>` /
`<Spinner>`，不要直接写依赖 native worklet 的 `useAnimatedStyle` 或 layout
decorator。详见[动效](/docs/design/tokens/motion#在代码中使用)。

---

## 样式 / 主题 {#样式--主题}

### 症状:主题切换后样式没变 / `useThemedStyles` 每次都重算 {#usethemedstyles-缓存不生效}

**原因。** `makeStyles` 函数写在了组件函数体内(内联),每次渲染都是新引用,打穿 `useMemo([colors, shadow, fontScale, maker])` 缓存。

**解法。** `makeStyles` 定义在**模块顶层**(通常从 `styles.ts` 导出):

```tsx
// ❌ Incorrect:makeStyles 内联在组件里 —— 每次渲染新引用,缓存失效
function MyComponent() {
  const makeStyles = (c: ColorTokens) => StyleSheet.create({ /* ... */ });
  const styles = useThemedStyles(makeStyles);
}

// ✅ Correct:makeStyles 在模块顶层
const makeStyles = (c: ColorTokens) => StyleSheet.create({ /* ... */ });

function MyComponent() {
  const styles = useThemedStyles(makeStyles);
}
```

---

### 症状:暗色模式下颜色不对,与设计稿不符 {#暗色颜色错乱}

**原因。** 颜色硬编码成 hex / rgba,只有亮色值,不随主题切换。

**解法。** 用 `useColors()` 返回的 role token(`c.primary` / `c.surface` / `c.foreground`…),不要内联 `#EB6E00` 或 `rgba(...)`。仅视觉锁定(QR 白卡 / 固定商标色)时允许硬编码,且必须加注释说明锁定理由。取色规则见[颜色 → 取色优先级链](/docs/design/tokens/colors#取色优先级链)。

---

### 症状:缺 ThemeProvider 时颜色还能出(但不切暗色) {#缺-themeprovider}

✅ **这是预期兜底,不是 bug。** `useTheme()` 在没有 `ThemeProvider` 时返回同一个模块级亮色 fallback(`lightColors` / `lightShadow` / `fontScale=1`),保证组件不崩且引用稳定。但这样**不会跟随系统暗色**。开发环境会在 React effect 阶段一次性记录诊断,render 期间不会写日志。正确做法是按[快速开始 → 根挂 ThemeProvider](/docs/getting-started#根挂-themeprovider) 在 App 根挂一次。

---

### 症状:传入 fontScale 后字号未变化或出现非法值 {#fontscale-非法}

**原因。** `ThemeProvider fontScale` 只接受有限正数;`0`、负数、`NaN`、`Infinity` 或非数字运行时输入都会回退为 `1`。缩放不设上限,因此很大的有限正数仍会按原值生效。

**解法。** 持久化值先用包根导出的 `normalizeFontScale(value)` 归一化。`useThemedStyles` 只缩放 maker 产物中的 `fontSize / lineHeight / letterSpacing`;render 期间动态拼入的文字 metric 用 `useFontScale()` 取当前 factor,再用 `scaleFontMetric(value, factor)` 显式乘一次。不要重复缩放,也不要期待 padding、Icon 或控件高度随字号档位改变。

---

## Peer Dependencies {#peer-dependencies}

### 症状:启动 Metro / 构建报 `Unable to resolve module ...` / `Cannot find module ...` {#peer-缺失}

**原因。** peerDeps **缺一即崩**,本库不打包它们。

**解法。** 按[快速开始 → 安装依赖](/docs/getting-started#安装依赖)逐一装齐:

```sh
yarn add react-native-svg \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-worklets \
  react-native-safe-area-context \
  react-native-reanimated-carousel \
  @sbaiahmed1/react-native-blur
```

iOS 装完还需 `cd ios && bundle exec pod install`。

版本范围见[快速开始 → 环境要求](/docs/getting-started#环境要求)。本库要求 `react-native >=0.86.0` + `react >=19.2.3 <20.0.0`;RN `0.85.x` 会因 peer 不满足而失败,不要用忽略 peer 的方式绕过。RN peer 不封顶,`0.87+` 装得上但本仓只验证到 `0.86.2`。

---

### 症状:worklet 不生效 / Metro 报 worklets 插件相关错误 {#worklets-babel-metro}

**原因。** `react-native-worklets@0.11` 的 Babel 插件与 Metro transformer 由**宿主工程**提供,本库不分发它们。宿主的 `@babel/core`、`@react-native/babel-preset`、`@react-native/metro-config` 版本与 RN `0.86.2` 不匹配时,worklet 编译会静默降级或直接报错。

**解法。** 宿主自备并对齐版本,且 `react-native-worklets/plugin` 必须排在 `plugins` 数组**最后**:

```sh
yarn add -D @babel/core @react-native/babel-preset@0.86.2 @react-native/metro-config@0.86.2
```

---

### 症状:安装时报 `react-native-reanimated-carousel` 与 `react-native-gesture-handler` 的 peer 冲突 {#rnrc-rngh-peer}

**原因。** `react-native-reanimated-carousel@5.0.0` 发布的 RNGH peer metadata 是 `>=2.9.0 <3.0.0`,与本库要求的 `>=3.0.0 <4.0.0` **没有交集**。这是 RNRC 侧的 metadata 滞后,该组合已在本仓实测适配并通过验证。

**解法。** 只有两种被认可的处理方式:**接受这一条警告**,或加**只作用于 Carousel 的窄 override / filter**。

- npm:`overrides` → `{"react-native-reanimated-carousel": {"react-native-gesture-handler": "$react-native-gesture-handler"}}`
- pnpm:`pnpm.peerDependencyRules.allowedVersions`,精确到 `react-native-reanimated-carousel>react-native-gesture-handler`
- Yarn:scoped `logFilters`

**不要**用全局 peer 忽略、`--force`、`--legacy-peer-deps` 或无效的 `packageExtensions` / metadata patch —— 那会连同真实的 major 漂移一并吞掉。

本仓 `.yarnrc.yml` 里的 `logFilters` **只影响本仓 install 日志,不随 npm 包分发**,消费端必须自行选择上述方式之一。本仓真正的门禁是 `yarn check:runtime-peers`:它按「包名 + 请求方 locator + 精确 range + provider major」四重匹配,任一维度漂移都会退出非零,与日志过滤互相独立。RNRC 发布出正确接受 RNGH 3 的版本后,升级 RNRC 并在同一次改动里删掉 filter 与 checker 的例外分支。

---

### 症状:iOS 构建失败 `Undefined symbols for architecture arm64` {#ios-链接错误}

**原因。** 装 / 升级原生包后没重新 `pod install`,或 peer 没装齐。

**解法。** 确认 peer 全部安装,然后重装 pods 并 clean build:

```sh
cd ios && bundle exec pod install --repo-update
# 再 Xcode → Product → Clean Build Folder 后重新构建
```

---

## Jest / 单元测试 {#jest--单元测试}

本库发布 `./jest-preset` 与 `./jest-setup` 两个 Jest 接线入口。下面除**前两条**与最后两条外,都是**没走入口**时的报错。完整说明见[在宿主工程里测试](/docs/testing);下面是照着报错反查。

### 症状:`jest-preset 需要宿主工程自行安装 @react-native/jest-preset` {#jest-missing-rn-preset}

完整报错是 `Validation Error: An unknown error occurred in @unif/react-native-design/jest-preset:` 后面跟这句话。

**原因。** `@react-native/jest-preset` 没装。它**不是**本库的 dependency —— 本库的 preset 文件在运行时 `require` 它,并把 `MODULE_NOT_FOUND` 换成了上面这句可执行的报错。(不换的话,jest 加载 preset 时只看报错文本里有没有 preset 路径,而 Node 的 Require stack 恰好带着 `.../@unif/react-native-design/jest-preset.js`,真因会被判成「preset 模块本身畸形」。)

**解法。** 把它连同其余测试侧依赖一起装上,见[测试 → 最小可用配方](/docs/testing#最小可用配方):`jest`、`@react-native/jest-preset`、`@react-native/babel-preset`、`@babel/core`、`@testing-library/react-native`、`react-test-renderer`,一个都不能省。

**另一个成因,报错不一样。** 如果看到的是 `Module @unif/react-native-design/jest-preset should have "jest-preset.js" or "jest-preset.json" file at the root`,那是本包 `exports` 里的 `./jest-preset/jest-preset` 别名缺失 —— 只会在改动本包自身时出现,装 npm 包用碰不到。

---

### 症状:render 任意含动画的组件抛 `useAnimatedStyle was used without a dependency array or Babel plugin` {#jest-babel-worklets-plugin}

**原因。** 真正转译 `node_modules/@unif/react-native-design/**` 的那份 babel 配置里没有 `react-native-worklets/plugin`。本库发布产物里有不带依赖数组的 `useAnimatedStyle`,靠这个插件在编译期补齐;缺了它 reanimated 4 在 **render 阶段**才抛,所以 suite 起得来、用例一条条红(某消费仓迁移时实测 106 条同型红)。**用了本库的 `jest-preset` 也不会好** —— 插件是宿主 babel 的事,jest 的 preset 够不着。

**解法。** 确认 jest 实际用的那份 babel 配置带这个插件,且排在 `plugins` **最后**。RN app 的标准 `babel.config.js` 本来就带,会缺的是 jest 走了另一份配置(`BABEL_ENV` 分支 / `babel.config.test.js` / 自定义 `transform`),或给 `node_modules` 单开了一份带独立 `configFile` 的 babel-jest。逐条见[测试 → 入口管不到的一条](/docs/testing#babel-worklets-插件)。

---

### 症状:`SyntaxError: Unexpected token 'export'` 或 `Cannot use import statement outside a module` {#jest-transform}

**原因。** 本库发布 ESM(`lib/module/*.js`),而 `@react-native/jest-preset` 默认的 `transformIgnorePatterns` 只放行 `react-native` / `@react-native` / `@react-native-community` 三个前缀,`node_modules` 里其余包一律不转译。

**解法。** 用 `preset: '@unif/react-native-design/jest-preset'`,放行清单在入口里。手工接线时:把 `@unif/react-native-design` 和它的 RN 生态 peer 一起加进白名单,见[测试 → 手工等价物](/docs/testing#不使用入口时的手工等价物)。只加 `@unif/react-native-design` 不够 —— 那几个 peer 同样发 ESM / TS 源码。

---

### 症状:render 任意 design 组件就抛 `useComposedEventHandler is not a function` {#jest-rngh-pressable}

**原因。** design 的交互组件内部用 RNGH 的 `Pressable`;RNGH 3 的 `Pressable` 在 Jest 里会走到 reanimated 的组合事件路径。**这是 render 阶段的硬崩溃**,不是「点了没反应」。

**解法。** 用 `preset: '@unif/react-native-design/jest-preset'`,入口已经把 RNGH 的 `Pressable` 换成 RN 的。手工接线时:在 setup 文件里自己覆盖(保留 `...actual`,`GestureHandlerRootView` 仍要是真的),见[测试 → 手工等价物](/docs/testing#不使用入口时的手工等价物)。

---

### 症状:render Switch / Carousel / Spinner / Skeleton / Reveal 抛 `useReducedMotion is not a function` {#jest-reduced-motion}

**原因。** 把 `react-native-reanimated` 映射到了它自带的 `mock.js` —— `react-native-reanimated@4.5.3` 的 mock 里 `useReducedMotion` 那行是注释掉的(`// useReducedMotion: ADD ME IF NEEDED`),而这些组件都经 `usePrefersReducedMotion` 读它。

**解法。** 用 `preset: '@unif/react-native-design/jest-preset'`,入口用的是**真实 reanimated** + 官方 `setUpTests()`,并删掉你自己那条 reanimated 的 `moduleNameMapper`。手工接线时:同样别映射 reanimated,只把 `react-native-worklets` 换成官方 mock;实在要用那份 mock 就自己补上 `useReducedMotion`,见[测试 → 每一条为什么必需](/docs/testing#每一条为什么必需)。

---

### 症状:`Cannot read properties of undefined (reading 'loadUnpackersWithCode')` {#jest-worklets}

**原因。** `react-native-worklets` 的 native 侧在 Jest 里不存在,import 阶段就崩,整个 suite 起不来。

**解法。** 用 `preset: '@unif/react-native-design/jest-preset'`,入口已经把它换成官方 mock,并附带 worklets 的 `.native.*` extension 过滤。手工接线时:在 setup 里 `jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'))`。

---

### 症状:`SafeAreaProvider` 里的内容一个都查不到 {#jest-safe-area}

**原因。** 真实 `SafeAreaProvider` 要等 native 量出 inset 才渲染子树,Jest 里等不到,于是整棵子树不渲染。

**解法。** 用 `preset: '@unif/react-native-design/jest-preset'`,入口已经接上 safe-area-context 自带的 `jest/mock`。手工接线时:自己 `jest.mock` 上去。只有被测树里含 `SafeAreaProvider`(以及根装配里的 `ToastHost` / `ConfirmHost`)时才需要,单独测一个 Button 不需要。

---

### 症状:测 Carousel 抛 `GestureDetector must be used as a descendant of GestureHandlerRootView` {#jest-carousel-root}

**原因。** RNGH 3 的 `GestureDetector` 会检查祖先里有没有根视图。

**解法。** 用 `preset: '@unif/react-native-design/jest-preset'`,入口把 `GestureDetector` 换成了透传壳,用例不必再包根视图。手工接线时:把用例包进 `<GestureHandlerRootView>` 再 render。

---

### 症状:`getByTestId` 查不到 Icon / Spinner / Skeleton {#jest-hidden-elements}

**原因。** 这类纯视觉组件按本库的 a11y 契约整棵子树对读屏隐藏,而 RNTL 的查询默认跳过隐藏元素。

**解法。** 查询时显式打开:`screen.getByTestId('save-icon', { includeHiddenElements: true })`,见[测试 → 纯视觉组件要开 includeHiddenElements](/docs/testing#纯视觉组件要开-includehiddenelements)。

---

### 症状:控制台刷 `An update to ItemRenderer inside a test was not wrapped in act(...)` {#jest-carousel-act}

**原因。** `react-native-reanimated-carousel` 5 自己的 item 渲染在 worklets mock 的回调里 setState,这条 `console.error` 来自上游,不来自本库。

**解法。** 不用处理 —— 它不是错误,不影响任何断言,用例照常绿。

---

> 没覆盖到的问题:对照[设计令牌](/docs/design/tokens/colors)核对 token 名,或按需 fetch 远程 [llms.txt](https://unif-design.github.io/react-native-design/llms.txt) 查逐组件 API。
