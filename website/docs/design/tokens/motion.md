---
sidebar_position: 4
title: 动效
description: 时长、缓动函数、特定动效
---

# 动效

功能性、克制。仅 fade 与 layout animation。**无弹簧、无回弹、无入场缩放。** 尊重 reduced-motion。

## 时长

| Token | 值 | 用途 |
|---|---|---|
| `fast` | 150ms | 按压态、hover |
| `base` | 200ms | 分段控件、布局变化、Modal fade |
| `slow` | 300ms | Drawer 过渡 |
| `pulse` | 1600ms | "思考中" spark 脉冲全周期（Reasoning 用 `motion.pulse / 2` 作 `usePulse` 的 `duration` 半周期） |

## 缓动函数

| Name | 值 |
|---|---|
| `ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |

## 按压态规则

- 非品牌表面：按压时 `opacity: 0.7`
- 品牌 CTA：按压时变为 `primary-500` 或 `primary-600`
- 禁用：按钮整体 `opacity: 0.5`，或发送键背景变为 `bg-pill (#E0E0E0)`

## 在代码中使用

整套设计系统的动画走 `react-native-reanimated@4` —— worklet 在 UI 线程跑，**不要再写 `Animated.loop` / `useNativeDriver`**。常用脉冲 / 渐变请直接复用 `usePulse` / `<Pulse>` / `<PulseDot>`。

### 通用 fade-in

```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '@unif/react-native-design';

function FadeIn({ children }) {
  const op = useSharedValue(0);
  React.useEffect(() => {
    op.value = withTiming(1, { duration: motion.fast });
  }, [op]);
  const style = useAnimatedStyle(() => ({ opacity: op.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
```

### 脉冲（思考中 / shimmer / blink cursor 全部走这个）

```tsx
import { Pulse, PulseDot, usePulse } from '@unif/react-native-design';
import { motion } from '@unif/react-native-design';

// 包裹任意 children
<Pulse from={0.4} duration={motion.pulse / 2}>
  <Icon name="spark" size={14} />
</Pulse>

// 圆点
<PulseDot />

// hook + 自定义 view
const animatedStyle = usePulse({ from: 0.5, duration: 700 });
<Animated.View style={[base, animatedStyle]} />
```

更多用法请看 [Pulse 文档页](/docs/components/pulse)。

### 进出过渡（替代 LayoutAnimation）

```tsx
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { motion } from '@unif/react-native-design';

{open ? (
  <Animated.View entering={FadeIn.duration(motion.base)} exiting={FadeOut.duration(motion.base)}>
    {children}
  </Animated.View>
) : null}
```

iOS Fabric 下 `LayoutAnimation` 行为不稳定，统一改走 reanimated 的 `entering` / `exiting` 装饰器（`Reasoning` 折叠就是这么做的）。
