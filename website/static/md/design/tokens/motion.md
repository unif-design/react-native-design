---
sidebar_position: 4
title: 动效
description: "Unif Design 的 motion 时长 token（fast/base/slow/pulse）与跨平台动效约定：native 使用 Reanimated，Web 使用 CSS/timer/RAF driver，复用 usePulse / Pulse / Reveal。值取自 src/theme/tokens.ts。"
---

# 动效

功能性、克制。仅 fade 与 layout animation。**无弹簧、无回弹、无入场缩放。** 尊重 reduced-motion。时长的真相源是 `src/theme/tokens.ts` 的 `motion`。

## 时长 / `motion` {#时长}

| Token | 值 | 用途 |
|---|---|---|
| `motion.fast` | 150ms | 按压态、hover |
| `motion.base` | 200ms | 分段控件、布局变化、Modal fade |
| `motion.slow` | 300ms | Drawer 过渡 |
| `motion.pulse` | 1600ms | "思考中" spark 脉冲全周期 |

`motion` 只有这四个时长键 —— **没有 easing token**。native Reanimated 动画通常使用
`withTiming` 默认曲线（Spinner 显式使用 `Easing.linear`）；Web driver 在各组件内声明
对应 CSS timing function。native-only 代码需要自定义缓动时从
`react-native-reanimated` import `Easing`，不要去找不存在的 `motion.easeOut`。

:::tip pulse 是全周期,usePulse 取半周期
`motion.pulse`(1600ms)是脉冲一来一回的**全周期**。`usePulse` / `<Pulse>` 的 `duration` 是**半周期**(一个方向),所以脉冲场景常传 `motion.pulse / 2`(800ms)。

`duration` 合法域 `[1, 2³¹)`、`delay` 合法域 `[0, 2³¹)`、`from` / `to` 合法域 `[0, 1]`。非法值**整体回退默认值 + dev warn**,不做 clamp 也不取整;`from === to` 为静态。详见 [Pulse → 参数校验规则](../../components/pulse.md#参数校验规则)。
:::

## Reduced motion / `usePrefersReducedMotion` {#reduced-motion}

`usePrefersReducedMotion(): boolean` 返回**真实的系统偏好**,两端语义一致:

| 平台 | 数据源 |
|---|---|
| native(iOS / Android) | Reanimated 的系统信号 `useReducedMotion()`,即系统「减弱动态效果 / Remove animations」开关 |
| web | `matchMedia('(prefers-reduced-motion: reduce)')`,开关变化时自动更新 |

:::danger 动画引擎不会替你处理
Reanimated 的 `ReduceMotion.System` **只覆盖它自己驱动的动画**(`withTiming` / `withSpring` / layout 装饰器)。组件自己用 `setInterval`、`requestAnimationFrame`、CSS transition、Modal 转场或 autoplay 做的动效完全不在其管辖范围内。

`Pulse` / `Switch` / `Carousel` / `Reveal` 等**必须显式分支到 `usePrefersReducedMotion()`**,不能假设动画引擎已经处理。开启后的正确行为是停在稳态终值(例如 Pulse 静止于 `to`、Carousel 停止 autoplay),而不是继续动或直接消失。
:::

```tsx
import { usePrefersReducedMotion } from '@unif/react-native-design';

function Blink() {
  const reduced = usePrefersReducedMotion();
  // reduced 为 true 时不启动任何 timer / 动画,直接渲染稳态
  return <Dot animated={!reduced} />;
}
```

## 按压态规则 {#按压态规则}

- **非品牌表面** —— 按压时 `opacity: 0.7`。
- **品牌 CTA** —— 按压时底色切到 `c.primaryPressed`(`#D06200`)。
- **禁用** —— 按钮整体 `opacity: 0.5`;送出键背景切到 `c.surfaceContainerHighest`(`#E0E0E0`)。

## 在代码中使用 {#在代码中使用}

共享代码不假设单一动画引擎。Design 组件先统一公共参数与 reduced-motion 语义，再在平台
driver 分流：

| 能力 | native | Web |
|---|---|---|
| Pulse / Skeleton | Reanimated 4 worklet | CSS opacity transition + `setInterval` 两档翻转 |
| Reveal | Reanimated `FadeIn` / `FadeOut` | 本地 `View` + CSS opacity transition + 双 RAF；卸载时不做退场 |
| Spinner | Reanimated 线性旋转 | 静态 CSS keyframes |
| Switch | Reanimated 颜色 / 位移插值 | CSS background / transform transition |

常用脉冲 / 渐入应复用 `usePulse` / `<Pulse>` / `<PulseDot>` / `<Reveal>`，不要在共享代码
里重写 native worklet 或 Web timer。native-only 场景仍可直接使用 Reanimated 4。

### 通用 fade-in

```tsx
import { Reveal, motion } from '@unif/react-native-design';

function FadeIn({ children }: { children: React.ReactNode }) {
  return <Reveal duration={motion.fast}>{children}</Reveal>;
}
```

### 脉冲(思考中 / shimmer / blink cursor 全走它) {#脉冲}

```tsx
import { Pulse, PulseDot, Icon, motion } from '@unif/react-native-design';

// 包裹任意 children
<Pulse from={0.4} duration={motion.pulse / 2}>
  <Icon name="spark" size={14} />
</Pulse>

// 圆点
<PulseDot />

```

需要组合自定义容器时可使用 `usePulse`；其返回值同样由平台 driver 提供。共享代码优先用
`<Pulse>`，完整签名与 Web 非 worklet 约束见 [Pulse 文档页](../../components/pulse.md)。

### 进出过渡(替代 LayoutAnimation) {#进出过渡}

```tsx
import { Reveal } from '@unif/react-native-design';

{open ? <Reveal>{/* children */}</Reveal> : null}
```

iOS Fabric 下不依赖 `LayoutAnimation`。共享代码使用 `<Reveal>`：native 解析为 Reanimated
`entering` / `exiting`，Web 解析为 CSS 入场并在卸载时直接移除。只有 native-only 代码
才直接使用 Reanimated decorator；文档站 MDX 不要直接用 `useAnimatedStyle`（见
[常见问题 → 文档站动画崩溃](../../troubleshooting.md#useanimatedstyle--layout-动画在文档站崩溃)）。
