# src 全量代码审查实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已获批 spec(`docs/specs/2026-06-10-src-code-review-design.md`)对 `src/` 执行四维度(质量/最佳实现/重复/解耦)静态审查,产出审查报告 `docs/reviews/2026-06-10-src-code-review.md`。

**Architecture:** 三阶段——①客观度量(jscpd / madge / eslint 复杂度规则)→ ②按依赖序人工深读(theme → utils → icons → ui → business → barrel)→ ③复核 Medium+ 发现并定稿。发现实时追加进报告文件的台账表,复核后移入定稿区。

**Tech Stack:** `yarn dlx`(jscpd、madge)、eslint 9 flat config(`eslint.config.mjs`)+ `--rule` 一次性注入、codegraph MCP(查调用方/影响面)、markdown 报告。

---

## 硬性约束(来自 spec §7,每个任务都适用)

- **只审不改**:任何 `src/`、`scripts/`、配置文件一律不动;发现"顺手就能修"的问题也只记台账。
- 全程只创建/修改一个文件:`docs/reviews/2026-06-10-src-code-review.md`。
- 不安装依赖(`package.json` / `yarn.lock` 不变),度量工具一律 `yarn dlx` 临时拉取。
- 执行分支:`docs/src-code-review`(自 main `ff626af` / v0.8.2 拉出;后续 merge 进的 main 提交均为纯文档改动,`src/` 与 ff626af 一致)。

## 四维 checklist(深读任务每个文件套用;完整判据见 spec §3)

1. **质量**:hooks 依赖数组完整或有刻意省略注释(`ThemeProvider` 只依赖 `scheme` 属刻意设计,豁免);`useThemedStyles` 的 maker 全部来自模块顶层 `styles.ts`;命令式注册表订阅清理 + `confirm()` 重入保护;定时器/动画 unmount 清理;索引访问是真 narrow 而非 `!`/`as` 糊弄;a11y(role/label/state、`fixed.hitTarget` 触达面积、disabled 可感知);异常 props(空数组、越界 index)防御。
2. **最佳实现**:`Pressable` 而非遗留 `Touchable*`;context value 引用稳定;列表 key 与 memo 策略;静态 `StyleSheet` vs 每渲染新建对象;动画走原生驱动;`r`/`rf` 纪律(`fixed.*` 不二次缩放、字号走 `rf`);web 分叉最小化;props 命名对齐 size/variant 体系;列表型组件用 `childTestID`;实现了但 barrel 漏导出。
3. **重复**:与已读文件比对——真重复(应提取)vs 约定性同形(`sizingFor`/`paletteFor`/`types.ts` 模板,豁免);原生与 `*.web.tsx` 间可共享逻辑;`ButtonBase` 之外的按钮 chrome。
4. **解耦**:import 方向(`ui/` 不依赖 `business/`;`theme/`/`utils/` 不依赖 `components/`;横向依赖只指基础原子);不 import 自家 barrel;`types.ts` 不反向依赖实现;单一职责(>100 行文件重点看)。

## 台账行格式

追加到报告 §2.1 表格,一发现一行:

```
| `path/to/file.tsx:42` | 质量/最佳实现/重复/解耦 | Critical/High/Medium/Low | (复核前留空) | 证据摘要(一句话+关键代码片段) | 修复建议(一句话) |
```

严重度判据(spec §4):Critical = 用户可见 bug/崩溃/泄漏;High = 正确性风险或影响面广的偏离;Medium = 维护性问题;Low = 风格一致性。

---

### Task 1: 报告骨架与基线

**Files:**
- Create: `docs/reviews/2026-06-10-src-code-review.md`

- [ ] **Step 1: 记录基线** — 运行 `git rev-parse --short HEAD && git status --short`。Expected: 输出当前 commit(短 hash)、工作区干净(无输出行)。记下 hash 备 Step 6 用。
- [ ] **Step 2: typecheck 基线** — 运行 `yarn typecheck`。Expected: 退出码 0,无报错。
- [ ] **Step 3: test 基线** — 运行 `yarn test`。Expected: 全部用例通过(`__tests__/` 下 scale/logger/testID 纯逻辑用例)。
- [ ] **Step 4: lint 基线** — 运行 `yarn lint`。Expected: 退出码 0。
- [ ] **Step 5: data.ts 生成一致性** — 运行 `shasum src/icons/data.ts && node scripts/build-icons.js && shasum src/icons/data.ts && git status --short`。Expected: 两次 hash 完全一致且工作区仍干净 = `data.ts` 与 `src/icons/svg/` 同步。若 hash 变化:这是一条 High 发现(生成物与源失同步),记台账并 `git checkout -- src/icons/data.ts` 还原。
- [ ] **Step 6: 写报告骨架** — 创建 `docs/reviews/2026-06-10-src-code-review.md`,内容如下(`<baseline-hash>` 等占位以 Step 1–5 实测结果填入):

