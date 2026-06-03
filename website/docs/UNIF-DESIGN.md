---
slug: /unif-design
title: 完整规范
description: "Unif Design 单文件设计宪法：品牌 / voice / 5 原则 / role-based token（颜色·字体·间距·圆角·阴影·动效）/ 图标 / 组件库 / Don'ts / RN 落地图。所有 token 值取自 src/theme，是 llms-full 的全量锚点。"
sidebar_label: 完整规范
---

# Unif Design — 完整规范

**品牌:** Unif(统一企业 / Uni-President China)
**真相源代码:** `src/theme/`、`src/components/ui/`、`src/components/business/`

> 这是一份**单文件设计宪法** —— 把品牌、原则、token、组件、Don'ts 收在一处,供整体把握与 AI 全量索引(llms-full 锚点)。逐项详情见各拆分页:[原则](/docs/design/principles)、[颜色](/docs/design/tokens/colors)、[字体](/docs/design/tokens/typography)、[间距·圆角·阴影](/docs/design/tokens/spacing-radii-shadows)、[动效](/docs/design/tokens/motion)、[组件概览](/docs/components)。所有 token 值取自 `src/theme`,与代码冲突时以代码为准。

---

## 1. 品牌与 voice {#品牌与-voice}

### 大小写
- 主品牌一律写作 **Unif** —— 不写 `UNIF`、`unif` 或加连字符。
- 子产品形如 `Unif <中文名>`(单个半角空格)。
- 拉丁字符与 CJK 字符之间用单个半角空格。

### 语言
- **中文优先。** 所有 UI 文案、按钮、placeholder、错误提示都是简体中文。
- 英文只出现在代码标识符、wordmark 和品牌名里。

### 语气
- 冷静、指示性、略正式。
- 助手像一个已经熟悉用户业务的同事。
- 不闲聊、不致歉。句子短、动词在前、**不加感叹号**。

### 人称
- 助手:`AI` 或 `助手`(头像内)。
- 用户:`我`(自己头像内)。
- 正文避免第一 / 第二人称,直接陈述事实:`已思考 3s`、`正在执行…`、`AI 回复中…`。

### 状态文案速查
| 场景 | 文案 |
|---|---|
| 工具运行中 | `执行中` |
| 工具完成 | `完成`(或 `完成 · 0.6s`) |
| 工具失败 | `失败` |
| 推理进行中 | `思考中…` |
| 推理完成 | `已思考 3s` |
| 确认发起 | `操作确认` |
| 确认完成 | `已确认，正在执行…` |
| 确认取消 | `已取消` |
| 发送失败 | `发送失败，请重试` |
| 输入空闲 | `输入消息…` |
| AI 流式回复 | `AI 回复中…` |

### 建议 chip(空状态)
像用户口气 —— 疑问句或祈使句,**不加句号**:`今天要拜访哪些客户？` · `帮我查一下今天的计划` · `新建一个拜访记录`。

### 标点
- 全角中文:`，` `。` `？` `：`
- 西文省略号 `…` 用于流式 / 加载。
- 中点 `·` 分隔行内元数据:`名称 · 地址`。

### Emoji
**禁用。** 无国旗 emoji、贴纸、装饰字符。功能性状态走图标。字符不传递信息就不该出现。

> 详见[语调与文案](/docs/design/voice)。

---

## 2. 设计原则(5 条) {#设计原则}

1. **中文优先。** 所有 UI 简体中文,英文仅品牌与代码。
2. **橙色克制。** `#EB6E00` 仅用于主按钮、用户气泡、活动标签、关键强调。蓝色(`#3775F6`)专属用户头像。
3. **无装饰。** 无插画、无渐变背景(仅品牌橙渐变)、无装饰 emoji。所有图标是手绘 24×24 描边 SVG。
4. **列表用 gap,不用 border。** 每行独立白卡,行间 gap 形成分组(iOS 17 / 微信新版风格)。
5. **气泡内角方。** 聊天气泡 14px 圆角,但指向头像的内角**直角(0)**。这是 Unif 最辨识度的视觉签名。

