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

### 3.3 eslint 复杂度热点

## 4. 豁免说明

(约定性同形清单 + 「基础原子」认定清单,Task 14/15 填)

## 5. 基线与前提

- 基线 commit:`9c05acf`(自 main `ff626af` / v0.8.2 拉出;其后 merge 进的 main 提交均为纯文档改动,`src/`、`scripts/` 与 ff626af 一致)
- yarn typecheck:通过(退出码 0,无报错)
- yarn test:通过(3 个 suite / 19 个用例全部通过)
- yarn lint:通过(退出码 0)
- data.ts 生成一致性:原始再生成 hash 不一致(HEAD `sha1:8b3275e9851e6e57debcffb1c450dd11689248ce` → 再生成 `sha1:4678ebadc98790ff6a0255d531efba8d1a201380`,`shasum` 即 SHA-1),但再生成产物经仓库 prettier 配置格式化后与 HEAD 字节一致 → 内容同步,差异纯格式(生成脚本输出未 prettier 化所致,详见 2.1 台账);已 `git checkout -- src/icons/data.ts` 还原,工作区恢复干净
