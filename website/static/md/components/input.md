---
sidebar_position: 1
title: Input 输入框
description: '单行文本输入，支持状态、插槽和公开 ref。'
---

<!-- Generated from @unif/react-native-design; edit source documentation. -->

# Input 输入框

单行文本输入，背景统一使用 GlassLayer；Android、旧 iOS 或减少透明度时使用主题 surface 实色、细中性边界与轻阴影形成层次，原生玻璃与 Web 外观保持。焦点、填写和错误状态保留各自描边，禁用只淡化前景。可视高度默认及最小命中框均为 44pt；多行使用 [Textarea](textarea.md)。

```tsx
const InputDemo = () => {
  const [value, setValue] = useState('');
  return (
    <>
      <Input
        value={value}
        onChangeText={setValue}
        placeholder="客户名称"
        accessibilityLabel="客户名称"
      />
    </>
  );
};
```

## 严格 value mode

受控调用必须同时提供更新入口；非受控调用可选 `defaultValue`，且它只在首次 render 读取一次。不要在同一实例切换两种 mode。

```tsx
<Input value={name} onChangeText={setName} />
<Input defaultValue="初始姓名" onChangeText={trackDraft} />

// 不支持：<Input value="locked" />
// 不支持：同时给 value 和 defaultValue
```

## slot、禁用与样式

```tsx
import { CloseOutlined, SearchOutlined } from '@unif/react-native-icons';
function SearchConditionField() {
  const colors = useColors();
  return (
    <Input
      value={query}
      onChangeText={setQuery}
      leading={{ kind: 'icon', icon: SearchOutlined }}
      trailing={{
        kind: 'action',
        icon: CloseOutlined,
        onPress: () => setQuery(''),
        accessibilityLabel: '清除搜索条件',
      }}
      placeholderTextColor={colors.primary}
      accessibilityLabel="搜索条件"
    />
  );
}
```

action slot 的 `icon`（图标组件）与 `label`（非空文字）二选一，并必须提供 `onPress` 和非空 `accessibilityLabel`。库渲染至少 44pt 宽、44pt 高的操作区域，文字操作可按内容加宽。`disabled` 或 `editable={false}` 会同时禁止文本与 action；`disabled` 覆盖 caller 的 `editable` 和 `accessibilityState.disabled`。

`containerStyle` 用于外层布局，但不能设置高度、min/max 尺寸或 `overflow`。`height` 小于 44 或非法时会回退为 44 并在开发环境诊断。

## API 要点

`InputProps` 基于 `TextInputProps`，但移除了 `style`、`multiline`、`numberOfLines`、`value`、`defaultValue`、`onChangeText`、`readOnly`、`role`、`aria-disabled`、`enterKeyHint`、`clearTextOnFocus` 的宽入口；严格 value union 重新提供 `value`、`defaultValue` 和 `onChangeText`。

- `leading` / `trailing`: `TextFieldSlot?`
- `height`: `number?`（最小 44）
- `error`: `string?`
- `disabled`: `boolean?`
- `containerStyle`: `TextFieldContainerStyle?`
- `ref`: `TextFieldHandle`，仅 `focus()` / `blur()`

`icon` 接收 `ComponentType<IconProps>`，例如从 `@unif/react-native-icons` 导入的 `SearchOutlined`，不接受图标名称字符串或已创建的 React 元素。

运行时会验证每个 slot 的 discriminant 和关键字段：icon 必须是有效组件，
可选 size 必须是有限 number、color 必须是 string；text 只接受 string/number；
action 验证图标或非空 label、函数 handler、非空可访问名称和可选 boolean disabled。`undefined` 表示无
slot，其他 malformed 未类型化值都会失败关闭，并在 effect 中诊断。合法但超出
`[1, 32]` 的数值 icon size 仍按既有规则回退 18。

无可见 label 时请传 `accessibilityLabel`。错误文字在 Android 是 polite live region；iOS 后续错误变化会播报。
