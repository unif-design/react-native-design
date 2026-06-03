---
sidebar_position: 3
title: 间距 · 圆角 · 阴影
description: "Unif Design 的 space（4px 网格）/ radius（含气泡非对称圆角）/ shadow（themed，brandLg 等品牌光晕，暗色趋零）token，值取自 src/theme。"
---

# 间距 · 圆角 · 阴影

`space` / `radius` 是静态 token(直接 import),`shadow` 是 themed token(走 hook,暗色自动趋零)。值的真相源是 `src/theme/tokens.ts`(space / radius)与 `src/theme/shadow.ts`(shadow)。

:::info 尺寸会随屏宽缩放
`space` / `radius` 的多数值经 `r()` 做像素对齐缩放(`PixelRatio.roundToNearestPixel`,避免 @3x 屏 0.5px 缝隙;基准宽 402pt)。下表是基准设计值。`radius.pill`(999)是大数哨兵,不缩放。
:::

## 间距 / `space` {#间距}

4px 基准网格。组件内部多用 `5–6`(12–14),板块之间用 `7–9`(16–24)。

| Token | 基准 px | 常用 |
|---|---|---|
| `space.px` | 1 | hairline 级位移 |
| `space['1']` | 4 | 最紧间隙 |
| `space['2']` | 6 | 图标-文字间隙 |
| `space['3']` | 8 | 头像-气泡间隙、列表行间 gap |
| `space['4']` | 10 | 气泡纵向 padding |
| `space['5']` | 12 | 气泡横向 padding、栏间距 |
| `space['6']` | 14 | 卡片 padding |
| `space['7']` | 16 | 区块栏间距 |
| `space['8']` | 20 | 较大区块间距 |
| `space['9']` | 24 | Hero padding |
| `space['10']` | 32 | 通栏区块间距 |

**规则。** 屏幕侧边距 12–16px。气泡 padding `10px 12px`。卡片 `12–14px`。尊重安全区(iOS home indicator 34px)。`space` 的 key 是字符串字面量,取值写 `space['7']` 或 `space[7]`。

## 圆角 / `radius` {#圆角}

小集合,明确分工。最重要的是**气泡的非对称圆角** —— 指向头像的内角是直角。

| Token | 基准 px | 用途 |
|---|---|---|
| `radius.xs` | 4 | Radio / Checkbox / Tag / Citation 内圈 |
| `radius.sm` | 6 | 小按钮、徽章 |
| `radius.md` | 8 | 输入框、默认按钮 |
| `radius.lg` | 10 | 卡片、列表行 |
| `radius.xl` | 12 | 大卡片、列表容器 |
| `radius['2xl']` | 14 | **聊天气泡** |
| `radius['3xl']` | 18 | 输入框 wrapper |
| `radius.pill` | 999 | chip、pill(大数哨兵,不缩放) |

### 气泡的非对称圆角(核心) {#气泡非对称圆角}

- **AI 气泡** —— `borderRadius: 0 14px 14px 14px`(左上角直角,指向 AI 头像)
- **用户气泡** —— `borderRadius: 14px 0 14px 14px`(右上角直角,指向用户头像)

