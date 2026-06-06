---
slug: /getting-started
sidebar_position: 2
title: 快速开始
description: "5 分钟上手 @unif/react-native-design：装 peerDeps、根挂 ThemeProvider、用 useColors / useThemedStyles 写第一个主题化组件。面向 RN 0.85 新架构。"
---

# 快速开始

5 分钟跑通:装包 → 挂 `ThemeProvider` → 用 `useColors()` / `useThemedStyles()` 写第一个跟随亮暗的组件。

## 环境要求 {#环境要求}

- **React Native 0.85+**(新架构 Fabric + TurboModules 已开启,对应 React 19 concurrent)
- Node.js ≥ 24.13(见仓库 `.nvmrc`)、Yarn 4

:::info 仅支持新架构
本库面向 RN 0.85 新架构,依赖 `react-native-reanimated@4` + `react-native-worklets`。旧架构(Bridge)与更低 RN 版本不在支持范围。
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
  @gorhom/bottom-sheet \
  @sbaiahmed1/react-native-blur
```

iOS 装完原生包后,在 `ios/` 目录执行 `bundle exec pod install`。
:::

> 版本下限(来自 `package.json#peerDependencies`):`react-native-reanimated >=4`、`react-native-worklets >=0.9`、`react-native-gesture-handler >=2`、`react-native-safe-area-context >=5`、`react-native-svg >=15`、`react-native-reanimated-carousel >=5.0.0-beta.0`、`@gorhom/bottom-sheet >=5`、`@sbaiahmed1/react-native-blur >=4`。

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

## 根挂 ThemeProvider {#根挂-themeprovider}

在 App 根组件挂载一次 `ThemeProvider`(它读 `useColorScheme()`,自动跟随系统亮暗),并按需渲染命令式 host:

```tsx
import { ThemeProvider, ToastHost } from '@unif/react-native-design';

export function App() {
  return (
    <ThemeProvider>
      {/* 你的导航 / 屏幕 */}
      <ToastHost />
    </ThemeProvider>
  );
}
```

- `ToastHost` —— 渲染 `toast.success / error / info(...)` 命令式调用的弹层。

:::tip 完整 Provider 栈
实战里 `ThemeProvider` 通常嵌在手势 / 键盘 / 安全区 Provider 内:`GestureHandlerRootView → KeyboardProvider → SafeAreaProvider → ThemeProvider → NavigationContainer`。骨架见[完整规范 → Quickstart](/docs/unif-design)。`ThemeProvider` 接受 `forceScheme?: 'light' | 'dark'` 强制某主题(用于测试 / 设置项接入)。
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

- [设计原则](/docs/design/principles) —— 5 条不可违背的设计规则
- [颜色 token](/docs/design/tokens/colors) —— role-based 角色 token 与取色优先级链
- [组件概览](/docs/components) —— 40+ 组件,按场景分组索引
- [常见问题](/docs/troubleshooting) —— peer 缺失、Web 点击无响应、缓存不生效等排障
