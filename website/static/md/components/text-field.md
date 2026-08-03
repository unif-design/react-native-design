---
sidebar_position: 1
title: TextField 输入共享内核（internal）
description: 'Input、Textarea、Search 与 PasswordInput 的严格 value、slot、44pt frame 与错误播报内核；不作为公共组件导入。'
---

# TextField 输入共享内核（internal）

`src/components/ui/TextField/` 是公开 `Input`、`Textarea`、`Search`、`PasswordInput` 的内部实现，业务不要深路径导入。它统一处理 value mode、slot、安全 a11y、布局和窄 ref；使用者应选择对应公开组件。

## 值与 ref 契约

- Input、Textarea、Search 首次 render 以 `value !== undefined` 锁定受控或非受控 mode；之后切换 mode 会在开发环境诊断，仍保持初始 mode。
- 非受控 `defaultValue` 仅初始化一次，之后输入由内部 state 持有；受控调用必须同时传 `value` 与 `onChangeText`。
- 初始受控后意外传入 `undefined` 时，仍显示最后一个合法字符串；初始非受控后收到 `value` 会被忽略。
- ref 只公开 `TextFieldHandle` 的 `focus()` 与 `blur()`，不会公开原生 `clear()` 或 `setNativeProps()`。

```tsx
const ref = useRef<TextFieldHandle>(null);
<Input ref={ref} defaultValue="初值" />;
ref.current?.focus();
```

## slot 与可访问性

`leading`/`trailing` 只能是可验证的 `TextFieldSlot`：装饰性 `{ kind: 'icon' | 'text' }`，或具备 `icon`、`onPress`、`accessibilityLabel` 的 `{ kind: 'action' }`。任意 ReactNode 和嵌套 Pressable 都不被接受。

- display slot 会由本地 View/Text 从 a11y tree 隐藏；语义放在输入框 label/hint 上。
- action slot 始终拥有真实 44×44pt Pressable frame；字段 `disabled` 或 `editable={false}` 时移除 handler，并上报 disabled state。
- 运行时逐分支验证 `kind`、生成 icon name、有限数 size、string color、
  string/number text value，以及 action 的函数 handler、非空名称和 boolean
  disabled。只有 `undefined` 表示无 slot；其余 malformed 值在 effect 诊断并移除。
  合法配置中的越界数值 icon size 仍回退 18。
- `A11Y_HIDDEN_PROPS` 是内部共享常量，只能应用到库内本地 RN 节点，不能透传给第三方组件。

## 布局、优先级与错误

- Input 高度最少 44pt；Textarea `minHeight` 最少 44pt，默认 96，非法 `maxHeight` 会回退为无上限。
- `containerStyle` 不能设 `height`、`minHeight`、`maxHeight`、`minWidth`、`maxWidth` 或 `overflow`；运行时也会剥掉这些 JS 传入值。caller 可用 `width` 扩展布局。
- `disabled` 优先于 `editable`，有效值是 `disabled !== true && editable !== false`；caller 的其他 `accessibilityState` 会保留，但 `disabled` 始终按真实状态覆盖。
- `placeholderTextColor` 使用 caller 值优先、theme token 兜底。`readOnly`、`role`、`aria-disabled`、`enterKeyHint`、`clearTextOnFocus` 已删除。
- Android 可见错误文本使用 polite live region；iOS 只在挂载后的空→非空或非空错误变更时延迟播报，首次已有错误和清空都不播报。
