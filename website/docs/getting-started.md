---
slug: /getting-started
sidebar_position: 2
title: 快速开始
description: 安装 @unif/react-native-design、挂载 ThemeProvider，5 分钟上手
---

# 快速开始

## 环境要求

- **React Native 0.85+**（新架构 Fabric + TurboModules 已开启）
- **React 19+**
- Node.js ≥ 24.13（见仓库 `.nvmrc`）

## Peer Dependencies

:::danger 必须提前安装
本库不打包下列依赖，宿主工程必须自行安装并完成原生侧配置：

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

iOS 还需在 `ios/` 目录执行 `bundle exec pod install`。
:::

## 安装

```sh
yarn add @unif/react-native-design
```

## 根挂 ThemeProvider

在 App 根组件挂载一次 `ThemeProvider`，并按需添加命令式 host：

```tsx
import { ThemeProvider, ToastHost, ConfirmHost } from '@unif/react-native-design';

export function App() {
  return (
    <ThemeProvider>
      {/* 你的导航 / 屏幕 */}
      <ToastHost />
      <ConfirmHost />
    </ThemeProvider>
  );
}
```

- `ToastHost` — 渲染 `toast.success/error/info/warn(...)` 命令式调用的弹层
- `ConfirmHost` — 渲染 `await confirm(...)` 命令式确认对话框

## 最小上手示例

```tsx
import { Button, useColors, useThemedStyles, type ColorTokens } from '@unif/react-native-design';
import { View } from 'react-native';

// makeStyles 必须定义在模块顶层，不要写在组件里 inline
const makeStyles = (c: ColorTokens) => ({
  wrap: { padding: 16, backgroundColor: c.surface },
});

export function Demo() {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.wrap}>
      <Button label="保存" onPress={() => {}} />
    </View>
  );
}
```

命令式 API：

```tsx
import { toast, confirm } from '@unif/react-native-design';

toast.success('已保存');

const ok = await confirm({
  title: '确认注销账号?',
  message: '注销后数据无法恢复',
  destructive: true,
});
```

## 下一步

- [组件概览](/docs/components) — Button、Cell、NavBar 等 37 个组件
- [设计原则](/docs/design/principles) — 5 条不可违背的设计规则
- [设计令牌](/docs/design/tokens/colors) — 颜色 / 字体 / 间距 / 圆角 / 阴影
- [常见问题](/docs/troubleshooting) — peer 缺失、RNGH Web 点击无响应等
