---
slug: /unif-design
title: Unif Design — 完整规范
description: 单文件设计宪法（品牌 / 5 原则 / tokens / 组件 / Don'ts），与拆分文档形成冗余备份
sidebar_label: 完整规范
---

# Unif Design

**Brand:** Unif (统一企业 / Uni-President China)
**Version:** 1.0
**Source-of-truth code:** `src/theme/`, `src/components/ui/`, `src/components/chat/`, `src/components/business/`

---

## 1. Brand & voice

### Casing
- Master brand is **Unif** — never `UNIF`, `unif`, or hyphenated.
- Sub-products take the form `Unif <中文名>` (single half-width space).
- Single half-width space between Latin and CJK glyphs.

### Language
- **Chinese-first.** All UI labels, buttons, placeholders, errors are Simplified Chinese.
- English appears only in code identifiers, the wordmark, and brand names.

### Tone
- Calm, instructional, slightly formal.
- The assistant is a colleague who already knows the rep's territory.
- Never chatty, never apologetic.
- Sentences are short. Verbs lead. **No exclamation points.**

### Person
- Assistant: `AI` or `助手` (in avatars).
- User: `我` (in their own avatar).
- Body copy avoids first/second person. State facts: `已思考 3s`, `正在执行…`, `AI 回复中…`.

### Status copy (template-literal short)
| State | Copy |
|---|---|
| Tool running | `执行中` |
| Tool done | `完成` (or `完成 · 0.6s`) |
| Tool failed | `失败` |
| Reasoning active | `思考中…` |
| Reasoning done | `已思考 3s` |
| Confirm pending | `操作确认` |
| Confirm done | `已确认，正在执行…` |
| Confirm cancelled | `已取消` |
| Send error | `发送失败，请重试` |
| Input idle | `输入消息…` |
| Input streaming | `AI 回复中…` |

### Suggestion chips (empty state)
Written as the user would speak — questions and imperatives, **no period**:
- `今天要拜访哪些客户？`
- `帮我查一下今天的计划`
- `新建一个拜访记录`

### Punctuation
- Chinese full-width: `，` `。` `？` `：`
- Western ellipsis `…` is acceptable for streaming/loading.
- Middle-dot `·` separates inline metadata: `name · address`.

### Emoji
**Never.** No flag emoji, stickers, decorative glyphs. Functional state goes through icons. If a glyph isn't load-bearing, it isn't there.

---

## 2. Design principles (5)

1. **中文优先.** All UI in Simplified Chinese. English only in brand and code.
2. **橙色克制.** `#EB6E00` only on primary buttons, user bubble, active tabs, key emphasis. Blue (`#3775F6`) reserved exclusively for the user avatar.
3. **无装饰.** No illustrations, gradient backgrounds, decorative emoji. All icons are hand-authored 24×24 stroked SVG.
4. **列表用 gap，不用 border.** Each row is its own white card; gaps between rows form groups (iOS 17 / WeChat-new style).
5. **气泡内角方.** Chat bubbles use 14px corner radius — but the corner pointing toward the avatar is **squared off (0)**. This is Unif's most distinctive visual signature.

---

## 3. Color system

> Tokens 按 Material 3 system tokens 风格 role 化命名；不引入 reference layer / tonal palette。
> 主题切换跟随系统（`useColorScheme()`），亮 / 暗各一套值，role 名固定不变。

### 3.1 Brand

| role | light | dark | use |
|---|---|---|---|
| `primary` | `#EB6E00` | `#EB6E00` | 品牌橙；亮 / 暗共用（brand identity 不变） |
| `primaryPressed` | `#D06200` | `#D06200` | 按下态；亮 / 暗共用 |
| `primaryContainer` | `#FFF5EB` | `#3D1F00` | 高亮选中背景 |
| `primaryContainerSubtle` | `#FFF8F0` | `#2A1500` | Card 选中背景 |
| `onPrimary` | `#FFFFFF` | `#FFFFFF` | brand 上的内容色 |
| `onPrimaryMuted` | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.85)` | brand 上的次级文字 |

**Avatar gradient**（数组、不暴露为 role）：
- `avatarGradient: ['#F49443', '#EB6E00']`（135°，Me hero 头像;亮 / 暗共用）

Flat orange `#EB6E00` is acceptable in 90% of cases. Don't introduce new gradients.

> 历史:旧 `brandGradient` / `brandGradientSoft` 0 消费已删(2026-05 dead code 清理)。

### 3.2 Semantic

| role | light | dark | use |
|---|---|---|---|
| `success` | `#52C41A` | `#52C41A` | 成功态 |
| `successContainer` | `#F0FFF0` | `#0E2810` | success badge bg |
| `onSuccess` | `#FFFFFF` | `#FFFFFF` | success 上的内容 |
| `error` | `#F4511E` | `#FF6B40` | 错误 / destructive |
| `errorContainer` | `#FFF5F5` | `#2A1010` | error badge bg |
| `onError` | `#FFFFFF` | `#FFFFFF` | error 上的内容 |
| `info` | `#3775F6` | `#5A91FF` | **User avatar only** by Unif spec；Tag info variant 沿用 |
| `infoContainer` | `#F0F5FF` | `#0F1A33` | info badge bg |
| `onInfo` | `#FFFFFF` | `#FFFFFF` | info 上的内容 |

