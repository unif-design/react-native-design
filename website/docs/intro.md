---
sidebar_position: 1
title: 简介
description: 安装 @unif/react-native-design 并把第一个组件搬上屏
slug: /intro
---

# 简介

`@unif/react-native-design` 是一套 React Native 设计系统包,提供:

- 设计令牌(颜色 / 字体 / 间距 / 圆角 / 阴影 / 动效)
- 一套完整的 UI 组件库(Button / Input / NavBar / Cell / Form / ...)
- 业务复合组件(ScreenLayout / EntryCard / VersionPill / ...)
- 图标库(语义命名 + 暗色自适应)

## 安装

```bash
npm install @unif/react-native-design

# 装齐 peerDeps(推荐 yarn / pnpm 自动提示;或手动一次性装)
npm install \
  react-native-gesture-handler \
  react-native-reanimated \
  react-native-safe-area-context \
  react-native-svg \
  react-native-worklets \
  @gorhom/bottom-sheet \
  @sbaiahmed1/react-native-blur
```

## 上屏

```tsx
import { Button, ThemeProvider } from '@unif/react-native-design';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Button label="开始" variant="primary" onPress={() => {}} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

`ThemeProvider` 内部会读 `useColorScheme()` 自动跟随系统亮 / 暗主题切换。

## 下一步

- [UNIF-DESIGN 总览](./UNIF-DESIGN) —— 设计系统的整体哲学与定位
- [设计原则](./design/intro) —— 风格、声音、不要做什么
- [Design Tokens](./design/tokens/colors) —— 颜色 / 字体 / 间距 / 动效
- [组件总览](./components/overview) —— 38 个组件的索引与分类

## 版本

当前文档对应 `@unif/react-native-design@0.2.0`。
