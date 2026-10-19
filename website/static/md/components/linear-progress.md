---
title: LinearProgress 横向进度
description: 根据真实加载比例展示一条轻量进度线。
---

<!-- Generated from @unif/react-native-design; edit source documentation. -->

# LinearProgress 横向进度

用于页面加载等已知比例的过程。默认使用 2pt 高度与主题主色，明暗主题自动切换。

```tsx
  <LinearProgressDemo />
```

按钮只切换演示数值。真实接入传入加载方报告的 `0..1` 比例；组件直接展示当前值，不产生计时进度、不请求数据，也不会在 100% 时自行隐藏。

## 用法

```tsx
import { LinearProgress } from '@unif/react-native-design';

{
  loading && (
    <LinearProgress value={progress} accessibilityLabel="网页加载进度" />
  );
}
```

调用方决定放在导航栏下方或其他位置，并处理开始、完成、失败与重试。默认铺满纵向容器的可用宽度；横向容器中通过 `style` 指定宽度或 flex。页面加载时可以用绝对定位覆盖内容上沿，避免显示隐藏时挤动页面。组件不接收点击事件。

## API

| 参数                 | 类型                   | 默认值                  | 说明                                                |
| -------------------- | ---------------------- | ----------------------- | --------------------------------------------------- |
| `value`              | `number`               | 必填                    | 真实 `0..1` 比例；越界收敛到边界，非有限值按 0 处理 |
| `thickness`          | `number`               | `2`                     | 高度；非有限或非正数按 2 处理                       |
| `color`              | `string`               | 主题 `primary`          | 已完成部分颜色                                      |
| `trackColor`         | `string`               | 主题 `surfaceContainer` | 轨道颜色                                            |
| `accessibilityLabel` | `string`               | `进度`                  | 读屏名称                                            |
| `style`              | `StyleProp<ViewStyle>` | —                       | 外层布局样式                                        |
| `testID`             | `string`               | —                       | 测试定位                                            |

## 无障碍与平台

iOS、Android 与 Web 使用同一基础 View 实现，无新增原生依赖。外层提供 `progressbar`、0～100 的取整百分比与文字值，内部装饰对读屏隐藏。没有自动动画，系统减少动态效果时仍直接显示真实值。

只知道“仍在加载”但没有比例时使用 [Spinner](loading.md)，不要制造进度。100% 仅表示输入比例，不代表业务成功。

源码与公开类型：`src/components/ui/LinearProgress/`。
