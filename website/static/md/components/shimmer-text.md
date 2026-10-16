---
sidebar_position: 6
title: ShimmerText 文字扫光
description: '保留原文字样式，以每四秒一次的白色扫光提示持续活动。'
---

<!-- Generated from @unif/react-native-design; edit source documentation. -->

# ShimmerText 文字扫光

为已知仍在进行的活动提供轻量文字提示。白光每四秒从文字开头扫到结尾，扫过后恢复原来的文字颜色；文案和活动是否结束由调用方提供。

## 代码演示 {#实时预览}

两处文字都使用真实的 `ShimmerText`。可以停用扫光或替换第一行文案，较长的中文在可用宽度内换行。页面明暗主题会同步到预览。

```tsx
  <ShimmerTextDemo />
```

## 用法

```tsx
import { ShimmerText } from '@unif/react-native-design';

<ShimmerText active={running} style={styles.status}>
  {statusText}
</ShimmerText>;
```

`children` 接收字符串，`active` 默认启用。`style`、`numberOfLines`、`allowFontScaling` 和可访问属性沿 React Native `Text` 的使用方式传入。已有文字样式直接复用；应用字号可由 `useThemedStyles` 等现有出口计算一次，组件不再次缩放，系统字号仍按 `Text` 的设置处理。

## 动效与状态

每个周期为 4000 毫秒，前 1240 毫秒从首字到尾字依次扫过，再恢复 `style.color` 指定的原色；其余时间保持原色。通常向白色高亮，原色已经为白色时改用灰色波纹以保留可见差异。未指定颜色时使用当前主题的文字颜色。

停用 `active`、系统开启减少动态效果或文案为空时呈现静态文字。平台动态色等不能用于颜色插值的输入也保持静态显示。替换文字会结束旧文案的动画并从新文案开始；卸载后释放本实例的动画资源。

组件只负责视觉，不推断进度、不发出任务完成回调。屏幕阅读器读取完整文字，不逐字重复朗读；忙碌区域和额外说明由调用方按真实状态提供。

## API

公开类型以源码中的 [`ShimmerTextProps`](https://github.com/unif-design/react-native-design/blob/main/src/components/ui/ShimmerText/types.ts) 为准，从包根入口导入。

```tsx
import type { ShimmerTextProps } from '@unif/react-native-design';
```

短文、长中文、主题与字号需要在实际使用的平台核对；Web 预览只说明浏览器中的表现。