```markdown
# src 全量代码审查报告

> 日期:2026-06-10 · 依据:`docs/specs/2026-06-10-src-code-review-design.md` · 状态:进行中
> 基线:`docs/src-code-review` @ `<baseline-hash>`,工作区干净

## 1. 执行摘要

(Task 15 定稿时填写:整体结论、四维度概评、最值得做的 3 件事)

## 2. 发现列表

### 2.1 台账(深读期增量追加,复核后移入 2.2)

| 位置 | 维度 | 严重度 | 置信度 | 证据摘要 | 建议 |
| --- | --- | --- | --- | --- | --- |

### 2.2 定稿发现(Task 14/15 按严重度分组填入)

#### Critical

#### High

#### Medium

#### Low

## 3. 度量数据附录

### 3.1 jscpd(重复度)

### 3.2 madge(循环依赖 / 孤儿)

### 3.3 eslint 复杂度热点

## 4. 豁免说明

(约定性同形清单 + 「基础原子」认定清单,Task 14/15 填)

## 5. 基线与前提

- 基线 commit:`<baseline-hash>`(自 main `ff626af` / v0.8.2 拉出)
- yarn typecheck:<通过/失败>
- yarn test:<通过/失败,用例数>
- yarn lint:<通过/失败>
- data.ts 生成一致性:<hash 一致/不一致>
```

- [ ] **Step 7: Commit**

```bash
git add docs/reviews/2026-06-10-src-code-review.md
git commit -m "docs: 审查报告骨架与基线记录"
```

### Task 2: 度量 — 重复度(jscpd)

**Files:**
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§3.1、§2.1)

- [ ] **Step 1: 跑 jscpd** — 运行 `yarn dlx jscpd src --ignore "**/data.ts" --min-tokens 50 --reporters consoleFull`。Expected: 输出每个克隆对的两处 `file:line` 范围 + 汇总表(总行数、重复行数、重复率)。若无网络导致 `yarn dlx` 失败:在报告 §3.1 写明「工具缺位,重复维度降级为深读期人工比对」(spec §8),跳过本任务余下步骤。
- [ ] **Step 2: 原始结果入附录** — 汇总表 + 克隆对清单(file:line 对)粘入报告 §3.1。
- [ ] **Step 3: 初判分流** — 逐克隆对判定:涉及 `styles.ts` 的 `sizingFor`/`paletteFor` 结构、`types.ts` 的 Props 模板 → 标记「约定性同形候选」附在 §3.1 末尾;其余 → 按台账行格式记入 §2.1(维度=重复,严重度初判 Medium,置信度留空)。
- [ ] **Step 4: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: jscpd 重复度度量结果"`

### Task 3: 度量 — 依赖关系(madge)

**Files:**
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§3.2、§2.1)

- [ ] **Step 1: 循环依赖** — 运行 `yarn dlx madge --circular --extensions ts,tsx src`。Expected: `✔ No circular dependency found!` 或环路径列表。离线失败处理同 Task 2 Step 1(§3.2 注明,深读期人工核对 import 方向)。
- [ ] **Step 2: 孤儿模块** — 运行 `yarn dlx madge --orphans --extensions ts,tsx src`。Expected: 无文件 import 的清单。注意:根入口 `src/index.tsx` 与仅被包外(example/website)引用的文件会误报,需人工判读。
- [ ] **Step 3: 结果入附录 + 台账** — 原始输出粘入 §3.2;确认的环(任何一条都是 High)与真孤儿(Medium,疑似死代码)记入 §2.1(维度=解耦)。
- [ ] **Step 4: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: madge 依赖关系度量结果"`

### Task 4: 度量 — 复杂度热点(eslint)

**Files:**
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§3.3)

- [ ] **Step 1: 跑一次性规则** — 运行:

