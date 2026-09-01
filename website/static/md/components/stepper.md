---
sidebar_position: 6
title: Stepper 步进器
description: "数字步进器 [−][N][+] —— md/sm 保持真实 44pt frame，xs 是横向触控小于 44pt 的 dense 紧凑档；formatValue 只格式化可见安全值，数值语义不变。"
---

# Stepper 步进器

数字步进控件——`[−][ N ][+]` 三段拼接，到达 min/max 自动禁用对应按钮。

## 实时预览

下方渲染的就是 `src/components/ui/Stepper/Stepper.tsx` 本体，通过 `react-native-web` 翻译成浏览器节点。

```tsx
const StepperDemo = () => {
  const [a, setA] = useState(12);
  const [b, setB] = useState(0);
  const [c, setC] = useState(50);
  const [compact, setCompact] = useState(4);
  const total = a + b + c;
  const amount = a * 120 + b * 96 + c * 48;
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="demo-label">独立</span>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Stepper value={a} onChange={setA} min={1} max={99} accessibilityLabel="独立商品数量" />
            <Text style={{ fontSize: 13, color: 'var(--ifm-color-emphasis-600)' }}>min=1, max=99</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Stepper
              value={compact}
              onChange={setCompact}
              min={0}
              max={99}
              size="xs"
              formatValue={(value) => `${value} 箱`}
              accessibilityLabel="紧凑整箱数量"
            />
            <Text style={{ fontSize: 13, color: 'var(--ifm-color-emphasis-600)' }}>xs + formatValue</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Stepper
              value={10}
              onChange={setA}
              min={10}
              max={10}
              accessibilityLabel="异常范围数量"
            />
            <Text style={{ fontSize: 13, color: 'var(--ifm-color-emphasis-600)' }}>零范围 / disabled slider</Text>
          </View>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="demo-label">下单清单</span>
          <View style={{ backgroundColor: 'var(--ifm-background-surface-color)', borderRadius: 10, paddingHorizontal: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'var(--ifm-color-emphasis-200)' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: 'var(--ifm-color-emphasis-800)' }}>统一冰红茶</Text>
                <Text style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)' }}>¥120 / 箱 · 库存 50</Text>
              </View>
              <Stepper value={a} onChange={setA} min={0} max={50} accessibilityLabel="统一冰红茶数量" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'var(--ifm-color-emphasis-200)' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: 'var(--ifm-color-emphasis-800)' }}>阿萨姆奶茶</Text>
                <Text style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)' }}>¥96 / 箱 · 库存 80</Text>
              </View>
              <Stepper value={b} onChange={setB} min={0} max={80} accessibilityLabel="阿萨姆奶茶数量" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: 'var(--ifm-color-emphasis-800)' }}>老坛酸菜面</Text>
                <Text style={{ fontSize: 12, color: 'var(--ifm-color-emphasis-600)' }}>¥48 / 箱 · 库存 30</Text>
              </View>
              <Stepper value={c} onChange={setC} min={0} max={30} accessibilityLabel="老坛酸菜面数量" />
            </View>
          </View>
        </div>
        <span style={{ fontSize: 13, color: 'var(--ifm-color-emphasis-600)' }}>合计 {total} 箱 · ¥{amount.toLocaleString()}</span>
      </div>
    </>
  );
};
```

## 视觉规范

来源：`src/components/ui/Stepper/styles.ts`、`Stepper.tsx`。

| 元素 | 规则 |
|---|---|
| 实际交互 frame | md/sm 三个 outer 均至少 `fixed.hitTarget`，不加 hitSlop；xs 是明确的 dense 例外：左右 outer 为 `r(24) × 44`，中央 adjustable 为 `r(40) × 44`，三块相邻且互不重叠，不加 hitSlop 或根 padding，Web / 402pt RN harness 总宽 88pt |
| visual 高度 | xs `r(24)`、sm `r(28)`、md `r(32)`；只有 Web / 402pt RN harness 得到 24/28/32/40/48 的基准值，其他 native window 按实际 `r()` 结果 |
| 圆角 | 8px（`radius.md`，外层左右两角），中间数字框无独立圆角 |
| 按钮 visual | md `r(32)²` / sm `r(28)²` / xs `r(24)²`，嵌在 side outer 内并朝中央贴边；`±` 基准字号 18px（`type.h1`），按 fontScale 缩放一次 |
| 数值 visual | md `r(48) × r(32)` / sm `r(40) × r(28)` / xs `r(40) × r(24)`；1px 上下边线、无左右边线，基准字号 md 14 / sm 13 / xs 11，按 fontScale 缩放一次；`formatValue` 只替换可见文案 |
| 背景 / 描边 | `c.surface` 底 + 1px `c.outline`（亮色 `#EDEDED`）边 |
| 禁用 | 按钮 `opacity: 0.4`（达到 min/max 或整体 `disabled` 时；按下 0.7） |

