---
sidebar_position: 1
title: GlassStats 玻璃数据条
description: '以多列数字和标签展示统计摘要。'
---

<!-- Generated from @unif/react-native-design@0.32.0; edit source documentation. -->

# GlassStats 玻璃数据条

展示多列数字与标签。数据由调用方格式化，组件负责排列和视觉呈现。

数据格式是元组 `[count, label]`,count 已经格式化好(如 `'12'` / `'¥2,016'` / `'99+'`),组件不做格式化。

## 代码演示 {#实时预览}

下方渲染的就是 `src/components/business/GlassStats/GlassStats.tsx` 本体。

```tsx
  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">2 列</span>
      <GlassStats
        items={[
          ['12', '今日'],
          ['86', '本月'],
        ]}
      />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">3 列 · 个人业绩</span>
      <GlassStats
        items={[
          ['¥2,016', '销售额'],
          ['28', '订单'],
          ['12', '客户'],
        ]}
      />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">4 列 · 综合统计</span>
      <GlassStats
        items={[
          ['256', '总数'],
          ['18', '本周'],
          ['¥12.3万', '金额'],
          ['98%', '完成率'],
        ]}
      />
    </div>
  </div>
```

## 用法

```tsx
import { GlassStats } from '@unif/react-native-design';

{
  /* 个人名片屏业绩 */
}
<GlassStats
  items={[
    [String(visitCount), '本月拜访'],
    [`¥${formatAmount(amount)}`, '销售额'],
    [String(orderCount), '订单'],
  ]}
/>;
```

## API

| 参数    | 类型                                            | 必填 | 说明                                                       |
| ------- | ----------------------------------------------- | ---- | ---------------------------------------------------------- |
| `items` | `ReadonlyArray<[count: string, label: string]>` | ✓    | 数据列,2~4 列均可。`count` 已格式化字串,`label` 是中文标签 |

## 无障碍（a11y）

来源：`src/components/business/GlassStats/GlassStats.tsx`、`types.ts`。

本组件为纯数据展示条,无交互。源码全是 `<View>` + `<Text>`(每列一个 `count` 文本 + 一个 `label` 文本),**未设置任何 a11y prop**(无 `accessibilityRole` / `accessibilityLabel`),也没有可传的 a11y prop(仅 `items`)。底层 `<Text>` 默认对 SR 可读,会按「数字 + 标签」顺序逐列朗读;配套的 `BlurLayer` 是 `pointerEvents="none"` 装饰层。无受控状态(checked/selected/disabled 均不适用)。

## 视觉规范

来源：`src/components/business/GlassStats/styles.ts`（值取自 `src/theme/{tokens,colors,shadow}.ts`）。

| 元素       | 规则                                                                                                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| count 字号 | `rf(20)`（本地常量,无对应 type token）· `fw.bold` · `c.foreground` · `fontFamily: fontMono` · `letterSpacing: -0.3`                                                                           |
| label 字号 | `t.micro`（11）· `c.foregroundMuted` · `paddingTop: space[1]`                                                                                                                                 |
| 列间分隔   | `StyleSheet.hairlineWidth` 竖线 · `c.glassSeparator`（亮色 `rgba(0,0,0,0.08)`）                                                                                                               |
| 容器       | 双层：外层 `glassShell` 仅 `radius['2xl']`（14）+ `s.glassBar` shadow；内层 `glass` `radius['2xl']` + `overflow:hidden` + `c.glassBorder` 边框；顶部 1px inset 高光线 `c.glassStatsHighlight` |
| 玻璃底     | 由 `<BlurLayer intensity="soft" />` 接管（BlurView + `c.glassTintLight` 白纱），随 light/dark scheme 自动切                                                                                   |

## 使用注意

- 不要在组件内做数字格式化 —— 业务层(`@/utils/format`)做好再传入,避免 i18n / 千分位 / 单位逻辑散落
- 不要超过 4 列 —— 屏宽限制,5 列以上 label 会挤换行,改用 [Cell](cell.md) 列表
- 不要单列用 —— 单数字直接用 `<Text>` + `t.heroLg`,没必要套 GlassStats 的胶囊容器