```bash
yarn eslint "src/**/*.{ts,tsx}" \
  --rule '{"complexity":["warn",10],"max-depth":["warn",4],"max-lines-per-function":["warn",{"max":100,"skipBlankLines":true,"skipComments":true}]}'
```

Expected: 退出码 0(基线无 error,Task 1 已确认),输出若干 warning,每条含 `file:line`、规则名、实测值。若 eslint 拒绝 `--rule`(flat config 兼容问题):创建临时 overlay 文件 `eslint.hotspot.config.mjs`(内容如下),改用 `yarn eslint -c eslint.hotspot.config.mjs "src/**/*.{ts,tsx}"`,跑完 `rm eslint.hotspot.config.mjs`,**不提交该文件**:

```js
// 一次性复杂度度量 overlay — 跑完即删,不提交
import base from './eslint.config.mjs';
export default [
  ...base,
  {
    rules: {
      complexity: ['warn', 10],
      'max-depth': ['warn', 4],
      'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }],
    },
  },
];
```

- [ ] **Step 2: 热点清单入附录** — warning 按文件聚合粘入 §3.3,标注「超阈值只是深读优先线索,不是缺陷判据」(spec §4)。后续深读任务优先精读这些文件。
- [ ] **Step 3: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: eslint 复杂度热点清单"`

### Task 5: 深读 — theme(10 文件)

**Files:**
- Review: `src/theme/{ThemeProvider.tsx, useTheme.ts, useThemedStyles.ts, colors.ts, shadow.ts, tokens.ts, scale.ts, palettes.ts, blur.ts, index.ts}`
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

每个文件套「四维 checklist」,以下是各文件**额外**的重点核对项;发现一律按台账行格式追加 §2.1:

- [ ] **Step 1: `ThemeProvider.tsx`** — `useMemo` 依赖恰为 `[scheme]` 且有 why 注释;context value 除 `{scheme, colors, shadow}` 外无多余字段;`useColorScheme()` null 分支处理。
- [ ] **Step 2: `useThemedStyles.ts`** — 本地 `NamedStyles<T>` shim 的类型正确性;`useMemo` 依赖 `[colors, shadow, maker]` 三项齐全。
- [ ] **Step 3: `useTheme.ts`** — Provider 缺失时的行为(throw 还是 fallback)有定义且一致。
- [ ] **Step 4: `colors.ts`** — 亮/暗 alpha 故意不同处的逐条注释仍在;role 命名一致性;有无色值绕过 token 硬编码。
- [ ] **Step 5: `shadow.ts`** — 暗色置零模式 + `floating`/`glassBar`/`brandAvatar` 三例外的注释完整;新 key 是否遵循该模式。
- [ ] **Step 6: `scale.ts`** — `r()` 走 `PixelRatio.roundToNearestPixel`;`rf()` moderate 系数 0.3;`fixed.*` 不被内部二次缩放;402pt 基准注释。
- [ ] **Step 7: `tokens.ts`** — token 分组与导出面;是否有应进 `palettes.ts` 的渐变序列混入。
- [ ] **Step 8: `palettes.ts`** — 只含渐变序列;light/dark 成对完整。
- [ ] **Step 9: `blur.ts` + `index.ts`** — barrel 导出完整;无循环 import。
- [ ] **Step 10: 消费面核查** — 用 codegraph(`codegraph_callers`)查 `useTheme`/`useColors`/`useShadow`/`useThemedStyles` 的调用方,确认组件层没有绕过 hook 直接 import `colors.ts` 原始对象的情况;发现记台账(维度=解耦)。
- [ ] **Step 11: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — theme"`

### Task 6: 深读 — utils(6 文件)

**Files:**
- Review: `src/utils/logger/{logger.ts, types.ts, index.ts, transports/console.ts}`、`src/utils/testID/{testID.ts, index.ts}`
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

- [ ] **Step 1: `logger/logger.ts`** — transport 抛错被吞的契约(try/catch 包裹每个 transport);`addTransport` 按 id 去重;默认级别 `__DEV__` ? debug : warn;`setLogLevel` 全局生效语义。
- [ ] **Step 2: `logger/transports/console.ts` + `types.ts` + `index.ts`** — transport 接口最小化;类型导出用 `import type`;barrel 完整。
- [ ] **Step 3: `testID/testID.ts` + `index.ts`** — `childTestID(parent, id, override?)` 三参语义(override 优先、parent 为空的行为);返回值在 parent/id 为 undefined 时的边界。
- [ ] **Step 4: 测试边界对照** — 对照 `__tests__/utils/`,确认现有纯逻辑用例覆盖上述契约;缺口(如 transport 吞错无用例)记台账(维度=质量,严重度 Low~Medium)。
- [ ] **Step 5: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — utils"`

