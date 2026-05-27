---
sidebar_position: 2
title: 字体
description: 系统字体栈、字号阶梯、字重、行高
---

# 字体

仅使用系统字体栈——iOS 走 `-apple-system`，Android 走系统默认，CJK 走 PingFang SC / Microsoft YaHei。**不引入 webfont**。

## 字体栈

```css
font-family:
  -apple-system, BlinkMacSystemFont,
  "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
  "Helvetica Neue", Helvetica, Arial, sans-serif;
```

Mono：`"SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace`

## 字号阶梯

| Token | 字号 | 用途 |
|---|---|---|
| `display` | 22px | 品牌标题 |
| `h1` | 18px | 页面标题 |
| `h2` | 17px | 区块标题 |
| `h3` | 15px | 卡片标题 / 强调正文 |
| `body` | 15px | 默认正文 |
| `sm` | 14px | 次级正文 / 按钮 |
| `smPlus` | 14.5px | dashboard card 标题（"小一档 semi" 惯例） |
| `xs` | 13px | 提示、说明 |
| `xsPlus` | 13.5px | 长文阅读字号（Privacy body） |
| `xxs` | 12px | meta、caption |
| `microPlus` | 11.5px | 半档微调（SplashScreen / VersionPill / profileCard / carousel） |
| `micro` | 11px | 徽章、工具名 |
| `nano` | 10px | TabBar / Grid / Citation / Sources 角标、最小标签 |

## 行高

| Token | 值 | 用途 |
|---|---|---|
| `tight` | 1.25 | 标题 |
| `body` | 1.45 | 正文段落（约 22/15） |

## 字重

`400` regular · `500` medium · `600` semi · `700` bold · `800` heavy

数字和代码风格的元数据可使用 mono 字体栈。

`fw` token 用 `as const` 声明，类型已经收窄到字面量字符串，**不需要再写 `as '500'` / `as '600'` 这种 cast**。

## 在代码中使用

```tsx
import { StyleSheet } from 'react-native';
import { type as t, fw, fontMono, useThemedStyles } from '@/theme';
import type { ColorTokens } from '@/theme';

const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    title: {
      fontSize: t.h2,                 // 17
      lineHeight: t.h2 * 1.25,        // 21.25
      fontWeight: fw.semi,
      color: c.foreground,
    },
    body: {
      fontSize: t.body,               // 15
      lineHeight: t.body * 1.45,      // 21.75
      color: c.foreground,
    },
    meta: {
      fontSize: t.micro,              // 11
      fontWeight: fw.semi,
      color: c.foregroundSubtle,
    },
    code: {
      fontFamily: fontMono,
      fontSize: t.xxs,                // 12
    },
  });

function Article() {
  const styles = useThemedStyles(makeStyles);
  // ...
}
```
