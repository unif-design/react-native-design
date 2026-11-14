---
sidebar_position: 3
title: 间距 · 圆角 · 阴影
description: '间距、圆角和主题阴影的公开设计变量。'
---

# 间距 · 圆角 · 阴影

`space` / `radius` 是静态 token(直接 import),`shadow` 是 themed token(走 hook,暗色自动趋零)。值的真相源是 `src/theme/tokens.ts`(space / radius)与 `src/theme/shadow.ts`(shadow)。

:::info 尺寸会随屏宽缩放
`space` / `radius` 的多数值经 `r()` 做像素对齐缩放(`PixelRatio.roundToNearestPixel`,避免 @3x 屏 0.5px 缝隙;基准宽 402pt)。下表是基准设计值。`radius.pill`(999)是大数哨兵,不缩放。
:::

## 间距 / `space` {#间距}

4px 基准网格。组件内部多用 `5–6`(12–14),板块之间用 `7–9`(16–24)。

| Token         | 基准 px | 常用                        |
| ------------- | ------- | --------------------------- |
| `space.px`    | 1       | hairline 级位移             |
| `space['1']`  | 4       | 最紧间隙                    |
| `space['2']`  | 6       | 图标-文字间隙               |
| `space['3']`  | 8       | 头像-气泡间隙、列表行间 gap |
| `space['4']`  | 10      | 气泡纵向 padding            |
| `space['5']`  | 12      | 气泡横向 padding、栏间距    |
| `space['6']`  | 14      | 卡片 padding                |
| `space['7']`  | 16      | 区块栏间距                  |
| `space['8']`  | 20      | 较大区块间距                |
| `space['9']`  | 24      | Hero padding                |
| `space['10']` | 32      | 通栏区块间距                |

**规则。** 屏幕侧边距 12–16px。气泡 padding `10px 12px`。卡片 `12–14px`。尊重安全区(iOS home indicator 34px)。`space` 的 key 是字符串字面量,取值写 `space['7']` 或 `space[7]`。

## 圆角 / `radius` {#圆角}

小集合,明确分工。最重要的是**气泡的非对称圆角** —— 指向头像的内角是直角。

| Token           | 基准 px | 用途                                   |
| --------------- | ------- | -------------------------------------- |
| `radius.xs`     | 4       | Radio / Checkbox / Tag / Citation 内圈 |
| `radius.sm`     | 6       | 小按钮、徽章                           |
| `radius.md`     | 8       | 输入框、默认按钮                       |
| `radius.lg`     | 10      | 卡片、列表行                           |
| `radius.xl`     | 12      | 大卡片、列表容器                       |
| `radius['2xl']` | 14      | **聊天气泡**                           |
| `radius['3xl']` | 18      | 输入框 wrapper                         |
| `radius.pill`   | 999     | chip、pill(大数哨兵,不缩放)            |

### 非对称圆角示例 {#气泡非对称圆角}

- **AI 气泡** —— `borderRadius: 0 14px 14px 14px`(左上角直角,指向 AI 头像)
- **用户气泡** —— `borderRadius: 14px 0 14px 14px`(右上角直角,指向用户头像)

