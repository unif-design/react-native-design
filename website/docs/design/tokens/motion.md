---
sidebar_position: 4
title: 动效
description: "Unif Design 的 motion 时长 token（fast/base/slow/pulse）与动效约定：仅 fade + layout，走 reanimated 4 worklet，复用 usePulse / Pulse / Reveal。值取自 src/theme/tokens.ts。"
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

`motion` 只有这四个时长键 —— **没有 easing token**。缓动曲线由 reanimated 的 `withTiming` 默认曲线承担(Spinner 旋转显式用 `Easing.linear`),需要自定义缓动时从 `react-native-reanimated` import `Easing`,不要去找不存在的 `motion.easeOut`。

:::tip pulse 是全周期,usePulse 取半周期
`motion.pulse`(1600ms)是脉冲一来一回的**全周期**。`usePulse` / `<Pulse>` 的 `duration` 是**半周期**(一个方向),所以脉冲场景常传 `motion.pulse / 2`(800ms)。
:::

## 按压态规则 {#按压态规则}

- **非品牌表面** —— 按压时 `opacity: 0.7`。
- **品牌 CTA** —— 按压时底色切到 `c.primaryPressed`(`#D06200`)。
- **禁用** —— 按钮整体 `opacity: 0.5`;送出键背景切到 `c.surfaceContainerHighest`(`#E0E0E0`)。

## 在代码中使用 {#在代码中使用}

整套动画走 `react-native-reanimated@4` —— worklet 在 UI 线程跑,**不要再写 `Animated.loop` / `useNativeDriver`**。常用脉冲 / 渐入请直接复用 `usePulse` / `<Pulse>` / `<PulseDot>` / `<Reveal>`,别自己重写。

### 通用 fade-in

```tsx
import React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '@unif/react-native-design';

function FadeIn({ children }: { children: React.ReactNode }) {
  const op = useSharedValue(0);
  React.useEffect(() => {
    op.value = withTiming(1, { duration: motion.fast });
  }, [op]);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
```

### 脉冲(思考中 / shimmer / blink cursor 全走它) {#脉冲}

```tsx
import { Pulse, PulseDot, usePulse, Icon, motion } from '@unif/react-native-design';
import Animated from 'react-native-reanimated';

// 包裹任意 children
<Pulse from={0.4} duration={motion.pulse / 2}>
  <Icon name="spark" size={14} />
</Pulse>

// 圆点
<PulseDot />

// hook + 自定义 view
function Custom() {
  const animatedStyle = usePulse({ from: 0.5, duration: 700 });
  return <Animated.View style={[/* base */, animatedStyle]} />;
}
```

更多用法见 [Pulse 文档页](/docs/components/pulse)。

### 进出过渡(替代 LayoutAnimation) {#进出过渡}

```tsx
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { motion } from '@unif/react-native-design';

{open ? (
  <Animated.View
    entering={FadeIn.duration(motion.base)}
    exiting={FadeOut.duration(motion.base)}
  >
    {/* children */}
  </Animated.View>
) : null}
```

iOS Fabric 下 `LayoutAnimation` 行为不稳定,统一改走 reanimated 的 `entering` / `exiting` 装饰器。design 包内的脉冲 / 渐入(含 `Reveal`)已收口 web 特化实现,在文档站 MDX 里不要直接用 `useAnimatedStyle`(见[常见问题 → 文档站动画崩溃](/docs/troubleshooting#useanimatedstyle--layout-动画在文档站崩溃))。
