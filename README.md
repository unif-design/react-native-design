# @unif/react-native-design

[![npm](https://img.shields.io/npm/v/@unif/react-native-design.svg?color=cb3837&logo=npm)](https://www.npmjs.com/package/@unif/react-native-design)
[![CI](https://github.com/unif-design/react-native-design/actions/workflows/ci.yml/badge.svg)](https://github.com/unif-design/react-native-design/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/@unif/react-native-design.svg?color=blue)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-unif--design.github.io-orange.svg)](https://unif-design.github.io/react-native-design/)

Unif 设计系统：theme(设计令牌)+ 组件 + 图标 + utils，面向 RN 0.85 新架构(Fabric + concurrent React)。所有 Unif 应用与端能力包的 UI 基座。

> 📖 **完整文档**(快速开始 · 组件 · 设计令牌 · 设计原则)：
> **https://unif-design.github.io/react-native-design/**

## 安装

```sh
yarn add @unif/react-native-design
```

需要一组 peer(`react-native-svg` / `react-native-gesture-handler` / `react-native-reanimated` / `react-native-worklets` / `react-native-safe-area-context` / `react-native-reanimated-carousel` / `@gorhom/bottom-sheet` / `@sbaiahmed1/react-native-blur`)+ 根挂 `ThemeProvider`，详见[文档站 · 快速开始](https://unif-design.github.io/react-native-design/docs/getting-started)。

## 用法

```tsx
import { Button, useColors, useThemedStyles } from '@unif/react-native-design';

function MyScreen() {
  const c = useColors();
  return <Button label="提交" onPress={() => {}} />;
}
```

组件 API、token 调色板、暗色适配、设计原则 —— 见[文档站](https://unif-design.github.io/react-native-design/)。

## 许可

MIT
