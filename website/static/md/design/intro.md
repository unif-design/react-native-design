---
slug: /design
sidebar_position: 1
title: 设计系统
description: 'Unif Design 的主题、组件与组合方式。'
---

<!-- Generated from @unif/react-native-design@0.32.2; edit source documentation. -->

# 设计系统

Unif Design 将通用交互、主题变量和 React Native 组件放在同一套系统中。它保留 Unif 的默认视觉语言，也可供其他项目通过公开属性组合使用。

## 核心概念 {#核心概念}

- 颜色按用途命名，如 `primary`、`surface`、`foreground`；组件随亮暗主题读取对应颜色。
- `ThemeProvider` 提供主题与应用字号，`useColors()` 和 `useThemedStyles()` 读取运行期主题。
- 间距、圆角、字重和动效使用公开变量；具体取值见所属主题页。
- 通用界面优先组合现有组件，应用自己维护导航、业务状态和请求。

## 阅读入口 {#这套系统里有什么}

| 想了解什么         | 文档                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| 如何选择视觉与交互 | [设计原则](principles.md)                                        |
| 如何写默认中文文案 | [语调与文案](voice.md)                                           |
| 如何使用主题与字体 | [颜色](tokens/colors.md)、[字体](tokens/typography.md) |
| 如何安排布局       | [间距、圆角与阴影](tokens/spacing-radii-shadows.md)              |
| 如何使用组件       | [组件索引](../components/overview.md)                                               |

第一次接入请先看[快速开始](../getting-started.md)。
