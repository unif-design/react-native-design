---
slug: /components
sidebar_position: 1
title: 组件概览
description: '按场景查找组件、代码示例与 API。'
---

<!-- Generated from @unif/react-native-design@0.32.2; edit source documentation. -->

# 组件概览

按场景查找组件，进入对应页面查看示例、API 和注意事项。组件从 `@unif/react-native-design` 包根导入。

消息、聊天输入和附件展示见独立的 [Chat 库](https://github.com/unif-design/react-native-chat)。页面预览运行于 React Native Web，原生行为按各组件的平台说明验证。

## 品牌 {#品牌}

| 组件                                | 说明                                           |
| ----------------------------------- | ---------------------------------------------- |
| [Logo](logo.md)       | 品牌标识容器；图片 `source` 由消费端持有并必传 |
| [图标 Icon](icons.md) | 24×24 描边 SVG 目录,`<Icon name="..." />`      |

## 通用 {#通用}

| 组件                                         | 说明                                                                |
| -------------------------------------------- | ------------------------------------------------------------------- |
| [Button](button.md)            | 主操作按钮,7 variant × 3 size,可 block                              |
| [IconButton](icon-button.md)   | 纯图标按钮,`accessibilityLabel` 类型必填                            |
| [Avatar](avatar.md)            | circle/square monogram 头像,variant `brand`/`info`/`soft`/`neutral` |
| [AvatarGroup](avatar-group.md) | 重叠头像组,统一形态与尺寸,支持 `max` 溢出及可选 action              |
| [Tag](tag.md)                  | 状态徽章,5 语义 × 2 尺寸                                            |
| [Chip](chip.md)                | 胶囊形可选中 pill(Suggestion 底层)                                  |
| [Confirm](confirm.md)          | 命令式 `confirm()` + `<ConfirmHost />` 高风险二次确认               |
| [Thumbnail](thumbnail.md)      | 缩略图，支持尺寸档位、尺寸对象和失败占位                            |
| [Loading](loading.md)          | `Spinner` 未知时长加载；`CircularProgress` 确定进度与可选百分比     |
| [BorderBeam](border-beam.md)   | 沿内容边缘循环移动的装饰性流光，支持 native / Web 与减少动态效果    |
| [Pulse](pulse.md)              | `usePulse` + `<Pulse>` + `<PulseDot>`,通用脉冲底座                  |
| [Reveal](reveal.md)            | 淡入容器：native Reanimated 入/退场 / Web CSS 入场                  |
| [StatusDot](status-dot.md)     | `done`/`error`/`active`/`pending` 圆点,`flat`/`soft` 双 tone        |

## 表单 {#表单}

| 组件                                             | 说明                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------- |
| [Input](input.md)                  | 单行输入,idle / focus / filled / error                                           |
| [PasswordInput](password-input.md) | 密码输入与显示切换                                                               |
| [Textarea](textarea.md)            | 多行输入(复用 Input,顶对齐)                                                      |
| [TextField](text-field.md)         | 带 label / 校验的表单字段封装                                                    |
| [Search](search.md)                | 搜索条(Input 预设 + 清除按钮)                                                    |
| [Checkbox](checkbox.md)            | 复选                                                                             |
| [Radio](radio.md)                  | 单选 + RadioGroup                                                                |
| [Switch](switch.md)                | 开关：native Reanimated / Web CSS transition                                     |
| [Stepper](stepper.md)              | `[−] N [+]` 步进；`xs` 是横向触控 < 44pt 的紧凑档，支持 `formatValue` 文案格式化 |
| [Form](form.md)                    | Form / FormGroup / FormRow(行间 hairline)                                        |

## 导航 {#导航}

| 组件                                           | 说明                                                  |
| ---------------------------------------------- | ----------------------------------------------------- |
| [NavBar](navbar.md)              | 固定顶部头,44px,default / brand / transparent variant |
| [DrawerHeader](drawer-header.md) | 抽屉顶部品牌面板 + 图片头像失败回退                   |
| [TabBar](tabbar.md)              | 固定底部 tab,50px,带 badge                            |
| [Tabs](tabs.md)                  | 页级下划线 tabs(局部分段用 `Segmented`)               |

## 反馈 {#反馈}

| 组件                                         | 说明                                                   |
| -------------------------------------------- | ------------------------------------------------------ |
| [Toast](toast.md)              | 命令式 `toast()` + `<ToastHost />` 全局轻提示          |
| [Empty](empty.md)              | 空状态                                                 |
| [Skeleton](skeleton.md)        | 骨架占位,`shape='line'/'rect'/'circle'`(走 `usePulse`) |
| [CircularProgress](loading.md) | `0..1` 确定圆形进度，可选中央百分比文字                |
| [BorderBeam](border-beam.md)   | 图片处理等短时忙碌状态的边缘流光；业务语义由外层承载   |

## 数据展示 {#数据展示}

| 组件                                  | 说明                                                          |
| ------------------------------------- | ------------------------------------------------------------- |
| [Cell · List](cell.md)  | 列表行 + List 容器,grouped(白卡 + gap)/ flush(hairline)两模式 |
| [Card](card.md)         | 内容卡,`default` / `plain`(`flat` 已 deprecated 等价 `plain`) |
| [Ribbon](ribbon.md)     | 包裹内容的右上缎带,`brand`/`danger` 语义色与可选读屏文案      |
| [Grid](grid.md)         | 九宫格图标网格                                                |
| [Carousel](carousel.md) | 轮播(包装 reanimated-carousel v5)                             |

## 业务复合 {#业务复合}

`@unif/react-native-design` 暴露的通用组合组件；应用自行维护导航与业务状态:

| 组件                                                | 说明                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [AvatarWithRing](avatar-with-ring.md) | 圆形头像 + ring + 品牌 shadow                                                           |
| [GlassStats](glass-stats.md)          | 玻璃数据条(BlurView + N 列)                                                             |
| [Decorations](decorations.md)         | `GradientWash` + `RadialHalo` + `ScreenBackdrop`(整屏沉浸渐变,暖橙 preset + 暗色自适配) |
| [VersionPill](version-pill.md)        | 版本号药丸                                                                              |

## 其他 {#其他}

| 组件                                     | 说明                                                    |
| ---------------------------------------- | ------------------------------------------------------- |
| [BlurLayer](blur-layer.md) | BlurView + tint 双层,intensity `soft`(10)/ `strong`(40) |
| [EntryCard](entry-card.md) | 横向小卡入口(Me 屏"设置 / 关于"双列)                    |

## 基础令牌 {#基础令牌}

颜色 / 字体 / 间距 / 圆角 / 阴影 / 动效 / 图标 → [设计令牌](../design/tokens/colors.md)。
