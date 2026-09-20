---
sidebar_position: 2
title: 设计原则
description: 'Unif Design 的文案、颜色、布局与组件组合原则。'
---

<!-- Generated from @unif/react-native-design@0.32.2; edit source documentation. -->

# 设计原则

这些原则说明 Unif 默认视觉与组件用法。具体参数和行为以组件 API 为准，应用内容和业务规则由调用方维护。

## 文案清晰 {#中文优先}

文档和内置示例优先使用简洁中文。业务名称、按钮文字等通过组件已有属性传入；组件不判断应用应使用哪种业务术语或语言。示例见[语调与文案](voice.md)。

## 颜色表达用途 {#橙色克制}

使用主题颜色表达主操作、内容层级和状态。品牌色用于重点操作和强调；`info`、`error` 等按公开组件的语义使用，不固定绑定某一种业务身份。

颜色通过 `useColors()` 或 `useThemedStyles()` 取得，避免把亮色主题的固定值带入暗色界面。详见[颜色](tokens/colors.md)。

## 内容优先 {#无装饰}

视觉效果服务于内容识别和操作反馈。需要图片头像、渐变或边缘动效时，使用相应组件公开能力，并遵守其无障碍和平台边界；这些能力并不限定某个业务场景。

## 布局按容器选择 {#列表用-gap-不用-border}

`List` 的默认 `grouped` 模式用卡片与间距分组；`flush` 适合已有容器内的紧凑列表。选择已有模式，避免自行叠加与模式冲突的分隔线。详见 [Cell · List](../components/cell.md)。

## 组合保持职责 {#气泡内角方}

Design 提供通用视觉与交互。聊天消息及气泡由 [Chat](https://github.com/unif-design/react-native-chat) 维护；订单、拜访等业务状态由应用维护，不进入基础组件。

[组件索引](../components/overview.md) · [使用建议](donts.md)