以下示例说明非对称圆角的写法。实际聊天气泡由 [Chat](https://github.com/unif-design/react-native-chat) 的公开组件维护，Design 不决定消息角色或业务布局。

```tsx
const aiBubble = {
  borderTopLeftRadius: 0, // 直角,指向 AI 头像
  borderTopRightRadius: 14,
  borderBottomLeftRadius: 14,
  borderBottomRightRadius: 14,
};

const userBubble = {
  borderTopLeftRadius: 14,
  borderTopRightRadius: 0, // 直角,指向用户头像
  borderBottomLeftRadius: 14,
  borderBottomRightRadius: 14,
};
```

## 阴影 / `shadow` {#阴影}

中性卡片阴影 + 品牌橙光晕两类。**无内阴影、无霓虹光晕、无双重边框。** `shadow` 是 **themed token** —— 走 `useShadow()` / `useThemedStyles` 第二参 `s` 拿,**暗色下绝大多数 `shadowOpacity` / `elevation` 自动置 0**(深度靠 surface 5 层明度差表达,见[颜色 → 表面](/docs/design/tokens/colors#表面))。

| Token            | 用途                                    | RN(亮色)                                           |
| ---------------- | --------------------------------------- | -------------------------------------------------- |
| `subtle`         | 轻提示浮起(Segmented active 段)         | `{0,1}` · opacity 0.06 · radius 2 · elev 1         |
| `card`           | 标准卡片下沉(Card default)              | `{0,1}` · opacity 0.08 · radius 4 · elev 2         |
| `floating`       | 中性浮岛(贴底浮起胶囊,大半径柔散)       | `{0,16}` · opacity 0.1 · radius 40 · elev 12       |
| `brandSm`        | 品牌光晕 sm(轻量档)                     | 橙 · `{0,6}` · opacity 0.08 · radius 18 · elev 3   |
| `brandMd`        | 品牌光晕 md(主按钮 / Avatar ring)       | 橙 · `{0,12}` · opacity 0.26 · radius 24 · elev 12 |
| `brandLg`        | 品牌光晕 lg(Login Logo halo)            | 橙 · `{0,16}` · opacity 0.22 · radius 36 · elev 12 |
| `brandXl`        | 品牌光晕 xl(Splash Logo 最重浮起)       | 橙 · `{0,20}` · opacity 0.2 · radius 50 · elev 12  |
| `brandAbout`     | About icon halo(brandLg / brandXl 之间) | 橙 · `{0,18}` · opacity 0.28 · radius 40 · elev 12 |
| `brandAssistant` | AssistantCard icon tile(hero 入口加权)  | 橙 · `{0,8}` · opacity 0.3 · radius 18 · elev 12   |
| `brandAvatar`    | Avatar 品牌橙光晕                       | 橙 · `{0,10}` · opacity 0.28 · radius 24 · elev 12 |
| `glassBar`       | GlassStats 数据条专用                   | 橙 · `{0,6}` · opacity 0.08 · radius 18 · elev 3   |
| `none`           | 显式去阴影(列表行 / 设置项)             | 全 0                                               |

> `{w,h}` 是 `shadowOffset`;橙 = `shadowColor: '#EB6E00'`(其余为黑)。完整 5 件套数值见 `src/theme/shadow.ts`。

iOS 的 `card` 使用 `boxShadow` 按容器圆角投影，透明玻璃表面也不需要遍历子树像素；浅色视觉参数仍为黑色 8%、偏移 `0 1`、原生模糊半径 `4`（`boxShadow.blurRadius: 8`），暗色保持无阴影。Android／Web 继续使用原有阴影。请完整使用 `shadow.card`；iOS 的传统 `shadowOpacity` 为 `0`，实际透明度在 `boxShadow.color` 中。覆盖为其他传统阴影时，同时清空 `boxShadow`。去阴影继续直接使用 `shadow.none`，例如 `style={[shadow.card, shadow.none]}`。

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
    card: { ...shadow.card }, // 默认卡片阴影(暗色自动趋零)
    float: { ...shadow.floating }, // 中性浮岛(大半径柔散)
    brand: { ...shadow.brandMd }, // 品牌橙光晕(主按钮 / Avatar ring)
    flat: { ...shadow.none }, // 显式去阴影
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
      ...s.card, // 暗色下 shadowOpacity / elevation 自动趋零
    },
  });
```

颜色与暗色主题见[颜色](/docs/design/tokens/colors)。

### 原生降级表面

组合仍使用普通 `View` 时，通过包根导出的 `useNativeSurfaceStyles()` 取得平台装饰，不在业务页面重复判断系统支持或定义同义阴影。优先使用已有 Card、按钮等组件；这个 hook 只交接外观，不改变调用方布局、尺寸、圆角、内容或交互。

返回对象稳定，包含可选的 `control` / `controlBorder`、`card` / `cardBorder`、`floatingBorder`、`input` / `inputBorder` 与 `welcomeIcon`，以及始终存在的 `floating` 和 `icon`。容器样式放不裁剪的外壳，边线放调用方现有的绝对装饰层；值可以直接用于 `style` 数组，也可以展开进样式对象。

不支持原生玻璃的浅色 iOS／Android 返回四组实体白色表面。其他外观的 `floating` 保留透明底及已有浮层阴影：`shadowColor: colors.scrim`、`shadowOpacity: 0.2`、`shadowRadius: 18`、`shadowOffset: { width: 0, height: 6 }`、`elevation: 8`，不返回 `floatingBorder`。Web 和支持原生玻璃的 iOS 不返回其他容器及边线装饰，减少透明度不会切换到这组新装饰；不支持原生玻璃的暗色另保留已有输入外观（`surfaceContainerHigh`、`shadow.subtle` 与 `outlineVariant`）。浅色输入角色使用 `0 4` 偏移、`0.08` 不透明度、`8` 阴影半径与 Android `elevation: 4`，输入边线为 `0.5` 宽、8% 黑色。

`icon.backgroundColor` 供应用图标交给 `GlassLayer.fallbackColor`：目标浅色原生降级为 `#FDF1E6`，Web 保留 `primaryContainer`，其他原生外观保留 `surfaceContainerHigh`。它只选择图标的回退颜色，不要求任意容器改为灰底。`welcomeIcon` 仅目标浅色原生降级返回 `#FDF1E6` 背景，其他外观继续使用调用方既有欢迎图标底色。

```tsx
const surfaces = useNativeSurfaceStyles();
// layout.card 只保留当前组件原有布局；其他平台得到 undefined，不新增表面。
<View style={[layout.card, surfaces.card]} />;
```

Search 的清除操作使用 `control.xs`（基准 22）的可见表面和 `icon.xxs`（基准 14）的图标；两者随屏宽缩放。交互命中仍不小于 `fixed.hitTarget`（44）。

Search 胶囊使用 `fixed.compactControl`（36pt），不随屏宽变化；相邻圆形操作可向 IconButton 显式传入 `surfaceSize={fixed.compactControl}` 保持等高。IconButton 默认 `md` 档使用随屏宽缩放的 `control.md`（基准 36），与该固定尺寸不是同一个 token。`fixed.hitTarget` 继续提供至少 44pt 的触达范围。
