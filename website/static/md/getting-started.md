---
slug: /getting-started
sidebar_position: 2
title: 快速开始
description: "5 分钟上手 @unif/react-native-design：装 peerDeps、根挂 ThemeProvider、用 useColors / useThemedStyles 写第一个主题化组件。面向 RN 0.86 新架构。"
---

# 快速开始

5 分钟跑通:装包 → 挂 `ThemeProvider` → 用 `useColors()` / `useThemedStyles()` 写第一个跟随亮暗的组件。

## 环境要求 {#环境要求}

支持矩阵严格来自 `package.json#peerDependencies`,本仓直接验证的版本是 React Native `0.86.2` + React `19.2.3`:

| 依赖 | 支持范围 | 本仓验证版本 |
| --- | --- | --- |
| `react-native` | `>=0.86.0 <0.87.0` | `0.86.2` |
| `react` | `>=19.2.3 <20.0.0` | `19.2.3` |
| `react-native-gesture-handler` | `>=3.0.0 <4.0.0` | `3.1.0` |
| `react-native-reanimated` | `>=4.5.2 <4.6.0` | `4.5.3` |
| `react-native-worklets` | `>=0.11.0 <0.12.0` | `0.11.3` |
| `react-native-reanimated-carousel` | `>=5.0.0 <6.0.0` | `5.0.0` |
| `react-native-safe-area-context` | `>=5` | `5.7.x` |
| `react-native-svg` | `>=15` | `15.15.x` |
| `@sbaiahmed1/react-native-blur` | `>=4` | `4.6.x` |

- Node.js `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`(与 `package.json#engines` 逐字一致;本仓 `.nvmrc` 固定 `v24.13.0`)、Yarn 4
- TypeScript 6

:::info 仅支持新架构与 RN 0.86.x
本库面向 RN 0.86 新架构(Fabric + TurboModules),依赖 `react-native-reanimated@4.5` + `react-native-worklets@0.11`。旧架构(Bridge)、RN `0.85` 及更低版本、RN `0.87+` 都不在支持范围 —— 发布 contract 是闭区间 `>=0.86.0 <0.87.0`,不做向前兼容承诺。
:::

## 安装依赖 {#安装依赖}

### 1. 装本库

```sh
yarn add @unif/react-native-design
```

### 2. 装 peer dependencies

:::danger peerDeps 缺一即崩
本库**不打包**下列依赖,宿主工程必须自行安装并完成原生侧配置。缺任一,Metro 打包或运行时就会报 `Unable to resolve module` / `Cannot find module`。

```sh
yarn add react-native-svg \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-worklets \
  react-native-safe-area-context \
  react-native-reanimated-carousel \
  @sbaiahmed1/react-native-blur
```

iOS 装完原生包后,在 `ios/` 目录执行 `bundle exec pod install`。
:::

