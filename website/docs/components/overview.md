---
slug: /components
sidebar_position: 1
title: 组件概览
description: "@unif/react-native-design 组件索引（40+ 组件，按场景分组：品牌 / 通用 / 表单 / 导航 / 反馈 / 数据展示 / 业务复合）。每个组件一页，逐组件 API 见各页与远程 llms.txt。"
---

# 组件概览

按使用场景分组的组件索引。所有组件都从**包根 barrel** 导出 —— `import { Button, Cell, useColors } from '@unif/react-native-design'`,**不要深路径**。每个组件一个独立文档页(Props 表 + Tokens 表 + 可交互 `<LiveDemo>`),点名称进入。

:::info 逐组件 API 在各组件页
本页只做索引,不镜像每个组件的完整 API。点进各组件页查 Props / variant / size;AI 可按需 fetch 远程 [llms.txt](https://unif-design.github.io/react-native-design/llms.txt) / 单组件 `md/components/<name>.md`。
:::

> 聊天专属组件(Message / PromptInput / Suggestion / Reasoning 等)在 portal 仓库文档站维护,不在本表。其总纲见[完整规范 → Component library](/docs/unif-design)。

## 品牌 {#品牌}

| 组件 | 说明 |
|---|---|
| [Logo](/docs/components/logo) | 品牌标识(`<Image>` 包装 `assets/logo.png`) |
| [图标 Icon](/docs/components/icons) | 24×24 描边 SVG 目录,`<Icon name="..." />` |

## 通用 {#通用}

| 组件 | 说明 |
|---|---|
| [Button](/docs/components/button) | 主操作按钮,6 variant × 3 size,可 block |
| [IconButton](/docs/components/icon-button) | 纯图标按钮,`accessibilityLabel` 类型必填 |
| [Avatar](/docs/components/avatar) | 单字符 monogram 头像,variant `brand`/`info`/`soft`/`neutral` |
| [Tag](/docs/components/tag) | 状态徽章,5 语义 × 2 尺寸 |
| [Chip](/docs/components/chip) | 胶囊形可选中 pill(Suggestion 底层) |
| [Thumbnail](/docs/components/thumbnail) | 16:9.5 缩略图,sm / md / lg 三档 |
| [Loading](/docs/components/loading) | `Spinner`(reanimated 4 旋转)+ 线性进度 |
| [Pulse](/docs/components/pulse) | `usePulse` + `<Pulse>` + `<PulseDot>`,通用脉冲底座 |
| [StatusDot](/docs/components/status-dot) | `done`/`active`/`pending` 圆点,`flat`/`soft` 双 tone |

## 表单 {#表单}

| 组件 | 说明 |
|---|---|
| [Input](/docs/components/input) | 单行输入,idle / focus / filled / error |
| [PasswordInput](/docs/components/password-input) | Input + secureTextEntry + 明文切换 |
| [Textarea](/docs/components/textarea) | 多行输入(复用 Input,顶对齐) |
| [TextField](/docs/components/text-field) | 带 label / 校验的表单字段封装 |
| [Search](/docs/components/search) | 搜索条(Input 预设 + 清除按钮) |
| [Checkbox](/docs/components/checkbox) | 复选 |
| [Radio](/docs/components/radio) | 单选 + RadioGroup |
| [Switch](/docs/components/switch) | 开关(reanimated 4 worklet) |
| [Stepper](/docs/components/stepper) | `[−] N [+]` 步进 |
| [Form](/docs/components/form) | Form / FormGroup / FormRow(行间 hairline) |

## 导航 {#导航}

| 组件 | 说明 |
|---|---|
| [NavBar](/docs/components/navbar) | 固定顶部头,44px,default / brand variant |
| [TabBar](/docs/components/tabbar) | 固定底部 tab,50px,带 badge |
| [Tabs](/docs/components/tabs) | 页级下划线 tabs(局部分段用 `Segmented`) |

> Drawer 用 `DrawerHeader` + `@react-navigation/drawer` 组合,无独立组件页。

## 反馈 {#反馈}

| 组件 | 说明 |
|---|---|
| [Toast](/docs/components/toast) | 命令式 `toast()` + `<ToastHost />` 全局轻提示 |
| [Confirm](/docs/components/confirm) | 命令式 `confirm()` + `<ConfirmHost />` 高风险二次确认 |
| [Empty](/docs/components/empty) | 空状态 |
| [Skeleton](/docs/components/skeleton) | 骨架占位,`shape='line'/'rect'/'circle'`(走 `usePulse`) |

## 数据展示 {#数据展示}

| 组件 | 说明 |
|---|---|
| [Cell · List](/docs/components/cell) | 列表行 + List 容器,grouped(白卡 + gap)/ flush(hairline)两模式 |
| [Card](/docs/components/card) | 内容卡,`default` / `plain`(`flat` 已 deprecated 等价 `plain`) |
| [Grid](/docs/components/grid) | 九宫格图标网格 |
| [Carousel](/docs/components/carousel) | 轮播(包装 reanimated-carousel v5) |

## 业务复合 {#业务复合}

`@unif/react-native-design` 暴露的通用业务复合组件(耦合 navigation / store 的留在消费者仓库):

| 组件 | 说明 |
|---|---|
| [AvatarWithRing](/docs/components/avatar-with-ring) | 圆形头像 + ring + 品牌 shadow |
| [GlassStats](/docs/components/glass-stats) | 玻璃数据条(BlurView + N 列) |
| [Decorations](/docs/components/decorations) | `GradientWash` + `RadialHalo` + `ScreenBackdrop`(整屏沉浸渐变,暖橙 preset + 暗色自适配) |
| [VersionPill](/docs/components/version-pill) | 版本号药丸 |

## 其他 {#其他}

| 组件 | 说明 |
|---|---|
| [BlurLayer](/docs/components/blur-layer) | BlurView + tint 双层,intensity `soft`(10)/ `strong`(40) |
| [EntryCard](/docs/components/entry-card) | 横向小卡入口(Me 屏"设置 / 关于"双列) |

> BottomSheet 是纯 layout 容器,配合路由 `presentation: 'transparentModal'` 使用,无独立组件页。

## 基础令牌 {#基础令牌}

颜色 / 字体 / 间距 / 圆角 / 阴影 / 动效 / 图标 → [设计令牌](/docs/design/tokens/colors)。

## 组件页统一结构 {#组件页统一结构}

每个组件文档页遵循:

1. **LiveDemo 预览** —— 可交互的实时演示(`<LiveDemo>`)。
2. **Props 表** —— 完整 API 参数(prop · 类型 · 默认 · 说明)。
3. **Tokens 表** —— 该组件实际读取的设计令牌:

| Token | 来源 | 作用 |
|---|---|---|
| `c.primary` | `useColors()` | 主按钮背景色 |
| `radius.md` | `@unif/react-native-design` | 中等圆角 |
| `s.brandLg` | `useThemedStyles` 第二参 | 品牌卡片阴影 |

**Token 来源说明:**

- `useColors()` —— 运行期主题色,随亮 / 暗自动切换(`ColorTokens`)。
- `space.*` / `radius.*` / `type.*` / `fw.*` —— 静态 token,直接 import。
- shadow 参数(`s.*`)—— `useThemedStyles((c, s) => ...)` 第二参,暗色下大多数趋零。

参考实现:[Button](/docs/components/button) 与 [Cell · List](/docs/components/cell)。
