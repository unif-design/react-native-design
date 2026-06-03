---
slug: /migration
sidebar_position: 11
title: 升级 / 迁移
description: "@unif/react-native-design 迁移指南：旧顶层 colors / shadow 静态导出 → 运行期 useColors() / useThemedStyles() hook（含旧 token → 新 role grep 对照），以及 reanimated 4 / bottom-sheet 升级注意。"
---

# 升级 / 迁移

破坏性变更与迁移方法。当前版本的完整 token 见[设计令牌](/docs/design/tokens/colors),组件 API 见[组件概览](/docs/components)。

---

## 令牌迁移:旧顶层导出 → 运行期 Hook {#令牌迁移}

### 背景 {#背景}

旧版 `@unif/react-native-design` 从顶层直接导出 `colors` 和 `shadow` 对象,可在模块顶层静态 import。这种写法只有单一亮色值,无法随系统亮暗切换 —— 顶层静态导出**已删除**:

```tsx
// ❌ Incorrect:顶层 colors / shadow 导出已删除,拿不到;且只有亮色值
import { colors, shadow } from '@unif/react-native-design';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,   // 静态,不随亮 / 暗切换
    ...shadow.brandLg,
  },
});
```

### 迁移方式 {#迁移方式}

**颜色 + 阴影**:改用运行期 hook。`useThemedStyles(maker)` 的 `maker` 签名是 `(c: ColorTokens, s: ShadowTokens) => StyleSheet`,在组件内调用即拿到当前主题的 styles。

```tsx
// ✅ Correct:运行期 hook,自动随主题切换
import { useThemedStyles } from '@unif/react-native-design';
import type { ColorTokens, ShadowTokens } from '@unif/react-native-design';
import { StyleSheet } from 'react-native';

// makeStyles 必须在模块顶层定义(不能内联进组件,否则打穿 useMemo 缓存)
const makeStyles = (c: ColorTokens, s: ShadowTokens) =>
  StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      ...s.brandLg,                  // 暗色下 shadowOpacity / elevation 自动趋零
    },
  });

function MyComponent() {
  const styles = useThemedStyles(makeStyles);
  // ...
}
```

只需 inline 取色时用 `useColors()`(返回 `ColorTokens`),取阴影用 `useShadow()`(返回 `ShadowTokens`)。

**间距 / 圆角 / 字体 / 动效**:这些是静态 token,继续直接 import:

```tsx
import { space, radius, type as t, fw, fontMono, motion } from '@unif/react-native-design';
```

### 对照速查 {#对照速查}

| 旧写法(已删除) | 新写法(正确) |
|---|---|
| `import { colors } from '@unif/react-native-design'` | `const c = useColors()` |
| `import { shadow } from '@unif/react-native-design'` | `const s = useShadow()`,或 maker 第二参 `(c, s) => ...` |
| `colors.primary` / `colors.surface` / `colors.foreground` | `c.primary` / `c.surface` / `c.foreground` |
| `shadow.brandLg` | `...s.brandLg`(spread 进 StyleSheet) |
| 顶层 `StyleSheet.create({ ... colors.x ... })` | `useThemedStyles(maker)` 运行期 |

### 旧 token 名 → 新 role 名 {#旧-token-名--新-role-名}

历史代码里若残留旧的强度档命名,grep 替换为 role 名:

| 旧 | 新 |
|---|---|
| `colors.bgPage` | `c.background` |
| `colors.bgCard` | `c.surface` |
| `colors.bgInput` | `c.surfaceContainer` |
| `colors.bgMuted` | `c.surfaceContainerHigh` |
| `colors.bgPill` | `c.surfaceContainerHighest` |
| `colors.fg1` / `fg2` / `fg3` | `c.foreground` / `c.foregroundMuted` / `c.foregroundSubtle` |
| `colors.primary300` / `500` | `c.primary` / `c.primaryPressed` |
| `colors.primary0` / `50` | `c.primaryContainer` / `c.primaryContainerSubtle` |
| `colors.success300` / `successBg` | `c.success` / `c.successContainer` |
| `colors.error300` / `error0` | `c.error` / `c.errorContainer` |
| `colors.info300` / `infoBg` | `c.info` / `c.infoContainer` |
| `colors.border` / `borderSoft` / `borderFaint` | `c.outline` / `c.outlineVariant` / `c.outlineFaint` |

> 旧 `brandGradient` / `primary100/200/400/600` 等强度档已随死代码清理移除(0 消费方)。完整迁移表见[完整规范 → Migration map](/docs/unif-design)。

### 为什么不能继续用静态导出 {#为什么不能继续用静态导出}

`ThemeProvider` 读 `useColorScheme()` 动态算亮 / 暗,并以 `scheme` 为唯一 `useMemo` 依赖,把稳定的 `colors` / `shadow` 引用注入 Context。`useThemedStyles(maker)` 的 `useMemo([colors, shadow, maker])` 依赖这个引用 —— 静态顶层导出永远只有亮色值,亮暗切换对它无效。

---

## 版本升级注意事项 {#版本升级注意事项}

### 升级 react-native-reanimated 4.x {#升级-reanimated-4}

Reanimated 4 使用新的 worklet 插件 `react-native-worklets/plugin` 替代旧的 `react-native-reanimated/plugin`。`babel.config.js` 里 worklets 插件**必须排在 plugins 数组最后**:

```js
// babel.config.js
module.exports = {
  plugins: [
    // ... 其它插件
    // worklets 插件必须最后
    'react-native-worklets/plugin',
  ],
};
```

### 升级 @gorhom/bottom-sheet {#升级-bottom-sheet}

BottomSheet 在新架构(Fabric)下需要额外的 peer:确保 `react-native-gesture-handler`(>=2)和 `react-native-reanimated`(>=4)版本符合 bottom-sheet 当前版本的 peerDependencies。升级前查阅 [@gorhom/bottom-sheet releases](https://github.com/gorhom/react-native-bottom-sheet/releases)。
