---
sidebar_position: 2
title: 设计原则
description: 5 条不可违背的规则——新增组件、修改样式前必读
---

# 设计原则

5 条不可违背的规则。新增组件、修改样式前必读。

## 1. 中文优先

所有 UI 文案均为简体中文，正式且简洁。英文仅出现在品牌名和代码标识符中。

```tsx
// ✓ 正确
<Text>今日待办</Text>
<Button label="提交订单" />

// ✗ 错误
<Text>Today's tasks</Text>
<Button label="Submit" />
```

## 2. 橙色克制

`#EB6E00` 仅用于：
- 主按钮（primary CTA）
- 用户气泡背景
- 活动标签 / 选中状态
- 关键强调

蓝色 `#3775F6` **专用于**用户头像，其它地方禁用。

```tsx
// ✓ 正确
<Button variant="primary" label="确认" />        // 橙底
<Avatar label="我" variant="info" />              // 蓝底（用户）
<Avatar label="AI" variant="brand" />             // 橙底（AI）

// ✗ 错误
<Avatar label="王" variant="info" />              // 蓝色不能给客户
<View style={{ backgroundColor: '#3775F6' }} />   // 蓝色装饰，禁止
```

## 3. 无装饰

- 无插画
- 无渐变背景（只允许主橙渐变 logo / drawer header）
- 无装饰性 emoji
- 无背景图、无 pattern

所有图标都是手绘 24×24 描边 SVG。功能性状态走图标系统。

## 4. 列表用 gap，不用 border

每行独立白卡，行间 8px 空隙形成分组（与 iOS 17 / 微信新版一致）。

```tsx
// ✓ 正确：白卡 + gap + 浅灰底
<View style={{ backgroundColor: 'var(--ifm-background-color)', padding: 8, borderRadius: 12 }}>
  <View style={{ marginBottom: 8, backgroundColor: 'var(--ifm-background-surface-color)', borderRadius: 10, padding: 12 }}>
    {/* row 1 */}
  </View>
  <View style={{ backgroundColor: 'var(--ifm-background-surface-color)', borderRadius: 10, padding: 12 }}>
    {/* row 2 */}
  </View>
</View>

// ✗ 错误：border-bottom 分隔
<View>
  <View style={{ borderBottomWidth: 1, borderBottomColor: 'var(--ifm-color-emphasis-200)' }}>{/* row */}</View>
  <View style={{ borderBottomWidth: 1, borderBottomColor: 'var(--ifm-color-emphasis-200)' }}>{/* row */}</View>
</View>
```

## 5. 气泡内角方

聊天气泡 14px 圆角，但**指向头像的内角是直角**——这是 Unif 最辨识度的视觉符号。

- **AI 气泡**：`borderRadius: 0 14px 14px 14px`（左上角直角，指向 AI 头像）
- **用户气泡**：`borderRadius: 14px 0 14px 14px`（右上角直角，指向用户头像）

不要为了对称就把所有角都改成 14px——这会破坏品牌识别。