`ThemeProvider fontScale` 只改变 `±` 与中央数值的文字 metric。三个 visual wrapper、md/sm 至少 44pt 的 outer frame、xs 高 44pt 且横向小于 44pt 的 dense outer、边框、圆角和点击布局都不缩放；动态中央字号不会再经过 `useThemedStyles` 二次处理。

## 用法

```tsx
import { Stepper } from '@unif/react-native-design';

const [qty, setQty] = useState(12);

<Stepper
  value={qty}
  onChange={setQty}
  min={1}
  max={99}
  accessibilityLabel="商品数量"
/>

{/* 自定义步长 */}
<Stepper
  value={packs}
  onChange={setPacks}
  step={6}
  min={0}
  max={120}
  accessibilityLabel="整箱数量"
/>

{/* 小尺寸 */}
<Stepper
  size="sm"
  value={n}
  onChange={setN}
  min={0}
  max={9}
  accessibilityLabel="套餐数量"
/>

{/* 紧凑视觉 + 单位文案；不需要覆盖中央值样式 */}
<Stepper
  size="xs"
  value={packs}
  onChange={setPacks}
  min={0}
  max={99}
  formatValue={(value) => `${value} 箱`}
  accessibilityLabel="整箱数量"
/>

{/* 原始 min > max 会折叠为零范围：显示 10，三个操作节点全部禁用 */}
<Stepper
  value={5}
  onChange={setQty}
  min={10}
  max={0}
  accessibilityLabel="异常范围数量"
/>
```

## API

来源：`src/components/ui/Stepper/types.ts`、`Stepper.tsx`。

| Prop | Type | 默认 | 说明 |
|---|---|---|---|
| `value` | `number` | — | 当前值（受控，必填） |
| `onChange` | `(value: number) => void` | — | 变更回调（已自动夹到 `[min, max]`，必填） |
| `accessibilityLabel` | `string` | — | 中央 adjustable 的上下文名称（必填）；左右按钮自动组合“`${label}，减少` / `${label}，增加`” |
| `min` | `number?` | `0` | 下限（达到时 `−` 禁用） |
| `max` | `number?` | `99` | 上限（达到时 `+` 禁用） |
| `step` | `number?` | `1` | 步长（非正数 / 非有限数回退为 1） |
| `size` | `'xs' \| 'sm' \| 'md'` | `'md'` | visual 高度 `r(24)` / `r(28)` / `r(32)`；xs 是横向触控小于 44pt 的 dense 紧凑档（类似 Segmented sm），sm/md 行为不变 |
| `formatValue` | `(value: number) => string` | — | 格式化中央可见文案；入参是归一化后的安全值，运算与 adjustable `now` 仍为 number |
| `disabled` | `boolean?` | `false` | 整体禁用（三个操作节点都不暴露 action） |
| `testID` | `string?` | — | 根定位；派生三个 outer `-decrement` / `-value` / `-increment` 与对应 `-*-visual` |

> 归一化边界：缺省仍是 `min=0`、`max=99`、`step=1`。只有 `typeof === 'number' && Number.isFinite(...)` 的输入参与运算；字符串、对象、NaN、Infinity 等未类型化值不会产生 NaN。非法 `min` 回退 0，非法 `max` 或 `max < safeMin` 折叠到 `safeMin`，非法/非正 `step` 回退 1，非法 `value` 回退 `safeMin`。`formatValue` 在归一化后调用。零范围、外部 `disabled` 与空白业务名称都不会暴露任何 action。无 `style`、`valueStyle` 或 `buttonStyle` prop。

## 无障碍（a11y）

