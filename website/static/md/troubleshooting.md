---
slug: /troubleshooting
sidebar_position: 10
title: 常见问题
description: "@unif/react-native-design 排障决策树（症状 → 因 → 解）：Web / 文档站点击无响应与动画崩溃、主题样式不切换 / useThemedStyles 缓存失效、peerDeps 缺失与 iOS 链接错误。"
---

# 常见问题

按**症状 → 原因 → 解法**排查。多数问题集中在「peer 缺失」「颜色没走 token / 主题不切」「web 环境特性」三类。

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
decorator。详见[动效](design/tokens/motion.md#在代码中使用)。

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

**解法。** 用 `useColors()` 返回的 role token(`c.primary` / `c.surface` / `c.foreground`…),不要内联 `#EB6E00` 或 `rgba(...)`。仅视觉锁定(QR 白卡 / 固定商标色)时允许硬编码,且必须加注释说明锁定理由。取色规则见[颜色 → 取色优先级链](design/tokens/colors.md#取色优先级链)。

---

### 症状:缺 ThemeProvider 时颜色还能出(但不切暗色) {#缺-themeprovider}

✅ **这是预期兜底,不是 bug。** `useTheme()` 在没有 `ThemeProvider` 时返回同一个模块级亮色 fallback(`lightColors` / `lightShadow` / `fontScale=1`),保证组件不崩且引用稳定。但这样**不会跟随系统暗色**。开发环境会在 React effect 阶段一次性记录诊断,render 期间不会写日志。正确做法是按[快速开始 → 根挂 ThemeProvider](getting-started.md#根挂-themeprovider) 在 App 根挂一次。

---

### 症状:传入 fontScale 后字号未变化或出现非法值 {#fontscale-非法}

**原因。** `ThemeProvider fontScale` 只接受有限正数;`0`、负数、`NaN`、`Infinity` 或非数字运行时输入都会回退为 `1`。缩放不设上限,因此很大的有限正数仍会按原值生效。

**解法。** 持久化值先用包根导出的 `normalizeFontScale(value)` 归一化。`useThemedStyles` 只缩放 maker 产物中的 `fontSize / lineHeight / letterSpacing`;render 期间动态拼入的文字 metric 用 `useFontScale()` 取当前 factor,再用 `scaleFontMetric(value, factor)` 显式乘一次。不要重复缩放,也不要期待 padding、Icon 或控件高度随字号档位改变。

---

## Peer Dependencies {#peer-dependencies}

### 症状:启动 Metro / 构建报 `Unable to resolve module ...` / `Cannot find module ...` {#peer-缺失}

**原因。** peerDeps **缺一即崩**,本库不打包它们。

**解法。** 按[快速开始 → 安装依赖](getting-started.md#安装依赖)逐一装齐:

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

版本范围见[快速开始 → 环境要求](getting-started.md#环境要求)。本库只支持 `react-native >=0.86.0 <0.87.0` + `react >=19.2.3 <20.0.0`;RN `0.85.x` 与 `0.87+` 都会因 peer 不满足而失败,这是有意收紧的 contract,不要用忽略 peer 的方式绕过。

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

> 没覆盖到的问题:对照[设计令牌](design/tokens/colors.md)核对 token 名,或按需 fetch 远程 [llms.txt](https://unif-design.github.io/react-native-design/llms.txt) 查逐组件 API。
