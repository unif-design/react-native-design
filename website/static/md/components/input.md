---
sidebar_position: 1
title: Input 输入框
description: '严格单行输入：受控/非受控 mode、44pt 最小 frame、可验证 slot 与窄 ref。'
---

# Input 输入框

单行文本输入。可视高度默认及最小命中框均为 44pt；多行使用 [Textarea](textarea.md)。

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
function SearchConditionField() {
  const colors = useColors();
  return (
    <Input
      value={query}
      onChangeText={setQuery}
      leading={{ kind: 'icon', icon: 'search' }}
      trailing={{
        kind: 'action',
        icon: 'close',
        onPress: () => setQuery(''),
        accessibilityLabel: '清除搜索条件',
      }}
      placeholderTextColor={colors.primary}
      accessibilityLabel="搜索条件"
    />
  );
}
```

action slot 由库渲染 44×44pt frame。`disabled` 或 `editable={false}` 会同时禁止文本与 action；`disabled` 覆盖 caller 的 `editable` 和 `accessibilityState.disabled`。

`containerStyle` 用于外层布局，但不能设置高度、min/max 尺寸或 `overflow`。`height` 小于 44 或非法时会回退为 44 并在开发环境诊断。

## API 要点

`InputProps` 基于 `TextInputProps`，但移除了 `style`、`multiline`、`numberOfLines`、`value`、`defaultValue`、`onChangeText`、`readOnly`、`role`、`aria-disabled`、`enterKeyHint`、`clearTextOnFocus` 的宽入口；严格 value union 重新提供前三项。

- `leading` / `trailing`: `TextFieldSlot?`
- `height`: `number?`（最小 44）
- `error`: `string?`
- `disabled`: `boolean?`
- `containerStyle`: `TextFieldContainerStyle?`
- `ref`: `TextFieldHandle`，仅 `focus()` / `blur()`

运行时会验证每个 slot 的精确 discriminant 和关键字段：icon 必须来自生成 registry，
可选 size 必须是有限 number、color 必须是 string；text 只接受 string/number；
action 还必须有函数 handler、非空名称和可选 boolean disabled。`undefined` 表示无
slot，其他 malformed 未类型化值都会失败关闭，并在 effect 中诊断。合法但超出
`[1, 32]` 的数值 icon size 仍按既有规则回退 18。

无可见 label 时请传 `accessibilityLabel`。错误文字在 Android 是 polite live region；iOS 后续错误变化会播报。
