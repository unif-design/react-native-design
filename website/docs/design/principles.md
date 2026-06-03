---
sidebar_position: 2
title: 设计原则
description: "Unif Design 5 条不可违背的规则：中文优先、橙色克制、无装饰、列表用 gap 不用 border、气泡内角方。新增组件 / 改样式前必读。"
---

# 设计原则

5 条不可违背的规则。**新增组件、修改样式前必读。** 这些是品牌一致性的底线,违反会破坏识别度。

## 1. 中文优先 {#中文优先}

所有 UI 文案均为简体中文,正式且简洁。英文仅出现在品牌名和代码标识符中。语气见[语调与文案](/docs/design/voice)。

```tsx
// ✅ Correct
<Text>今日待办</Text>
<Button label="提交订单" onPress={onSubmit} />

// ❌ Incorrect
<Text>Today's tasks</Text>
<Button label="Submit" onPress={onSubmit} />
```

## 2. 橙色克制 {#橙色克制}

品牌橙 `c.primary`(`#EB6E00`)**仅用于**:

- 主按钮(primary CTA)
- 用户气泡背景
- 活动标签 / 选中状态
- 关键强调

蓝色 `c.info`(`#3775F6`)**专属于用户头像**(及 Tag 的 `info` variant 历史沿用),其它地方禁用 —— 这是 user / AI 视觉区分的关键。

```tsx
// ✅ Correct
<Button variant="primary" label="确认" onPress={onOk} />  // 橙底
<Avatar label="我" variant="info" />                       // 蓝底(用户)
<Avatar label="AI" variant="brand" />                      // 橙底(AI)

// ❌ Incorrect
<Avatar label="王" variant="info" />                       // 蓝色不能给客户
<View style={{ backgroundColor: '#3775F6' }} />            // 蓝色装饰,禁止
```

> `Avatar` 的 `variant` 取值:`brand` / `info` / `soft` / `neutral`(见 [Avatar 文档](/docs/components/avatar))。颜色一律走 token,不内联 hex(见[颜色 → 取色优先级链](/docs/design/tokens/colors#取色优先级链))。

## 3. 无装饰 {#无装饰}

- 无插画
- 无渐变背景(仅允许品牌橙渐变:Logo 圆 / Drawer header)
- 无装饰性 emoji
- 无背景图、无 pattern

所有图标都是手绘 24×24 描边 SVG,功能性状态走图标系统(见[图标](/docs/components/icons))。头像是单字符 monogram,不放图片。

## 4. 列表用 gap,不用 border {#列表用-gap-不用-border}

每行独立白卡,行间 8px 空隙形成分组(与 iOS 17 / 微信新版一致),而不是用 `border-bottom` 切分。

```tsx
// ✅ Correct:用 List(grouped 默认)—— 白卡 + 8px gap + 浅灰底,无 cell 间分隔线
<List>
  <Cell title="账号与安全" onPress={goSecurity} />
  <Cell title="通用" onPress={goGeneral} />
</List>

// ❌ Incorrect:手画 border-bottom 分隔
<View>
  <View style={{ borderBottomWidth: 1 }}>{/* row 1 */}</View>
  <View style={{ borderBottomWidth: 1 }}>{/* row 2 */}</View>
</View>
```

`<List>` 有两种模式:`grouped`(默认,白卡 + gap)与 `flush`(紧凑 + cell 间 hairline,嵌在已有底色区里)。详见 [Cell · List 文档](/docs/components/cell)。

## 5. 气泡内角方 {#气泡内角方}

聊天气泡用 `radius['2xl']`(14px)圆角,但**指向头像的内角是直角** —— 这是 Unif 最辨识度的视觉符号。

- **AI 气泡** —— `borderRadius: 0 14px 14px 14px`(左上角直角,指向 AI 头像)
- **用户气泡** —— `borderRadius: 14px 0 14px 14px`(右上角直角,指向用户头像)

不要为了对称就把四角都改成 14px —— 这会破坏品牌识别。完整代码见[间距 · 圆角 · 阴影 → 气泡非对称圆角](/docs/design/tokens/spacing-radii-shadows#气泡非对称圆角)。

---

> 这 5 条是**硬约束**;更细的"不要做什么"清单见[全局 Don'ts](/docs/design/donts)。token 全量见[设计令牌](/docs/design/tokens/colors)。
