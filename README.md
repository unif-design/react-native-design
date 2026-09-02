# @unif/react-native-design

[![npm](https://img.shields.io/npm/v/@unif/react-native-design.svg?color=cb3837&logo=npm)](https://www.npmjs.com/package/@unif/react-native-design)
[![CI](https://github.com/unif-design/react-native-design/actions/workflows/ci.yml/badge.svg)](https://github.com/unif-design/react-native-design/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/@unif/react-native-design.svg?color=blue)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-unif--design.github.io-orange.svg)](https://unif-design.github.io/react-native-design/)

Unif 设计系统 —— theme(设计令牌)+ 组件 + 图标 + utils,面向 React Native 0.86+ 新架构(Fabric + TurboModule)。所有 Unif 应用与端能力包的 UI 基座。

## 特性

- **运行时主题**:`useColors()` 角色 token 跟随系统 light/dark 自动切换;`useThemedStyles` + 模块顶层 `makeStyles` 缓存样式,绝不内联 hex。
- **40+ 组件**:Button、Card、Ribbon、Cell、NavBar、Toast 等原子组件 + AvatarWithRing、GlassStats 等通用复合组件,全部从包根 barrel 导出,无需深路径。
- **a11y 内建**:交互组件预设 `accessibilityRole`;`IconButton` 的 `accessibilityLabel` 为类型必填。
- **图标集 + 严格 TS**:`IconName` 闭集类型、`<Icon>` 自动继承主题色;`strict` + `noUncheckedIndexedAccess`,类型随包发布。

## 安装

```sh
yarn add @unif/react-native-design
```

本库不打包原生依赖,宿主工程需自行安装下列 peer 并完成原生侧配置:

```sh
yarn add react-native-svg \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-worklets \
  react-native-safe-area-context \
  react-native-reanimated-carousel \
  @sbaiahmed1/react-native-blur
```

iOS 另需在 `ios/` 执行 `bundle exec pod install`。完整步骤见[文档站 · 快速开始](https://unif-design.github.io/react-native-design/docs/getting-started)。

`react-native-worklets` 的 Babel 插件与 Metro transformer 由宿主工程提供,不随本库分发 —— 宿主需自备与自身 RN 版本匹配的 `@babel/core`、`@react-native/babel-preset`、`@react-native/metro-config`；本仓验证组合为 RN `0.87.1` 与对应的 `0.87.1` 工具链。

`react-native-reanimated-carousel@5.0.0` 发布的 RNGH peer 是 `>=2.9.0 <3.0.0`,与本包要求的 `>=3.0.0 <4.0.0` 无交集;该组合已实测适配。消费端只能**接受这条警告**或加**只作用于 Carousel 的窄 override**(npm `overrides`、pnpm `peerDependencyRules.allowedVersions`、Yarn scoped `logFilters`),不要用全局 peer 忽略、`--force` 或 `--legacy-peer-deps`。本仓不使用全局 `logFilters`；`yarn check:runtime-peers` 只接受 root、example、website 三条精确的 RNRC 5 / RNGH 3 例外。

## 快速开始

App 根必须按 `GestureHandlerRootView → SafeAreaProvider → ThemeProvider → App 内容 + Hosts` 装配；`SafeAreaProvider` 从其 peer 包导入，设计系统 API 继续只从包根导入。`makeStyles` 必须写在模块顶层:

```tsx
import {
  ThemeProvider,
  ToastHost,
  ConfirmHost,
  Button,
  useThemedStyles,
  type ColorTokens,
} from '@unif/react-native-design';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// inline 会破坏 useThemedStyles 的样式缓存
const makeStyles = (c: ColorTokens) => ({
  wrap: { padding: 16, backgroundColor: c.surface },
});

function Demo() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <Button label="保存" onPress={() => {}} />
    </View>
  );
}

export const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <ThemeProvider>
        <Demo />
        <ToastHost />
        <ConfirmHost />
      </ThemeProvider>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
```

## RN 0.87.1 组件展厅

仓库内的持久 `example/` 是 `@unif/react-native-design-example` workspace：它精确使用
React Native `0.87.1`、React `19.2.3`、New Architecture 和 Hermes，并通过 Metro
直接消费本仓 public package root。展厅只挂载当前路由，共有以下 8 个 scene：

| Scene ID      | 标题           | 主要覆盖                                      |
| ------------- | -------------- | --------------------------------------------- |
| `foundation`  | 基础能力与图标 | Theme、token、Icon、logger、testID            |
| `actions`     | 操作与状态     | Button、IconButton、Chip、Tag、StatusDot      |
| `feedback`    | 反馈与浮层     | Empty、动效、Blur、Toast、Confirm             |
| `forms`       | 表单与输入     | 文本输入、选择控件、Stepper（xs 为横向触控 < 44pt 的紧凑档）、Form |
| `navigation`  | 导航组件       | NavBar、DrawerHeader、Tabs、Segmented、TabBar |
| `collections` | 容器与集合     | Card、Ribbon、Cell、List、Grid、EntryCard、Carousel |
| `media`       | 媒体展示       | Avatar、Thumbnail、Logo 与图片失败边界        |
| `business`    | 业务复合组件   | 渐变、背景、统计、头像环、版本状态            |

从仓库根目录执行：

```sh
yarn install --immutable
yarn example start
yarn example android
yarn example ios

yarn verify:example-showcase
yarn example typecheck
yarn example lint
yarn example test --maxWorkers=2
```

iOS 首次运行或 native 依赖变化后，先执行
`cd example && bundle install`，再执行
`cd example && bundle exec pod install --project-directory=ios`。完整启动步骤、主题与
fontScale 操作，以及 VoiceOver/TalkBack、真机、旋转、remote image failure 等尚需人工
执行的矩阵见 [`example/README.md`](example/README.md)。自动化结果不等同于真机或 a11y
验收通过。

Media 默认 success fixture 是项目部署的
`https://unif-design.github.io/react-native-design/img/logo.png`，failure specimen 使用固定的
invalid-image fixture
`https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png`，
确保 HTTP 成功后仍稳定进入 native decode failure/fallback 分支。
Jest 只证明 source wiring 以及合成 load/error event 后的组件状态；真实 HTTPS、缓存和 native
decode 仍按 `example/README.md` 的 Android/iOS 手工矩阵标记为待执行。

## 文档

- **文档站**(快速开始 · 组件 API · 设计令牌 · 设计原则):https://unif-design.github.io/react-native-design/
- **在宿主工程里测试**(一行接入 `@unif/react-native-design/jest-preset`):
  https://unif-design.github.io/react-native-design/docs/testing
- **AI / LLM**(纯 Markdown,按需 fetch,别凭记忆猜 API):
  [llms.txt 索引](https://unif-design.github.io/react-native-design/llms.txt) · [llms-full.txt 全文](https://unif-design.github.io/react-native-design/llms-full.txt)
- **Agent Skill** `design`(`unif` plugin,覆盖组件 API、token 规则、与原生 RN 的关键差异):
  `/plugin marketplace add unif-design/skills` → `/plugin install unif@skills`

## 临时原生验证宿主(runtime harness)

```sh
yarn create:runtime-harness
```

该命令**现场生成**一个一次性的 RN `0.87.1` app,用于人工验证 Jest 覆盖不到的部分:真实 native / Web 结构、44pt 命中框、a11y tree、reduced motion 与命令式 API 的竞态。

它做的事:

1. `yarn prepare` + `yarn pack` 打包**当前源码**,harness 装的是 `file:` tarball,不是 registry 上的版本;
2. 用 `yarn.lock` 里钉死的官方 `@react-native-community/cli@20.2.0` + `@react-native-community/template@0.87.1` 生成脚手架 —— 两者的版本、template 自带的 React / RN / CLI 版本、以及锁文件里的 `checksum` 都会先校验,任一不符立即失败;
3. 枚举根 `peerDependencies` 的**每一个**非 optional 项,从根 direct range 精确匹配 `yarn.lock` locator,并交叉验证 installed version 与 peer range;`@babel/core` / `@react-native/metro-config` 也走同一链路,在首次安装前写成精确版本;
4. 配好 Babel(`react-native-worklets/plugin` 排最后)、Metro、RNGH root import,拷入 `manual-tests/runtime-api/RuntimeApiScreen.tsx`,并逐文件核对生成的 Podfile / Android Gradle 文件与 installed template 捕获的摘要;
5. 首次 `yarn install` 只在脚本自持的临时 app 内生成 `yarn.lock`,随后立即以同一 manifest / lock 执行 `yarn install --immutable` 最终复验,再执行 `bundle install` + `bundle exec pod install`;完整流程成功后才保留并打印绝对路径与全部 provider 版本。

边界:

- app 只建在**脚本自持的系统临时目录**里(`fs.mkdtempSync`),**不接受调用方传目录**;脚手架之后的任一步失败也会递归删除自己那一个临时路径,只有完整成功才保留。
- **完全不读、不写、不复制持久 `example/`** —— 两者职责不同：`example/` 提供公共面
  coverage 与可运行 RN `0.87.1` native shell；临时 runtime harness 专门验证 packed
  tarball、负向路径与竞态，不替代展厅。
- 生成物不入库。

随后在**打印出来的那个目录**里执行(不是在本仓):

```sh
yarn android
yarn ios
```

harness 不继承本仓 `check:runtime-peers` 的 workspace 精确 allowlist；安装输出会如实暴露这条已知的 RNRC / RNGH peer warning，等同消费端实际可见结果。

## 兼容性

支持范围严格来自 `package.json#peerDependencies`;本仓直接验证的版本是 RN `0.87.1` + React `19.2.3`。

| 依赖                               | 支持范围           | 本仓验证版本 |
| ---------------------------------- | ------------------ | ------------ |
| `react-native`                     | `>=0.86.0`         | `0.87.1`     |
| `react`                            | `>=19.2.3 <20.0.0` | `19.2.3`     |
| `react-native-gesture-handler`     | `>=3.0.0 <4.0.0`   | `3.1.0`      |
| `react-native-reanimated`          | `>=4.5.2 <4.7.0`   | `4.6.0`      |
| `react-native-worklets`            | `>=0.11.0 <0.13.0` | `0.12.1`     |
| `react-native-reanimated-carousel` | `>=5.0.0 <6.0.0`   | `5.0.0`      |
| `react-native-safe-area-context`   | `>=5`              | `5.8.0`      |
| `react-native-svg`                 | `>=15`             | `15.15.5`    |
| `@sbaiahmed1/react-native-blur`    | `>=4`              | `6.0.1`      |

- 新架构(Fabric + TurboModule)必须开启;旧架构 Bridge、RN `0.85` 及更低版本不在支持范围。
- `react-native` peer 不封顶；当前验证基线是 RN `0.87.1`，同时保留对 Portal 所用 RN `0.86.3` 的安装兼容。
- Node.js `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`(`package.json#engines`;本仓 `.nvmrc` 固定 `v24.13.0`)
- TypeScript 6、Yarn 4

## 许可

MIT