来源：`src/components/ui/Stepper/Stepper.tsx`、`accessibility.ts`、
`accessibility.web.ts`、`types.ts`。

- 默认 role：`−` / `+` 两个 outer `<Pressable>` 是 button；中央 outer `<View>` 在 native 是 `'adjustable'`，在 Web 映射为 `role="slider"`。根 `<View>` 不设 role，内部 visual 子树隐藏出 a11y tree。
- accessible name：trim 后非空的必填 `accessibilityLabel` 命名中央 adjustable；左右按钮组合“`${accessibilityLabel}，减少` / `${accessibilityLabel}，增加`”。空白名称会禁用并移除三个 action/role 语义，在 effect 诊断。
- 单一归一化结果同时驱动可见值、disabled opacity、side/native/Web handler 和状态。native custom `accessibilityActions` 到 `safeMin` 只列 `increment`、到 `safeMax` 只列 `decrement`；标准 adjustable 手势仍可能派发无效方向，driver 会在调用 `onChange` 前将其确定性 no-op。
- Web 中央 slider 显式输出 `aria-disabled`、`aria-valuemin/max/now` 与 tab order；ArrowUp/Right 增加，ArrowDown/Left 减少，Home/End 跳到上下限。已识别的边界按键仍阻止浏览器默认行为，但不会发出无效变更。
- 外部 `disabled` 或零范围时，native 中央完全省略 `accessibilityActions` 与 `onAccessibilityAction`；Web 中央设置 `aria-disabled=true`、`tabIndex=-1` 并省略键盘 handler。两个侧按钮也都 disabled 且没有 handler。
- 两侧采用 platform seam：native 使用 RNGH `Pressable`，Web 使用 RN core `Pressable`，不依赖 Website 的仓库级 RNGH shim。

```tsx
<Stepper
  value={qty}
  onChange={setQty}
  min={1}
  max={99}
  accessibilityLabel="统一冰红茶数量"
/>
```

## Native / Web 人工测量

在 runtime harness 的 Stepper 区用 Inspector 测量：

| 节点 | testID | 预期布局 |
|---|---|---|
| md/sm 左右 outer platform Pressable | `stepper-middle-decrement` / `stepper-middle-increment` | native 为 RNGH、Web 为 RN core；side outer = max(44, visual button width) × max(44, visual height)，透明、无 `hitSlop`；visual 朝中央贴边 |
| md/sm 中央 adjustable outer | `stepper-middle-value` | value outer = max(44, visual value width) × max(44, visual height) |
| xs 三个 outer | `stepper-compact-decrement` / `stepper-compact-value` / `stepper-compact-increment` | `r(24)×44 / r(40)×44 / r(24)×44`；无 `hitSlop`、无根 padding，三块互不重叠；Web / 402pt RN harness 总宽 88pt，横向触控小于 44pt |
| md visual wrappers | 对应 `-decrement-visual` / `-value-visual` / `-increment-visual` | 实现为 `r(32)×r(32)` / `r(48)×r(32)` / `r(32)×r(32)`；Web 与 402pt RN harness 是 32×32 / 48×32 / 32×32，其他 native window 按实际 `r()` 结果 |
| sm visual wrappers | `stepper-zero-range-*-visual` | `r(28)×r(28) / r(40)×r(28) / r(28)×r(28)`；outer 按 md/sm 公式至少 44pt |

Web Inspector 检查中央 `role=slider`、`aria-valuemin/max/now`、disabled 与 tab order；键盘逐一验证 ArrowUp/Right、ArrowDown/Left、Home、End。iOS 需要分别检查过滤后的 custom action 列表与标准 adjustable 手势：无效标准方向可能派发，但业务值和 unexpected 计数必须不变。RN 宽屏 Inspector 还要确认动态 outer 包住完整 scaled visual。`stepper-zero-range-value` 必须上报 disabled 且没有 handler。这些人工行只有真实执行后才能记为 PASS。

## 不要

- ❌ 不要用覆盖层替换 Stepper 中央值；单位文案用 `formatValue`，数值行为仍由 Stepper 持有
- ❌ 不要省略或复用无上下文的 `accessibilityLabel`——名称应说明正在调整哪个业务值
- ❌ 不要去掉描边或圆角——Stepper 必须看起来"可点击"
