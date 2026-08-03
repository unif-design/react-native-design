---
sidebar_position: 1
title: Toast 轻提示
description: "命令式全局轻提示 —— toast(msg) / toast.success / .error / .info,或 {message,kind,duration};配根部挂一次 <ToastHost />,inverseSurface 底胶囊 + 可选状态点,默认 3000ms 后 fade+slide 自动消失,同时最多 1 条。"
---

# Toast 轻提示

非阻塞反馈——3 秒后自动消失，居中或底部出现。

## 实时预览

下方在 Web 平台解析到 `ToastHost.web.tsx`：使用纯 React state、CSS transition 与 timer 驱动 fade + slide；native 才解析到 `ToastHost.tsx` 并使用 Reanimated 4。两端共享同一个 Toast Store 与 delivery identity 契约。每个 Button 都带真实的 `onPress`，点击即可触发对应提示。

```tsx
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
    <Button label="信息" variant="secondary" onPress={() => toast.info('已切换到日报模式')} />
    <Button label="成功" variant="secondary" onPress={() => toast.success('订单提交成功')} />
    <Button label="失败" variant="secondary" onPress={() => toast.error('网络异常，请重试')} />
    <Button label="长文" variant="secondary" onPress={() => toast('正在同步最近 30 天的拜访记录…')} />
  </div>
  <ToastHost />
```

## 视觉规范

来源：`src/components/ui/Toast/styles.ts`、`ToastHost.tsx`、`ToastHost.web.tsx`、`toast.ts`。

| 元素 | 规则 |
|---|---|
| 形态 | 圆角 8（`radius.md`）`c.inverseSurface` 底（亮色 `#1C1C1E`），`c.inverseOnSurface` 白字 |
| 内边距 | 横向 14（`space[6]`）/ 纵向 10（`space[4]`） |
| 宽度 | max-width 85%，水平居中；距底部 32px（`space[10]`） |
| 字号 | 14px（`type.sm`）/ 500 |
| 出现 | 200ms（`motion.base`）fade + 8px slide-up |
| 停留 | 默认 3000ms（`duration` 可覆盖） |
| 退出 | 200ms fade + 下滑 8px |
| 层级 | host `position: absolute` + `zIndex: 200` + `pointerEvents: none` |

## 状态变体

`kind` 仅决定文本左侧 6×6 圆点的颜色（来源：`dotColorFor`）：

```text
✓ success · c.success 绿点（亮色 #52C41A）
✕ error   · c.error 红点（亮色 #F4511E）
ℹ info    · 无圆点（默认）
```

## 用法

```tsx
import { toast, ToastHost } from '@unif/react-native-design';

// 在应用根放一次 ToastHost
<ToastHost />

// 任意位置触发
toast('已保存');
toast.success('订单提交成功');
toast.error('网络异常，请重试');
toast.info('已切换到日报模式');

// 自定义时长
toast({ message: '正在同步…', duration: 5000 });
```

## API

来源：`src/components/ui/Toast/toast.ts`、`types.ts`、`ToastHost.tsx`。

命令式函数 `toast`（不是组件）：

| 调用 | 签名 | 说明 |
|---|---|---|
| `toast(input)` | `(input: ToastInput) => void` | 默认 `kind: 'info'` |
| `toast.info(input)` | `(input: ToastInput) => void` | info 提示 |
| `toast.success(input)` | `(input: ToastInput) => void` | success 提示（绿点） |
| `toast.error(input)` | `(input: ToastInput) => void` | error 提示（红点） |

`ToastInput` = `string`（简写，走默认 kind + 3000ms）`|` 对象：

| 字段 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `message` | `string` | — | 消息文本（必填） |
| `kind` | `'info' \| 'success' \| 'error'` | `'info'` | 类型（决定圆点颜色） |
| `duration` | `number?` | `3000` | 自动消失毫秒数 |
| `position` | `'top' \| 'bottom' \| 'center'` | `'bottom'` | 显示位置(top/center 自动避让 safe-area) |

`<ToastHost />` 组件 props（`ToastHostProps`，在 app 根附近挂一次）：

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `testID` | `string?` | — | 容器 testID；文本节点派生 `${testID}-text` |

