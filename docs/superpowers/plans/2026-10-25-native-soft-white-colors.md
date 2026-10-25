# Native Soft White Colors Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. 当前用户已要求直接在 worktree 开发，不另设原型或计划确认关卡。

**Goal:** 只将 Portal 不支持 Liquid Glass 的旧 iOS／Android 浅色表面改为已选定的柔雾白。

**Architecture:** 在 Design 的现有主题出口选择稳定的浅色回退调色板，现有组件及 Portal 消费相同 token。渐变只换颜色和 halo 颜色，保留全部 stop 位置、几何、透明度与渲染层；原生玻璃、Web 和深色不变。

**Tech Stack:** React Native 0.88、Design 1.12.1、现有 ThemeProvider／GlassLayer／ScreenBackdrop。

**Spec:** 本会话最新用户要求：柔雾白，只改色彩；所有页面保留原图标、文案、布局、尺寸及交互。不再更新预览。规范参照 `/Users/liulijun/tongyi/unif-design/unif-platform-architecture/libraries/react-native-design/theme.md`。

## Global Constraints

- 只用套餐正常额度。初始阶段仅本地开发；2026-10-25 用户随后明确要求发版并完成 Portal 安装测试，交付与设备验证沿现有工程流程执行，首位版本号保持 1。
- 不支持玻璃且为 iOS／Android 时采用柔雾白；iOS 26 原生支持与 Web、深色保持原色。
- 不改变 JSX 结构、图标类型、布局／圆角／阴影／字体／透明度、业务状态及回调。
- 品牌前景、危险／成功等语义色保持，背景及既有边线采用选定中性颜色。
- Portal worktree：`/Users/liulijun/.codex/worktrees/portal-soft-white-colors/ai-app-portal`；Design worktree：`/Users/liulijun/tongyi/unif-design/.worktrees/portal-soft-white-colors/react-native-design`。

## Review Focus

- 原生支持为真或 Web 时不得套用新配色。
- 深色、减少透明度偏好、显式 fallbackColor 保持原语义。
- 新 token 只表达 halo 颜色，不能改变既有 halo 布局或透明度。
- 输入／列表／图标操作的真实组件、触摸和无障碍名字保持。
- Portal 必须实际消费本次库源码的本地构建包；不借正式旧包测试声称新代码通过。

## Task 1: 共享回退配色与实际消费者

Files: Design `src/theme/nativeFallbackColors.ts`、`colors.ts`、`palettes.ts`、`ThemeProvider.tsx`、`components/business/Decorations/ScreenBackdrop.tsx`；Portal `AccountScreen.tsx` 的 halo color，以及 `OrderResultContent.tsx`／`constants.ts` 的分享背景配色。GlassLayer 实现沿用原样。

- [x] 在真实 ThemeProvider／组件测试中先证明旧 iOS／Android 的选定表面、原生支持／Web／深色边界及自定义 stops 保留；运行红灯。
- [x] 统一选择现有颜色 token：background `#F5F5F7`、surfaceContainer `#F7F7F9`、surfaceContainerHigh `#FAFAFC`、surfaceContainerHighest `#E8E8EC`、outline `#EEEEF2`、outlineVariant `#E1E1E7`、outlineFaint `#F3F3F6`；hero `#FBFBFD`／`#F8F8FB`／`#F5F5F7`，halo `#F0F0F5`。四段背景 `#F9F9FB`／`#FFFFFF`／`#F8F8FA`／`#F6F6F9`。
- [x] 运行定向测试，构建 Design 并在 Portal worktree 的独立 node_modules 中消费本地包；保留正式 manifest／lock。
- [x] 验证实际 Portal 消费者、类型与结构检查，运行库原有完整覆盖门禁。Design 完整 105 套／1239 项、四项覆盖率 100%；Portal 实际本地包完整 667 套／7803 项、原覆盖率门槛通过。类型、修改文件 Lint、Portal 结构、Design 构建及文档生成通过；未执行原生 App 构建、设备／业务验收及远端交付。
- [x] 审查差异只含颜色选择和必要关联；不执行提交、推送或发布。独立审查发现的订单分享图片旧底色已修复，页面和图片共用 `warmOrangePalette.resolve(scheme)`，对应两项回归先红后绿。
