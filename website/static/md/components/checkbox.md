---
sidebar_position: 3
title: Checkbox 复选框
description: "受控多选框 —— 20×20 盒子，square / circle 两种形状；可见 label 或显式 accessibilityLabel 必须至少提供一个。"
---

# Checkbox 复选框

受控多选控件——20×20 盒子，未选透明描边、已选主橙实心 + 白勾、禁用半透明。`shape='circle'` 切圆形,用于需要强调的必勾项(如协议同意)。

## 实时预览

下方渲染的就是 `src/components/ui/Checkbox/Checkbox.tsx` 本体，通过 `react-native-web` 翻译成浏览器节点。

```tsx
const CheckboxDemo = () => {
  const [agree, setAgree] = useState(false);
  const [skus, setSkus] = useState({ a: true, b: true, c: false, d: false });
  const toggle = (id) => setSkus((p) => ({ ...p, [id]: !p[id] }));
  const picked = Object.values(skus).filter(Boolean).length;
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="demo-label">单个</span>
          <Checkbox checked={agree} onChange={setAgree} label="同意接收提醒" />
          <Checkbox checked={true} onChange={() => {}} label="禁用 · 已选" disabled />
          <Checkbox checked={false} onChange={() => {}} label="禁用 · 未选" disabled />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="demo-label">多项 · 选客户</span>
          <Checkbox checked={skus.a} onChange={() => toggle('a')} label="东方便利店" />
          <Checkbox checked={skus.b} onChange={() => toggle('b')} label="明珠超市" />
          <Checkbox checked={skus.c} onChange={() => toggle('c')} label="优家便利" />
          <Checkbox checked={skus.d} onChange={() => toggle('d')} label="悦家" />
          <span style={{ fontSize: 13, color: 'var(--ifm-color-emphasis-600)', marginTop: 6 }}>已选：{picked} / 4</span>
        </div>
      </div>
    </>
  );
};
```

## 状态

| 状态 | 视觉 |
|---|---|
| 未选 | 20×20 盒子,1.5px 描边 `c.outline`,透明背景 |
| 已选 | 20×20 `c.primary` 背景 + `c.onPrimary` 白勾(check,strokeWidth 3.5) |
| 禁用 | `opacity: 0.5` |

## 用法

```tsx
import { Checkbox } from '@unif/react-native-design';

<Checkbox checked={agree} onChange={setAgree} label="同意服务条款" />

{/* 无可见旁标时显式命名 */}
<Checkbox
  checked={selected}
  onChange={setSelected}
  accessibilityLabel="选择全部客户"
/>

{/* 多项选择 */}
{customers.map(c => (
  <Checkbox
    key={c.id}
    checked={picked.includes(c.id)}
    onChange={() => togglePick(c.id)}
    label={c.name}
  />
))}
```

## API

| Prop | Type | 默认 | 说明 |
|---|---|---|---|
| `checked` | `boolean` | — | 当前是否选中(受控) |
| `onChange` | `(checked: boolean) => void` | — | 状态变更回调,传入新的 `checked` 值 |
| `label` | `string` | 与 `accessibilityLabel` 二选一 | 可见旁标，同时作为默认 accessible name |
| `accessibilityLabel` | `string` | 与 `label` 二选一 | 无可见旁标时必填；有 `label` 时可覆盖读屏文案 |
| `shape` | `'square' \| 'circle'` | `'square'` | 形状;`'circle'` 用于强调的必勾项(如协议同意) |
| `disabled` | `boolean` | `false` | 禁用时移除 handler、上报 disabled 并半透明 |
| `testID` | `string` | — | E2E / 测试定位 |

`CheckboxProps` 是 named union：`label: string` 分支可选
`accessibilityLabel`；不渲染 `label` 的分支必须提供
`accessibilityLabel: string`。不存在“只画方框但没有 accessible name”的合法调用。

## 主题键（Tokens）

| Token | 来源 | 作用 |
|---|---|---|
| `c.outline` | `useColors()` | 未选盒子描边色 |
| `c.primary` | `useColors()` | 已选盒子填充 + 边框色 |
| `c.onPrimary` | `useColors()` | 白勾(check icon)色 |
| `c.foreground` | `useColors()` | label 文字色 |
| `radius.xs` | `@unif/react-native-design` | 方形盒子圆角(4) |
| `space['4']` | `@unif/react-native-design` | 盒子↔label 间距(10) |
| `type.sm` | `@unif/react-native-design` | label 字号 |

## 无障碍（a11y）

来源：`src/components/ui/Checkbox/Checkbox.tsx`、`types.ts`。

- 默认 `accessibilityRole`：`'checkbox'`（在 `<Pressable>` 上硬编码）。
- accessible name：优先 trim 后非空的 `accessibilityLabel`，否则回退 trim 后非空的可见 `label`。两者最终都空白时移除 handler/action 语义，并在 effect 诊断。
- 状态语义：`accessibilityState={{ checked, disabled: !!disabled }}` —— `checked` 直接映射受控的 `checked` prop，`disabled` 映射 `disabled` prop。
- 禁用语义：同时传 `disabled={true}` 与 `onPress={undefined}`，不是在 handler 内静默 no-op。
- 视觉方框、Icon 与可见文字是外层 checkbox 的 display descendants；它们只在本地 RN `View` / `Text` 上复用共享 `A11Y_HIDDEN_PROPS`，不会生成重复焦点，也不会把隐藏 props 透传给第三方 Icon。

```tsx
// label 同时作为 SR 朗读文案
<Checkbox checked={agree} onChange={setAgree} label="同意服务条款" />

// 仅显示方框时必须显式命名
<Checkbox
  checked={selected}
  onChange={setSelected}
  accessibilityLabel="选择全部客户"
/>
```
