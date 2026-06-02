---
slug: /migration
sidebar_position: 11
title: 升级 / 迁移
description: 令牌迁移、废弃 API 对照表
---

# 升级 / 迁移

## 令牌迁移：旧顶层导出 → 运行期 Hook（Phase B–E）

### 背景

旧版 `@unif/react-native-design` 从顶层直接导出 `colors` 和 `shadow` 对象，可以在模块顶层静态 import：

```tsx
// ❌ 已废弃 — Phase B–E 已删除
import { colors, shadow } from '@unif/react-native-design';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,   // 静态，不随亮/暗切换
    ...shadow.brandLg,
  },
});
```

这种写法只有单一亮色值，无法随系统亮暗主题切换。

### 迁移方式

**颜色**：改用运行期 hook `useColors()`，配合 `useThemedStyles(maker)` 构建响应式样式。

```tsx
// ✅ 正确 — 运行期 hook，自动随主题切换
import {
  useColors,
  useThemedStyles,
  type ColorTokens,
  type ShadowTokens,
} from '@unif/react-native-design';
import { StyleSheet } from 'react-native';

// makeStyles 必须在模块顶层定义（不能 inline 写在组件里）
const makeStyles = (c: ColorTokens, s: ShadowTokens) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      ...s.brandLg,
    },
  });

function MyComponent() {
  const styles = useThemedStyles(makeStyles);
  // ...
}
```

**间距 / 圆角 / 字体 / 动效**：这些是静态 token，可以继续直接 import：

```tsx
import { space, radius, type as t, fw, dim, motion } from '@unif/react-native-design';
```

### 对照速查

| 旧写法（已废弃）| 新写法（正确）|
|---|---|
| `import { colors } from '@unif/react-native-design'` | `const c = useColors()` |
| `import { shadow } from '@unif/react-native-design'` | maker 第二参数 `(c, s) => ...`，使用 `s.brandLg` 等 |
| `colors.primary` | `c.primary` |
| `colors.surface` | `c.surface` |
| `colors.foreground` | `c.foreground` |
| `shadow.brandLg` | `...s.brandLg`（spread 到 StyleSheet）|
| `StyleSheet.create({ ... colors.x ... })` 顶层 | `useThemedStyles(maker)` 运行期 |

### 为什么不能继续用静态导出

`ThemeProvider` 读取 `useColorScheme()` 动态计算亮/暗色，并把 `colors`/`shadow` 的稳定引用注入 Context。`useThemedStyles(maker)` 的 `useMemo([colors, shadow, maker])` 依赖这个引用——静态顶层导出永远只有亮色值，亮暗切换对它无效。

---

## 版本升级注意事项

### 升级 react-native-reanimated 4.x

Reanimated 4 使用新的 worklet 插件（`react-native-worklets/plugin`）替代旧的 `react-native-reanimated/plugin`。`babel.config.js` 里 worklets 插件**必须排在 plugins 数组最后**：

```js
// babel.config.js
module.exports = {
  plugins: [
    ['module-resolver', { ... }],
    // worklets 插件必须最后
    'react-native-worklets/plugin',
  ],
};
```

### 升级 @gorhom/bottom-sheet

BottomSheet 在新架构（Fabric）下需要额外的 peer：确保 `react-native-gesture-handler` 和 `react-native-reanimated` 版本符合 bottom-sheet 当前版本的 peerDependencies 要求。升级前查阅 [@gorhom/bottom-sheet releases](https://github.com/gorhom/react-native-bottom-sheet/releases)。
