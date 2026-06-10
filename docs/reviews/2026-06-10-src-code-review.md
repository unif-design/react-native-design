# src 全量代码审查报告

> 日期:2026-06-10 · 依据:`docs/specs/2026-06-10-src-code-review-design.md` · 状态:进行中
> 基线:`docs/src-code-review` @ `9c05acf`,工作区干净

## 1. 执行摘要

(Task 15 定稿时填写:整体结论、四维度概评、最值得做的 3 件事)

## 2. 发现列表

### 2.1 台账(深读期增量追加,复核后移入 2.2)

| 位置 | 维度 | 严重度 | 置信度 | 证据摘要 | 建议 |
| --- | --- | --- | --- | --- | --- |
| `scripts/build-icons.js:74` | 质量 | Low | 高(字节级复现) | Step 5 对 `src/icons/data.ts` 原始再生成 hash 变化(`8b3275e9…` → `4678ebad…`,diff ±2k 行):`build-icons.js` 输出未经 prettier 格式化(`:74` 单行拼接 `IconName` union),而提交版本按文档流程跑过 `yarn lint --fix`(prettier 拆行)。将再生成产物按仓库 prettier 配置(package.json#prettier)格式化后与 HEAD 字节一致(同为 `8b3275e9…`)→ 内容与 `src/icons/svg/` 同步,差异纯格式、再生成不幂等。任务预设「hash 变化即 High(生成物失同步)」,经上述验证证伪,降级记录;工作区已 `git checkout -- src/icons/data.ts` 还原。 | 让 `scripts/build-icons.js` 直接产出 prettier 格式(或脚本末尾调用仓内 prettier 3.8.1),使再生成幂等,`node scripts/build-icons.js && git diff --exit-code` 即可作 CI 一致性校验 |
| `src/components/ui/Avatar/Avatar.tsx:20-33 ↔ src/components/ui/DrawerHeader/DrawerHeader.tsx:17-30` | 重复 | Medium | | jscpd #1(14 行/64 token):图片加载失败 fallback 逻辑逐行重复 —— `imageFailed` state + `mountedRef` unmount 守卫 + `handleImageError`(连同一句中文注释一并复制)。同一行为两处独立维护,演进需手工同步(如日后补「source 变更时重置 failed」需改两处,漏一处即行为分叉)。 | 抽共享 hook(如 `useImageFallback`,Avatar 目录内 shared 或 utils),或评估 DrawerHeader 头像块直接复用 `Avatar` 原子;与质量维度联动:`mountedRef` 守卫所防的 unmount-setState 告警在 React 18+ 已移除,若深读判该守卫为死重,正确去重是删除而非抽 hook |
| `src/components/ui/Grid/styles.ts:72-88 ↔ src/components/ui/TabBar/styles.ts:27-43` | 重复 | Medium | | jscpd #3(17 行/83 token,本次唯一 typescript 克隆):`badge` + `badgeText` 红色计数角标样式块逐字段一致(`minWidth`/`height` 均 r(16)、`radius.md`、`c.error`/`c.onError`、`t.nano`、`fw.bold`、`lineHeight: 12`),仅 `top` 偏移不同(r(-6) vs r(-3))。同一视觉物两处维护,角标视觉调整需双改。非 sizingFor/paletteFor 约定结构(见 §3.1 分流)。 | 抽共享角标样式工厂(如 ui 内部 `badgeStyles(c)`,`top` 偏移留参数),或评估独立 Badge 原子供 Grid/TabBar 组合 |
| `src/components/ui/Segmented/Segmented.tsx:27-40 ↔ src/components/ui/Tabs/Tabs.tsx:22-35` | 重复 | Medium | | jscpd #4(14 行/103 token):同构选择器的渲染骨架重复 —— `items.map` + gesture-handler `Pressable` + a11y 三件套(`accessibilityRole="tab"`、`accessibilityState`、`accessibilityLabel`)+ `childTestID` + pressed opacity(模式同、值异:0.85 vs 0.7,且 Segmented 项另有 activeBg/activeShadow——抽取时须参数化)。tab 项的 a11y/testID 行为两处维护,易漂移;仓库已有 ButtonBase 把按钮 chrome 收口的先例。 | 评估抽内部 tab-item primitive(render-prop 模式,类 `ButtonBase`)统一 Pressable/a11y/testID;若 Task 14 判原子独立性优先,则记入 §4 豁免说明(理由:原子独立性优先;按本报告定义不属约定性同形) |
| `src/components/ui/BlurLayer/BlurLayer.tsx:3-21 ↔ src/components/ui/BlurLayer/BlurLayer.web.tsx:10-22` | 重复 | Medium | | jscpd #2(19 行/63 token):平台兄弟文件间重复 —— import 段 + 函数签名解构 + `useColors`/`useTheme` 开场两端逐行同构,克隆体以声明性样板为主,真正分叉只有 BlurView 与 View 降级渲染。平台分叉本身是仓库约定。 | 倾向豁免(样板占比高、抽取收益低);若两端共享推导(blurType/tint 计算)后续增长,再抽 `shared.ts` |
| `src/components/ui/Spinner/Spinner.tsx:24-36 ↔ src/components/ui/Spinner/Spinner.web.tsx:46-60` | 重复 | Medium | | jscpd #5(13 行/110 token,单笔最大 token 克隆):入参防御逻辑在 native/web 双实现逐行重复 —— `size`/`thickness` 的 `Number.isFinite` 校验、两条 `log.warn` 中文文案、`safeSize`/`safeThickness` 钳制。属行为性逻辑而非样板:钳制规则或文案改动需两端同步,漂移即两端运行时行为不一致。 | 抽 `Spinner/shared.ts` 导出 `sanitizeSpinnerProps(size, thickness)`(校验 + warn + 钳制一体),两端消费,渲染保持平台分叉 |
| `src/components/ui/Switch/Switch.tsx:11-38、:63-76 ↔ src/components/ui/Switch/Switch.web.tsx:3-35、:49-62`(jscpd #6/#7 合并) | 重复 | Medium | | 2 笔克隆共 42 行/171 token,文件对累计最大:(a)动画端点常量 `THUMB_OFF_X`/`THUMB_ON_X` 的 `r()` 推导连同推导注释整段两端复制,而其依赖 `INSET`/`TRACK_W`/`THUMB` 本就由 `styles.ts` 导出,派生常量却未收口;(b)`Pressable` 外壳(onPress 翻转、disabled、hitSlop 6、a11y switch role/state、testID)两端逐行一致。 | (a)`THUMB_OFF_X`/`THUMB_ON_X` 移入 `styles.ts` 与 INSET 等同源导出;(b)评估抽共享 Pressable 外壳,两端只分叉 track/thumb 动画实现 |
| `src/components/ui/Toast/ToastHost.tsx:11-28 ↔ src/components/ui/Toast/ToastHost.web.tsx:3-23` | 重复 | Medium | | jscpd #8(18 行/71 token):host 开场段重复 —— theme/styles/`_subs`/types import + 函数签名 + `useColors`/`useThemedStyles`/state hooks。另经核读,克隆区下方紧邻的 `_subs` 订阅 effect(native :34-43 ↔ web :29-37)亦两端同构(仅 native 多 clearTimeout 一行——系刻意架构分歧:web 端 timer 清理移入 entry effect cleanup,抽共享 hook 须把 timer 处理留在平台侧或暴露回调),jscpd 因 token 数不足未报。 | 评估把订阅与 entry state 抽共享 hook(如 `useToastEntry`),两端只分叉动画渲染;若判平台分叉约定豁免,Task 14 定 |
| `src/components/index.ts:1-2`(整文件) | 解耦 | Medium | | madge --orphans 报 8 个孤儿,7 个经排除流程判误报(根入口 1 + `*.web.*` 平台变体 6),本文件是唯一真孤儿(疑似死代码):src 内零 import —— 根 barrel `src/index.tsx:9-10` 直接 re-export `./components/ui` 与 `./components/business`,绕过本文件;包外亦零引用 —— `package.json#exports` 无 `./components` 子路径,example/website 全仓 grep 深路径 0 命中(example 全部从包根 import),jest/babel 配置无模块映射。git 史:`b090723`(phase 2+3 迁移)引入后零改动,且全历史 `src/index.tsx` 从未 import 过 `./components` → 自引入起即未被使用。完整证据链见 §3.2。 | 删除 `src/components/index.ts`(2 行 re-export barrel,无任何契约内可达路径);不建议反向「改走它」——那会为零消费者多加一跳 re-export,且与根 barrel 直连 ui/business 的现行结构相悖;若日后想要 `components` 聚合入口,再按需重建并让根 barrel 经它 re-export |
| `src/theme/useTheme.ts:6-14` | 质量 | Low | | Provider 缺失时 `useTheme` 静默回退模块级 `FALLBACK`(light 全套 tokens),无 `__DEV__` 告警亦无 why 注释 —— 漏包 `ThemeProvider` 的接入错误被掩盖(整 app 永远 light、暗色失效且零信号);FALLBACK 为模块级稳定引用,useThemedStyles 缓存契约不受影响。fallback-vs-throw 属 CLAUDE.md 注释标准里「读者会问为什么」的决策但未注明。 | 补一句 why 注释,并在 dev 下一次性 `console.warn` 提示缺 Provider(告警用 `typeof __DEV__ !== 'undefined' && __DEV__` 守卫——裸 `__DEV__` 在非 Metro 的 web 打包器下会 ReferenceError,logger.ts:12 已有此先例——配模块级 flag 保证只警一次;theme 是最底层,不引 utils/logger,维持零仓内依赖) |
| `src/theme/colors.ts:169、172` | 质量 | Low | | 两处暗色 alpha 与亮色故意不同但缺逐条注释(CLAUDE.md 契约:「很多 alpha 值在亮/暗之间故意不同,colors.ts 有逐条注释」):(a)`glassStatsHighlight` 暗 0.10 无注释,且亮侧注释宣称的「比 glassHighlight 更强」(0.65>0.28)在暗色反转(0.10<0.24);(b)`brandTint12` 暗 0.22 无注释并与 `brandTint14` 暗值(:117,同 0.22)撞值 —— 亮色 10/12/14 三档阶梯(0.10/0.12/0.14)在暗色塌缩为 0.16/0.22/0.22,亮侧「比 brandTint10 多 2% 视觉权重」语义不再成立;刻意合档还是笔误无从判别。 | 两处各补一句暗色 why 注释;`brandTint12` 暗值若为笔误改回阶梯中间档(0.18-0.20),若刻意合档则注明 |
| `src/theme/shadow.ts:7 ↔ src/theme/colors.ts:5、75、111、196` | 重复 | Low | | 品牌橙 hex `'#EB6E00'` 字面量跨文件重复 5 处:colors.ts 亮/暗 `primary`、`glassActiveFg`(:75,注释自言「亮色同 primary」)、`avatarGradient` 第 2 stop、shadow.ts 模块级 `BRAND`(全部品牌光晕 shadowColor 的唯一来源)—— 品牌色调整需多点手工同步,漏改 shadow.ts 即光晕与主色静默分叉(无类型/测试兜底);另有 8 处 `rgba(235,110,0,…)` 同色字面量受字符串 token 形态限制难以引用常量,不计入。 | colors.ts 导出单一品牌常量(如 `BRAND_ORANGE`),亮/暗 `primary`、`glassActiveFg`、`avatarGradient`、shadow.ts `BRAND` 共同引用(primary 亮暗同值,scheme 无关推导安全) |
| `src/theme/colors.ts:92-98、184-188、195-196(对照 palettes.ts:1-15)` | 解耦 | Medium | | 渐变序列驻留 colors.ts,与 palettes.ts 自述职责冲突:`heroGradient0/1/2` 是 3 stop 渐变序列硬塞进 role-based ColorTokens —— palettes.ts 头注释明言该形态是反模式(「硬塞 4 个 role 进 ColorTokens 语义模糊,改放这里」),CLAUDE.md 同口径「新加 palette 走这里,不要往 colors.ts 塞」;`avatarGradient` 渐变数组(:195-196)亦驻 colors.ts。git 核实两者与 palettes.ts(含该头注释)同源于 phase 1 提交 `7dd4231`(并存而非先后遗留)→ 仓内并行两套渐变安置惯例,新增渐变时先例互相矛盾。 | 首选在 colors.ts 两处注明「历史驻留,新渐变一律进 palettes.ts」的边界(CLAUDE.md 与 palettes.ts 头注释对「新增」的指向本就单义,矛盾只困扰归纳旧代码者);迁入 palettes.ts 降为可选项——heroGradient 驻 ColorTokens 享受随主题自动切换,迁成 palette 形态后消费方须手动 `scheme === 'dark'` 分支,除 breaking 外还是人体工学回退 |
| `src/theme/scale.ts:10-16` | 质量 | Medium | | 模块加载时一次性取 `Dimensions.get('window').width` 定死 ratio,无短边守卫亦无竖屏假设注释:横屏启动时按长边算(iPhone 17 Pro 874/402≈2.17,全部 `r()` 尺寸约翻倍、`rf()` 字号 +35%),旋转后也不重算;`rf` 注释自引的 react-native-size-matters 正是用 min(width, height) 短边防此例。触发面主要在消费 app:一旦允许横屏/iPad 即用户可见布局劣化(届时应升 High);仓内 example 的方向配置(Android 无 `screenOrientation` 锁、iOS iPad 键放开横屏)仅佐证仓内无竖屏锁定惯例——example 现为未渲染本库的死脚手架,证据成色有限。iPad Split View 启动(window 宽可小于 402)同属此启动抽奖,`min(w,h)` 修法一并覆盖。`width 为 0 时回退 DESIGN_WIDTH` 的防御已具备,不在此列。 | ratio 分子改 `Math.min(width, height)`(竖屏行为不变,一行同时收口横屏启动与旋转漂移);若刻意只支持竖屏 phone,补 why 注释声明边界 |
| `src/theme/colors.ts:51 ↔ :156` | 质量 | Low | | 与 `:169、172` 行同类的第 3 处暗色 alpha 注释缺口:`scrim` 亮 0.5 → 暗 0.7,两侧均无注释(违 CLAUDE.md「亮/暗 alpha 故意不同有逐条注释」契约)。质量复审全量扫描确认显著缺口共 3 处(另有 brandTint14 等 3 处属块级注释勉强覆盖的边缘,点到为止不入账)。 | 补一句暗色加深的 why 注释(如「暗色环境底图对比度低,scrim 需更重才能压住」) |
| `src/theme/shadow.ts:109-117、120-125` | 质量 | Low | | ShadowTokens 类型纪律与 ColorTokens 不对称:顶层 key 经同态映射保留 readonly,但值类型嵌套字段可合法赋值(tsc 实测:`t.card = {...}` 报 2540,`t.card.shadowOpacity = 3` 通过);叠加 `darkZero` 浅展开,暗色 9 个 token(subtle/card/brand 系/none)共享同一 `shadowOffset` 对象引用——一次类型合法的 `shadow.card.shadowOffset.height = 5` 会静默串改 9 个 token。ColorTokens 因值为 string 经同态映射天然全量只读,无此问题。 | 值类型嵌套字段加 `readonly`;`darkZero` 改为每 token 独立展开 offset 对象(或冻结) |
| `src/theme/blur.ts:4-9 ↔ src/theme/colors.ts:60、64、163、165` | 质量 | Low | | 注释与档位失配:colors.ts 四处注释宣称 glassSurface/tabBarGlassTint 的 alpha 按「blurAmount=25 / 15」标定,但 blur.ts 仅 10/40 两档、仓内无任何 15/25 用法(grep 0 命中,TabBar 亦不使用 BlurLayer),且文档站 blur-layer.mdx:88 明文禁止 hardcode blurAmount——注释所述设计组合无法用公共 API 复现:注释过时或档位缺口,二者必居其一。 | 对照设计稿二选一:更新四处注释为现档(10/40)标定值,或在 blur.ts 补 15/25 档并文档化 |
| `src/theme/index.ts:9` | 解耦 | Low | | 裸 `ThemeContext` 对外导出但零文档(website docs 与 CLAUDE.md 的 ./theme 清单均未列):消费方可自挂 inline-value Provider 绕开 `ThemeProvider` 的 useMemo 契约,打穿 useThemedStyles 缓存;子树强制主题的正当需求已有嵌套 `<ThemeProvider forceScheme>` 覆盖,该导出无已知正当用途。 | 注释/文档标明「内部用途,自挂 Provider 须保证 value 引用稳定」,或评估下个 breaking 版本收回导出 |

### 2.2 定稿发现(Task 14/15 按严重度分组填入)

(移入行格式:`**位置** · 维度 · 置信度` + 证据(含关键代码片段)+ 修复建议)

#### Critical

#### High

#### Medium

#### Low

## 3. 度量数据附录

### 3.1 jscpd(重复度)

**实际命令** —— 计划命令(`--ignore` / `consoleFull`)在 `yarn dlx` 解析到的 jscpd 5.0.5(Rust 重写的 `cpd` CLI)已不存在,按 v5 等价旗标执行,并加 json reporter 便于精确核对:

```sh
yarn dlx jscpd src --ignore-pattern "**/data.ts" --min-tokens 50 --reporters console-full,json --output /tmp/jscpd-report
```

已确认 `src/icons/data.ts` 被排除(console 与 JSON 报告中均无任何 data.ts 条目)。

**汇总**(jscpd 5.0.5,src/ 共 128 文件 6548 行):

| Format | 文件数 | 总行数 | 总 token | 克隆数 | 重复行 | 重复 token |
| --- | --- | --- | --- | --- | --- | --- |
| tsx | 56 | 3302 | 17055 | 7 | 113(3.42%) | 582(3.41%) |
| typescript | 72 | 3246 | 13075 | 1 | 16(0.49%) | 83(0.63%) |
| **合计** | 128 | 6548 | 30130 | 8 | 129(1.97%) | 665(2.21%) |

**克隆对清单**(8 对;行数/token 为单笔克隆体量):

| # | 克隆对(file:line) | 行数 | token |
| --- | --- | --- | --- |
| 1 | `src/components/ui/Avatar/Avatar.tsx:20-33` ↔ `src/components/ui/DrawerHeader/DrawerHeader.tsx:17-30` | 14 | 64 |
| 2 | `src/components/ui/BlurLayer/BlurLayer.tsx:3-21` ↔ `src/components/ui/BlurLayer/BlurLayer.web.tsx:10-22` | 19 | 63 |
| 3 | `src/components/ui/Grid/styles.ts:72-88` ↔ `src/components/ui/TabBar/styles.ts:27-43` | 17 | 83 |
| 4 | `src/components/ui/Segmented/Segmented.tsx:27-40` ↔ `src/components/ui/Tabs/Tabs.tsx:22-35` | 14 | 103 |
| 5 | `src/components/ui/Spinner/Spinner.tsx:24-36` ↔ `src/components/ui/Spinner/Spinner.web.tsx:46-60` | 13 | 110 |
| 6 | `src/components/ui/Switch/Switch.tsx:11-38` ↔ `src/components/ui/Switch/Switch.web.tsx:3-35` | 28 | 97 |
| 7 | `src/components/ui/Switch/Switch.tsx:63-76` ↔ `src/components/ui/Switch/Switch.web.tsx:49-62` | 14 | 74 |
| 8 | `src/components/ui/Toast/ToastHost.tsx:11-28` ↔ `src/components/ui/Toast/ToastHost.web.tsx:3-23` | 18 | 71 |

**分流初判**(Task 14 二审定性):

- **约定性同形候选:0 对** —— 预期会成簇的 `styles.ts` `sizingFor`/`paletteFor` 结构与 `types.ts` Props 模板,在 min-tokens 50 下均未被报成克隆(结构同形但 token 序列差异足够大)——「0 对」仅为机器度量结论,不代表仓库无约定性同形;§4 豁免清单仍由深读期人工比对供给。唯一涉及 `styles.ts` 的 #3 经核读是 `makeStyles` 内 `badge`/`badgeText` 样式块的逐字段重复(仅 `top` 偏移不同),不属于 sizingFor/paletteFor 约定结构,不入候选。
- **入台账:8 对 → §2.1 共 7 行**(#6/#7 同属 `Switch.tsx ↔ Switch.web.tsx` 同一文件对、同一成因,合并 1 行)。其中 5 对(#2、#5、#6、#7、#8)是 `*.tsx ↔ *.web.tsx` 平台兄弟文件之间的重复 —— 平台分叉本身是仓库约定(CLAUDE.md「`*.web.tsx` 兄弟文件」),但分叉内被克隆的逻辑/常量是否应抽公共模块,台账逐对给出证据,留 Task 14 权衡。

### 3.2 madge(循环依赖 / 孤儿)

**实际命令**(`yarn dlx` 解析到 madge 8.0.0;两查询按计划分两次运行;src 内全部相对路径 import、无 `@/` 别名,默认解析即可全量定位,未需 `--ts-config`):

```sh
yarn dlx madge --circular --extensions ts,tsx src
yarn dlx madge --orphans --extensions ts,tsx src
```

两次均 `Processed 195 files`,与 `find src -type f \( -name "*.ts" -o -name "*.tsx" \) | wc -l` = 195 一致 → 覆盖 src 全量 ts/tsx(含 §3.1 jscpd 排除的 `data.ts`;jscpd 的「128 文件」是其自身统计口径,与此无冲突)。

**循环依赖** — 原始输出:

```
✔ No circular dependency found!
```

0 环,无台账项。

**孤儿模块** — 原始输出(8 个,madge 输出为相对 `src/` 路径):

```
components/index.ts
components/ui/BlurLayer/BlurLayer.web.tsx
components/ui/Pulse/usePulse.web.ts
components/ui/Reveal/Reveal.web.tsx
components/ui/Spinner/Spinner.web.tsx
components/ui/Switch/Switch.web.tsx
components/ui/Toast/ToastHost.web.tsx
index.tsx
```

**逐个判读**(排除流程:① 根入口 / ② package.json 字段引用 / ③ example、website workspace 引用 / ④ 平台变体 / ⑤ jest、babel 配置引用;全过 8 项,误报 7 + 真孤儿 1):

| Orphan(相对 src/) | 判定 | 排除理由 |
| --- | --- | --- |
| `index.tsx` | 误报 | ① 根入口;② `package.json#exports["."]` 的 `source` 直指 `./src/index.tsx`、`main`/`types` 指向其 bob 构建产物,`tsconfig.paths` 亦把包名映射到 `./src/index` —— 包的对外入口,src 内无人 import 是设计使然 |
| `components/ui/BlurLayer/BlurLayer.web.tsx` | 误报 | ④ 平台变体:native 兄弟 `BlurLayer.tsx` 同目录存在,目录内 `index.ts` 以无后缀 `./BlurLayer` import,Metro / bob 按平台后缀解析,madge 不认 `.web` 后缀、固定解析到 native 版 → `*.web.*` 必然报孤儿 |
| `components/ui/Pulse/usePulse.web.ts` | 误报 | ④ 同上,native 兄弟 `usePulse.ts` 存在 |
| `components/ui/Reveal/Reveal.web.tsx` | 误报 | ④ 同上,native 兄弟 `Reveal.tsx` 存在 |
| `components/ui/Spinner/Spinner.web.tsx` | 误报 | ④ 同上,native 兄弟 `Spinner.tsx` 存在 |
| `components/ui/Switch/Switch.web.tsx` | 误报 | ④ 同上,native 兄弟 `Switch.tsx` 存在 |
| `components/ui/Toast/ToastHost.web.tsx` | 误报 | ④ 同上,native 兄弟 `ToastHost.tsx` 存在 |
| `components/index.ts` | **真孤儿** | ①–⑤ 逐项排除均不命中,证据见下 |

**真孤儿证据链 — `src/components/index.ts`**(整文件仅 2 行:`export * from './ui'; export * from './business';`):

- ① 非根入口(根入口是 `src/index.tsx`)。
- ② package.json 各字段不引用:`exports` 仅映射 `.`、`./package.json`、`./docs-home.css`,无 `./components` 子路径;`main`/`types` 指向根入口产物;bob `source: src` 是整目录构建配置、不构成对单文件的引用。
- ③ workspace 零引用:`grep -rn "components/index"` 全仓(仅排除 node_modules / lib / .yarn / .git / 本审查自身产物 docs/reviews、docs/plans)0 命中;example/src 对本包的 import 全部是 `from '@unif/react-native-design'` 包根形式(子路径 import grep 0 命中);example + website 内 `design/(src|components|lib)` 深路径 grep 0 命中。
- ④ 非平台变体(无 `.web` 后缀亦无对应变体)。
- ⑤ jest 配置(package.json#jest 仅 preset / testEnvironment / 路径忽略项)与 babel.config.js(仅两段 presets,无模块映射)均不引用。
- 旁证:src 内绕过它的原因是根 barrel `src/index.tsx:9-10` 直接 `export * from './components/ui'` + `'./components/business'`;git 史上该文件由 `b090723`(phase 2+3 迁移)引入后零改动,且 `git log --all -S "from './components'"` 对 `src/index.tsx` 全历史 0 命中 → 根入口从未经由它 re-export,自引入起即未被使用。

**度量边界**(与 §3.1「0 对」边界句同理,防止「0 环 + 1 孤儿」被外推成「解耦无问题」):(a)孤儿判定是**文件级**入边检查——可达文件内 export 级的未使用代码不在本结论范围,且本次审查没有任务覆盖该粒度(madge/jscpd 均不查,深读 checklist 亦未列专项);(b)**0 环 ≠ 分层方向合规**——`ui → business` 这类越层 import 只要不构成环,`--circular` 不会报,方向合规由 Task 13 Step 3 的 grep 专项核查。两点加强语:madge 8 默认跟随 `import type` 边(实测双 type-import 互引即报环),故「0 环」已含类型层;src 内 grep 动态 import/require 为 0(命中均为注释),静态图即全图。另一条现成推论供 Task 13 复用:孤儿清单不含任何组件级 `index.ts` → 不存在整组件目录从 barrel 体系脱链,「漏导出」核查可收窄为 barrel 内 named export 完整性。

→ 记入 §2.1:真孤儿 1 项(Medium,维度=解耦);环 0 项。

### 3.3 eslint 复杂度热点

**实际命令**(与计划一致,eslint 9.39.4 的 `--rule` 旗标直通可用,未走 overlay 兜底;实际退出码 0 —— 0 error,warning 不计入退出码):

```sh
yarn eslint "src/**/*.{ts,tsx}" \
  --rule '{"complexity":["warn",10],"max-depth":["warn",4],"max-lines-per-function":["warn",{"max":100,"skipBlankLines":true,"skipComments":true}]}'
```

覆盖面经 `-f json` 二次运行复核:实际 lint **195 个文件**,与 §3.2 madge 的 src 全量 ts/tsx 计数一致(含 `src/icons/data.ts` —— `eslint.config.mjs` 的 ignores 只排 node_modules/lib/website,纯数据文件无函数体,三规则天然 0 命中)。输出无基线规则混入(json 输出中 ruleId 仅含三条注入规则;注:基线 `yarn lint` 退出码 0 只证 0 error,不蕴含 0 warning,故此处以 json 复核为准),全部 warning 均来自本次注入的目标规则。

**汇总** —— 共 **6 条 warning,全部来自 `complexity`**;`max-depth`(>4)与 `max-lines-per-function`(>100 有效行)均 **0 命中** —— 0 也是有效结论:src 内无超过 4 层的嵌套块、无超过 100 有效行的函数体,这两个维度无深读线索。

**热点清单**(每文件恰 1 条 warning,文件聚合即逐条列出;按实测复杂度降序 = 深读优先序):

| 文件 | 位置(函数) | 规则 | 实测/阈值 |
| --- | --- | --- | --- |
| `src/components/ui/Stepper/Stepper.tsx` | 18:8(`Stepper`) | complexity | 22 / 10 |
| `src/components/ui/Cell/Cell.tsx` | 34:8(`Cell`) | complexity | 20 / 10 |
| `src/components/ui/TextField/TextFieldBase.tsx` | 25:3(`TextFieldBase`) | complexity | 20 / 10 |
| `src/components/ui/Spinner/Spinner.tsx` | 16:8(`Spinner`) | complexity | 12 / 10 |
| `src/components/ui/Spinner/Spinner.web.tsx` | 35:8(`Spinner`) | complexity | 12 / 10 |
| `src/components/ui/Button/ButtonBase.tsx` | 73:28(匿名箭头函数 —— `Pressable` 的 `style` 回调,多重三元合成样式数组) | complexity | 11 / 10 |

**度量边界**:超阈值只是深读优先线索,**不是缺陷判据**(spec §4)—— RN 组件渲染函数靠条件分支表达 variant/状态本属常态,是否构成问题由深读期结合上下文判断,故本节不向 §2.1 台账记行。后续深读任务优先精读上表 6 文件,头部三个(22/20/20,双倍于阈值)优先级最高。两条交叉线索供深读复用:(a)`Spinner.tsx ↔ Spinner.web.tsx` 同值 12 —— 被标记函数体恰包含 §3.1 jscpd #5 的克隆区(两端逐行重复的入参防御分支),与该台账行「抽 `sanitizeSpinnerProps`」的建议同源,若采纳则两端复杂度同步回落;(b)`ButtonBase.tsx:73` 仅超 1,但位于 Button/IconButton 共享的核心 primitive 上,影响面大于单组件。

→ 记入 §2.1:0 行(线索随深读任务消化)。

## 4. 豁免说明

(约定性同形清单 + 「基础原子」认定清单,Task 14/15 填)

## 5. 基线与前提

- 基线 commit:`9c05acf`(自 main `ff626af` / v0.8.2 拉出;其后 merge 进的 main 提交均为纯文档改动,`src/`、`scripts/` 与 ff626af 一致)
- yarn typecheck:通过(退出码 0,无报错)
- yarn test:通过(3 个 suite / 19 个用例全部通过)
- yarn lint:通过(退出码 0)
- data.ts 生成一致性:原始再生成 hash 不一致(HEAD `sha1:8b3275e9851e6e57debcffb1c450dd11689248ce` → 再生成 `sha1:4678ebadc98790ff6a0255d531efba8d1a201380`,`shasum` 即 SHA-1),但再生成产物经仓库 prettier 配置格式化后与 HEAD 字节一致 → 内容同步,差异纯格式(生成脚本输出未 prettier 化所致,详见 2.1 台账);已 `git checkout -- src/icons/data.ts` 还原,工作区恢复干净
