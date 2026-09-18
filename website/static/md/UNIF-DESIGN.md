---
slug: /unif-design
title: 文档概览
description: 'Unif Design 文档入口：安装、组件、主题变量、测试与贡献。'
sidebar_label: 完整规范
---

<!-- Generated from @unif/react-native-design@0.32.0; edit source documentation. -->

# Unif Design

Unif 企业设计系统的 React Native 组件库，提供基础组件、主题、字体和图标。`@unif` 是 Unif 维护的包命名空间，其他项目可以按公开 API 与许可使用这些库。

## 开始使用 {#quickstart}

从[快速开始](getting-started.md)安装依赖并配置 `ThemeProvider`。逐组件用法见[组件索引](components/overview.md)，支持范围以所用版本的包声明和安装文档为准。

## 设计与文案 {#品牌与-voice}

[设计原则](design/principles.md)说明主题、布局和反馈的选择；[语调与文案](design/voice.md)提供默认中文示例。应用通过组件已有的文字属性表达自己的产品内容。

## 设计变量

| 内容             | 入口                                                  |
| ---------------- | ----------------------------------------------------- |
| 颜色与亮暗主题   | [颜色](design/tokens/colors.md)                    |
| 字体与应用字号   | [字体](design/tokens/typography.md)                |
| 间距、圆角与阴影 | [布局变量](design/tokens/spacing-radii-shadows.md) |
| 动效与系统偏好   | [动效](design/tokens/motion.md)                    |
| 图标             | [图标目录](components/icons.md)                    |

变量与默认值在所属页面和代码中维护，本页只提供导航。

## 组件与组合 {#组件库}

[组件索引](components/overview.md)按场景分组，每页提供示例、API 和必要的无障碍／平台说明。消费者从包根导入组件和公开类型。

消息、聊天输入和附件展示由独立的 [@unif/react-native-chat](https://github.com/unif-design/react-native-chat) 提供。Design 负责通用 UI，应用负责导航、状态和业务请求。

## 开发与验证 {#rn-落地图}

- [测试接入](testing.md)：在宿主测试中接入公开 preset。
- [常见问题](troubleshooting.md)：依赖、主题和平台问题。
- [版本迁移](migration.md)：已有版本的接口调整。
- [贡献指南](https://github.com/unif-design/react-native-design/blob/main/CONTRIBUTING.md)：参与库维护。

[AI 文档索引](https://unif-design.github.io/react-native-design/llms.txt)提供按页读取入口；全文聚合由这些页面生成。