### Task 7: 深读 — icons 入口 + 生成脚本 + Icon 组件

**Files:**
- Review: `src/icons/{index.ts, types.ts}`、`scripts/build-icons.js`、`src/components/ui/Icon/`(含 `Icon.tsx` 及同目录 types/styles/index)
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

- [ ] **Step 1: `scripts/build-icons.js`** — regex 只认 `<path>`/`<rect>`/`<circle>` + `fill="currentColor"`:遇到 polyline/polygon 是**静默丢弃**还是报错退出?静默丢弃 = High(图标缺笔画无人知);viewBox/stroke 属性规范(CLAUDE.md 表格)有无校验;生成头部 `AUTO-GENERATED` 注释;输出排序稳定性(影响 diff 噪音)。
- [ ] **Step 2: `src/icons/types.ts` + `index.ts`** — `IconName` 闭集 union 与 `data.ts` key 同步机制;导出面。
- [ ] **Step 3: `ui/Icon/Icon.tsx`** — `fill: 'currentColor'` 替换为 stroke 色的实现;未知 name 的 fallback(崩溃/空渲染/告警);size 是否走 `r()`;`createLogger('Icon')` 用法。
- [ ] **Step 4: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — icons 与生成脚本"`

### Task 8: 深读 — ui 基础原子(7 组件)

**Files:**
- Review: `src/components/ui/{Spinner, StatusDot, Skeleton, Pulse, Logo, BlurLayer, Thumbnail}/` 全部文件(含 `Spinner.web.tsx`、`BlurLayer.web.tsx`)
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

每组件读目录内全部文件(`*.tsx`/`types.ts`/`styles.ts`/`index.ts`)套四维 checklist;web 分叉与原生**成对比对**(props 面、行为语义、可共享逻辑):

- [ ] **Step 1: Spinner(+ `.web`)** — 旋转动画 unmount 清理;原生驱动;web 版 CSS 动画语义等效;两版尺寸表是否重复定义(重复维度)。
- [ ] **Step 2: Skeleton** — shimmer 循环动画清理;列表占位的 key。
- [ ] **Step 3: Pulse** — 循环动画清理;reduce-motion 尊重与否(a11y)。
- [ ] **Step 4: StatusDot + Logo + Thumbnail** — 纯展示件:palette/sizing 约定遵循;Thumbnail 的图片加载失败 fallback。
- [ ] **Step 5: BlurLayer(+ `.web`)** — 平台分叉边界(原生 blur vs web backdrop-filter);`glassTint*` token 使用。
- [ ] **Step 6: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — ui 基础原子"`

### Task 9: 深读 — ui 按钮族(4 组件)

**Files:**
- Review: `src/components/ui/{Button, IconButton, Chip, Tag}/` 全部文件(Button 目录含 `ButtonBase.tsx`)
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

