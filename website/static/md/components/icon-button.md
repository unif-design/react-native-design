---
sidebar_position: 1
title: IconButton 图标按钮
description: '只包含图标的按钮，需要提供无障碍名称。'
---

<!-- Generated from @unif/react-native-design@0.32.0; edit source documentation. -->

# IconButton 图标按钮

仅包含图标的按钮，用于工具栏或紧凑操作区。需要提供 `accessibilityLabel`。

`size` 走 `ButtonSize`（sm/md/lg = 28/36/44）。`variant` 复用 Button palette，但
IconButton 精确排除会撕掉方形高度的 `'text'`，默认是透明底 `'ghost'`。

## 代码演示 {#实时预览}

下方渲染的就是 `src/components/ui/IconButton/IconButton.tsx` 本体。

```tsx
const IconButtonDemo = () => {
  const [count, setCount] = useState(0);
  const onPress = () => setCount((value) => value + 1);
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="demo-label">size · sm 28 / md 36 / lg 44</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <IconButton
              icon="bell"
              size="sm"
              accessibilityLabel="通知"
              onPress={onPress}
            />
            <IconButton
              icon="bell"
              size="md"
              accessibilityLabel="通知"
              onPress={onPress}
            />
            <IconButton
              icon="bell"
              size="lg"
              accessibilityLabel="通知"
              onPress={onPress}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="demo-label">
            variant · neutral 中性 / primary 橙底 / ghost 透明
          </span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <IconButton
              icon="scan"
              variant="neutral"
              accessibilityLabel="扫码"
              onPress={onPress}
            />
            <IconButton
              icon="scan"
              variant="primary"
              accessibilityLabel="扫码"
              onPress={onPress}
            />
            <IconButton
              icon="scan"
              variant="ghost"
              accessibilityLabel="扫码"
              onPress={onPress}
            />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="demo-label">disabled · opacity 0.5 + 不响应</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <IconButton
              icon="check"
              variant="primary"
              accessibilityLabel="确认"
              disabled
              onPress={onPress}
            />
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
import { IconButton } from '@unif/react-native-design';

{
  /* NavBar 右侧扫码按钮 */
}
<IconButton
  icon="scan"
  size="md"
  variant="neutral"
  accessibilityLabel="扫码"
  accessibilityHint="打开二维码扫描"
  onPress={() => navigation.navigate('Scanner')}
/>;

{
  /* 卡片右上关闭 */
}
<IconButton
  icon="close"
  size="sm"
  variant="ghost"
  accessibilityLabel="关闭"
  onPress={onClose}
/>;
```

## API

| 参数                 | 类型                                                                           | 默认值     | 说明                                                                                         |
| -------------------- | ------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| `icon`               | `IconName`                                                                     | —          | 包内生成图标目录中的闭集名称                                                                 |
| `onPress`            | `() => void`                                                                   | —          | **必填**点击回调；disabled / loading 时组件移除有效 handler                                  |
| `size`               | `('sm' \| 'md' \| 'lg')?`                                                      | `'md'`     | 方形边长 28 / 36 / 44                                                                        |
| `variant`            | `('primary' \| 'secondary' \| 'ghost' \| 'neutral' \| 'outline' \| 'danger')?` | `'ghost'`  | 与 Button 共用 palette，但精确排除会撕掉方形高度的 `'text'`                                  |
| `color`              | `string?`                                                                      | variant fg | icon 描色 override(仅 icon 色,bg/border 仍由 variant 决定)                                   |
| `disabled`           | `boolean?`                                                                     | `false`    | 不响应 + opacity 0.5                                                                         |
| `loading`            | `boolean?`                                                                     | `false`    | 以 ActivityIndicator 替代 icon，自动 disabled + busy                                         |
| `accessibilityLabel` | `string`                                                                       | —          | **必填且运行时必须非空** —— icon-only 按钮 SR 用户唯一信息源；空白值失败关闭并在 effect 诊断 |
| `accessibilityHint`  | `string?`                                                                      | —          | 行为不显然时填(如"打开扫描器")                                                               |
| `accessibilityState` | `Omit<AccessibilityState, 'disabled' \| 'busy'>?`                              | —          | caller 可补充 `selected` / `expanded` 等状态；`disabled` / `busy` 由组件接管，类型上禁止覆盖 |
| `style`              | `StyleProp<ViewStyle>?`                                                        | —          | 容器附加样式                                                                                 |
| `testID`             | `string?`                                                                      | —          | E2E / 测试定位                                                                               |

## 无障碍（a11y）

来源：`src/components/ui/IconButton/types.ts`、`IconButton.tsx`、`Button/ButtonBase.tsx`。

- 默认 `accessibilityRole`：`'button'`（IconButton 透传给共享的 `ButtonBase`，其 `accessibilityRole = 'button'` 为默认参数）。
- a11y props：`accessibilityLabel` **是 TS 强制必填**，运行时还会 trim；空白值会移除 handler/action 语义并在 effect 诊断，不会形成 unnamed button。`accessibilityHint` 可选，仅在「行为不显然」时补。
- 状态语义：disabled 或 loading 时自动上报 `accessibilityState.disabled: true` 并移除有效 handler；loading 还上报 `busy: true`。调用方不能覆盖这两个字段。

```tsx
// label 必填(SR 唯一信息源);hint 仅在行为不显然时补
<IconButton icon="scan" accessibilityLabel="扫码" accessibilityHint="打开二维码扫描" onPress={...} />
```

## 使用注意

- 不要把 icon 当装饰用 IconButton —— 装饰用 `<Icon>` 即可,没 hit area 浪费
- 不要在 IconButton 内文字 + icon 混搭 —— 用 [Button](button.md) 的 `rightIcon` / `leftIcon` prop
