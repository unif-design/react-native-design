---
sidebar_position: 6
title: StatusDot 状态点
description: '用圆点表达完成、错误、进行中和待处理状态。'
---

<!-- Generated from @unif/react-native-design@0.32.0; edit source documentation. -->

# StatusDot 状态点

用圆点展示完成、错误、进行中或待处理状态；业务状态由调用方映射。

| 状态      | 视觉                     | 内部                                     |
| --------- | ------------------------ | ---------------------------------------- |
| `done`    | 绿底 + 白勾              | `success` 填充 + `<Icon name="check" />` |
| `error`   | 红底 + 白叉              | `error` 填充 + `<Icon name="close" />`   |
| `active`  | 边框 + 内嵌 `<PulseDot>` | `primary` 边框 + 跳动                    |
| `pending` | 仅边框                   | `outline` 灰边                           |

`tone='flat'`（默认）—— pending/active 底色透明（`'transparent'`），用于 Task。
`tone='soft'` —— pending = `c.surface`、active = `c.primaryContainer`，用于 ChainOfThought（推理链气氛更柔）。

## 代码演示 {#实时预览}

```tsx
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">flat（任务列表风格）</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="done" size={16} />
          <span>done</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="error" size={16} />
          <span>error</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="active" size={16} />
          <span>active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="pending" size={16} />
          <span>pending</span>
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">soft（推理链风格）</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="done" size={18} tone="soft" />
          <span>done</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="error" size={18} tone="soft" />
          <span>error</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="active" size={18} tone="soft" />
          <span>active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusDot status="pending" size={18} tone="soft" />
          <span>pending</span>
        </div>
      </div>
    </div>
  </div>
```

## 用法

```tsx
import { StatusDot } from '@unif/react-native-design';

// 任务列表风格
<StatusDot status="done" size={16} />
<StatusDot status="active" size={16} />
<StatusDot status="pending" size={16} />

// 推理链风格（柔色）
<StatusDot status="active" size={18} tone="soft" />
```

## API

来源：`src/components/ui/StatusDot/types.ts`、`StatusDot.tsx`、`styles.ts`。

| 参数                 | 类型                                         | 默认值                   | 说明                                                                           |
| -------------------- | -------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------ |
| `status`             | `'pending' \| 'active' \| 'done' \| 'error'` | —                        | 当前状态（必填）                                                               |
| `size`               | `number?`                                    | `r(16)`                  | 圆点直径（done 勾 ≈ `size*0.6`）                                               |
| `tone`               | `('flat' \| 'soft')?`                        | `'flat'`                 | flat 透明底；soft 柔色底（pending=`c.surface`、active=`c.primaryContainer`）   |
| `accessibilityLabel` | `string?`                                    | 按 `status` 派生英文名称 | 独立状态点的 SR 名称；显式传 `''` 表示语义已由父容器承载，并关闭自身可访问节点 |
| `style`              | `StyleProp<ViewStyle>?`                      | —                        | 容器附加样式（margin / position 等）                                           |
| `testID`             | `string?`                                    | —                        | E2E / 测试定位                                                                 |

> 颜色派生（`paletteFor`）：done = `c.success` 底+边；error = `c.error` 底+边；active = `c.primary` 边框（底 flat 透明 / soft `c.primaryContainer`）；pending = `c.outline` 边框（底 flat 透明 / soft `c.surface`）。圆点带 1.5px 边框。

## 无障碍（a11y）

来源：`src/components/ui/StatusDot/StatusDot.tsx`、`types.ts`。

视觉状态指示器，无交互、无 `accessibilityRole`。源码会为根 `<View>` 设置
`accessible` 与 `accessibilityLabel`：

- 未传 `accessibilityLabel` 时，按 `status` 派生
  `'pending'` / `'active'` / `'done'` / `'error'`。
- 传入非空字符串时，使用 caller 提供的业务名称。
- 显式传空字符串 `''` 时，不派生默认名称，并把根节点移出独立可访问焦点。父容器已经
  合并播报标题与状态时用这一分支，避免重复朗读。

内部 `<Icon>` / `<PulseDot>` 都对 SR 隐藏，不会和根状态名称形成重复焦点。默认名称是
稳定的英文状态 key；面向中文用户的独立状态点应传明确的中文业务文案：

```tsx
<StatusDot status="done" accessibilityLabel="已完成" />;

{
  /* 父容器已经朗读“资料审核，进行中”时，关闭圆点自己的名称 */
}
<StatusDot status="active" accessibilityLabel="" />;
```

## 组合使用 {#内部使用}

调用方将业务状态映射为 `done`、`error`、`active` 或 `pending`。放入步骤、任务或列表时，结合可理解的状态文字使用。

## 设计原则

需要状态圆点时复用 `StatusDot`，颜色与动效由组件统一处理。