> 详见[设计原则](/docs/design/principles);硬性禁忌见[全局 Don'ts](/docs/design/donts)与本文 §14。

---

## 3. 颜色系统 {#颜色系统}

> Token 按 Material 3 system tokens 风格 **role 化命名**;不引入 reference layer / tonal palette。
> 主题跟随系统(`useColorScheme()`),亮 / 暗各一套值,role 名固定不变。值的真相源是 `src/theme/colors.ts`。

### 3.1 Brand {#brand}

| role | light | dark | 用途 |
|---|---|---|---|
| `primary` | `#EB6E00` | `#EB6E00` | 品牌橙;亮 / 暗共用(identity 不变) |
| `primaryPressed` | `#D06200` | `#D06200` | 按下态;亮 / 暗共用 |
| `primaryContainer` | `#FFF5EB` | `#3D1F00` | 高亮选中背景 |
| `primaryContainerSubtle` | `#FFF8F0` | `#2A1500` | Card 选中背景 |
| `onPrimary` | `#FFFFFF` | `#FFFFFF` | 品牌底上的内容色 |
| `onPrimaryMuted` | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.85)` | 品牌底上的次级文字 |

**Avatar 渐变**(数组,不暴露为 role):`avatarGradient = ['#F49443', '#EB6E00']`(135°,Me hero 头像;亮 / 暗共用)。平铺橙 `#EB6E00` 在 90% 场景足够,**不要引入新渐变**。历史 `brandGradient` / `brandGradientSoft` 已随死代码清理移除(0 消费)。

### 3.2 Semantic {#semantic}

| role | light | dark | 用途 |
|---|---|---|---|
| `success` | `#52C41A` | `#52C41A` | 成功态 |
| `successContainer` | `#F0FFF0` | `#0E2810` | success badge 底 |
| `onSuccess` | `#FFFFFF` | `#FFFFFF` | success 上的内容 |
| `error` | `#F4511E` | `#FF6B40` | 错误 / destructive |
| `errorContainer` | `#FFF5F5` | `#2A1010` | error badge 底 |
| `onError` | `#FFFFFF` | `#FFFFFF` | error 上的内容 |
| `info` | `#3775F6` | `#5A91FF` | **仅用户头像**(Tag info variant 历史沿用) |
| `infoContainer` | `#F0F5FF` | `#0F1A33` | info badge 底 |
| `onInfo` | `#FFFFFF` | `#FFFFFF` | info 上的内容 |

### 3.3 Surface(5 层) {#surface}

| role | light | dark | 用途 |
|---|---|---|---|
| `background` | `#F5F5F5` | `#0A0A0A` | 整页底色(OLED 友好) |
| `surface` | `#FFFFFF` | `#1C1C1E` | Card / Sheet / 气泡 |
| `surfaceContainer` | `#F5F5F5` | `#2C2C2E` | 卡内输入框 / 次级面 |
| `surfaceContainerHigh` | `#F0F0F0` | `#3A3A3C` | 次按钮 / 按下态 |
| `surfaceContainerHighest` | `#E0E0E0` | `#48484A` | disabled 按钮 / pill |

### 3.4 Foreground {#foreground}

| role | light | dark | 用途 |
|---|---|---|---|
| `foreground` | `#333333` | `#FFFFFF` | 主文字 |
| `foregroundMuted` | `#666666` | `rgba(235,235,245,0.6)` | 次级文字 |
| `foregroundSubtle` | `#999999` | `rgba(235,235,245,0.3)` | 三级文字 / placeholder |
| `onSurface` | = `foreground` | = `foreground` | 别名 |
| `onSurfaceMuted` | = `foregroundMuted` | = `foregroundMuted` | 别名 |

### 3.5 Outline {#outline}

| role | light | dark | 用途 |
|---|---|---|---|
| `outline` | `#EDEDED` | `#3A3A3C` | 默认 hairline |
| `outlineVariant` | `#E8E8E8` | `#48484A` | 次级 hairline |
| `outlineFaint` | `#F5F5F5` | `rgba(84,84,88,0.65)` | 最弱 hairline |

### 3.6 Inverse {#inverse}

| role | light | dark | 用途 |
|---|---|---|---|
| `inverseSurface` | `#1C1C1E` | `#FFFFFF` | toast / tooltip 反色底 |
| `inverseOnSurface` | `#FFFFFF` | `#000000` | inverseSurface 上的内容 |

### 3.7 Misc {#misc}