### 3.3 Surface (5 layers)

| role | light | dark | use |
|---|---|---|---|
| `background` | `#F5F5F5` | `#0A0A0A` | 整页底色（OLED 友好） |
| `surface` | `#FFFFFF` | `#1C1C1E` | Card / Sheet / 气泡 |
| `surfaceContainer` | `#F5F5F5` | `#2C2C2E` | 卡片内输入框 / 次级 |
| `surfaceContainerHigh` | `#F0F0F0` | `#3A3A3C` | secondary button / 按下态 |
| `surfaceContainerHighest` | `#E0E0E0` | `#48484A` | disabled button / pill |

### 3.4 Foreground

| role | light | dark | use |
|---|---|---|---|
| `foreground` | `#333333` | `#FFFFFF` | 主文字 |
| `foregroundMuted` | `#666666` | `rgba(235,235,245,0.6)` | 次级文字 |
| `foregroundSubtle` | `#999999` | `rgba(235,235,245,0.3)` | 三级文字 / placeholder |
| `onSurface` | = `foreground` | = `foreground` | 别名 |
| `onSurfaceMuted` | = `foregroundMuted` | = `foregroundMuted` | 别名 |

### 3.5 Outline

| role | light | dark | use |
|---|---|---|---|
| `outline` | `#EDEDED` | `#3A3A3C` | 默认 hairline |
| `outlineVariant` | `#E8E8E8` | `#48484A` | 次级 hairline |
| `outlineFaint` | `#F5F5F5` | `rgba(84,84,88,0.65)` | 最弱 hairline |

### 3.6 Inverse

| role | light | dark | use |
|---|---|---|---|
| `inverseSurface` | `#1C1C1E` | `#FFFFFF` | toast / tooltip 反色 bg |
| `inverseOnSurface` | `#FFFFFF` | `#000000` | inverseSurface 上的内容 |

### 3.7 Misc

| role | light | dark | use |
|---|---|---|---|
| `scrim` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Sheet 遮罩；暗色加深 |

### 3.8 Why role-based, no reference layer

行业（Material 3 / Apple HIG / Tailwind / GitHub Primer / IBM Carbon）共识：design token 应按 **角色** 命名（`primary` / `surface` / `outline`），而不是按强度档（`gray100` / `orange500`）。Unif 不引入 Material 3 的 reference layer / tonal palette，理由：

1. reference layer 的真正价值在于"多 brand / 多产品共享 palette"——Google 80+ 产品共享 neutral 灰阶。Unif 单 brand 单 app，无此需求
2. HCT 算法吐出 ~80 个 reference token，role 层只引用 ~20 个，剩下 60+ 是死代码
3. 现有 brand palette 是手工 8 档（`primary0/.../600`），跟 M3 13 档 tone 不对齐——引入 reference 等于推倒重做 brand
4. role 层已是组件需要的全部抽象。reference 多一层间接、无功能收益
5. Tailwind / shadcn-ui 也是单层 role + hex，生态无差异

未来要加 reference 是纯加法演进：role 中的 hex 抽到 `reference.primary.tone40`，role 改成引用 reference。组件代码 0 改动。

### 3.9 Dark mode philosophy

- **iOS HIG dark 风格**：纯黑 / 近黑 background（`#0A0A0A`）+ 深灰多层 surface（`#1C / #2C / #3A / #48`）。OLED 友好；跟亮色源同根（"iOS 17 / WeChat-new style"）
- **Brand 橙保留原值**（亮 / 暗均 `#EB6E00`）：在 `#0A0A0A` 上对比度 4.36:1 过 WCAG AA，无需调亮，brand identity 不变
- **layered surface 替代 shadow**：暗色下 `shadow.card` / `shadow.brandMd` 的 shadowOpacity / elevation 全部置 0；视觉层次靠 surface 5 层明度差表达
- **跟 §2 "无装饰" 哲学一致**：暗色态进一步纯化，"内角方"气泡视觉签名（§2 第 5 条）完全保留

### 3.10 Migration map（旧 token → 新 role）

老代码迁移 grep 用：

| 旧 | 新 |
|---|---|
| `colors.bgPage` | `c.background` |
| `colors.bgCard` | `c.surface` |
| `colors.bgInput` | `c.surfaceContainer` |
| `colors.bgMuted` | `c.surfaceContainerHigh` |
| `colors.bgPill` | `c.surfaceContainerHighest` |
| `colors.fg1` / `fg2` / `fg3` | `c.foreground` / `c.foregroundMuted` / `c.foregroundSubtle` |
| `colors.fgOnBrand` | `c.onPrimary` |
| `colors.primary300` / `500` | `c.primary` / `c.primaryPressed` |
| `colors.primary0` / `50` | `c.primaryContainer` / `c.primaryContainerSubtle` |
| `colors.primary100` / `200` / `400` | 已删（旧 `brandGradient` 数组同步移除,0 消费方）|
| `colors.primary600` | 已删除（grep 验证 0 消费方）|
| `colors.success300` / `successBg` | `c.success` / `c.successContainer` |
| `colors.error300` / `error0` | `c.error` / `c.errorContainer` |
| `colors.info300` / `infoBg` | `c.info` / `c.infoContainer` |
| `colors.border` / `borderSoft` / `borderFaint` | `c.outline` / `c.outlineVariant` / `c.outlineFaint` |
| `colors.scrim` | `c.scrim`（不变） |

