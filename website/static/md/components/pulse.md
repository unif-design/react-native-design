---
sidebar_position: 5
title: Pulse · PulseDot · usePulse
description: '为内容或状态圆点提供脉冲动效。'
---

<!-- Generated from @unif/react-native-design@0.32.0; edit source documentation. -->

# Pulse · PulseDot · usePulse

通用脉冲原语：`shared/pulse` 内部统一完成参数归一化与平台驱动；Pulse、PulseDot、Skeleton 分别提供自己的默认值和诊断入口，公共 usePulse 接口保持不变。native 使用 `react-native-reanimated@4` worklet，Web 使用 CSS transition + timer。三个 API：

- **`usePulse(options)`** — 钩子，返回可直接拼到 `Animated.View` 上的 style
- **`<Pulse>{children}</Pulse>`** — 把 children 包进一个 opacity 循环动画
- **`<PulseDot />`** — 一个固定的圆点（默认 6×6 主橙），用于"思考中"等指示器

## 代码演示 {#实时预览}

下方渲染的是 `PulseDot.tsx` 与 `Pulse.tsx` 的 Web 路径：公共 hook 仍执行同一套归一化，平台解析选择 `usePulseDriver.web.ts`，由 CSS transition + timer 驱动；参数和 reduced-motion 语义与 native 一致。

```tsx
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">PulseDot · 默认 6×6 主橙</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PulseDot />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">PulseDot · 自定义 size / color</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PulseDot size={6} />
        <PulseDot size={10} color="#3775F6" />
        <PulseDot size={14} color="#52C41A" />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">PulseDot · delay 错峰（打字中三连点）</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PulseDot delay={0} />
        <PulseDot delay={200} />
        <PulseDot delay={400} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">{'<Pulse>'} 包装 · spark 图标</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Pulse from={0.4} duration={500}>
          <Icon name="spark" size={20} color="#EB6E00" />
        </Pulse>
        <Pulse from={0.3} duration={800}>
          <Icon name="thinking" size={20} color="#3775F6" />
        </Pulse>
      </div>
    </div>
  </div>
```

## 用法

### `usePulse` hook

```tsx
import Animated from 'react-native-reanimated';
import { usePulse } from '@unif/react-native-design';

export function MyShimmerLine({ width }) {
  const animatedStyle = usePulse({ from: 0.6, to: 1, duration: 700 });
  return (
    <Animated.View
      style={[
        { width, height: 11, borderRadius: 3, backgroundColor: '#EDEDED' },
        animatedStyle,
      ]}
    />
  );
}
```

### `<Pulse>` 包装组件

```tsx
import { Pulse, Icon } from '@unif/react-native-design';

<Pulse from={0.4} duration={500}>
  <Icon name="spark" size={14} color="#EB6E00" />
</Pulse>;
```

### `<PulseDot>`

```tsx
import { PulseDot } from '@unif/react-native-design';

<PulseDot />                                  // 默认 6×6 主橙
<PulseDot size={10} color="#3775F6" />        // 自定义
<PulseDot delay={200} />                      // 错峰开始（多个排成一行做"打字中"）
```

## API

### `usePulse(options?)`

| Option     | 类型     | 默认值 | 合法域     | 说明                                        |
| ---------- | -------- | ------ | ---------- | ------------------------------------------- |
| `from`     | `number` | `0.6`  | `[0, 1]`   | 透明度起点（不必小于 `to`）                 |
| `to`       | `number` | `1`    | `[0, 1]`   | 透明度终点                                  |
| `duration` | `number` | `700`  | `[1, 2³¹)` | 半周期时长（ms），完整一圈 = `2 × duration` |
| `delay`    | `number` | `0`    | `[0, 2³¹)` | 首次开始之前的延迟（ms）                    |

返回可直接传给 `Animated.View` 的 `style`。

#### 参数校验规则 {#参数校验规则}

四个参数都由**唯一一层归一化**处理（native 与 web 共用），规则是**非法字段回退到所属组件默认值，不做 clamp、不做取整**：

