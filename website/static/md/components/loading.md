---
sidebar_position: 4
title: Loading 加载
description: "旋转加载指示器 Spinner —— outer 承载 caller layout/transform，inner 固定视觉环独立旋转；900ms 线性一圈，native 走 reanimated 4、Web 走静态 CSS keyframes。"
---

# Loading 加载

旋转加载指示器。`size` 调直径（默认 18，`< 8` 会被钳到 8），`thickness` 调描边粗细（默认 2），`color` 默认主橙 `c.primary`。

## 实时预览

下方使用公共 `<Spinner>` API；本页由 `Spinner.web.tsx` 的静态 CSS keyframes 驱动，native 则由 `Spinner.tsx` 的 Reanimated worklet 驱动。

```tsx
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">尺寸</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Spinner size={14} />
        <Spinner size={18} />
        <Spinner size={24} />
        <Spinner size={32} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">颜色</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Spinner color="#EB6E00" />
        <Spinner color="#52C41A" />
        <Spinner color="#3775F6" />
        <Spinner color="#999" />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">thickness · 描边粗细</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Spinner thickness={1} />
        <Spinner thickness={2} />
        <Spinner thickness={3} />
      </div>
    </div>
  </div>
```

## 用法

```tsx
import { Spinner } from '@unif/react-native-design';
import { useColors } from '@unif/react-native-design';

function Demo() {
  const c = useColors();
  return (
    <>
      <Spinner />                                       {/* 默认 18px 主橙 */}
      <Spinner size={24} />                             {/* 24px */}
      <Spinner color={c.success} />                     {/* 绿色 */}
      <Spinner color={c.foregroundSubtle} thickness={1.5} />  {/* 细线灰 */}
      <Spinner
        size={24}
        style={{ width: 72, height: 48, transform: [{ scale: 1.2 }] }}
      /> {/* outer 可扩容/变换，24pt ring 仍居中旋转 */}
    </>
  );
}
```

## API

| Prop | Type | 默认 | 说明 |
|---|---|---|---|
| `size` | `number?` | `18` | 直径（含 stroke）；非有限或 `< 8` 钳到 8（打 warn） |
| `color` | `string?` | `c.primary`（运行期 hook 取） | 旋转弧颜色（轨道色固定 `c.outline`） |
| `thickness` | `number?` | `2` | 描边粗细；`≤ 0` fallback 到 2 |
| `style` | `StyleProp<ViewStyle>?` | — | outer layout 样式；可扩容并使用 margin/flex/position/transform，不能改变 inner ring 居中 |
| `testID` | `string?` | — | E2E / 测试定位 |

## 无障碍（a11y）

来源：`src/components/ui/Spinner/Spinner.tsx`、`Spinner.web.tsx`、`types.ts`。

Spinner 是纯视觉旋转指示器，**源码刻意把自己对 SR 隐藏**：两端 outer View 统一展开完整隐藏属性（`accessible={false}`、`accessibilityElementsHidden`、`importantForAccessibility="no-hide-descendants"`、`aria-hidden`）。它**不**设 `accessibilityRole='progressbar'`、也不设 `accessibilityState={{ busy }}` 或 `accessibilityLabel`。

因此「正在加载」的语义必须由**外部上下文**声明 —— 例如在包裹容器上设 `accessibilityState={{ busy: true }}`、或用一段状态文案（如 `<Text>加载中…</Text>` / live region）告知 SR；不要指望 Spinner 自身朗读。组件本身无可配置的 a11y prop（仅 `size` / `color` / `thickness` / `style` / `testID`）。

## 节奏

900ms 一圈，线性 easing，不要回弹。这是设计令牌 [`motion`](../design/tokens/motion.md) 之外的特例——加载体感需要稳定均匀。

## 两层容器语义

native 与 Web 都固定为 outer layout View + inner visual ring：

- outer 先提供 `safeSize × safeSize` 默认尺寸，再应用 caller `style`，最后强制 `alignItems / justifyContent: center`；它独占 `testID`、完整 a11y 隐藏和 caller transform。
- inner 始终保持 `safeSize × safeSize`，只承载 ring 与 rotate。native 的 Reanimated transform、Web 的 CSS animation ref 都只落到 inner。
- caller 可把 outer 扩到更大，也可添加 scale / translate；这些 transform 不会被旋转覆盖。caller 的 `alignItems / justifyContent` 不能把 ring 推离中心。
- Web `@keyframes` 内容是静态常量，不拼接 size、color、thickness 或其他 props。

Spinner 属于 essential motion；系统开启 reduced motion 时仍保持匀速旋转，加载状态的非动画语义仍应由外部状态文案或 `busy` 容器提供。

## 人工验收状态

runtime harness 已提供扩大 outer、caller scale/translate、恶意 align/justify 与 inner rotate 的组合检查。真实 native / Web Inspector 尚未执行，因此当前仍为 **BLOCKED**。
