---
sidebar_position: 1
title: Button 按钮
description: "文本按钮 —— 7 variant(primary/secondary/ghost/neutral/outline/danger/text)× 3 size(sm/md/lg，高 28/36/44)，支持 block 块级、loading、leftIcon / rightIcon。"
---

# Button 按钮

文本按钮,7 视觉变体 × 3 尺寸 · 支持块级 / 内联。变体:`primary` 主操作 · `secondary` 次操作 · `ghost` 透明底品牌橙字 · `neutral` 透明底主文字色(多 icon 场景避免全染主橙)· `outline` 白底灰边 · `danger` 破坏性操作 · `text` 纯文字。

## 实时预览

下方渲染的就是 `src/components/ui/Button/Button.tsx` 本体，通过 `react-native-web` 翻译成浏览器节点。

```tsx
const ButtonDemo = () => {
  const [count, setCount] = useState(0);
  const onPress = () => setCount((value) => value + 1);
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">Button · 变体</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Button label="主按钮" variant="primary" onPress={onPress} />
        <Button label="次按钮" variant="secondary" onPress={onPress} />
        <Button label="ghost" variant="ghost" onPress={onPress} />
        <Button label="中性" variant="neutral" onPress={onPress} />
        <Button label="描边" variant="outline" onPress={onPress} />
        <Button label="危险" variant="danger" onPress={onPress} />
        <Button label="文字" variant="text" onPress={onPress} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">Button · 尺寸</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Button label="Small" size="sm" onPress={onPress} />
        <Button label="Medium" size="md" onPress={onPress} />
        <Button label="Large" size="lg" onPress={onPress} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">状态</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <Button label="禁用" disabled onPress={onPress} />
        <Button label="加载中" loading onPress={onPress} />
      </div>
    </div>
        <span className="demo-label">已触发 {count} 次</span>
      </div>
    </>
  );
};
```

## 用法

```tsx
import { Button } from '@unif/react-native-design';

<Button label="确认" variant="primary" onPress={handleConfirm} />
<Button label="取消" variant="secondary" onPress={handleCancel} />
<Button label="查看详情" variant="outline" onPress={openDetails} />
<Button label="重新发起" variant="text" size="sm" onPress={restart} />
<Button label="提交" variant="primary" block size="lg" onPress={submit} />
```

## API

| Prop | Type | 默认 | 说明 |
|---|---|---|---|
| `label` | `string` | — | 按钮文字，同时作为业务名称；trim 后空白会失败关闭 action 并在 effect 诊断 |
| `onPress` | `() => void` | — | **必填**点击回调；`disabled` / `loading` 时组件移除有效 handler |
| `size` | `('sm' \| 'md' \| 'lg')?` | `'md'` | 高度 28 / 36 / 44 |
| `variant` | `('primary' \| 'secondary' \| 'ghost' \| 'neutral' \| 'outline' \| 'danger' \| 'text')?` | `'primary'` | 视觉变体 |
| `block` | `boolean?` | `false` | 仅撑满父容器交叉轴（`alignSelf: stretch`）；主轴尺寸由父容器或 `style` 决定 |
| `disabled` | `boolean?` | `false` | 禁用（opacity 0.5 + 不响应 onPress） |
| `loading` | `boolean?` | `false` | 加载态:用 `ActivityIndicator` 替代 label,自动 disabled |
| `leftIcon` | `IconName?` | — | 左侧图标,与文本同色；尺寸由 Button size 固定，不随 fontScale 放大 |
| `rightIcon` | `IconName?` | — | 右侧图标,与文本同色；尺寸由 Button size 固定，不随 fontScale 放大 |
| `style` | `StyleProp<ViewStyle>?` | — | 额外样式覆盖（merge 到末尾） |
| `testID` | `string?` | — | E2E / 测试定位 |
| `accessibilityHint` | `string?` | — | SR 行为说明 hint,仅在「行为不显然」时加 |
| `accessibilityState` | `Omit<AccessibilityState, 'disabled' \| 'busy'>?` | — | caller 可补充 `selected` / `expanded` 等状态；`disabled` / `busy` 由组件接管，类型上禁止覆盖 |

## 无障碍（a11y）

来源：`src/components/ui/Button/ButtonBase.tsx`、`Button.tsx`、`types.ts`。

- 默认 `accessibilityRole`：`'button'`（在 `ButtonBase` 中硬编码，`accessibilityRole = 'button'`）。
- a11y props：`accessibilityLabel` 自动取 trim 后非空的必填 `label`，无需另传；`accessibilityHint` 可选，仅在「行为不显然」时补充（如「切换主题」）。空白 `label` 不会留下 unnamed button：组件移除 handler/action 语义，并在 effect 中诊断。
- 状态语义：`disabled` **或** `loading` 任一为真时都会上报 `accessibilityState.disabled: true` 并移除有效 handler；loading 还上报 `busy: true`（此时 label 被 `ActivityIndicator` 替换）。调用方传入的状态不能覆盖这两个字段。

```tsx
// label 即 a11y label;hint 仅在行为不显然时补
<Button label="确认" variant="primary" onPress={handleConfirm} />
<Button label="切换" accessibilityHint="切换深浅主题" onPress={toggleTheme} />
```

## 主题键（Tokens）

读取来源：`src/components/ui/Button/styles.ts`、`ButtonBase.tsx`。

| Token | 来源 | variant / 说明 |
|---|---|---|
| `c.primary` | `useColors()` | `primary` 变体背景色；`ghost` / `text` 变体文字色 |
| `c.onPrimary` | `useColors()` | `primary` 变体文字/图标色 |
| `c.surfaceContainerHigh` | `useColors()` | `secondary` 变体背景色 |
| `c.foreground` | `useColors()` | `secondary` / `neutral` / `outline` 变体文字色 |
| `c.surface` | `useColors()` | `outline` 变体背景色 |
| `c.outline` | `useColors()` | `outline` 变体边框色 |
| `c.error` | `useColors()` | `danger` 变体背景色 |
| `c.onError` | `useColors()` | `danger` 变体文字色 |
| `radius.lg` / `radius.md` / `radius.sm` | 静态 token | 按 `size='lg'/'md'/'sm'` 对应圆角 |
| `control.lg` / `control.md` / `control.sm` | 静态 token（`src/theme`） | 按尺寸对应高度（44 / 36 / 28） |
| `space['6']` / `space['4']` | 静态 token | `md` / `sm` 水平内边距(`lg` 用 `r(18)`) |
| `space['2']` / `space['1']` | 静态 token | 内容 gap(`lg`/`md` 用 `'2'`,`sm` 用 `'1'`) |
| `fw.semi` | 静态 token | 按钮文字字重（`600`） |
| `type.body` / `type.sm` / `type.xxs` | 静态 token | 按 `size='lg'/'md'/'sm'` 对应字号 |

## fontScale

`ThemeProvider fontScale` 只把 Button label 字号缩放一次。Button 高度、水平 padding、gap、圆角和左右 Icon 尺寸仍由原始 `size` token 决定，不随字号档位改变。例如 `fontScale={1.5}` 会放大文字，但 `md` 仍保持 `control.md` 的原有几何，Icon 仍使用未缩放的 `type.sm + 2`。
