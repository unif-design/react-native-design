---
slug: /design
sidebar_position: 1
title: 设计
description: Unif Design 的设计哲学、令牌、组件规范
---

# 设计

Unif Design 的设计师视角——原则、令牌、组件视觉契约。

## 概览

| 板块 | 内容 |
|---|---|
| [设计原则](./principles.md) | 5 条不可违背的规则——中文优先、橙色克制、无装饰、列表用 gap、气泡内角方 |
| [语调与文案](./voice.md) | 大小写、人称、状态文案速查、标点 |
| [设计令牌 · 颜色](./tokens/colors.mdx) | 主色 / 语义色 / 中性色，点击复制 HEX |
| [设计令牌 · 字体](./tokens/typography.md) | 系统字体栈、字号阶梯 |
| [设计令牌 · 间距/圆角/阴影](./tokens/spacing-radii-shadows.md) | 4px 网格、圆角 token、唯一卡片阴影 |
| [设计令牌 · 动效](./tokens/motion.md) | 时长、缓动函数 |
| [设计令牌 · 图标](/docs/components/icons) | 24×24 stroked SVG 规则 |
| [不要这样做](./donts.md) | 硬性禁忌 |

## 一句话说明

- **品牌色** `#EB6E00` — 仅用于主按钮、用户气泡、活动标签、关键强调
- **气泡** AI `0/14/14/14`，用户 `14/0/14/14` — 直角永远指向头像
- **列表** 白卡 + 8px gap，**不**用 border-bottom
- **图标** 24×24 stroked SVG，`stroke-width: 1.75`，`linecap: round`
- **字体** 仅系统栈，CJK 走 PingFang SC / Microsoft YaHei

继续浏览 → [组件](/docs/components)
