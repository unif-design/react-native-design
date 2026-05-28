---
slug: /components
sidebar_position: 1
title: 组件概览
description: 组件全览 — 通用 / 表单 / 导航 / 反馈 / 数据展示
---

# 组件概览

按使用场景分组。所有组件均已在 RN 中实现。每个组件一个文件夹，导出统一通过 `@/components/ui` barrel。

> **聊天专属组件** 不在本表，请看 [Chat 概览](/docs/chat)。

## 品牌

| 组件 | 状态 | RN 路径 |
|---|---|---|
| [Logo](./logo.mdx) | ✓ | `src/components/ui/Logo/` |

## 通用

| 组件 | 状态 | RN 路径 |
|---|---|---|
| [Button](./button.mdx) | ✓ | `src/components/ui/Button/` |
| [Avatar](./avatar.mdx) | ✓ | `src/components/ui/Avatar/` |
| [Tag](./tag.mdx) | ✓ | `src/components/ui/Tag/` |
| [Chip](./chip.mdx) | ✓ | `src/components/ui/Chip/`（pill 圆角，可选中；Suggestion 底层） |
| [Loading](./loading.mdx) | ✓ | `src/components/ui/Spinner/` |
| [Pulse · PulseDot](./pulse.mdx) | ✓ | `src/components/ui/Pulse/`（reanimated 4 worklet 通用脉冲） |
| [StatusDot](./status-dot.mdx) | ✓ | `src/components/ui/StatusDot/`（done/active/pending 圆点） |

## 表单

| 组件 | 状态 | RN 路径 |
|---|---|---|
| [Input](./input.mdx) | ✓ | `src/components/ui/Input/` |
| [PasswordInput](./password-input.mdx) | ✓ | `src/components/ui/PasswordInput/`(Input + secureTextEntry + eye toggle,4 处 caller 复用) |
| [Search](./search.mdx) | ✓ | `src/components/ui/Search/` |
| [Checkbox](./checkbox.mdx) | ✓ | `src/components/ui/Checkbox/` |
| [Radio](./radio.mdx) | ✓ | `src/components/ui/Radio/` |
| [Switch](./switch.mdx) | ✓ | `src/components/ui/Switch/` |
| [Stepper](./stepper.mdx) | ✓ | `src/components/ui/Stepper/` |
| [Form](./form.mdx) | ✓ | `src/components/ui/Form/` |

## 导航

| 组件 | 状态 | RN 路径 |
|---|---|---|
| [NavBar](./navbar.mdx) | ✓ | `src/components/ui/NavBar/` |
| [TabBar](./tabbar.mdx) | ✓ | `src/components/ui/TabBar/` |
| [Tabs](./tabs.mdx) | ✓ | `src/components/ui/Tabs/`（页级下划线）+ `src/components/ui/Segmented/`（局部分段） |
| Drawer | ✓ | `src/components/ui/DrawerHeader/` + `@react-navigation/drawer` |

## 反馈

| 组件 | 状态 | RN 路径 |
|---|---|---|
| [Toast](./toast.mdx) | ✓ | `src/components/ui/Toast/`（`toast.ts` imperative + `ToastHost.tsx`） |
| [Confirm](./confirm.mdx) | ✓ | `src/components/ui/Confirm/`（`confirm()` imperative + `ConfirmHost.tsx`,高风险确认弹窗） |
| [Empty](./empty.mdx) | ✓ | `src/components/ui/Empty/` |
| [Skeleton](./skeleton.mdx) | ✓ | `src/components/ui/Skeleton/`（单一组件 + `shape='line'/'rect'/'circle'`，走 `usePulse`） |

## 数据展示

| 组件 | 状态 | RN 路径 |
|---|---|---|
| [Cell · List](./cell.mdx) | ✓ | `src/components/ui/Cell/` |
| [Card](./card.mdx) | ✓ | `src/components/ui/Card/`（default / plain；`flat` 已 deprecated 等价 `plain`） |
| [Grid](./grid.mdx) | ✓ | `src/components/ui/Grid/` |
| [Carousel](./carousel.mdx) | ✓ | `src/components/ui/Carousel/`（包装 reanimated-carousel v5 beta） |

## 反馈（弹层壳）

| 组件 | 状态 | RN 路径 |
|---|---|---|
| [BlurLayer](./blur-layer.mdx) | ✓ | `src/components/ui/BlurLayer/`(BlurView + tint 双层,intensity 'soft'(10) / 'strong'(40)) |
| BottomSheet | ✓ | `src/components/ui/BottomSheet/`（纯 layout 容器，配合 `presentation: 'transparentModal'` 路由屏） |

## 业务复合

业务复合组件在 `@/components/business`，封装了 navigation / 安全区 / 主题上下文，把屏级骨架收成一行声明：

| 组件 | 状态 | RN 路径 | 说明 |
|---|---|---|---|
| ScreenLayout | ✓ | `src/components/business/ScreenLayout/` | 二级屏布局（SafeAreaView + NavBar + 双色背景） |
| CellList | ✓ | `src/components/business/CellList/` | 数据驱动的 Cell 列表（items 数组） |
| AvatarWithRing | ✓ | `src/components/business/AvatarWithRing/` | 圆形头像 + ring + 品牌 shadow |
| GlassStats | ✓ | `src/components/business/GlassStats/` | 玻璃数据条（BlurView + N 列） |
| Decorations | ✓ | `src/components/business/Decorations/` | `GradientWash` 线性渐变 + `RadialHalo` 径向柔光 + `ScreenBackdrop` 整屏沉浸渐变(preset 暖橙 + 暗色自适配) |
| [Thumbnail](./thumbnail.mdx) | ✓ | `src/components/ui/Thumbnail/` | 列表 / 卡片 / chat 通用 16:9.5 缩略图(sm 64×40 / md 113×67 / lg 160×96)|
| ModernAppCell | ✓ | `src/components/business/ModernAppCell/` | 46×46 r13 应用图标 tile（IconName / imageUrl 双轨 · tint 透传 · badge） |
| SmsCodeInput | ✓ | `src/components/business/SmsCodeInput/` | Input + sendSms + isMobile 校验 + 60s 倒计时,3 处 caller 复用 |

> 横向小卡入口(Me 屏底部"设置 / 关于"双列)看 [EntryCard](./entry-card)（在 ui 层,不在 business）。

会话列表用 `<List>` + `<Cell variant="assistant" />` 直接渲染（icon 玻璃感 + 标题 + badge + 时间 + 预览全在 Cell.assistant 里），不再单独抽 `AssistantChatRow` 组件。

## 基础令牌

颜色 / 字体 / 间距 / 圆角 / 阴影 / 动效 / 图标 → [设计令牌](/docs/design/tokens/colors)