直角指向头像,是设计系统最辨识度的视觉符号,**不要破坏**(见[设计原则 → 气泡内角方](/docs/design/principles#气泡内角方))。

```tsx
const aiBubble = {
  borderTopLeftRadius: 0,         // 直角,指向 AI 头像
  borderTopRightRadius: 14,
  borderBottomLeftRadius: 14,
  borderBottomRightRadius: 14,
};

const userBubble = {
  borderTopLeftRadius: 14,
  borderTopRightRadius: 0,        // 直角,指向用户头像
  borderBottomLeftRadius: 14,
  borderBottomRightRadius: 14,
};
```

## 阴影 / `shadow` {#阴影}

中性卡片阴影 + 品牌橙光晕两类。**无内阴影、无霓虹光晕、无双重边框。** `shadow` 是 **themed token** —— 走 `useShadow()` / `useThemedStyles` 第二参 `s` 拿,**暗色下绝大多数 `shadowOpacity` / `elevation` 自动置 0**(深度靠 surface 5 层明度差表达,见[颜色 → 表面](/docs/design/tokens/colors#表面))。

| Token | 用途 | RN(亮色) |
|---|---|---|
| `subtle` | 轻提示浮起(Segmented active 段) | `{0,1}` · opacity 0.06 · radius 2 · elev 1 |
| `card` | 标准卡片下沉(Card default) | `{0,1}` · opacity 0.08 · radius 4 · elev 2 |
| `floating` | 中性浮岛(贴底浮起胶囊,大半径柔散) | `{0,16}` · opacity 0.1 · radius 40 · elev 12 |
| `brandSm` | 品牌光晕 sm(轻量档) | 橙 · `{0,6}` · opacity 0.08 · radius 18 · elev 3 |
| `brandMd` | 品牌光晕 md(主按钮 / Avatar ring) | 橙 · `{0,12}` · opacity 0.26 · radius 24 · elev 12 |
| `brandLg` | 品牌光晕 lg(Login Logo halo) | 橙 · `{0,16}` · opacity 0.22 · radius 36 · elev 12 |
| `brandXl` | 品牌光晕 xl(Splash Logo 最重浮起) | 橙 · `{0,20}` · opacity 0.2 · radius 50 · elev 12 |
| `brandAbout` | About icon halo(brandLg / brandXl 之间) | 橙 · `{0,18}` · opacity 0.28 · radius 40 · elev 12 |
| `brandAssistant` | AssistantCard icon tile(hero 入口加权) | 橙 · `{0,8}` · opacity 0.3 · radius 18 · elev 12 |
| `brandAvatar` | Avatar 品牌橙光晕 | 橙 · `{0,10}` · opacity 0.28 · radius 24 · elev 12 |
| `glassBar` | GlassStats 数据条专用 | 橙 · `{0,6}` · opacity 0.08 · radius 18 · elev 3 |
| `none` | 显式去阴影(列表行 / 设置项) | 全 0 |

> `{w,h}` 是 `shadowOffset`;橙 = `shadowColor: '#EB6E00'`(其余为黑)。完整 5 件套数值见 `src/theme/shadow.ts`。

:::note 暗色例外项
暗色下 `subtle` / `card` / `brand*` 多数置零,但 **`floating` / `glassBar`(黑色 drop shadow)与 `brandAvatar`(橙光晕)在暗色不置零** —— 否则浮岛 / 数据条 / 头像在暗底上贴平、看不出层级。每个例外在源码里都注释了原因。
:::

确认卡片用 `2px` 彩色边框(橙 / 绿 / 灰),**不带阴影**。

```tsx
import { StyleSheet } from 'react-native';
import { useShadow, space, radius } from '@unif/react-native-design';

// 方式一:useShadow() 直接拿
function Demo() {
  const shadow = useShadow();
  const styles = StyleSheet.create({
    card:  { ...shadow.card },        // 默认卡片阴影(暗色自动趋零)
    float: { ...shadow.floating },    // 中性浮岛(大半径柔散)
    brand: { ...shadow.brandMd },     // 品牌橙光晕(主按钮 / Avatar ring)
    flat:  { ...shadow.none },        // 显式去阴影
  });
  // ...
}
```

```tsx
// 方式二(推荐):useThemedStyles 第二参 s 注入,与 colors 一起 memo
import { useThemedStyles } from '@unif/react-native-design';
import type { ColorTokens, ShadowTokens } from '@unif/react-native-design';

const makeStyles = (c: ColorTokens, s: ShadowTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: space['6'],
      ...s.card,                      // 暗色下 shadowOpacity / elevation 自动趋零
    },
  });
```

> 完整 token 速查与暗色哲学,见[完整规范](/docs/unif-design)的 Spacing / Radii / Shadows 三节。
