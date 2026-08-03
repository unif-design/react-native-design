---
sidebar_position: 1
title: VersionPill 版本号药丸
description: "版本徽章胶囊 —— 可见状态 + 「版本 {version}」+ 可选「· build {build}」mono 后缀；默认状态为 success 色的“正常”。"
---

# VersionPill 版本号药丸

About / Splash / 调试面板等显版本号的小药丸。左侧状态点 + 版本号 + 可选 build 后缀,圆角胶囊。

## 实时预览

下方渲染的就是 `src/components/business/VersionPill/VersionPill.tsx` 本体。

```tsx
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">基础 · 仅版本号</span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <VersionPill version="2.8.0" />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">带 build 号</span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <VersionPill version="2.8.0" build="20260525" />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">可见 status 文案</span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <VersionPill version="2.8.0-beta" status={{ label: '内测' }} />
        <VersionPill version="2.8.0-rc1" status={{ label: '候选版' }} />
      </div>
    </div>
  </div>
```

## 用法

```tsx
import { VersionPill } from '@unif/react-native-design';

{/* About 屏底 */}
<VersionPill version="0.2.0" />

{/* 内测版本醒目 */}
<VersionPill
  version="2.8.0-beta"
  status={{ label: '内测' }}
  build="20260525"
/>
```

## API

来源：`src/components/business/VersionPill/types.ts`、`VersionPill.tsx`。

| Prop | Type | 默认 | 说明 |
|---|---|---|---|
| `version` | `string` | — | 版本号字串（`'2.8.0'`，必填） |
| `build` | `string?` | — | build 号；为空时省略分点与 build 字 |
| `status` | `VersionStatus?` | `{ label: '正常', color: c.success }` | 可见状态文案与状态点颜色；空白 label 回退“状态未知”并在 effect 诊断，省略 `color` 时使用 `c.foregroundMuted` |
| `style` | `StyleProp<ViewStyle>?` | — | 容器附加样式覆盖 |

## 视觉规范（Tokens）

来源：`src/components/business/VersionPill/styles.ts`。

| 元素 | 规则 |
|---|---|
| 胶囊 | `c.surface` 底 + hairline `c.outline` 边，圆角 `radius.pill`（999），横向 padding 11 / 纵向 5 |
| 状态点 | 5×5 圆点（`radius.pill`），色由 resolved status 决定 |
| 状态文字 | `type.microPlus` + `c.foregroundMuted`，始终在状态点旁可见 |
| 版本文字 | `type.microPlus`（11.5）+ `c.foregroundMuted` + `tabular-nums`（等宽数字） |
| 分隔点 | `·`，`type.microPlus` + `opacity 0.5` |
| build 文字 | `type.micro`（11）+ `c.foregroundMuted` + 等宽字体（`fontMono`） |

## 无障碍（a11y）

来源：`src/components/business/VersionPill/VersionPill.tsx`、`types.ts`。

VersionPill 是**纯展示**徽章，外层本地 `<View accessible>` 合并名称，例如“版本 2.0.0，build 12，测试中”；没有 build 时对应片段整体省略。空白 status label 会显示并朗读“状态未知”，保留 caller 的合法颜色策略，同时在 effect 诊断。状态点、可见文字、版本和 build 子节点均隐藏为单一焦点。

## 不要

- 不要硬编码 `version` —— 走 `@/config/brand` 的 `APP_VERSION`(package.json 派生),build 走 react-native-device-info `getBuildNumber()`
- 不要只用颜色表达状态；`status.label` 必须给出可见且可朗读的状态语义。需要自定义点颜色时从 `useColors()` 取角色 token，例如 `{ label: '已废', color: colors.error }`
