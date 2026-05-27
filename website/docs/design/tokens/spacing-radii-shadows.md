---
sidebar_position: 3
title: 间距 · 圆角 · 阴影
description: 4px 网格、圆角令牌、唯一卡片阴影
---

# 间距 · 圆角 · 阴影

## 间距

4-px 基准网格。组件内部多用 `10–14`，板块之间用 `16–24`。

| Token | px | 常用 |
|---|---|---|
| `1` | 4 | 最紧间隙 |
| `2` | 6 | 图标-文字间隙 |
| `3` | 8 | 头像-气泡间隙 |
| `4` | 10 | 气泡纵向 padding |
| `5` | 12 | 气泡横向 padding、栏间距 |
| `6` | 14 | 卡片 padding |
| `7` | 16 | 区块栏间距 |
| `8` | 20 | 较大区块间距 |
| `9` | 24 | Hero padding |
| `10` | 32 | 通栏区块间距 |

**规则。** 屏幕侧边距 12–16px。气泡 padding `10px 12px`。卡片 `12–14px`。尊重安全区（iOS home indicator: 34px）。

## 圆角

小集合，明确分工。最重要的是**气泡的非对称圆角**——指向头像的内角是直角。

| Token | px | 用途 |
|---|---|---|
| `sm` | 6 | 小按钮、徽章（4 是特殊微型） |
| `md` | 8 | 输入框、默认按钮 |
| `lg` | 10 | 卡片、列表行 |
| `xl` | 12 | 大卡片、列表容器 |
| `2xl` | 14 | **聊天气泡** |
| `3xl` | 18 | 输入框 wrapper |
| `pill` | 999 | chips、pill |

### 气泡的非对称圆角（核心）

- **AI 气泡**：`borderRadius: 0 14px 14px 14px`（左上角直角）
- **用户气泡**：`borderRadius: 14px 0 14px 14px`（右上角直角）

直角指向头像。这是设计系统最辨识度的视觉符号，**不要破坏**。

```tsx
const aiBubble = {
  borderTopLeftRadius: 0,         // 直角
  borderTopRightRadius: 14,
  borderBottomLeftRadius: 14,
  borderBottomRightRadius: 14,
};

const userBubble = {
  borderTopLeftRadius: 14,
  borderTopRightRadius: 0,        // 直角
  borderBottomLeftRadius: 14,
  borderBottomRightRadius: 14,
};
```

## 阴影

仅一种轻微卡片阴影。**无内阴影、无霓虹光晕、无双重边框。**

| 用途 | CSS | RN |
|---|---|---|
| Card | `0 1px 4px rgba(0,0,0,0.08)` | `shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: {0, 1}, elevation: 2` |
| Pop（弹层） | `0 4px 12px rgba(235,110,0,0.18)` | `shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: {0, 4}, elevation: 6, shadowColor: '#EB6E00'` |
| 列表行 / 设置项 | 无 | 无 |

确认卡片用 `2px` 彩色边框（橙 / 绿 / 灰），**不带阴影**。

```tsx
const shadow = useShadow(); // 来自 @/theme

const styles = StyleSheet.create({
  card: { ...shadow.card },           // 默认卡片阴影
  raised: { ...shadow.floating },     // TabBar 玻璃浮岛(大半径柔散)
  brand: { ...shadow.brandMd },       // 品牌橙光晕(Avatar ring / 主按钮)
  flat: { ...shadow.none },           // 显式去阴影
});
```