> 版本范围见上方[环境要求](#环境要求)表格,唯一事实来源是 `package.json#peerDependencies`。

:::caution Worklets 需要宿主自备 Babel / Metro
`react-native-worklets@0.11` 的 Babel 插件与 Metro transformer 由**宿主工程**提供,不随本库分发。宿主必须装上与 RN `0.86.2` 匹配的 `@babel/core`、`@react-native/babel-preset@0.86.x` 和 `@react-native/metro-config@0.86.x`,否则 worklet 编译会静默降级或直接报错。
:::

:::caution RNRC 5.0.0 与 Gesture Handler 3 的 peer 冲突
本包要求 Gesture Handler 3.x,但 `react-native-reanimated-carousel@5.0.0` 发布的 peer 范围是 `>=2.9.0 <3.0.0` —— 与本包的 `>=3.0.0 <4.0.0` **完全没有交集**。该组合已在本仓实测适配并通过验证,包管理器仍会就此报一次 peer 警告。

只有两种被认可的处理方式:**接受这一条警告**,或加**只作用于 Carousel 的窄 override / filter**。

npm:

```json
{
  "overrides": {
    "react-native-reanimated-carousel": {
      "react-native-gesture-handler": "$react-native-gesture-handler"
    }
  }
}
```

`$react-native-gesture-handler` 会复用消费端根依赖中满足 `>=3.0.0 <4.0.0` 的版本,避免装第二份 Gesture Handler。

pnpm 用 `pnpm.peerDependencyRules.allowedVersions` 精确到 `react-native-reanimated-carousel>react-native-gesture-handler`;Yarn 用 scoped `logFilters`。

**禁止**全局 peer 忽略、`--force`、`--legacy-peer-deps` 或无效的 `packageExtensions` / metadata patch —— 那会连同真实的 major 漂移一起吞掉。

本仓自己的 `.yarnrc.yml` `logFilters` **不随 npm 包分发**,消费端必须自行选择上述方式之一。本仓的权威门禁是 `yarn check:runtime-peers`(窄 allowlist:包名 + 请求方 locator + 精确 range + provider major,任一维度漂移即失败),与日志过滤无关。
:::

### 3. 配 babel(worklets 插件必须最后)

```js
// babel.config.js —— react-native-worklets/plugin 必须排在 plugins 数组最后
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... 其它插件
    'react-native-worklets/plugin',
  ],
};
```

## 根挂 Provider 与 Host {#根挂-themeprovider}

App 根按 `GestureHandlerRootView → SafeAreaProvider → ThemeProvider → App 内容 + Hosts` 装配。`SafeAreaProvider` 必须从 `react-native-safe-area-context` 这个 peer 包导入；设计系统组件与函数仍只从 `@unif/react-native-design` 包根导入:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ConfirmHost,
  ThemeProvider,
  ToastHost,
} from '@unif/react-native-design';

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          {/* 你的导航 / 屏幕 */}
          <ToastHost />
          <ConfirmHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- `ThemeProvider` —— 读取 `useColorScheme()`,自动跟随系统亮暗。
- `ToastHost` / `ConfirmHost` —— 都会读取安全区 context；各挂一次，且必须位于 `SafeAreaProvider` 内。

:::tip 完整 Provider 栈
若宿主还使用键盘或导航 Provider，可在不破坏上述相对顺序的前提下加入，例如 `GestureHandlerRootView → KeyboardProvider → SafeAreaProvider → ThemeProvider → NavigationContainer + Hosts`。骨架见[完整规范 → Quickstart](UNIF-DESIGN.md)。`ThemeProvider` 接受 `forceScheme?: 'light' | 'dark'` 强制某主题(用于测试 / 设置项接入)。
:::

## 第一个主题化组件 {#第一个主题化组件}

颜色 / 阴影走 `useThemedStyles(maker)`,自动跟随亮暗。**`makeStyles` 必须定义在模块顶层** —— 内联进组件会让引用每次渲染都变、打穿缓存。

```tsx
import { StyleSheet, View, Text } from 'react-native';
import {
  Button,
  useThemedStyles,
  type ColorTokens,
} from '@unif/react-native-design';

// ✅ 模块顶层定义 maker:(colors, shadow) => StyleSheet
const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    wrap: { padding: 16, backgroundColor: c.surface },
    title: { color: c.foreground, fontSize: 17, fontWeight: '600' },
  });

export function Demo() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>今日待办</Text>
      <Button label="保存" variant="primary" onPress={() => {}} />
    </View>
  );
}
```

只需 inline 取一两个颜色(状态映射 / prop fallback)时,用 `useColors()`:

```tsx
import { useColors } from '@unif/react-native-design';

function Banner({ active }: { active: boolean }) {
  const c = useColors(); // 跟随亮暗
  return <View style={{ backgroundColor: active ? c.primary : c.surfaceContainer }} />;
}
```

## 命令式 API {#命令式-api}

挂好 host 后,任意位置可直接调用:

```tsx
import { toast } from '@unif/react-native-design';

toast.success('已保存');
```

## 下一步 {#下一步}

- [设计原则](design/principles.md) —— 5 条不可违背的设计规则
- [颜色 token](design/tokens/colors.md) —— role-based 角色 token 与取色优先级链
- [组件概览](components/overview.md) —— 40+ 组件,按场景分组索引
- [在宿主工程里测试](testing.md) —— Jest 接入:一行 `@unif/react-native-design/jest-preset`
- [常见问题](troubleshooting.md) —— peer 缺失、Web 点击无响应、缓存不生效等排障