| role | light | dark | 用途 |
|---|---|---|---|
| `scrim` | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` | Sheet 遮罩;暗色加深 |
| `sheetBackdrop` | `rgba(245,245,247,0.72)` | `rgba(245,245,247,0.72)` | 合规 sheet 之下浅 tint(焦点引导) |

> `colors.ts` 另有一批玻璃感(`glassTintLight` / `glassBorder` / `glassActiveFg` / `glassPillBg`…)、Hero 渐变(`heroGradient0/1/2`)、淡阶图标(`iconFaint40/30/25`)、头像 ring 等专用 role,多数亮 / 暗 alpha **故意不同**(逐条注释了原因,不要归一化)。完整清单见源码。

### 3.8 为什么 role-based、不要 reference layer {#为什么-role-based}

行业(Material 3 / Apple HIG / Tailwind / GitHub Primer / IBM Carbon)共识:design token 按**角色**命名(`primary` / `surface` / `outline`),而非按强度档(`gray100` / `orange500`)。Unif 不引入 M3 的 reference layer / tonal palette:

1. reference layer 的价值在"多 brand / 多产品共享 palette";Unif 单 brand 单 app,无此需求。
2. role 层已是组件需要的全部抽象,reference 多一层间接、无功能收益。
3. Tailwind / shadcn-ui 也是单层 role + hex,生态无差异。

未来要加 reference 是纯加法:role 里的 hex 抽到 reference,role 改成引用 reference,组件代码 0 改动。

### 3.9 暗色哲学 {#暗色哲学}

- **iOS HIG dark 风格**:纯黑 / 近黑 `background`(`#0A0A0A`)+ 深灰多层 `surface`(`#1C / #2C / #3A / #48`),OLED 友好。
- **品牌橙保留原值**(亮 / 暗均 `#EB6E00`):在 `#0A0A0A` 上对比度过 WCAG AA,无需调亮。
- **layered surface 替代 shadow**:暗色下 shadow token 的 `shadowOpacity` / `elevation` 多数置 0(例外见 §7);深度靠 surface 5 层明度差。
- **"内角方"气泡签名完整保留**。

### 3.10 颜色规则 {#颜色规则}

