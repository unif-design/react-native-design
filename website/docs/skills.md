---
title: AI Skill
description: "unif-design 是一个 Agent Skill,教 AI 编码助手正确调用 @unif/react-native-design 的 API、避免常见幻觉。"
---

# AI Skill：unif-design

## 这是什么

`unif-design` 是一个 **Agent Skill**,教 AI 编码助手(Claude Code / Cursor / Codex)正确调用 `@unif/react-native-design` 的 API、避免常见幻觉。

它把这个设计系统的关键约定、易错点和参考索引打包给 AI,让助手在你的项目里写代码时按真实 API 来,而不是凭记忆瞎猜。

## 覆盖什么

**何时会触发:** 用 `@unif/react-native-design` 搭任何 UI——按钮 / 卡片 / 列表 / 表单 / 弹窗 / 头像 / 标签,套颜色 token、用 `useColors` / `useThemedStyles`、主题切换、a11y。

**覆盖的能力:**

- 组件 API、props、variant、size(按需 fetch 远程 llms.txt,不靠记忆)。
- 颜色 token 规则:`useColors()` 角色 token、颜色优先级链、绝不内联 hex/rgba。
- 主题化样式:`useThemedStyles` + 模块顶层 `makeStyles`、shadow `...s.brandLg`。
- 与原生 RN 的关键差异(如 RNGH `Pressable`)、a11y 必填项、`createLogger` 取代 console。

> 拍照 / 扫码 / 分享各有专门 skill(camera / hms-scan / umeng),不在本 skill 范围内。

## 如何安装

**Claude Code 插件市场:**

```bash
/plugin marketplace add unif-design/skills
/plugin install unif@unif-skills
```

**或用 skills CLI:**

```bash
npx skills add unif-design/skills
```

## 在 GitHub 查看

skills 全部开源,发布在插件市场仓库 `unif-design/skills`。本 skill 的源码与参考文档:

👉 **[github.com/unif-design/skills · unif-design](https://github.com/unif-design/skills/tree/main/skills/unif-design)**

---

装了之后,在你的项目里让 AI 写 `@unif/react-native-design` 代码会更准。