- [ ] **Step 1: `Button/ButtonBase.tsx`** — render-prop `children({sizing, palette})` 契约;Pressable 状态(pressed/disabled)样式;a11y(role=button、disabled state);hitSlop 补足 `fixed.hitTarget`;非 block `flexGrow: undefined` 放行 style 覆盖(#70 修复)的实现。
- [ ] **Step 2: `Button/` 其余 + `IconButton/`** — 两者都通过 ButtonBase 组合、无 chrome 重复;`sizingFor`/`paletteFor` 的 size/variant case 完整(对照 `types.ts` union,`noFallthroughCasesInSwitch` 下有无漏 case 的 default 糊弄)。
- [ ] **Step 3: `Chip/` + `Tag/`** — 是否重复实现按钮 chrome(若 Chip 可按压而没用 ButtonBase = 重复维度 Medium);Tag 纯展示则确认无交互残留。
- [ ] **Step 4: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — ui 按钮族"`

### Task 10: 深读 — ui 表单族(11 组件)

**Files:**
- Review: `src/components/ui/{Form, TextField, Input, Textarea, PasswordInput, Search, Checkbox, Radio, Switch, Stepper, Segmented}/` 全部文件(Form 含 `FormGroup.tsx`/`FormRow.tsx`;TextField 含 `TextFieldBase.tsx`;Switch 含 `Switch.web.tsx`)
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

- [ ] **Step 1: `TextField/TextFieldBase.tsx`(111 行,热点)** — 单一职责;受控/非受控双模一致;`onChangeText` 等回调引用稳定性。
- [ ] **Step 2: Input / Textarea / PasswordInput / Search** — 是否都组合 TextFieldBase(绕过者记重复维度);PasswordInput 明文切换的 a11y;Search 清除按钮触达面积。
- [ ] **Step 3: Checkbox / Radio / Switch(+ `.web`)** — a11y state(checked)必查;受控语义统一(`value`+`onChange` 还是 `checked`+`onValueChange`,族内命名一致性);Switch 两版行为等效。
- [ ] **Step 4: Stepper(95 行,热点)** — min/max 边界与连点保护;disabled 区间的 a11y。
- [ ] **Step 5: Segmented** — 列表 key 与 `childTestID`;选中态 a11y。
- [ ] **Step 6: Form / FormGroup / FormRow** — 布局容器是否夹带状态管理(超职责);间距走 token。
- [ ] **Step 7: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — ui 表单族"`

### Task 11: 深读 — ui 容器/导航(12 组件)

**Files:**
- Review: `src/components/ui/{Avatar, Card, Cell, Grid, NavBar, TabBar, Tabs, DrawerHeader, Carousel, Reveal, EntryCard, Empty}/` 全部文件(Reveal 含 `Reveal.web.tsx`)
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

- [ ] **Step 1: Cell(109 行,热点)+ Card** — Cell 单一职责(左图标/标题/右箭头/按压是否拆分合理);Card 阴影走 shadow token 暗色模式。
- [ ] **Step 2: Grid(88 行 styles,热点)** — 列计算与 `childTestID`;子项 key。
- [ ] **Step 3: NavBar + TabBar + DrawerHeader** — `fixed.navbarH`/`fixed.tabbarH` 直接使用不二次 `r()`;安全区处理归属(组件内 or 留给消费者)一致。
- [ ] **Step 4: Tabs(与已读的 Segmented 互查)** — 两者交互模型相近:有无可共享逻辑未提取(重复维度);各自 `childTestID`。
- [ ] **Step 5: Carousel(95 行,热点)** — 自动播放定时器清理(质量维度重点);手势与定时器竞态;页码指示 key。
- [ ] **Step 6: Reveal(+ `.web`)+ EntryCard + Empty + Avatar** — Reveal 动画清理与两版等效;Avatar `sizingFor` 约定;Empty 插画/文案 a11y。
- [ ] **Step 7: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — ui 容器导航"`

### Task 12: 深读 — ui 命令式浮层(Toast + Confirm)

**Files:**
- Review: `src/components/ui/Toast/{toast.ts, ToastHost.tsx, ToastHost.web.tsx, types.ts, styles.ts, index.ts}`、`src/components/ui/Confirm/{confirm.ts, ConfirmHost.tsx, types.ts, styles.ts, index.ts}`
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

- [ ] **Step 1: `toast.ts`** — 模块级 `Set<Subscriber>` 注册表;Host 未挂载时调用 `toast()` 的行为有定义;小写文件名的 APFS 注释保留。
- [ ] **Step 2: `ToastHost.tsx`(102 行)+ `.web`(104 行)** — 订阅 effect 清理;自动消失 `setTimeout` 在 unmount/快速连发时清理;双 Host 挂载行为;两版重复逻辑(队列管理应可共享——重复维度重点)。
- [ ] **Step 3: `confirm.ts` + `ConfirmHost.tsx`(91 行)** — 重入返回 `Promise.resolve(false)` 保护;Promise 在 Host unmount 时是否悬挂(泄漏维度);按钮 a11y。
- [ ] **Step 4: 跨族比对** — Toast/Confirm 注册表样板相似度:值不值得提取共享 `createImperativeHost` 工具,给结论记台账(spec 维度 3,「给结论即可,不强制」)。
- [ ] **Step 5: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — 命令式浮层"`

### Task 13: 深读 — business(4 组件)+ 三个 barrel

**Files:**
- Review: `src/components/business/{AvatarWithRing, GlassStats, VersionPill}/` 全部文件、`src/components/business/Decorations/{ScreenBackdrop.tsx, GradientWash.tsx, RadialHalo.tsx, types.ts, index.ts}`、`src/index.tsx`、`src/components/ui/index.ts`、`src/components/business/index.ts`
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1)