> 全局只需一个 `<ToastHost />`；同一时间只显示一条，新调用替换旧的。

## 投递语义 {#投递语义}

`toast()` 由一个纯状态机驱动(`src/components/ui/Toast/store.ts`),模型是 **pending / delivery 双态**:

| 场景 | 行为 |
|---|---|
| 未挂 `<ToastHost />` 时调用 | 消息**保留**为 pending(不是丢弃、不告警);Host 挂上后立即补投 |
| 未挂 Host 时连续调用多次 | **latest-wins** —— 只保留最新一条,不排队补投历史消息 |
| 已挂 Host 时连续调用 | 立即投递,后者替换前者;旧的那条的定时器 / 动画不再影响 UI |
| 挂了多个 `<ToastHost />` | 只有第一个生效,其余永久惰性(不渲染、不接收投递),第一个卸载后**也不会**自动接管 |
| Host 卸载时消息还没显示完 | 未完成的投递退回 pending,下一个 Host 会重新投递;若期间已有更新的消息,更新的优先 |
| Host 渲染 / 订阅回调抛错 | 作废该 Host,消息退回 pending 等待新 Host |

:::danger 启动早期的 toast 不会丢
这是与旧版本的**行为变更**:此前未挂 Host 时 `toast()` 会告警并丢弃消息。现在消息会保留并在 Host 挂载后补投 —— 如果你依赖「没有 Host 就静默丢弃」,需要改为条件调用。
:::

### 竞态守卫

每次投递带 **owner token + leaseId + entry id** 三重身份。Host 的每个定时器、RAF 和动画完成回调在改 UI 或上报完成前都要通过这三项 CAS —— 否则经典竞态会发生:A 的 3 秒定时器在 B 已经显示之后才触发,把 B 提前抹掉。

同一条消息被重新投递(Host 重挂)会拿到**新的 leaseId**,所以仅比较 `entry.id` 不足以区分两次投递。

`ToastDelivery` / lease / subscriber 等标识类型是 Host 与 Store 之间的**内部协议**,不从包根导出。`ToastEntry.id` 同样是内部身份,不保证跨版本稳定 —— 业务不要依赖它的具体取值。

## 无障碍（a11y）

来源：`src/components/ui/Toast/ToastHost.tsx`、`ToastHost.web.tsx`、`toast.ts`、`types.ts`。

- 默认 `accessibilityRole`：**无**。Toast 由 `<ToastHost>` 渲染为 `<View>` + `<Text>`（native 与 web 两份实现一致），源码**未**设置 `accessibilityRole`。
- 朗读 / live region：`<ToastHost>` 在每条 toast 出现时调用 `AccessibilityInfo.announceForAccessibility(message)`（native 与 web 两端一致，web 经 RN-Web 注入 aria-live region），**screen reader 会主动播报 message 文本**。host 容器仍 `pointerEvents="none"`（不抢焦点）。需要用户*停留确认*的关键操作（而非一次性通知）仍应改用会获得焦点的模态对话框。
- a11y props：命令式 `toast(...)` 入参（`ToastInput`：`message` / `kind` / `duration`）与 `ToastHostProps`（仅 `testID`）均**不含** a11y 字段；`kind`（success/error/info）只决定圆点颜色，不带语义角色。
- 无受控状态（`checked` / `selected` / `disabled` 均不适用）。

> 现状如实记录：Toast 出现时主动播报 message（SR 可感知），但仍是非阻塞提示（不抢焦点、自动消失）；需要用户停留确认的关键操作请用模态对话框。

- ❌ 不要在 Toast 里放按钮——需要交互的反馈用内联 Confirmation 或模态对话框
- ❌ 不要堆叠多个 Toast——同一时间最多 1 条，新的把旧的替换
- ❌ 不要超过 50 字——超过就用模态对话框承载
- ❌ 不要挂多个 `<ToastHost />` —— 多余的实例惰性，且第一个卸载后不会自动接管
- ❌ 不要依赖 `ToastEntry.id` 的具体取值 —— 它是内部竞态守卫,不是稳定公共契约