- 超出合法域、`NaN`、`Infinity` 或非 `number` → **整个字段回退到默认值**，并在 `__DEV__` 下打一条 warn 说明收到了什么、回退成了什么。
- 合法值**原样保留** —— `duration: 700.5` 不会被取整,`duration: 0` 也不会被悄悄夹成 `1`（那样调用方永远发现不了自己传错了）。
- `duration` / `delay` 上界是开区间 `2³¹`：`setTimeout` / `setInterval` 内部用 int32 存时长，`>= 2³¹` 会溢出成 `0` 变成「每帧触发」。

#### 反向脉冲与静态 {#反向脉冲与静态}

- `from > to` 是**合法**的反向脉冲，两个值原样保留。
- `from === to` 视为**静态**：不启动任何 timer / 动画，直接停在 `to`。
- 系统开启**减弱动态效果**时同样不启动动画，静止在 `to`（完全显示）。native 读系统设置、web 读 `matchMedia`，详见[动效 → Reduced motion](../design/tokens/motion.md#reduced-motion)。

:::info web 端不跑 worklet
native 走 Reanimated 4 worklet（UI 线程）；**web 走 CSS transition + `setInterval` 两档翻转**（零 rAF JS 帧），不是 worklet。两端的参数语义、静态判定和 reduced-motion 行为完全一致 —— 差异只在动画驱动层（`usePulseDriver.ts` / `usePulseDriver.web.ts`）。
:::

### `<Pulse>`

接受 `usePulse` 全部 options（`from` / `to` / `duration` / `delay`）+ `children` + 可选 `testID`。把 children 渲在一个 `<Animated.View>` 里，opacity 走脉冲循环。

### `<PulseDot>`

| 参数                                 | 类型      | 默认值                                   | 说明                                                                                                                 |
| ------------------------------------ | --------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `size`                               | `number?` | `6`                                      | 圆点直径（px）                                                                                                       |
| `color`                              | `string?` | `c.primary`（运行期 hook 取）            | 填充色                                                                                                               |
| `from` / `to` / `duration` / `delay` | `number?` | from=0.5 / to=1 / duration=700 / delay=0 | 与 `usePulse` 同一套[校验规则](#参数校验规则)（注意 `PulseDot` 的 `from` 默认 0.5，`usePulse` / `<Pulse>` 默认 0.6） |
| `testID`                             | `string?` | —                                        | E2E / 测试定位                                                                                                       |

## 无障碍（a11y）

来源：`src/components/ui/Pulse/PulseDot.tsx`、`Pulse.tsx`、`usePulse.ts`。

纯视觉脉冲原语，三个 API 均无交互、无 `accessibilityRole`：

- `<PulseDot>` 源码在其 `<Animated.View>` 上显式设 `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`，对 SR **完全隐藏**（圆点是装饰性指示器，无朗读价值）。
- `<Pulse>` 是透明包装层（仅给 children 套一个 opacity 循环的 `<Animated.View>`），自身**未设置任何 a11y prop**，a11y 语义完全由其 `children` 承载——把语义放在被包裹的内容上（如有意义的图标加 `accessibilityLabel`）。
- `usePulse` 只返回动画 `style`，不涉及 a11y。

## 组合使用 {#内部使用}

[Skeleton](skeleton.md) 与 Pulse 复用基础动效。应用也可将公开的 `Pulse`／`PulseDot` 组合到自己的内容中；状态语义由外层文字与无障碍属性表达。

## 使用注意

- 需要脉冲时使用 `usePulse`，复用参数校验、系统动效偏好和资源释放，避免在消费方重复实现。
- ❌ 不要在 `useAnimatedStyle` 里引用 React state（worklet 闭包只能读 SharedValue）。
- options 对象可以内联：归一化按 `from`/`to`/`duration`/`delay` 的实际值缓存，不因对象引用变化重启动效。
- ❌ 不要指望库会替你把非法值夹到合法域 —— 非法字段回退到默认值并 dev warn，不做 clamp。
- ❌ 不要假设 web 端跑的是 worklet —— web 是 CSS transition + `setInterval`。
