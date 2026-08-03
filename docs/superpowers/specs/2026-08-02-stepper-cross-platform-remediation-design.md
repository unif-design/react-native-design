# Stepper 跨平台语义与真实 frame 补充设计

**状态：** 已批准

**批准日期：** 2026-08-02

**选择：** 方案 A —— 公共状态单源 + platform driver + 至少 44pt outer

## 1. 背景与覆盖关系

本设计补充
`docs/superpowers/specs/2026-07-30-input-interaction-a11y-design.md`
的 Stepper 契约，并覆盖原 Task 7 中以下两个无法同时成立的字面要求：

1. side outer “精确 44×44”与无上限 `r(28)` / `r(32)` visual 同时成立；
2. iOS `adjustable` 在 min/max 只暴露一个标准增减方向。

补充设计不恢复旧 API，也不降低 `accessibilityLabel`、handler removal、零范围、
真实 frame 或跨平台 a11y 门禁。

## 2. 已确认的根因

### 2.1 Web 中央 adjustable

Website 使用 `react-native-web@0.21.2`。RNW `View` 不消费 RN 对象式
`accessibilityState`、`accessibilityValue`、`accessibilityActions` 和
`onAccessibilityAction`；`accessibilityRole="adjustable"` 只生成
`role="slider"`，不会自动提供 `aria-disabled`、`aria-valuemin/max/now`、
tab stop 或键盘行为。

因此 Web 必须有显式 platform driver，不能依赖 native props 被 RNW 自动翻译。

### 2.2 iOS 标准 adjustable 手势

React Native 0.86.2 Fabric 的 `RCTViewComponentView` 使用
`accessibilityActions` 构建 custom-action menu，但
`accessibilityIncrement` / `accessibilityDecrement` 只检查
`onAccessibilityAction` 是否存在，不按 action 数组过滤方向。

保留标准 adjustable 体验时，min/max 的无效标准方向仍可能进入 JS。库能保证的是
capability-guarded no-op，不能声称平台已隐藏该标准方向。

### 2.3 宽屏 visual 与 outer

`r()` 不设上限。固定 `44×44` 的 side outer 在宽屏 native 上可能小于
`r(28)` / `r(32)` visual，造成 visual 溢出 hit frame。真实触控区域必须覆盖完整
可见控件，所以 outer 的契约应是“至少 44pt”，并在 visual 更大时同步增长。

## 3. 设计决策

### 3.1 单一归一化入口

默认 `min=0`、`max=99`、`step=1` 下沉到 pure normalizer；组件不再维护另一份默认
逻辑。normalizer 继续唯一产出：

- `safeMin` / `safeMax` / `safeStep` / `safeValue`
- `rangeDisabled`
- `canDecrement` / `canIncrement`
- 过滤后的 custom `accessibilityActions`

视觉、pointer handler、keyboard handler、native accessibility handler 与所有状态
都消费这份结果。

### 3.2 平台边界

公共 `Stepper.tsx` 负责 state、normalization、frame 结构与可见 visual。平台差异只
下沉到内部 seam：

- native side action 使用 RNGH `Pressable`；
- Web side action 使用 RN core `Pressable`，从而获得 RNW 的 button 键盘激活、
  `disabled`、`aria-disabled` 与 tab order；
- native 中央 driver 提供 RN `accessibilityState`、
  `accessibilityValue`、过滤后的 `accessibilityActions` 和
  `onAccessibilityAction`；
- Web 中央 driver 提供 `aria-disabled`、`aria-valuemin/max/now`、`tabIndex` 和
  keyboard handler。

平台 driver 只能接收 normalized 数据，不得重新校验 raw props 或复制范围算法。

### 3.3 Web slider 键盘契约

中央 Web slider 在非零范围时进入 tab order，并支持：

- `ArrowUp` / `ArrowRight`：increment；
- `ArrowDown` / `ArrowLeft`：decrement；
- `Home`：跳到 `safeMin`；
- `End`：跳到 `safeMax`。

所有已识别的 slider 按键都阻止浏览器默认滚动；只有实际改变值时才调用
`onChange`。边界无效方向是确定性 no-op。`rangeDisabled` 时设置
`aria-disabled=true`、移出 tab order，并完全省略 keyboard handler。

### 3.4 Native adjustable 边界契约

- custom `accessibilityActions` 仍只列出 normalized 后有效的方向；
- side 按钮到边界时继续 disabled 且移除 handler；
- iOS/Android 标准 adjustable 手势若仍派发无效方向，JS handler 必须在
  `onChange` 之前通过 `canIncrement` / `canDecrement` 拦截，成为确定性 no-op；
- 零范围或外部 disabled 时继续完全省略 native action handler 和 action 数组。

文档和 verification matrix 不再声称 iOS 已隐藏无效标准方向；它们分别验证 custom
action 列表、有效方向结果及无效方向不改变业务值。

### 3.5 Frame 契约

pure layout resolver 根据 visual dims 计算：

- side outer width：`max(fixed.hitTarget, dims.btn)`；
- side outer height：`max(fixed.hitTarget, dims.h)`；
- central outer width：`max(fixed.hitTarget, dims.w)`；
- central outer height：`max(fixed.hitTarget, dims.h)`。

visual 仍保持原有 `dims.btn × dims.h` / `dims.w × dims.h`，side visual 继续朝中央贴边。
不得使用 `hitSlop`、padding 或 overflow visual 伪造 frame。

## 4. 自动化门禁

新增或扩展 pure tests：

1. normalizer 直接覆盖真实缺省入口，不再在测试中手写 `0/99/1` 冒充默认；
2. layout resolver 覆盖窄屏、402pt 基线和宽屏 visual，证明 outer 至少 44 且不小于
   visual；
3. side alignment 保持 decrement 靠右、increment 靠左；
4. frame 结果不包含 padding / hitSlop；
5. Web driver 覆盖完整 `aria-*`、tabIndex、Arrow/Home/End、边界 no-op 和
   range-disabled handler omission；
6. 使用 Website 实际 RNW 路径做 SSR/DOM 证据检查，确认中央输出 value、disabled
   与 focus 属性。

Jest 继续只测 pure seam，不新增 renderer 或 snapshot。

## 5. 文档与人工验收

- sm visual 必须写成 `r(28)`，仅 Web / 402pt RN harness 可记录为 28；
- md visual 同理写成 `r(32)` / `r(48)`；
- 所有 outer 统一描述为“至少 44pt”，宽屏按实际 visual 扩展；
- Website 明确源码 native 使用 RNGH，Web side 使用 RN core Pressable seam；
- manual harness 增加 Web keyboard、宽屏 frame 与 native 无效标准方向 no-op 的真实
  检查说明；
- Website/llms 与 sibling `../skills/skills/design/` 的 Stepper 指南在最终计划中
  同步，运行各自验证后才能声明完成。

## 6. 非目标

- 不新增 iOS/Android 原生模块来改写平台 adjustable 协议；
- 不把 visual 强行 cap 到 44；
- 不恢复 optional `accessibilityLabel` 或任何旧兼容分支；
- 不用 Website 构建成功代替 RN 0.86.2 Inspector、VoiceOver/TalkBack 或浏览器读屏
  实测。