### 3.11 Rules（不变）

- No near-black, no off-white, no tinted greys. Keep neutrals true.
- Brand 橙只在 primary buttons / user bubble / active tabs / key emphasis。
- Blue (`info`) reserved for user avatar (Tag info variant 历史沿用，不扩散到其他场景)。

---

## 4. Typography

### Font stack (system only — no webfonts)
```
-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB",
"Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif
```
Mono: `"SF Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace`

The brand explicitly relies on the OS to render its own native CJK type. **Don't introduce webfonts.**

### Type scale (mobile-first)
| Token | Size | Use |
|---|---|---|
| `display` | 22px | Brand title |
| `h1` | 18px | Screen title |
| `h2` | 17px | Section title |
| `h3` | 15px | Card title / body emphasis |
| `body` | 15px | Default body |
| `sm` | 14px | Secondary body / button |
| `xs` | 13px | Hints, descriptions |
| `2xs` | 12px | Meta, captions |
| `micro` | 11px | Badges, tool names |

### Line height
| Token | Value | Use |
|---|---|---|
| `tight` | 1.25 | Headings |
| `body` | 1.45 | Body paragraphs (~22/15) |

### Weights
`400` regular · `500` medium · `600` semi · `700` bold · `800` heavy

Numerals and code-style metadata may use the mono stack.

---

## 5. Spacing

4-px base. Use these values:
| Token | px | Common use |
|---|---|---|
| `1` | 4 | Tightest gaps |
| `2` | 6 | Icon-text gaps |
| `3` | 8 | Avatar-bubble gap |
| `4` | 10 | Bubble vertical padding |
| `5` | 12 | Bubble horizontal padding, gutter |
| `6` | 14 | Card padding |
| `7` | 16 | Section gutter |
| `8` | 20 | Larger section gap |
| `9` | 24 | Hero padding |
| `10` | 32 | Full-bleed section gap |

**Rules.** 12–16px gutter on screens. Bubble padding `10px 12px`. Cards `12–14px`. Respect safe-area insets at top and bottom (iOS home indicator: 34px).

---

## 6. Radii

| Token | px | Use |
|---|---|---|
| `sm` | 6 | Small buttons, badges (4 — special micro case) |
| `md` | 8 | Inputs, default buttons |
| `lg` | 10 | Cards, list rows |
| `xl` | 12 | Cards (large), list container |
| `2xl` | 14 | **Chat bubbles** |
| `3xl` | 18 | Prompt input wrapper |
| `pill` | 999 | Chips, pills |

### The bubble motif (signature)
- **AI bubble:** `border-radius: 0 14px 14px 14px` (TL squared)
- **User bubble:** `border-radius: 14px 0 14px 14px` (TR squared)

The squared corner points toward the avatar. This is the most recognizable Unif UI motif — preserve it.

---

## 7. Shadows

Single subtle drop shadow for cards. **No** inner shadows, neon glows, or double borders.

| Token | Use | RN (light) |
|---|---|---|
| `subtle` | Segmented active 段等轻提示浮起 | `shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: {0,1}, elevation: 1` |
| `card` | 标准卡片下沉（Card default） | `shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: {0,1}, elevation: 2` |
| `pop` | 强调操作 / popper | `shadowColor: #EB6E00, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: {0,4}, elevation: 6` |
| `brandSm` | 玻璃数据条等次要装饰 | `shadowColor: #EB6E00, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: {0,6}, elevation: 3` |
| `brandMd` | 主按钮 / Avatar ring 中等强调 | `shadowColor: #EB6E00, shadowOpacity: 0.26, shadowRadius: 24, shadowOffset: {0,12}, elevation: 12` |
| `brandLg` | Login Logo 头像悬浮 | `shadowColor: #EB6E00, shadowOpacity: 0.22, shadowRadius: 36, shadowOffset: {0,16}, elevation: 12` |
| `brandXl` | Splash Logo 启动屏最重浮起 | `shadowColor: #EB6E00, shadowOpacity: 0.20, shadowRadius: 50, shadowOffset: {0,20}, elevation: 12` |
| `brandAbout` | About icon halo(比 brandLg 重一档) | `shadowColor: #EB6E00, shadowOpacity: 0.28, shadowRadius: 40, shadowOffset: {0,18}, elevation: 12` |
| `none` | 列表行 / 设置项 | 全 0 |

**暗色态：layered surface 替代 shadow。** 所有 shadow token 在暗色下 `shadowOpacity` / `elevation` 全部置 0；视觉层次靠 `surface` 5 层明度差表达（`background` → `surface` → `surfaceContainer` → `surfaceContainerHigh` → `surfaceContainerHighest`，见 §3.3）。这是 iOS HIG dark / Material 3 dark 的标准做法。

Confirmation cards use `2px` colored border (orange/green/grey) with **no shadow**.

---

## 8. Motion

Functional and quick. Fades + layout animations only. **No bounce, no spring, no scale-on-mount.** Respect reduced-motion.

| Token | Value | Use |
|---|---|---|
| `fast` | 150ms | Press states, hovers |
| `base` | 200ms | Segmented-control slider, layout shifts |
| `slow` | 300ms | Sheet transitions |
| `pulse` | 1600ms loop | Reasoning spark pulse (full cycle = 2 × 700ms 内通过 `usePulse` 半周期实现，token 仅做参考) |

