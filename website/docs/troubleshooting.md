---
slug: /troubleshooting
sidebar_position: 10
title: 常见问题
description: Web/文档站、样式/主题、peer 缺失等常见问题排查
---

# 常见问题

## Web / 文档站

### ❓ RNGH 的 `Pressable` 在 Web 上点击无响应

**症状**：组件页 LiveDemo 里 Button / Cell 可见，但点击没有任何反应（`onPress` 不触发）。

**原因**：`react-native-gesture-handler` 的 `Pressable` 在 `react-native-web` 运行时不会触发 `onPress`——RNGH 依赖原生手势驱动，browser 不存在。

**修复**：文档站 webpack 插件（`website/src/plugins/docusaurus-rnw/index.js`）用 `NormalModuleReplacementPlugin` 把 RNGH 的 `Pressable` 替换成 `react-native-web` 的原生 `Pressable`。如果你修改了插件或引入了新的 Pressable 来源，确保替换规则覆盖到新路径。

---

### ❓ `useAnimatedStyle` / Layout 动画在文档站崩溃

**症状**：开发服务器启动后，包含 Reanimated 动画的页面抛出运行时错误或白屏。

**原因**：`react-native-reanimated` 的 worklet 转换在 web 运行时不完整，`useAnimatedStyle` 等 API 在 `react-native-web` 下无法正常运行。

**修复**：所有脉冲 / 渐入 / Layout 动画通过 design 包内的 `usePulse.web`（web 平台特化实现）+ `Reveal`（`@unif/react-native-design` 0.4.37+ 已收口）统一处理。消费方不要在文档站 MDX 里直接使用 `useAnimatedStyle`。

---

## 样式 / 主题

### ❓ `useThemedStyles` 缓存不生效，每次渲染都重新计算

**症状**：组件频繁重渲染，性能问题；或者主题切换时样式未更新。

**原因**：`makeStyles` 函数写在了组件函数体内（inline），导致每次渲染都是新引用，打穿 `useMemo([colors, shadow, maker])` 缓存。

**修复**：

```tsx
// ❌ 错误 — makeStyles 在组件内 inline 定义
function MyComponent() {
  const makeStyles = (c: ColorTokens) => ({ ... }); // 每次渲染新引用
  const styles = useThemedStyles(makeStyles);
}

// ✅ 正确 — makeStyles 定义在模块顶层（通常在 styles.ts 导出）
const makeStyles = (c: ColorTokens) => StyleSheet.create({ ... });

function MyComponent() {
  const styles = useThemedStyles(makeStyles);
}
```

---

### ❓ 颜色直接写了 hex，亮暗切换后视觉错乱

**症状**：暗色模式下某些元素颜色不对，与设计稿不符。

**修复**：使用 `useColors()` 返回的 role token（`c.primary`、`c.surface`、`c.foreground` 等），不要硬编码 `#EB6E00` 或 `rgba(...)`。仅视觉锁定（QR 白卡 / 商标色）时允许硬编码，且必须加注释说明锁定理由。

---

## Peer Dependencies

### ❓ 运行时报 `Cannot find module 'react-native-reanimated'` / `Cannot find module 'react-native-gesture-handler'`

**症状**：安装 `@unif/react-native-design` 后启动 Metro 或构建时报模块找不到。

**修复**：按[快速开始](/docs/getting-started)中的 peer 清单逐一安装：

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

iOS 安装后还需执行 `cd ios && bundle exec pod install`。

---

### ❓ iOS 构建失败：`Undefined symbols for architecture arm64`

**症状**：`pod install` 之后 Xcode 构建仍然报链接错误。

**修复**：确认 peer 已全部安装，然后重新执行 `cd ios && bundle exec pod install --repo-update`，再 clean build（Xcode Product → Clean Build Folder）。
