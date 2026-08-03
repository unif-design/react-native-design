---
sidebar_position: 3
title: Search 搜索框
description: '严格受控/非受控 Search：单一 current value、库自管 action、44pt root 与 36pt surface。'
---

# Search 搜索框

Search 自管搜索 icon、清除 action、36pt 可视 surface、44pt 根命中框、`returnKeyType="search"` 与 `accessibilityRole="search"`。这些入口不能由 caller 覆盖。

## 值模式与提交

```tsx
<Search defaultValue="初始关键词" onSubmit={submit} />
<Search
  value={query}
  onChangeText={setQuery}
  onSubmitEditing={recordNativeEvent}
  onSubmit={submit}
  accessibilityLabel="搜索客户"
/>
```

首次 render 锁定 controlled/uncontrolled mode。非受控 `defaultValue` 仅初始化一次；受控调用必须同时给 `value` 与 `onChangeText`。Search 只维护一个 controller value：输入、清除和 `onSubmit` 都读取它。

按 return 时先执行 `onSubmitEditing(event)`，再执行 `onSubmit(currentValue)`。当前 value 非空、字段有效可编辑且 controller 能更新时才渲染清除 action；清除调用同一个 `onChangeText('')` 路径。

## 删除的入口与 ref

不支持 caller `leading`、`trailing`、`height`、`returnKeyType`、`accessibilityRole`、`role`、`clearButtonMode` 或 `enterKeyHint`。`disabled`/`editable={false}` 会移除清除 handler 并上报 disabled state。

ref 是 `TextFieldHandle`，只含 `focus()` / `blur()`；没有原生 `clear()`。无可见 label 时提供 `accessibilityLabel`。