**Easings**
- `ease-out`: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- `ease-in-out`: `cubic-bezier(0.4, 0, 0.2, 1)`

**Press states.** Lower opacity to `0.7` for non-brand surfaces; for brand CTAs, shift to `primary-500`/`primary-600`. Disabled = `opacity: 0.5` on buttons or `bg: #E0E0E0` on the send button.

---

## 9. Iconography

Inline SVG only — **no icon font, no Unicode load-bearing UI, no decorative emoji.**

### Drawing rules (every glyph)
| Property | Value |
|---|---|
| viewBox | `0 0 24 24` |
| stroke-width | `1.75` (heavy variants `2`) |
| stroke-linecap | `round` |
| stroke-linejoin | `round` |
| fill | `none` (filled glyphs use `fill="currentColor"`) |
| color | inherits via `currentColor` |
| default size | 16–20px inline, 24px standalone |

### Required glyph set (~30 core icons)
`send` · `retry` · `stop` · `check` · `close` · `chevron-down` · `chevron-right` · `chevron-up` · `chevron-left` · `menu` · `arrow-left` · `arrow-up` · `arrow-right` · `arrow-down` · `plus` · `alert` · `warning` · `error` · `thinking` · `spark` · `clipboard` · `settings` · `mic-on` · `mic-off` · `location` · `file` · `image` · `link` · `more-h` · `more-v` · `search` · `eye` · `eye-off`

**Avatars** are character-based (single-character monogram on a colored disc). Never invent illustrative SVGs (clouds, robots with personality, squiggles).

**RN implementation.** `src/components/ui/Icon/Icon.tsx` uses `react-native-svg` (`<Svg>` + `<Path>` / `<Circle>` / `<Rect>`) reading from `@/assets/icons` — a catalog whose path data lives in `src/assets/icons/data.ts` (generated from the SVG sources by an offline build step). Stable types (`IconElement`, `IconDef`) sit beside it in `types.ts`; `index.ts` re-exports both.

**Adding a new icon:** drop the SVG into `src/assets/icons/svg/<name>.svg`, then regenerate the catalog (an offline script) — both the RN catalog (`src/assets/icons/data.ts`) and the docs-site mirror (`website/src/components/iconsCatalog.ts`) regenerate, and `IconName` TypeScript type updates automatically.

---

## 10. Component library

Grouped as in the design system. Each entry: name · purpose · key states.

### Brand (1)
- **Logo** — Master mark + wordmark + sub-product lockup. Orange disc with white `U`, gradient on surface uses `135°`.

### Foundations (8)
- **Colors · Primary** — Orange ramp 0→600.
- **Colors · Semantic** — Success / warning / error / info.
- **Colors · Neutrals** — Text / border / surface / background.
- **Typography** — Type scale, weights, line heights.
- **Spacing** — 4px base grid.
- **Radii** — Radius tokens (incl. bubble asymmetry).
- **Shadows** — Card / popup / modal.
- **Motion** — Durations + easings.
- **Iconography** — 24×24 stroked SVG set.

### Basics (7)
- **Button** — variants: `primary`, `secondary`, `ghost`, `outline`, `danger`, `text`. Sizes: `sm`/`md`/`lg`. Block + non-block.
- **Avatar** — single-char monogram disc. Variants: `brand`/`info`/`soft`/`neutral`. Sizes: 18/28/32/40/56 (`xs`/`sm`/`md`/`lg`/`xl`). `xs` 专用于内联序号 / 脚注引用 (e.g. Sources)。
- **Tag** — status badges. Variants: `neutral`/`brand`/`success`/`error`/`info`/`outline`. Sizes: `md`/`lg`.
- **Chip** — 胶囊形可点击 pill。`selected` 切换主色边框 / 文本；可带 `leading`/`trailing`。Suggestion 等组合的底层。
- **Loading** — `Spinner` (reanimated 4 旋转) + linear progress.
- **Pulse** — `usePulse` hook + `<Pulse>` wrapper + `<PulseDot>`，reanimated 4 worklet 通用脉冲。Skeleton / Shimmer / Reasoning / Task / ChainOfThought / Message BlinkCursor 全部建立其上。
- **StatusDot** — `done`/`active`/`pending` 圆点，`flat`/`soft` 双 tone。Task 列表与 ChainOfThought 步骤共用，不要自画状态圆。

### Form (4)
- **Input** — single-line / multi-line / password. States: `idle`/`focus`/`filled`/`error`. 44px tall, 8px radius.
- **Search** — search bar with leading icon, clear button.
- **Selection** — checkbox / radio / switch / stepper.
- **Form** — row-grouped form with section dividers.

### Navigation (4)
- **NavBar** — fixed top header, 44px tall. Variants: default (white + hairline), `brand` (gradient).
- **TabBar** — fixed bottom tab bar, 50px tall. Hairline top.
- **Tabs** — `Tabs/`（页级下划线）/ `Segmented/`（局部分段）。两个文件夹独立但共用 `TabItem` 形状。
- **Drawer** — left slide-in drawer (gradient header, conversation list).

### Feedback (5)
- **Toast** — global lightweight banner. Auto-dismiss.
- **Empty** — empty state with illustration disc + title + desc.
- **Skeleton** — loading placeholders.

