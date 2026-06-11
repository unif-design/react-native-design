# src 全量代码审查方案(设计)

> 日期:2026-06-10 · 状态:已与维护者对齐 · 执行产物见 `docs/reviews/2026-06-10-src-code-review.md`

## 1. 背景与目标

对 `src/` 做一次深度静态审查,回答四个问题:**代码质量**是否过硬、**实现方式**是否符合 RN 0.85 新架构下的最佳实践、有没有值得提取的**代码重复**、模块之间**解耦**是否干净。产出一份带严重度、证据和修复建议的审查报告;本次只审不改,修复批次另行决定。

执行路线:**工具度量先行 + 定向人工深读**。「重复」「解耦」两个维度本质是全局比对问题,用 jscpd / madge 出客观数据;人工深读集中在工具测不了的「质量」「最佳实现」维度。

## 2. 范围

**审**:

- `src/` 手写代码全量:`theme/`(10 文件)、`utils/`(logger、testID)、`icons/`(`index.ts`、`types.ts`)、`components/ui/`(37 组件)、`components/business/`(4 组件)、根 barrel `index.tsx` —— 约 6900 行。
- `scripts/build-icons.js`:虽在 `src/` 外,但它决定 `icons/data.ts` 的质量,一并纳入。
- `*.web.tsx` 兄弟文件与原生版本**成对审**,关注双平台 API/行为一致性。

**特殊处理**:

- `icons/data.ts`(2530 行生成物)不逐行人读,用「重新跑 `node scripts/build-icons.js` + `git diff`」验证与 svg 源的一致性。
- 审查在自 main(`ff626af`,v0.8.2)拉出的 `docs/src-code-review` 分支上进行,工作区干净;基线 commit 记入报告。

**不审**:`example/`、`website/`、`lib/`、`__tests__/`。

## 3. 审查维度与检查清单

### 维度 1 · 代码质量(正确性 / 健壮性)

- **hooks 契约**:`useMemo`/`useCallback`/`useEffect` 依赖数组完整,或刻意省略处有注释说明(`ThemeProvider` 只依赖 `scheme` 是 CLAUDE.md 记录的刻意设计,不算违例)。
- **`useThemedStyles` 契约**:所有 maker 来自模块顶层 `styles.ts` 导出,无 inline maker(inline 会打穿 memo 缓存)。
- **命令式注册表**(`toast()` / `confirm()`):订阅在 Host unmount 时清理;`confirm()` 重入返回 `Promise.resolve(false)` 的保护仍在;Host 重复挂载行为有定义。
- **资源清理**:`setTimeout` / `setInterval` / 动画循环在 unmount 时取消——重点排查 Toast 自动消失、Pulse、Skeleton shimmer、Carousel 自动播放。
- **类型安全**:`noUncheckedIndexedAccess` 下的索引访问是实质性 narrow 还是 `!` / `as` 断言糊弄;`verbatimModuleSyntax` 下 `import type` 一致。
- **a11y**:可交互组件有 `accessibilityRole` / `label` / `state`;触达面积达到 `fixed.hitTarget`;disabled 状态对辅助技术可见。
- **错误路径**:logger transport 抛错被吞的契约保持;组件对异常 props(空数组、越界 index)有防御。

### 维度 2 · 实现方式是否最佳(RN 0.85 新架构习语)

- **交互原语**:用 `Pressable` 而非遗留 `Touchable*`;合理利用平台能力(`android_ripple`、hover)。
- **渲染性能**:context value 引用稳定;列表型组件(Grid、Tabs、Segmented、Carousel)的 key 与 memo 策略;render-prop children 的重渲染边界;style 是静态 `StyleSheet` 还是每次渲染新建对象。
- **动画**:是否走原生驱动;web 分叉的动画与原生语义等效。
- **缩放纪律**:`r`/`rf` 使用一致;`fixed.*` 物理常量不被二次 `r()`;字号统一走 `rf`。
- **平台分叉**:`*.web.tsx` 只分叉必要部分;文件级分叉 vs `Platform.select` 的选择标准一致。
- **API 设计一致性**:props 命名跟既有组件对齐(size/variant 体系);列表型组件用 `childTestID` 而非 inline 三元;组件已实现但 barrel 漏导出的情况。

### 维度 3 · 代码重复

- jscpd 报告逐条甄别:**真重复**(应提取为 util/hook/组件)与**约定性同形**(`sizingFor`/`paletteFor`/`types.ts` 的结构模板是刻意设计,豁免)。
- 原生与 `*.web.tsx` 之间:尺寸表、常量、纯逻辑等可共享部分是否提取。
- `ButtonBase` 之外是否有组件重复实现按钮 chrome(Pressable + 尺寸 + palette + a11y)。
- Host 模式样板(ToastHost / ConfirmHost 的 `Set<Subscriber>` 注册表)的共性是否值得提取——给结论即可,不强制。

