---
slug: /design
sidebar_position: 1
title: 设计系统
description: "Unif Design 设计系统总览：品牌理念（中文优先、橙色克制、无装饰）、role-based token、组件视觉契约的入口；面向 React Native 0.85 新架构。"
---

# Unif Design

Unif Design 是 [Unif](https://github.com/unif-design)(统一企业 / Uni-President China)的 React Native 设计系统 —— 一套**品牌理念 + role-based token + 组件视觉契约**,面向 RN 0.85 新架构(Fabric + TurboModules)。本区从设计师视角讲清楚:为什么这么设计、用哪些 token、组件该长什么样。

> 找**怎么装、怎么用代码**?去[快速开始](/docs/getting-started)。找**逐组件 API**?去[组件概览](/docs/components)。要一份单文件全量参考?去[完整规范](/docs/unif-design)。

## 设计理念 {#设计理念}

一句话:**克制、功能性、中文优先。** 界面不是被装饰出来的,是被信息和操作组织出来的。三条贯穿始终的取向:

- **中文优先** —— 产品只面向中文用户,所有 UI 文案是简体中文;英文只出现在品牌名和代码标识符里。
- **橙色克制** —— 品牌橙 `#EB6E00` 只点在主按钮、用户气泡、活动标签、关键强调上,不铺满、不滥用;蓝色专属用户头像。
- **无装饰** —— 无插画、无渐变背景(仅品牌橙渐变)、无装饰 emoji、无背景图。视觉是功能性的。

完整的 5 条不可违背规则见[设计原则](/docs/design/principles)。

## 核心概念 {#核心概念}

- **role-based token,不是强度档** —— 颜色按**角色**命名(`primary` / `surface` / `foreground`),不是按强度(`gray100` / `orange500`)。亮 / 暗主题切换时,改的是 role 指向哪个 hex,组件代码不动。
- **颜色 / 阴影走运行期 hook** —— 用 `useColors()` / `useThemedStyles()` 在组件内拿,自动跟随系统亮暗;顶层静态 `colors` 导出已删除。
- **非颜色 token 静态 import** —— `space` / `radius` / `type` / `fw` / `motion` 是静态值,直接 import。
- **组合优先,不重造** —— 屏级 UI 是把现成原子(`Card` / `Cell` / `Tag` / `Avatar` / `Button`…)拼起来,而不是新写一套样式。

## 这套系统里有什么 {#这套系统里有什么}

| 板块 | 内容 |
|---|---|
| [设计原则](/docs/design/principles) | 5 条不可违背的规则 —— 中文优先、橙色克制、无装饰、列表用 gap、气泡内角方 |
| [语调与文案](/docs/design/voice) | 大小写、人称、状态文案速查、建议 chip 语气、标点 |
| [颜色 token](/docs/design/tokens/colors) | role-based 角色 token、亮 / 暗各一套、取色优先级链 |
| [字体 token](/docs/design/tokens/typography) | `type` 字号阶梯 + `fw` 字重 + 系统字体栈 |
| [间距 · 圆角 · 阴影](/docs/design/tokens/spacing-radii-shadows) | `space` 4px 网格、`radius`(含气泡非对称)、themed `shadow` |
| [动效 token](/docs/design/tokens/motion) | `motion` 时长、reanimated 用法 |
| [图标](/docs/components/icons) | 24×24 描边 SVG 规则 |
| [全局 Don'ts](/docs/design/donts) | 硬性禁忌清单 |

## 一句话速记 {#一句话速记}

- **品牌色** `#EB6E00` —— 仅主按钮、用户气泡、活动标签、关键强调。
- **气泡** AI `0/14/14/14`,用户 `14/0/14/14` —— 直角永远指向头像。
- **列表** 白卡 + 8px gap,**不**用 border-bottom。
- **图标** 24×24 描边 SVG,`stroke-width: 1.75`,`stroke-linecap: round`。
- **字体** 仅系统栈,CJK 走 PingFang SC / Microsoft YaHei,不引入 webfont。

## 下一步 {#下一步}

- [设计原则](/docs/design/principles) —— 5 条不可违背的规则,新增组件 / 改样式前必读
- [颜色 token](/docs/design/tokens/colors) —— role-based 角色 token 与取色优先级链
- [组件概览](/docs/components) —— 40+ 组件索引,按场景分组
- [快速开始](/docs/getting-started) —— 装包、挂 ThemeProvider、5 分钟跑通