### Data Display (4)
- **Cell · List** — list row with optional icon, title, desc, extra, arrow。两种模式互斥:
  - **grouped(默认)** — 每行独立白卡 + `8px` 间距,绕在浅灰底容器内,**无 cell 间分隔线**(iOS 17 / 微信新版同款)。
  - **flush(`<List flush />`)** — 紧凑列表,透明底 + cell 间 hairline 分隔线铺满全宽(`divider="full"` 默认;`divider="none"` 可关)。常嵌在 Card 内 / 已有底色的区下方。
- **Card** — content card. White, `12px` radius, `12–14px` padding, card shadow.
- **Grid** — 9-square icon grid.
- **Thumbnail** — 列表 / 卡片右侧 / chat 通用 16:9.5 缩略图,`sm 64×40 / md 113×67 / lg 160×96` 三档。bg 占位 `c.surfaceContainer`,新增缩略图场景禁止 inline 写死 `<Image style>`。

### Chat (13)
- **Message** — bubble. 4 states: user · AI · streaming · failed. Asymmetric corners.
- **Prompt Input** — composer. 4 states: idle · typing · streaming · with attachments. 18px radius wrapper, focus ring `rgba(235,110,0,0.08)` outer + `primary-300` border.
- **Attachments** — grid / inline chip / list row.
- **Suggestion** — prompt chips. Empty-state, follow-up, and selected (multi-select) modes.
- **Sources** — citation list with numbered badges. Tap to open source.
- **Citation** — inline citation badge embedded in message text (`<n>` in primaryContainer disc).
- **Reasoning** — collapsible "thinking" trace. `思考中…` (active, pulsing) → `已思考 N.Ns` (done, collapsed).
- **Chain of Thought** — stepped reasoning track (done · active · pending dots, vertical line connecting).
- **Task** — task / plan list with done · running · todo states.
- **Tool** — tool/function call card. 4 states: running · success · error. Body is mono-font code or structured plain text.
- **Confirmation** — high-risk action confirm. 3 states: pending (orange border) · confirmed (green border, spinner + progress) · cancelled (grey border, retry link). **Inline** in chat — never modal.
- **Shimmer** — streaming placeholders. 3 patterns: bubble lines · shimmering text · typing dots.
- **DayDivider** — `今天 / 昨天 / YYYY-MM-DD` 居中分隔符。

> Conversation = full thread (NavBar + day dividers + messages + empty/populated views)，由 `@/components/chat` 与 `@/components/ui` 基础原子按需组合而成。

### Business compositions (6)

业务复合组件在 `@/components/business`，封装了 navigation / 安全区 / 主题上下文，把屏级骨架收成一行声明。

> TabBar 直接用 React Navigation 7 自带 `BottomTabBar`(在 `src/navigation/MainTabs.tsx` 里 `tabBarIcon` 走 Icon catalog),不再自渲玻璃胶囊,失去自定义品牌质感换来零兼容代码 + 嵌套 push 自动 hide 等原生行为。

- **ScreenLayout** — 二级屏布局 (SafeAreaView + NavBar + 双色背景: surface 头部 / surfaceContainer 内容区)。
- **CellList** — 数据驱动的 Cell 列表，callers 传 items 数组而不写一堆 `<Cell />`。
- **AvatarWithRing** — 圆形头像 + 白色 4px ring + 品牌色 shadow，Me 屏 hero 头像。
- **GlassStats** — 玻璃数据条 (BlurView + tint + N 列)，Me 屏 hero 数据。
- **Decorations** — `GradientWash` 垂直线性渐变 + `RadialHalo` 中央径向柔光 + `ScreenBackdrop` 整屏沉浸渐变背景容器(`preset="warmOrange"` 一键暖橙 + 暗色自适配 + 3 halo),纯装饰层 `pointerEvents="none"`。

会话列表用 `<List>` + `<Cell />` (variant=`assistant`) 渲染,不单独抽组件 —— icon 玻璃感 + 标题 + badge + 时间 + 末行预览全部在 Cell.assistant 里。

---

## 11. Layout rules

- **Fixed top header**, 44px.
- **Fixed bottom prompt input.**
- Message stream scrolls between them.
- Drawer slides in from the left.
- Chat list does **not** use floating action buttons or sticky banners.
- Confirmations and queues render **inline** in the message stream — never as modals (modals are reserved for tenant selection at login).
- **Transparency & blur:** scrim only (`rgba(0,0,0,0.5)`). No `backdrop-filter`, no glassmorphism, no translucent navbar.
- **Imagery:** none in-app. Avatars are single-char monograms on colored discs. No photos, illustrations, or icon-style imagery.
- **Cards:** white, `12px` radius, `12–14px` padding, `0 1px 4px rgba(0,0,0,0.08)` shadow on tool/message cards. List-style cards (settings rows, group items) have **no shadow, no border** — just rows separated by gaps on grey.

---

## 12. RN implementation map

All components are implemented. Path alias `@/*` → `src/*` is configured in both `tsconfig.json` (`paths`) and `babel.config.js` (`babel-plugin-module-resolver`). Animations across the system are driven by `react-native-reanimated@4` worklets; touch is routed through `react-native-gesture-handler`; keyboard handled by `react-native-keyboard-controller`.