- 无近黑、无米白、无染色灰,中性色保持纯净。
- 品牌橙只在主按钮 / 用户气泡 / 活动标签 / 关键强调。
- 蓝色(`info`)专属用户头像(Tag info variant 历史沿用,不扩散)。
- **绝不内联 hex / rgba** —— 走 `useColors()` role token,新硬编码挂 CI。取色优先级链见[颜色 → 取色优先级链](/docs/design/tokens/colors#取色优先级链)。旧 token → 新 role 的 grep 对照见[迁移](/docs/migration#旧-token-名--新-role-名)。

---

## 4. 字体 {#字体}

### 字体栈(仅系统,无 webfont)
```
-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB",
"Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif
```
Mono(`fontMono` token):iOS `Menlo` / Android `monospace`。品牌刻意依赖 OS 渲染原生中文字形,**不引入 webfont**。

### 字号阶梯 `type`(移动优先,经 `rf()` 缩放)
| Token | 基准 px | 用途 |
|---|---|---|
| `display` | 22 | 品牌标题 |
| `h1` | 18 | 页面标题 |
| `h2` | 17 | 区块标题 |
| `h3` | 15 | 卡片标题 / 强调正文 |
| `body` | 15 | 默认正文 |
| `sm` | 14 | 次级正文 / 按钮 |
| `xs` | 13 | 提示、说明 |
| `xxs` | 12 | meta、caption |
| `micro` | 11 | 徽章、工具名 |
| `nano` | 10 | TabBar / Grid / Citation / Sources 角标 |

半档微调:`smPlus`(14.5)· `xsPlus`(13.5)· `microPlus`(11.5)。Hero 档:`heroLg`(26)· `heroMd`(22)· `heroSm`(18)。完整说明见[字体](/docs/design/tokens/typography)。

### 行高(惯例,非 token)
**没有 `lineHeight` token。** 行高用字号乘系数:标题 ×1.25、正文 ×1.45(直接写 `lineHeight: t.body * 1.45`)。

### 字重 `fw`
`fw.regular` `'400'` · `fw.medium` `'500'` · `fw.semi` `'600'` · `fw.bold` `'700'` · `fw.heavy` `'800'`。用 `as const` 声明,无需再 cast。

---

## 5. 间距 `space` {#间距}

4px 基准网格(多数值经 `r()` 像素对齐缩放):
| Token | 基准 px | 常用 |
|---|---|---|
| `px` | 1 | hairline 级位移 |
| `1` | 4 | 最紧间隙 |
| `2` | 6 | 图标-文字间隙 |
| `3` | 8 | 头像-气泡间隙、列表行间 gap |
| `4` | 10 | 气泡纵向 padding |
| `5` | 12 | 气泡横向 padding、栏间距 |
| `6` | 14 | 卡片 padding |
| `7` | 16 | 区块栏间距 |
| `8` | 20 | 较大区块间距 |
| `9` | 24 | Hero padding |
| `10` | 32 | 通栏区块间距 |

**规则。** 屏幕侧边距 12–16px。气泡 padding `10px 12px`。卡片 `12–14px`。尊重安全区(iOS home indicator 34px)。`space` key 是字符串字面量(`space['7']`)。

---

## 6. 圆角 `radius` {#圆角}

| Token | 基准 px | 用途 |
|---|---|---|
| `xs` | 4 | Radio / Checkbox / Tag / Citation 内圈 |
| `sm` | 6 | 小按钮、徽章 |
| `md` | 8 | 输入框、默认按钮 |
| `lg` | 10 | 卡片、列表行 |
| `xl` | 12 | 大卡片、列表容器 |
| `2xl` | 14 | **聊天气泡** |
| `3xl` | 18 | 输入框 wrapper |
| `pill` | 999 | chip、pill(大数哨兵,不缩放) |

### 气泡 motif(签名)
- **AI 气泡:** `border-radius: 0 14px 14px 14px`(左上角直角)
- **用户气泡:** `border-radius: 14px 0 14px 14px`(右上角直角)

直角指向头像 —— Unif 最辨识度的 UI motif,保留它。

---

## 7. 阴影 `shadow`(themed) {#阴影}

中性卡片阴影 + 品牌橙光晕两类。**无内阴影、无霓虹光晕、无双重边框。** 走 `useShadow()` / `useThemedStyles` 第二参拿。

| Token | 用途 | RN(亮色) |
|---|---|---|
| `subtle` | Segmented active 段等轻提示浮起 | `{0,1}` · op 0.06 · r 2 · elev 1 |
| `card` | 标准卡片下沉(Card default) | `{0,1}` · op 0.08 · r 4 · elev 2 |
| `floating` | 中性浮岛(贴底浮起胶囊) | `{0,16}` · op 0.1 · r 40 · elev 12 |
| `brandSm` | 品牌光晕 sm | 橙 · `{0,6}` · op 0.08 · r 18 · elev 3 |
| `brandMd` | 主按钮 / Avatar ring 中等强调 | 橙 · `{0,12}` · op 0.26 · r 24 · elev 12 |
| `brandLg` | Login Logo halo | 橙 · `{0,16}` · op 0.22 · r 36 · elev 12 |
| `brandXl` | Splash Logo 最重浮起 | 橙 · `{0,20}` · op 0.2 · r 50 · elev 12 |
| `brandAbout` | About icon halo | 橙 · `{0,18}` · op 0.28 · r 40 · elev 12 |
| `brandAssistant` | AssistantCard icon tile | 橙 · `{0,8}` · op 0.3 · r 18 · elev 12 |
| `brandAvatar` | Avatar 品牌橙光晕 | 橙 · `{0,10}` · op 0.28 · r 24 · elev 12 |
| `glassBar` | GlassStats 数据条专用 | 橙 · `{0,6}` · op 0.08 · r 18 · elev 3 |
| `none` | 列表行 / 设置项 | 全 0 |

**暗色态:layered surface 替代 shadow。** 多数 token 暗色下 `shadowOpacity` / `elevation` 置 0;深度靠 `surface` 5 层明度差(§3.3)。**例外:`floating` / `glassBar`(黑色 drop shadow)与 `brandAvatar`(橙光晕)暗色不置零** —— 否则浮岛 / 数据条 / 头像在暗底贴平。确认卡片用 `2px` 彩色边框,无阴影。

---

## 8. 动效 `motion` {#动效}

功能性、快速。仅 fade + layout,**无弹簧、无回弹、无入场缩放**。尊重 reduced-motion。

| Token | 值 | 用途 |
|---|---|---|
| `fast` | 150ms | 按压态、hover |
| `base` | 200ms | 分段控件、布局变化、Modal fade |
| `slow` | 300ms | Drawer 过渡 |
| `pulse` | 1600ms | "思考中" spark 脉冲全周期(`usePulse` 取半周期 = `pulse / 2`) |

**没有 easing token** —— 缓动由 reanimated `withTiming` 默认曲线承担(Spinner 显式用 `Easing.linear`),自定义缓动从 `react-native-reanimated` import `Easing`。

**按压态。** 非品牌表面 `opacity: 0.7`;品牌 CTA 切到 `c.primaryPressed`(`#D06200`);禁用 = 按钮 `opacity: 0.5` 或送出键背景 `c.surfaceContainerHighest`(`#E0E0E0`)。

---

## 9. 图标 {#图标}

仅 inline SVG —— **无 icon font、无 Unicode 承载 UI、无装饰 emoji**。

### 绘制规范(每个 glyph)
| 属性 | 值 |
|---|---|
| viewBox | `0 0 24 24` |
| stroke-width | `1.75`(heavy 变体 `2`) |
| stroke-linecap | `round` |
| stroke-linejoin | `round` |
| fill | `none`(填充 glyph 用 `fill="currentColor"`) |
| color | 经 `currentColor` 继承 |
| 默认尺寸 | inline 16–20px,standalone 24px |

**头像**是字符型(单字符 monogram 落在色盘上)。不要发明插画式 SVG(云朵、有表情的机器人、波浪线)。

**RN 实现。** `src/components/ui/Icon/Icon.tsx` 用 `react-native-svg`(`<Svg>` + `<Path>` / `<Circle>` / `<Rect>`),从 `src/icons` 目录读路径数据。源 SVG 在 `src/icons/svg/<name>.svg`,生成的目录在 `src/icons/data.ts`(由 `scripts/build-icons.js` 离线生成,**不要手改**,头部有 `AUTO-GENERATED — DO NOT EDIT BY HAND`)。

**加新图标:** 扔 SVG 到 `src/icons/svg/<name>.svg` → 跑 `node scripts/build-icons.js` → `yarn lint --fix`(prettier 把 `IconName` union 拆行)→ `yarn typecheck`。`IconName` 是闭集,组件 prop 类型自动同步;文档站镜像在 `website/src/components/iconsCatalog.ts`。详见[图标页](/docs/components/icons)。

---

## 10. 组件库 {#组件库}

按设计系统分组。**本包(`@unif/react-native-design`)实现 38 个 ui 原子 + 4 个通用业务复合组件**;聊天 / IM 组件(Message / PromptInput 等)是同一套设计语言,但代码在 portal 仓库,这里只描述其视觉契约。

### 品牌
- **Logo** —— `<Image>` 包装容器,接 `source` prop(母版 mark 由消费者提供)。
- **Icon** —— 24×24 描边 SVG 目录。

### 通用
- **Button** —— variant:`primary` / `secondary` / `ghost` / `outline` / `danger` / `text`;size:`sm` / `md` / `lg`;可 `block`。
- **IconButton** —— 纯图标按钮,`accessibilityLabel` 类型必填。
- **Avatar** —— 单字符 monogram。variant:`brand` / `info` / `soft` / `neutral`;size:`xs`(18)/ `sm`(28)/ `md`(32)/ `lg`(40)/ `xl`(56)。
- **Tag** —— 状态徽章,5 语义 × 2 尺寸(`md` / `lg`)。
- **Chip** —— 胶囊形可选中 pill;`selected` 切主色边框 / 文本;可带 leading / trailing。Suggestion 底层。
- **Thumbnail** —— 16:9.5 缩略图,`sm 64×40 / md 113×67 / lg 160×96`。
- **Loading** —— `Spinner`(reanimated 4 旋转)+ 线性进度。
- **Pulse** —— `usePulse` + `<Pulse>` + `<PulseDot>`,reanimated 4 worklet 通用脉冲。Skeleton / Shimmer / Reasoning 等建立其上。
- **StatusDot** —— `done` / `active` / `pending` 圆点,`flat` / `soft` 双 tone。

### 表单
- **Input** —— 单行;状态 `idle` / `focus` / `filled` / `error`。
- **PasswordInput** —— Input + secureTextEntry + 明文切换。
- **Textarea** —— 多行(复用 Input,顶对齐)。
- **TextField** —— 带 label / 校验的字段封装。
- **Search** —— 搜索条(Input 预设,`accessibilityRole='search'`)。
- **Checkbox / Radio / Switch / Stepper** —— 选择 / 开关 / 步进。
- **Form** —— Form / FormGroup / FormRow(行间 hairline)。

### 导航
- **NavBar** —— 固定顶部头,44px。default(白 + hairline)/ `brand`(渐变)。
- **TabBar** —— 固定底部 tab,50px,带 badge。
- **Tabs / Segmented** —— 页级下划线 / 局部分段,共用 `TabItem` 形状。
- **Drawer** —— `DrawerHeader` + `@react-navigation/drawer`。

### 反馈
- **Toast** —— 命令式 `toast()` + `<ToastHost />`,全局轻提示,自动消失。
- **Confirm** —— 命令式 `confirm(): Promise<boolean>` + `<ConfirmHost />`,高风险二次确认(同一时间只 1 个对话框)。
- **Empty** —— 空状态。
- **Skeleton** —— 骨架占位,`shape='line'/'rect'/'circle'`(走 `usePulse`)。

### 数据展示
- **Cell · List** —— 列表行 + List 容器,两模式互斥:**grouped**(默认,白卡 + 8px gap,无 cell 间分隔线)/ **flush**(`<List flush />`,透明底 + cell 间 hairline)。
- **Card** —— 内容卡。variant `default`(白底 + card shadow + 边框)/ `plain`(仅白底,无阴影无边框);`flat` 已 deprecated 等价 `plain`。
- **Grid** —— 九宫格图标网格。
- **Carousel** —— 轮播(包装 reanimated-carousel v5)。

### 其他 ui
- **BlurLayer** —— BlurView + tint 双层,intensity `soft`(10)/ `strong`(40)。
- **BottomSheet** —— 纯 layout 容器,配 `presentation: 'transparentModal'` 路由屏。
- **EntryCard** —— 横向小卡入口(Me 屏"设置 / 关于"双列)。
- **Reveal** —— 进出过渡封装(收口 web 特化)。

### 业务复合(本包 4 个)
通用部分(不耦合 navigation / store);耦合的(ScreenLayout / CellList / ModernAppCell / SmsCodeInput)留在消费者仓库。
- **AvatarWithRing** —— 圆形头像 + ring + 品牌 shadow。
- **GlassStats** —— 玻璃数据条(BlurView + N 列)。
- **Decorations** —— `GradientWash`(线性渐变)+ `RadialHalo`(径向柔光)+ `ScreenBackdrop`(整屏沉浸渐变,`preset="warmOrange"` + 暗色自适配),纯装饰层 `pointerEvents="none"`。
- **VersionPill** —— 版本号药丸。

### 聊天(设计语言,代码在 portal)
Message(非对称圆角气泡)· PromptInput(4 态)· Attachments · Suggestion · Sources · Citation · Reasoning(`思考中…` → `已思考 N.Ns`)· ChainOfThought · Task · Tool · Confirmation(**内联**,绝不模态)· Shimmer · DayDivider。Conversation = 完整线程,由 chat 与 ui 原子组合而成。

> 逐组件 API / props / variant / size 见各[组件页](/docs/components)与远程 [llms.txt](https://unif-design.github.io/react-native-design/llms.txt)。

---

## 11. 布局规则 {#布局规则}

- **固定顶部头**,44px;**固定底部输入框**;消息流在两者之间滚动;Drawer 从左滑入。
- 聊天列表**不**用悬浮操作按钮或 sticky banner。
- 确认与队列**内联**渲染在消息流里,绝不模态(模态仅留给登录选租户)。
- **透明与模糊:** 玻璃感由专用 token(`glassTintLight` 等)+ `BlurLayer` 承担;通用遮挡用 `scrim`。
- **图像:** app 内无图像。头像是单字符 monogram。无照片、插画。
- **卡片:** 白底、`radius.xl`(12)、`12–14px` padding、`card` shadow;列表式卡片(设置行 / 组项)无阴影无边框,靠灰底上的 gap 分隔。

---

## 12. RN 落地图 {#rn-落地图}

路径别名 `@/*` → `src/*`(`tsconfig.json` paths + `babel.config.js` module-resolver)。动画走 `react-native-reanimated@4` worklet;触控走 `react-native-gesture-handler`;键盘走 `react-native-keyboard-controller`。**库代码内部走相对路径,不用 `@/` 别名。**

```
src/
├── icons/                   ← 图标目录(见 §9)
│   ├── svg/*.svg            ← 源 SVG(在这编辑)
│   ├── data.ts              ← 生成的 IconName / ICONS(只读,勿手改)
│   └── index.ts             ← barrel(从 src/icons import)
│
├── theme/
│   ├── colors.ts            ← lightColors / darkColors / ColorTokens(role-based,§3)
│   ├── palettes.ts          ← 渐变序列(warmOrangePalette,塞不进单值 role 的色组)
│   ├── shadow.ts            ← lightShadow / darkShadow / ShadowTokens(themed;暗色趋零)
│   ├── tokens.ts            ← type / fw / space / radius / avatar / icon / control / dim / fixed / motion(非主题)
│   ├── scale.ts             ← r() 像素对齐缩放 / rf() 字号缩放(基准宽 402)
│   ├── blur.ts              ← blur soft(10)/ strong(40)
│   ├── ThemeProvider.tsx    ← context provider,读 useColorScheme();forceScheme? 可强制
│   ├── useTheme.ts          ← useTheme / useColors / useShadow(缺 Provider 时 fallback light)
│   ├── useThemedStyles.ts   ← useThemedStyles(maker),含 useMemo([colors, shadow, maker]) 缓存
│   └── index.ts             ← barrel
│
├── components/ui/           ← 38 个原子组件(Avatar / Button / Card / Cell / Icon / Input / NavBar / Toast / ...)
│   └── index.ts             ← barrel(从 @unif/react-native-design 包根导出)
│
└── components/business/     ← 4 个通用业务复合(AvatarWithRing / Decorations / GlassStats / VersionPill)
    └── index.ts             ← barrel
```

公共入口 `src/index.tsx` re-export:`./theme`(token + Provider + hooks + r/rf)、`./icons`、`./utils/testID`、`./utils/logger`、`./components/ui`、`./components/business`。

> 关于 example / website workspace、构建(react-native-builder-bob)、测试边界、TS 严格度等工程细节,见仓库 `CLAUDE.md`。

---

## 13. Recipes {#recipes}

### 用 token(themed,role-based)
颜色和 shadow 走 hook(跨亮 / 暗自动切换);非颜色 token(type / fw / space / radius / motion)静态 import。

```ts
// styles.ts —— maker 工厂,接收 (c, s) 注入主题
import { StyleSheet } from 'react-native';
import type { ColorTokens, ShadowTokens } from '@unif/react-native-design';
import { type as t, fw, space, radius } from '@unif/react-native-design';

export const makeStyles = (c: ColorTokens, s: ShadowTokens) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: space['6'],
      ...s.card,                  // 暗色下 shadowOpacity / elevation 自动趋零
    },
    title: { fontSize: t.h3, fontWeight: fw.semi, color: c.foreground },
  });
```

```tsx
// Component.tsx —— 入口加 hook,组件消费 styles
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

字面量颜色(`'#fff'` / `rgba(...)`)在组件层禁止,必须经 token。inline 取色用 `useColors()`。

### 命令式 toast
根附近挂一次 `<ToastHost />`,然后任意位置调用:
```tsx
import { toast } from '@unif/react-native-design';

toast('已保存');
toast.success('订单提交成功');
toast.error('网络异常，请重试');
```

### 加新颜色 / token
- 颜色 role:在 `src/theme/colors.ts` 给 `lightColors` 和 `darkColors` **同时**加同名 key(TS 编译期强制对齐键集合)。
- shadow:在 `src/theme/shadow.ts` 给 `lightShadow` / `darkShadow` 同时加;暗色版 `shadowOpacity` / `elevation` 通常置 0。
- 非主题 token(type / fw / space / radius / motion / dim):在 `src/theme/tokens.ts` 加。
- 同步更新本文 §3–§8。
- 不引入紫 / 蓝 accent(蓝色专属用户头像);不在品牌橙之外加渐变。

### 加新组件
1. 读 §1(voice)与 §2(原则)。
2. 定位(每组件一个独立目录 `<Name>/<Name>.tsx + types.ts + styles.ts + index.ts`):净新原子 → `src/components/ui/<Name>/`;通用业务复合 → `src/components/business/<Name>/`。
3. **组合现有原子**,不重造样式(如"带 Switch 的设置行" = `<Cell title="..." extra={<Switch ... />} />`)。
4. token 从包根 import,绝不硬编码 hex / px / radius。
5. 从本地 `index.ts` barrel 导出,并在本文 §10 / §12 登记。

---

## 14. Don'ts(load-bearing) {#donts}

- ❌ 不在品牌橙(Logo 圆 / Drawer header)之外加渐变。
- ❌ 不加紫 / 蓝 accent —— 蓝色**专属**用户头像。
- ❌ UI 文案不用装饰 / 国旗 emoji,功能性状态走图标。
- ❌ 不写英文 UI 文案(除非明确要求),产品出货简体中文。
- ❌ 不引入新字体,系统栈 + PingFang SC 是全部。
- ❌ 不用模态替换内联确认(模态仅留给登录选租户)。
- ❌ 不破坏 §6 气泡非对称圆角(指向头像的直角是签名)。
- ❌ 列表行不用 `border-bottom`,用白卡 + 8px gap。
- ❌ 不硬编码颜色 / 字号 / 间距;不把 `makeStyles` 内联进组件。

> 完整清单见[全局 Don'ts](/docs/design/donts)。

---

## 15. Logo {#logo}

`Logo` 组件是 `<Image>` 的标准化包装(尺寸 / 圆角 / a11y),**母版 PNG 由消费者提供**,通过 `source` prop 传入 —— 本设计包不内置 logo 资源。

```tsx
// React Native
import { Logo } from '@unif/react-native-design';
<Logo source={require('@/assets/logo.png')} size={64} label="Unif" />
```

文档站的 navbar / OG / favicon 三槽都指向 `website/static/img/logo.png` 这一份(`docusaurus.config.ts`)。母版是 `#EB6E00` 橙底的品牌标识,**不要重绘 / 替换 / 重新着色 / 加阴影滤镜**;最小尺寸 24×24。

---

## 16. 给新 agent / 新会话的 Quickstart {#quickstart}

接手项目时它有:

- RN 0.85 / React 19,新架构(Fabric + TurboModules)默认开启。
- 完整设计系统:38 ui + 4 业务复合组件,全套 token(`colors / shadow / type / fw / space / radius / avatar / icon / control / dim / fixed / motion / blur / fontMono`)在 `src/theme/`,亮 / 暗双套经 `ThemeProvider` + `useThemedStyles`;SVG 图标目录在 `src/icons/svg/` + 生成的 `src/icons/data.ts`(只读)。
- 单元 / 集成测试在 `__tests__/`(Jest + `@testing-library/react-native`)。
- Docusaurus 文档站在 `website/`。
- 本文 —— 单一权威文本参考。

### Provider 栈
`GestureHandlerRootView → KeyboardProvider → SafeAreaProvider → ThemeProvider → NavigationContainer → RootNavigator` + `<ToastHost />`(挂一次,任意位置可 `toast(...)`)。worklets babel 插件 `react-native-worklets/plugin` 注册在最后。

### 任何 UI 改动的流程
1. 读 §1(voice)与 §2(原则)—— 不可妥协。
2. 读 §3–§9(token / 图标)。
3. **组合,不重造** —— 看 §10 有哪些原子,复用 `Card` / `Cell` / `Tag` / `Chip` / `Avatar` / `Button`。
4. import 走包根 barrel,token 从包根。
5. 新组件按 §13 流程,完成后更新 §10 / §12。
6. 提交前:`yarn typecheck` · `yarn lint` · `yarn test`。

### "X 长什么样"去哪看
- **静态规范:** 本文 §3–§11 + 对应 `website/docs/...` 页。
- **可视 + 交互:** `cd website && npm start`,每个组件页有 `<LiveDemo>`。
- **生产代码:** `src/components/{ui,business}/<Component>.tsx`,直接读。
- **用法示例:** `__tests__/...` 文件可当代码样例。

---

_权威参考结束。_
