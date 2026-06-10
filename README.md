# @unif/react-native-design

[![npm](https://img.shields.io/npm/v/@unif/react-native-design.svg?color=cb3837&logo=npm)](https://www.npmjs.com/package/@unif/react-native-design)
[![CI](https://github.com/unif-design/react-native-design/actions/workflows/ci.yml/badge.svg)](https://github.com/unif-design/react-native-design/actions/workflows/ci.yml)
[![License](https://img.shields.io/npm/l/@unif/react-native-design.svg?color=blue)](LICENSE)
[![Docs](https://img.shields.io/badge/docs-unif--design.github.io-orange.svg)](https://unif-design.github.io/react-native-design/)

Unif 设计系统 —— theme(设计令牌)+ 组件 + 图标 + utils,面向 React Native 0.85 新架构(Fabric + TurboModule)。所有 Unif 应用与端能力包的 UI 基座。

## 特性

- **运行时主题**:`useColors()` 角色 token 跟随系统 light/dark 自动切换;`useThemedStyles` + 模块顶层 `makeStyles` 缓存样式,绝不内联 hex。
- **40+ 组件**:Button、Card、Cell、NavBar、Toast 等原子组件 + AvatarWithRing、GlassStats 等通用复合组件,全部从包根 barrel 导出,无需深路径。
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

## 快速开始

在 App 根挂一次 `ThemeProvider`,命令式 host(`ToastHost` / `ConfirmHost`)按需添加;`makeStyles` 必须写在模块顶层:

```tsx
import {
  ThemeProvider, ToastHost, Button, useThemedStyles, type ColorTokens,
} from '@unif/react-native-design';
import { View } from 'react-native';

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
  <ThemeProvider>
    <Demo />
    <ToastHost />
  </ThemeProvider>
);
```

## 文档

- **文档站**(快速开始 · 组件 API · 设计令牌 · 设计原则):https://unif-design.github.io/react-native-design/
- **AI / LLM**(纯 Markdown,按需 fetch,别凭记忆猜 API):
  [llms.txt 索引](https://unif-design.github.io/react-native-design/llms.txt) · [llms-full.txt 全文](https://unif-design.github.io/react-native-design/llms-full.txt)
- **Agent Skill** `unif-design`(覆盖组件 API、token 规则、与原生 RN 的关键差异):
  `/plugin marketplace add unif-design/skills` → `/plugin install unif@unif-skills`

## 兼容性

- React Native **0.85+**(新架构 Fabric + TurboModule;随 RN 0.85 对应 concurrent React)
- React 19、TypeScript 6
- Node.js ≥ 24.13(见 `.nvmrc`)

## 许可

MIT