```
src/
├── assets/
│   ├── logo.png          ← master mark (1024×1024 RGBA, see §15)
│   └── icons/            ← icon catalog (see §9)
│       ├── svg/*.svg     ← source SVG files (edit here)
│       ├── types.ts      ← IconElement / IconDef (hand-written stable types)
│       ├── data.ts       ← GENERATED IconName / ICONS / ICON_NAMES (treat as read-only)
│       └── index.ts      ← barrel — import from `@/assets/icons`
│
├── theme/
│   ├── colors.ts            ← lightColors / darkColors / ColorTokens (role-based, see §3)
│   ├── shadow.ts            ← lightShadow / darkShadow / ShadowTokens (themed; 暗色 opacity 趋零)
│   ├── tokens.ts            ← type scale, weights, spacing, radii, motion, dim (非主题相关)
│   ├── ThemeProvider.tsx    ← context provider，读 useColorScheme()
│   ├── useTheme.ts          ← useTheme / useColors / useShadow hooks (缺 Provider 时 fallback to light)
│   ├── useThemedStyles.ts   ← useThemedStyles(maker) hook，含 useMemo 缓存
│   └── index.ts             ← barrel
│
├── components/ui/        ← base UI primitives (no business logic)
│   ├── Avatar/          ← Avatar
│   ├── BlurLayer/       ← BlurView + tint 双层 (intensity 'soft' 10 / 'strong' 40)
│   ├── BottomSheet/     ← @gorhom/bottom-sheet wrap (配合 presentation: 'transparentModal' 路由屏)
│   ├── Button/          ← Button (6 variants × 3 sizes)
│   ├── Card/            ← Card (default / plain；`flat` 已 deprecated 等价 `plain`)
│   ├── Cell/            ← Cell + List + Leading (white-card + gap, NOT border-bottom)
│   ├── Checkbox/        ← Checkbox 复选
│   ├── Chip/            ← Chip (pill 圆角可选中)
│   ├── Confirm/         ← imperative confirm() Promise<boolean> + ConfirmHost(高风险二次确认)
│   ├── DrawerHeader/    ← Drawer 品牌头部 (配 @react-navigation/drawer 用)
│   ├── Empty/           ← Empty 空态
│   ├── Form/            ← Form / FormGroup / FormRow (行间 hairline)
│   ├── Grid/            ← Grid 九宫格
│   ├── Icon/            ← <Icon name="..." /> via react-native-svg (reads @/assets/icons)
│   ├── Input/           ← Input (idle / focus / filled / error)
│   ├── Logo/            ← <Image> wrapper for assets/logo.png
│   ├── NavBar/          ← NavBar (default / brand variant)
│   ├── PasswordInput/   ← Input + secureTextEntry + eye 切换明文/密文(4 处 caller 复用)
│   ├── Pulse/           ← usePulse + <Pulse> + <PulseDot> (reanimated 4 worklet)
│   ├── Radio/           ← Radio + RadioGroup + Radio.Group
│   ├── Search/          ← Search (Input 预设, accessibilityRole='search')
│   ├── Segmented/       ← 局部分段控件（与 Tabs 共用 TabItem 形状）
│   ├── Skeleton/        ← Skeleton + shape='line'/'rect'/'circle' (走 usePulse)
│   ├── Spinner/         ← Loading spinner (reanimated 4 旋转)
│   ├── StatusDot/       ← done/active/pending × flat/soft
│   ├── Stepper/         ← [−] N [+] 步进
│   ├── Switch/          ← 32×20 (reanimated 4 worklet + interpolateColor, UI 线程)
│   ├── TabBar/          ← 50px 底部 tab + badge
│   ├── Tabs/            ← 页级下划线 tabs（Segmented 已拆出）
│   ├── Tag/             ← Tag (5 语义 × 2 尺寸)
│   ├── Textarea/         ← 多行输入 (复用 Input.styles, textAlignVertical='top')
│   ├── Toast/           ← ToastHost.tsx + toast.ts (imperative toast() + <ToastHost />)
│   └── index.ts          ← barrel
│
├── components/chat/      ← chat/IM business components, composed over ui/ primitives
│   ├── Attachments/      ← AttachmentChip / Grid / List (3 形态)
│   ├── ChainOfThought/   ← 分步推理轨迹 (done / active / pending)
│   ├── Citation/         ← 内联引用角标 (primaryContainer + primary 10px)
│   ├── Confirmation/     ← 内联确认 3 态 (Card + Button)
│   ├── DayDivider/       ← 日期分隔
│   ├── Message/          ← 消息气泡 (Avatar + 非对称圆角 — Unif 标识)
│   ├── PromptInput/      ← 输入框 4 态 (idle / typing / streaming / attachments)
│   ├── Reasoning/        ← 推理过程折叠 (thinking / done)
│   ├── Shimmer/          ← ShimmerBubble + ShimmerTyping 流式占位
│   ├── Sources/          ← 引用来源
│   ├── Suggestion/       ← SuggestionList (Chip)
│   ├── Task/             ← 任务列表 (Card)
│   ├── Tool/             ← 工具调用卡 (Card + Tag)
│   └── index.ts          ← barrel
│
└── components/business/  ← 业务复合组件 (含 navigation / 安全区 / 主题上下文)
    ├── AvatarWithRing/   ← 圆形头像 + ring + 品牌 shadow
    ├── CellList/         ← 数据驱动的 Cell 列表 (items 数组)
    ├── Decorations/      ← GradientWash + RadialHalo + ScreenBackdrop
    ├── GlassStats/       ← 玻璃数据条 (BlurView + N 列)
    ├── ModernAppCell/    ← 46×46 应用 tile,Home 我的常用 / 分类应用
    ├── ScreenLayout/     ← 二级屏布局 (SafeArea + NavBar + 双色背景)
    ├── SmsCodeInput/     ← Input + sendSms + isMobile 校验 + 60s 倒计时(3 处 caller 复用)
    ├── VersionPill/      ← 版本号药丸
    └── index.ts          ← barrel
```