### 维度 4 · 代码解耦

- `madge --circular` 目标为 0;内部代码 import 自家 barrel(`components/ui/index.ts` / `src/index.tsx`)形成自引环的情况。
- **分层方向**:`ui/` 不依赖 `business/`;`theme/`、`utils/` 不依赖 `components/`;`ui/` 组件间横向依赖只允许指向基础原子(Icon、Spinner 这类),复合件之间互相 import 要逐个论证;审查中实际认定的「基础原子」清单固化进报告的豁免说明。
- **公共 API 边界**:`src/index.tsx` 导出面与文档站一致;内部 primitive(`ButtonBase`、`TextFieldBase`)是否泄漏进公共导出。
- **单一职责**:>100 行的组件文件(Cell 109、TextFieldBase 111、ScreenBackdrop 122 等)检查是否承担多职责。
- `types.ts` 是否反向 import 实现文件。

## 4. 执行流程(三阶段)

### 阶段 1 · 客观度量(产出:度量数据附录)

| 步骤 | 命令 | 喂给维度 |
| --- | --- | --- |
| 重复度 | `yarn dlx jscpd src --ignore "**/data.ts" --min-tokens 50` | 维度 3 |
| 循环依赖/孤儿 | `yarn dlx madge --circular --orphans --extensions ts,tsx src` | 维度 4 |
| 复杂度热点 | eslint 一次性叠加 `complexity`(>10)/ `max-depth`(>4)/ `max-lines-per-function`(>100)——命令行 `--rule` 注入,不改配置文件;超阈值只作深读线索,不是缺陷判据 | 深读优先级 |
| data.ts 一致性 | `node scripts/build-icons.js` + `git diff src/icons/data.ts` | 范围特殊件 |
| 基线 | `yarn typecheck` && `yarn test` && `yarn lint` | 报告基线段 |

工具用 `yarn dlx` 临时拉取,**不写进 devDependencies**。

### 阶段 2 · 人工深读(产出:findings 台账)

- 顺序按依赖方向:`theme` → `utils` → `icons`(入口/类型/生成脚本)→ `ui`(先基础原子,后复合件)→ `business` → `index.tsx`。
- 每个文件过第 3 节四维 checklist;阶段 1 的热点(重复块、复杂度高分、循环依赖)优先深读。
- 跨文件调用关系用 codegraph 查证(某 export 谁在用、改动影响面),不靠猜。
- 台账每条记录:`file:line`、维度、严重度、证据、建议。

### 阶段 3 · 复核与报告(产出:审查报告)

- 每条 medium 及以上发现,重读上下文复核后定稿,标置信度;拿不准的降级并注明。
- 按第 5 节格式汇总成报告,落盘 `docs/reviews/2026-06-10-src-code-review.md`。

**严重度定义**:

| 级别 | 判据 |
| --- | --- |
| Critical | 用户可见 bug / 崩溃 / 内存泄漏 |
| High | 正确性风险,或影响面广的最佳实践偏离 |
| Medium | 维护性问题(重复、耦合、契约偏离) |
| Low | 风格与一致性 |

## 5. 产出物

报告 `docs/reviews/2026-06-10-src-code-review.md`(新建 `docs/reviews/`,与 `docs/specs`、`docs/plans` 并列),结构:

1. **执行摘要**——整体结论 + 四维度各一段概评 + 最值得做的 3 件事。
2. **发现列表**——按严重度分组,每条含 `file:line`、维度标签、证据(代码片段或度量数据)、修复建议、置信度。
3. **度量数据附录**——jscpd / madge / 复杂度原始结果。
4. **豁免说明**——哪些「相似」判定为约定性同形不算重复,避免未来重复争论。

## 6. 验收标准

- 手写源码逐文件覆盖;`data.ts` 有生成比对结论。
- 四个维度都有明确结论,哪怕是「未发现问题」。
- 每条 medium+ 发现带复核标记与置信度。
- `yarn typecheck` / `yarn test` / `yarn lint` 基线状态记录在报告里。

## 7. 明确不做

- 不改任何代码(纯报告,修复批次另行决定)。
- 不审 `example/` / `website/` / `lib/` / `__tests__/`。
- 不开 GitHub issues。
- 不把 jscpd / madge 写进项目依赖或 CI——要不要常态化是报告里的一条建议,不在本次范围。

## 8. 风险与注意

- **jscpd 误报**:本仓的 `styles.ts` / `types.ts` 约定性同形会推高重复率,所有重复块必须人工甄别后才进报告,原始数据进附录。
- **`yarn dlx` 依赖网络**:离线时降级为人工抽查重复与依赖关系,报告注明工具缺位。