- [ ] **Step 1: Decorations 三件(ScreenBackdrop 122 行,热点)** — 单一职责;渐变用 `palettes.ts` 而非 hardcode;`types.ts`(103 行)是否塞了实现逻辑。
- [ ] **Step 2: AvatarWithRing + GlassStats + VersionPill** — 「复合但通用」边界:无 navigation/store/业务流程耦合(spec:那些留在消费者仓库);对 ui 原子的组合是否重复造轮子。
- [ ] **Step 3: 分层方向核查** — `grep -rn "components/business" src/components/ui` Expected: 无输出(ui 不依赖 business);`grep -rnE "from '.*components/" src/theme src/utils` Expected: 无输出(theme/utils 不依赖 components;只匹配 import 行,避免注释字样误报)。有输出即 High(维度=解耦)。
- [ ] **Step 4: barrel 核查** — `src/index.tsx`/`ui/index.ts`/`business/index.ts` 导出完整性:目录里有但 barrel 漏导出的组件;内部 primitive(ButtonBase/TextFieldBase)是否泄漏进公共导出;`grep -rnE "from '(\.\./)+(index)?'" src/components --include='*.ts' --include='*.tsx'` 查向上引用 barrel 的可疑 import,命中后人工确认是否构成自引环(madge 环检测为主,此为补充)。**附加核查**:CLAUDE.md 提到 `BottomSheet` 但 `src/components/ui/` 无此目录——确认是已移除还是文档漂移,记台账(维度=质量,文档一致性)。
- [ ] **Step 5: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 深读台账 — business 与 barrel"`

### Task 14: 复核 Medium+ 发现

**Files:**
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§2.1 → §2.2、§4)

- [ ] **Step 1: 逐条复核** — 筛出 §2.1 中 Medium/High/Critical 行,每条:重读目标文件相关段(±50 行)+ `codegraph_callers` 查实际使用方,判定**确认/降级/移除**;填置信度(高 = 证据直接可见;中 = 需上下文推断;低 = 依赖未验证假设——低置信度按 spec §4 降级一档并注明)。
- [ ] **Step 2: jscpd 候选二审** — Task 2 Step 3 的「约定性同形候选」逐个定性:确属刻意模板 → 写入 §4 豁免说明(附理由);实为真重复 → 移入 §2.1 正式行并复核。
- [ ] **Step 3: 移行** — 复核完成的行从 §2.1 挪到 §2.2 对应严重度小节;§2.1 清空后标注「全部复核完毕」。
- [ ] **Step 4: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: 发现复核与置信度标注"`

### Task 15: 报告定稿 + 验收

**Files:**
- Modify: `docs/reviews/2026-06-10-src-code-review.md`(§1、§2.2、§4、§5)

- [ ] **Step 1: 发现定稿** — §2.2 各严重度小节内按维度排序,每条格式:`**位置** · 维度 · 置信度` + 证据(含关键代码片段)+ 修复建议。
- [ ] **Step 2: 写执行摘要** — §1 填:整体结论一段、四维度各一段概评(即使某维度零发现也要写「未发现问题」+ 依据,spec §6)、「最值得做的 3 件事」(按修复收益排序)。
- [ ] **Step 3: 豁免说明终稿** — §4 固化:约定性同形清单(逐模式 + 理由)、「ui 基础原子」认定清单(深读中实际确认的横向依赖白名单,spec §3 维度 4)。
- [ ] **Step 4: 验收对照** — 报告末尾加「验收对照(spec §6)」小节,逐条勾选:①手写源码逐文件覆盖 + data.ts 生成比对结论;②四维度均有结论;③每条 Medium+ 带复核标记与置信度;④typecheck/test/lint 基线已记录。任何一条不满足:回到对应任务补齐后再定稿。
- [ ] **Step 5: 状态翻转 + 通读** — 报告头部「状态:进行中」改「已定稿」;全文通读检查 `file:line` 格式统一、表格渲染、台账区已清空。
- [ ] **Step 6: Commit** — `git add docs/reviews/2026-06-10-src-code-review.md && git commit -m "docs: src 代码审查报告定稿"`
