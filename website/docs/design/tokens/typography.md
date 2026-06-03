---
sidebar_position: 2
title: 字体
description: "Unif Design 字体 token：type 字号阶梯 + fw 字重 + fontMono 等宽栈；仅系统字体（CJK 走 PingFang SC），不引入 webfont。值取自 src/theme/tokens.ts。"
---

# 字体

仅用系统字体栈 —— iOS 走 `-apple-system`,Android 走系统默认,CJK 走 PingFang SC / Microsoft YaHei。**不引入 webfont**:品牌刻意依赖 OS 渲染原生中文字形。字号 / 字重的真相源是 `src/theme/tokens.ts`。

:::info 字号会随屏宽缩放
`type` 的每个值经 `rf()` 做 moderate 缩放(系数 `0.3`,对中文字号最友好;基准宽 402pt = iPhone 17 Pro)。下表数值是**基准设计值**,真机上略有浮动。详见 `src/theme/scale.ts`。
:::

## 字体栈

系统栈在 RN 端由 OS 默认提供;文档站 / web 侧 CSS 栈:

```css
font-family:
  -apple-system, BlinkMacSystemFont,
  "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
  "Helvetica Neue", Helvetica, Arial, sans-serif;
```

等宽栈走 `fontMono` token(iOS `Menlo` / Android `monospace`,用于数字、代码风格元数据):

```tsx
import { fontMono } from '@unif/react-native-design';
// style={{ fontFamily: fontMono }}
```

## 字号阶梯 / `type` {#字号阶梯}

| Token | 基准 px | 用途 |
|---|---|---|
| `display` | 22 | 品牌标题 |
| `h1` | 18 | 页面标题 |
| `h2` | 17 | 区块标题 |
| `h3` | 15 | 卡片标题 / 强调正文 |
| `body` | 15 | 默认正文 |
| `sm` | 14 | 次级正文 / 按钮 |
| `xs` | 13 | 提示、说明 |
| `xxs` | 12 | meta、caption |
| `micro` | 11 | 徽章、工具名 |
| `nano` | 10 | TabBar / Grid / Citation / Sources 角标、最小标签 |

### 半档微调 {#半档微调}

为收敛"近似 token + delta"反模式,补了几个 0.5 step 的半档,各有固定语义:

| Token | 基准 px | 用途 |
|---|---|---|
| `smPlus` | 14.5 | dashboard card 标题("小一档 semi"惯例) |
| `xsPlus` | 13.5 | 长文阅读字号(Privacy 正文) |
| `microPlus` | 11.5 | VersionPill / profileCard / Splash / carousel 副标题 |

### Hero 档 {#hero-档}

Hero 区主标题的三档(带 Logo / NavBar 的品牌大标题):

| Token | 基准 px | 用途 |
|---|---|---|
| `heroLg` | 26 | 一级 brand hero(带 Logo,Login 屏) |
| `heroMd` | 22 | 二级 hero(独立屏 + NavBar,ForgotPassword) |
| `heroSm` | 18 | 承接式 hero(Group 选组 / 选角色子区) |

## 字重 / `fw` {#字重}

| Token | 值 | 别名 |
|---|---|---|
| `fw.regular` | `'400'` | regular |
| `fw.medium` | `'500'` | medium |
| `fw.semi` | `'600'` | semi |
| `fw.bold` | `'700'` | bold |
| `fw.heavy` | `'800'` | heavy |

`fw` 用 `as const` 声明,类型已收窄到字面量字符串,**不需要再写 `as '500'` / `as '600'` 这种 cast**。

## 行高(惯例,非 token) {#行高}

:::warning 行高没有独立 token
设计系统**没有** `lineHeight` token。行高按惯例用字号乘系数算:标题 ×1.25(紧凑)、正文 ×1.45。在 `makeStyles` 里直接写 `lineHeight: t.body * 1.45` 即可,不要去 import 不存在的 `lh` token。
:::

| 惯例 | 系数 | 用途 |
|---|---|---|
| 紧凑 | ×1.25 | 标题 |
| 正文 | ×1.45 | 正文段落(约 22 / 15) |

## 在代码中使用 {#在代码中使用}

```tsx
import { StyleSheet } from 'react-native';
import { type as t, fw, fontMono, useThemedStyles } from '@unif/react-native-design';
import type { ColorTokens } from '@unif/react-native-design';

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    title: {
      fontSize: t.h2,               // 17
      lineHeight: t.h2 * 1.25,      // 标题用 ×1.25
      fontWeight: fw.semi,          // '600'(无需 cast)
      color: c.foreground,
    },
    body: {
      fontSize: t.body,             // 15
      lineHeight: t.body * 1.45,    // 正文用 ×1.45
      color: c.foreground,
    },
    meta: {
      fontSize: t.micro,            // 11
      fontWeight: fw.semi,
      color: c.foregroundSubtle,
    },
    code: {
      fontFamily: fontMono,
      fontSize: t.xxs,              // 12
    },
  });

function Article() {
  const styles = useThemedStyles(makeStyles);
  // ...
}
```

> `type` 导入时常起别名 `t`(避开 JS 保留字 `type`):`import { type as t } from '@unif/react-native-design'`。