> Home 产品屏 `src/screens/home/manageApp/ManageApp.tsx`(**ManageApp**) —— Dashboard 「我的常用」编辑屏：SortableGrid 拖拽排序 + 8 上限 + `noEdit` 默认应用锁 + 本地文件持久化(`<userId>-<comGroup>-<roleId>`)。

Top-level:
```
App.tsx                   ← entry, wraps GestureHandlerRootView + KeyboardProvider + SafeAreaProvider + ThemeProvider, renders RootNavigator + Boot + ToastHost
__tests__/                ← Jest + @testing-library/react-native
src/screens/              ← 产品屏 (auth/home/agent/me/policy, 每屏 <name>/ 子目录,不带 Screen 后缀)
src/navigation/           ← Root / Auth / MainTabs / Home / Agent / Me 各 stack
src/features/auth/        ← 鉴权 store (zustand + MMKV persist)
src/services/             ← HTTP 服务层
src/utils/                ← http / fs / format / validation / rsa / 等
src/config/               ← env / brand / keys / paths / policy / uiConstants
src/app/                  ← Boot / SplashScreen
```

---

## 13. Recipes

### Use a token (themed, role-based)

颜色和 shadow 走 hook，跨亮 / 暗主题自动切换；非颜色 token（type / fw / space / radius）保持静态 import。

```ts
// styles.ts —— 工厂函数，接收 (c, s) 注入主题
import { StyleSheet } from 'react-native';
import type { ColorTokens, ShadowTokens } from '@unif/react-native-design';
import { type as t, fw, space, radius } from '@unif/react-native-design';

export const makeStyles = (c: ColorTokens, s: ShadowTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: space[6],
      ...s.card,                       // 暗色下 shadowOpacity / elevation 自动趋零
    },
    title: {
      fontSize: t.h3,
      fontWeight: fw.semi,
      color: c.foreground,
    },
  });
```

```tsx
// Component.tsx —— 入口加 hook，组件代码消费 styles
import { useThemedStyles } from '@unif/react-native-design';
import { makeStyles } from './styles';

export function MyCard({ title }: { title: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}
```

字面量颜色（`'#fff'` / `'#000'` / `'rgba(...)'`）在组件层禁止，必须经 token。如需要 inline 取色（如 prop fallback、状态映射），用 `useColors()` hook 拿 `c`。`shadow.card` / `shadow.brandMd` 也是 themed——暗色下 shadowOpacity / elevation 自动趋零（layered surface 替代 shadow）。

### Imperative toast
Mount once near the root (`<ToastHost />` is already in `App.tsx`), then call from anywhere:
```tsx
import { toast } from '@unif/react-native-design';

toast('已保存');
toast.success('订单提交成功');
toast.error('网络异常，请重试');
```

### Add a new icon
```bash
# 1. drop the SVG into the in-tree source dir
src/assets/icons/svg/<name>.svg
# 2. regenerate the catalog (offline build step)
#    icons/data.ts (RN, exposed via `@/assets/icons`) and
#    website/src/components/iconsCatalog.ts (docs grid) are both updated;
#    IconName TS literal type auto-extends.
```
SVG drawing rules: see §9. Note: `src/assets/icons/data.ts` is generated — treat it as read-only and never hand-edit.

### Add a new component
1. Read §1 (voice) and §2 (principles).
2. Decide where (each component is its own folder `<Name>/<Name>.tsx + types.ts + styles.ts + index.ts`):
   - Net-new base primitive → `src/components/ui/<Name>/`
   - Chat / IM-specific composition over base → `src/components/chat/<Name>/`
   - Single-feature surface (not reusable) → `src/features/<feature>/<Name>.tsx`
3. **Compose existing primitives** instead of reinventing styles. e.g., a "Settings row with Switch" = `<Cell title="..." extra={<Switch ... />} />`, never a new ad-hoc Row component.
4. Pull tokens from `@/theme`. Never hardcode hex / px / radius.
5. Export from the local `index.ts` barrel.
6. Add a unit test in `__tests__/components/<area>/<Name>.test.tsx`.
7. Add the entry to §10 + §12 in this file.

### Add a new color or token
- 颜色 role：在 `src/theme/colors.ts` 中**同时**给 `lightColors` 和 `darkColors` 加同名 key（TS 编译期会强制对齐键集合，少一个就报错）。
- shadow：在 `src/theme/shadow.ts` 中给 `lightShadow` 和 `darkShadow` 同时加；暗色版的 `shadowOpacity` / `elevation` 通常置 0。
- 非主题 token（type / weight / spacing / radius / motion / dim）：在 `src/theme/tokens.ts` 中加。
- Update §3–§8 in this file with the new value.
- Don't introduce purple/blue accents. Blue is reserved for the user avatar.
- Don't add gradients beyond the existing brand-orange one.

---

## 14. Don'ts (load-bearing)

- ❌ Don't add gradients beyond the existing brand-orange one (logo bubble, drawer header).
- ❌ Don't add purple/blue accent colors. Blue is **reserved** for the user avatar.
- ❌ Don't use decorative emoji or flag emoji in UI copy. Functional state goes through icons.
- ❌ Don't write English UI copy unless explicitly asked — the product ships in Simplified Chinese.
- ❌ Don't introduce new fonts. The system stack + PingFang SC is the entire type system.
- ❌ Don't redraw the U mark — copy from the inline-SVG block in §15.
- ❌ Don't replace inline-bubble confirmations with modals. Modals are reserved for tenant selection at login.
- ❌ Don't break the asymmetric bubble corner rule (§6) — the squared corner pointing at the avatar is the signature.
- ❌ Don't use `border-bottom` on list rows. Use white-card-per-row + 8px gap on grey background.

---

## 15. Logo

Logo source-of-truth is a 1024×1024 RGBA PNG: a stylized white bird silhouette with the "健康快乐" tagline on a `#EB6E00` orange background. **Don't redraw or substitute with an SVG U-mark.**

### Asset paths

| Use | Path | Notes |
|---|---|---|
| RN (`require()`) | `src/assets/logo.png` | Master mark 1024×1024 RGBA |
| Docs site (navbar / OG / favicon) | `website/static/img/logo.png` | All three slots in `docusaurus.config.ts` point at this single file |

### Usage

```tsx
// React Native
import { Image } from 'react-native';
<Image
  source={require('./src/assets/logo.png')}
  style={{ width: 64, height: 64, borderRadius: 14 }}
  accessibilityLabel="Unif"
/>

// Web
<img src="/img/logo.png" alt="Unif" width="64" height="64" />
```

### Rules

- Background is fixed `#EB6E00` — don't recolor.
- Don't crop the "健康快乐" tagline.
- Min size 24×24. The docs site uses the master `logo.png` everywhere (navbar / OG image / favicon).
- Don't apply shadow / outline / filter — flat only.

---

## 16. Quickstart for a fresh agent / session

You're picking up a project that has:
- React Native 0.85 / React 19 at the root (`App.tsx`). New Architecture (Fabric + TurboModules) enabled by default.
- A complete design system: ~51 components (31 ui + 13 chat + 7 business) in `src/components/`, all token groups (`colors / shadow / type / fw / lh / space / radius / avatar / icon / control / dim / fixed / motion / fontFamily / fontMono`) in `src/theme/` with light/dark dual sets via `ThemeProvider` + `useThemedStyles`, an SVG icon catalog under `src/assets/icons/svg/` + generated `src/assets/icons/data.ts` (consumed via `@/assets/icons`, treat as read-only).
- Unit / integration tests under `__tests__/` (Jest + `@testing-library/react-native`) cover store / utils / screens with dark-mode assertions and a11y attribute regressions.
- A live Docusaurus docs site at `website/` (`cd website && npm install && npm start`).
- This document — the single canonical text reference.

### Stack

- **Native deps:**
  - `react-native-reanimated@4` + `react-native-worklets` — all UI-thread animations
  - `react-native-gesture-handler` — every interactive `<Pressable>`
  - `react-native-keyboard-controller` — `<KeyboardAvoidingView>` and friends
  - `react-native-safe-area-context` — insets
  - `react-native-svg` — icon rendering
- **Provider stack** (in `App.tsx`): `GestureHandlerRootView → KeyboardProvider → SafeAreaProvider → ThemeProvider → NavigationContainer → RootNavigator` + `<ToastHost />` (one mount, anywhere can call `toast(...)`).
- **Path alias:** `@/*` → `src/*` configured in `tsconfig.json` + `babel.config.js`. Worklets babel plugin `react-native-worklets/plugin` registered last.
- **Testing:** Jest + `@testing-library/react-native` + `@testing-library/jest-native`. `jest.setup.ts` mocks `react-native-worklets` (must be first), `react-native-reanimated`, `react-native-gesture-handler`, `react-native-keyboard-controller`.

### Workflow for any UI change

1. Read §1 (voice) and §2 (principles) — non-negotiable.
2. Read §3–§9 for tokens / icons.
3. **Compose, don't recreate.** Look at §10 to see what primitives exist. Reuse `Card`, `Cell`, `Tag`, `Chip`, `Avatar`, `Button`, etc. — never reinvent styles.
4. Imports go through `@/components/ui` (base) or `@/components/chat` (chat business). Tokens from `@/theme`.
5. New work must follow §13 *Add a new component* recipe.
6. Verify before commit:
   ```bash
   npx tsc --noEmit
   npx jest
   npx eslint src __tests__
   ```
7. If you added a component, update §10 and §12 in this file. If you added an icon, regenerate the icon catalog (offline build step).

### Where to look for "how does X look"

- **Static spec:** §3–§11 of this doc + the corresponding `website/docs/...` page.
- **Visual + interactive:** `cd website && npm start` → every component page has an Expo Snack live preview.
- **Production code:** `src/components/{ui,chat}/<Component>.tsx` — read it directly.
- **Usage examples:** the `__tests__/components/...` files double as code samples.

---

_End of canonical reference._
