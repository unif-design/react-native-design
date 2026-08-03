# Website、LLM 与文档设计

> 日期：2026-07-30
>
> 父设计：[全量整改总览](./2026-07-30-runtime-api-full-remediation-design.md)
>
> 状态：设计已确认，待书面审阅

## 1. 范围

本专项确保公开源码、Website 示例/API 表、LLM mirror、消费侧 Skill 和站点部署链接保持一致，并修复当前 Website typecheck 与文档生成失真。

Website docs 继续是 LLM 文档的唯一内容来源，不在仓库其他说明文件复制完整组件 API。

`AGENTS.md` / `CLAUDE.md` 的通用规范重构由同一分支上的并行会话负责，不属于本专项的编辑或提交范围。本专项在其最终内容落地后只读取并执行 Skill 同步门禁；不得覆盖、回退或顺手整理这两个文件。

## 2. LLM 链接

### 2.1 输出链接

`build-llms.js` 生成：

- 索引中的页面链接：相对 `md/...`。
- 全文入口：相对 `llms-full.txt`。
- mirror 文档之间的内部链接：相对当前产物或使用 Website `baseUrl` 可安全解析的形式。

每个 source 文档只生成一个物理 mirror，canonical 路径固定为保留 source 相对路径大小写的 `md/<relSlug>.md`。frontmatter `slug` 只是路由 alias，加入 route map 并指向同一个 canonical mirror，绝不额外写第二份文件。`llms.txt`、`md/index.json` 和正文链接都指向 canonical mirror。

因此当前 `docs/UNIF-DESIGN.md` 与 `slug: /unif-design` 必须只产生 `md/UNIF-DESIGN.md`；两个 route spelling 归并到同一 source，而不是在 Linux 生成两份、在默认 APFS 上互相覆盖。

生成结果不能硬编码域名或根路径 `/docs/...`。同一套产物必须同时支持域名根目录和 Docusaurus 子路径部署。

### 2.2 正文链接转换

对 Website MDX 中指向站内文档的链接进行确定性转换：

- 外部 `http(s)`、mailto 和锚点链接保持不变。
- `/docs/...` 与当前 docs 路由转换为对应 mirror 相对路径。
- 保留 URL fragment。
- 找不到目标文档时构建失败并指出源文件和链接，不能生成死链。
- 路由解析只查预检阶段建立的 `route alias -> canonical mirror` 映射；不得根据 frontmatter slug 临时拼接物理路径。

## 3. Exported LiveDemo 提取

继续使用现有轻量 parser 和平衡括号逻辑，不新增 MDX AST 依赖。转换分两阶段完成。

两阶段扫描都必须先识别并保护 Markdown fenced code（反引号或波浪线，结束 fence 与起始字符/长度匹配）及 inline code span。示例代码中的 `<ExampleDemo />`、`export` 或 `<LiveDemo>` 只作为文档文本保留，不能被当成真实 MDX 定义/invocation，也不能触发 unknown Demo 错误。

### 3.1 第一阶段：收集定义

扫描单个 MDX 文件内所有 export 定义，建立：

```text
demoName -> LiveDemo source body
```

要求：

- 支持现有 exported function/const stateful demo 写法。
- 使用已有的 balanced-brace/parenthesis 逻辑，不用易截断 JSX 的单行 regex。
- 一个文件可包含多个 demo。
- 定义中的嵌套 JSX、hook 和对象字面量不能提前终止提取。

### 3.2 第二阶段：替换 invocation

- 顶层直接 `<LiveDemo>...</LiveDemo>` 继续转换为 `tsx` code fence。
- `<DemoName />` 查找第一阶段映射并替换为对应 code fence。
- import/export 壳从 LLM mirror 中移除，但 source body 只保留一份。
- 名称以 `Demo` 结尾的未知自闭合 invocation 视为生成错误，并报告文件和名称。
- 普通 Docusaurus/MDX 组件不因名称不同而误报。

生成后执行兜底扫描，确保 mirror 中不存在未处理的 `LiveDemo` 或悬空 `*Demo` invocation。

## 4. 生成器测试

`website/scripts/build-llms.test.js` fixture 至少覆盖：

- 顶层直接 `LiveDemo`。
- exported stateful function demo。
- exported const demo。
- 同文件多个 demo。
- demo 内嵌套 JSX、hook、对象和多行表达式。
- fenced/inline code 中的 `export`、`LiveDemo` 和未知 `*Demo` 文本不被执行式转换或误报。
- 未知自闭合 `*Demo` 失败并包含可定位错误。
- 普通非 Demo MDX 组件不误报。
- 索引、全文和正文内部链接的相对路径及 fragment。
- 不存在目标的内部文档链接失败。
- 大写 source `UNIF-DESIGN.md` 与小写 frontmatter alias `/unif-design` 只生成一个 canonical mirror；source route 与 alias route 都解析到该文件，索引也只出现一次。
- 两个不同 source 的 canonical path 或 route alias 仅大小写/Unicode 规范化不同，必须在所有平台一致失败。
- 在独立临时 site root 中预置旧 `llms.txt`、`llms-full.txt`、`md/`、stale mirror 和 `static/img` sentinel，验证成功生成只替换三个正式目标、删除 stale mirror、保留 sentinel，且不残留 staging/backup。
- validation 失败时，旧 bundle 的文件清单、逐文件 bytes/hash 和 `static/img` sentinel 完全不变。
- 通过注入的文件操作在至少一个正式目标完成 rename 后制造 commit 失败；fixture 同时覆盖旧目标全存在和部分原本缺失，验证 rollback 恢复旧 bundle 的文件清单、缺失状态与逐文件 bytes/hash，且不残留部分新目标、staging 或 backup。
- 对同一 fixture 连续成功生成两次，产物文件清单与逐文件 hash 完全一致。

测试使用 Node 现有 `assert`、临时目录及可注入的 rename/file-ops 边界，同时验证确定性字符串和文件系统事务，不引入新的测试 runner，也不对真实 `website/static/` 做破坏性 fault injection。

## 5. Website 修复

### 5.1 IconCatalog

按 [Theme、平台、资源与 Icons 设计](./2026-07-30-theme-platform-icons-design.md)：

- 删除无效 `rect.ry`。
- 完整转发 shape 的 `fill`、`opacity`、`stroke`。
- 搜索、分类和计数覆盖全部 `ICON_NAMES`。
- 重复/未知分类由纯函数校验，剩余项进入“未分类”。

### 5.2 首页示例

- 删除不存在的 `ThemeProvider theme={...}` 用法，改为当前真实 API。
- 所有 Button/IconButton 示例提供必填 handler。
- 示例代码必须同时通过 TypeScript 和文档构建，不能只作为不可执行字符串保留旧 API。

## 6. 文档同步清单

每项源码 API、行为或依赖修改都在其原子实施提交中同步对应 Website MDX、README（适用时）和 type/test fixture；本专项最终逐项审计并修复遗漏，但不把前三个专项的文档同步计划性延后。清单至少包括：

- 依赖安装、README 和 Getting Started：平台 contract 为 RN `>=0.86.0 <0.87.0`、React `>=19.2.3 <20.0.0`，Node engine 为 `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`；所有面向消费者的当前支持说明统一写成 RN `0.86.x`，不能继续保留 RN `0.85+`、`0.85.x` 或 Node `>=18`；同时同步 RNGH 3、RNRC 5、Reanimated `>=4.5.2 <4.6.0`、Worklets 0.11 的版本矩阵及本仓使用的 `~4.5.3` / `^0.11.3`。
- Worklets：消费工程需满足其 Babel/Metro peer contract；RNRC 5.0.0 + RNGH 3 在上游修正 metadata 前，只能使用消费方包管理器的精确 peer allowlist/filter 或接受该条 warning，不能推荐全局忽略 peer，也不能暗示本仓 Yarn filter 会随 npm 包传播。
- Confirm：唯一 Host、无 Host立即 `false`、已有 active 时重入 `false`，以及 Host 卸载时当前 Promise 的 settle 语义。
- Toast：唯一 Host、无 Host时 latest-wins、owner 卸载后的重投语义；entry/lease 属于内部实现，不泄漏成公共 API。
- Pulse / PulseDot / Skeleton：合法 duration/delay/opacity 范围、reduced motion；删除 Web 使用 worklet 的错误描述。
- TextField/Input/Textarea：严格 controlled/uncontrolled 联合、锁定 mode、defaultValue、placeholder precedence、a11y state、错误播报、slot/高度约束、受限 container style、只含 focus/blur 的 `TextFieldHandle`，以及移除 `readOnly` / `clearTextOnFocus` / 高优先级 alias；新增根导出的 `TextFieldSlot`、`TextFieldContainerStyle`、`TextFieldHandle` 必须有准确签名。
- Search：controlled/uncontrolled 联合、清除和提交顺序；`ref` 收窄为 `TextFieldHandle`，删除现有“透传原生 TextInput ref”的说明，不能再承诺 `clear()` / `setNativeProps()`。
- PasswordInput：删除 `inputProps`，改为顶层 props；`ref` 同样只暴露 `TextFieldHandle` 的 `focus()` / `blur()`。
- Button/IconButton：必填 `onPress`、loading busy/disabled、`block` 语义。
- NavBar：严格 action object 与纯展示 `ReactNode`。
- Checkbox/Radio/Switch：accessible name 要求、`Radio.Group` 名称、disabled state 和 Switch reduced motion。
- Cell：`title` / `desc` / `leading` 的 primitive/display 限制，`CellExtra` 完整判别联合，以及 actionable/control/static 三分支和 control/onPress 互斥。
- Stepper：必填上下文名称、真实 44pt frame 和归一化边界 action。
- Carousel：display/action 联合、actionable 分支必填 `getAccessibilityLabel`、单页 Pagination、reduced-motion autoplay 和消费方暂停责任。
- Logo：`accessibilityLabel` 替代 `label` 及装饰模式；Grid、DrawerHeader 同步本轮 a11y 契约。
- VersionPill：`status` 替代 `statusColor`，`status.label` 必须可见且可朗读。
- Thumbnail：严格 uri/source 联合、缺 source placeholder、外层 layout / 固定 visual frame、稳定 ring，以及 `containerStyle` / `imageStyle` 替代 `style`。
- Theme/Typography：fontScale 的作用范围和“不缩放”边界；新增并从根导出的 `normalizeFontScale`、`scaleFontMetric`、`useFontScale` 三个签名与用法；`ThemeContext` 不再公开，`usePrefersReducedMotion` 在 native 读取真实系统设置。
- `useSvgId`：始终调用 `useId`，prefix/override/React suffix 的消毒、空 override fallback 和公开/测试导出边界。
- Reveal / Spinner：单层 Reveal Web 容器、caller opacity 与 reduced motion，以及 Spinner 外层 caller style / 内层 rotate 的两层 style/transform 语义。
- Avatar / DrawerHeader：语义 source identity、同 source 不重试和跨 source keyed attempt 行为。
- StatusDot：修正或补充 `accessibilityLabel`，删除与源码不符的描述。
- EntryCard：修正当前已经过时的 label 描述。
- RadioGroup：文档承认源码已有 group role，不再列为缺失能力。
- Grid：文档承认 action 语义已按 handler 条件化。
- VersionPill：文档承认已有外层组合 a11y，同时说明新的 status 语义。

API 表必须逐项以最终 TypeScript 类型为准；被删除的 prop 不出现在示例、表格、生成 mirror 或消费说明中。

实现结束前还要扫描 README 与 Website 当前支持说明：

```sh
rg -n 'React Native 0\.85|RN 0\.85|0\.85\+' README.md website/docs
rg -n '"node"\s*:\s*">=18|Node(\.js)?.*>=18' README.md website/package.json website/docs
```

两条命令的结果都必须为空；真正描述旧版本迁移的历史文档若未来出现，必须用明确的历史上下文和单独 allowlist，不能靠全局跳过。

AI Skill 页面和仓库说明也属于同步范围。实现结束前执行：

```sh
rg -n 'skills/(unif-design|umeng-share)' \
  --glob '!docs/superpowers/specs/**' .
```

结果必须为空。`unif-design/skills` 作为仓库/marketplace 安装标识继续保留，但所有指向该仓具体 Skill tree 的链接和文字路径统一为 `skills/design/`；尤其修正现有 `website/docs/skills.md` 的旧链接。

## 7. 并行 Agent 规范前置条件与 Skill 同步

### 7.1 文件所有权边界

- `AGENTS.md` / `CLAUDE.md` 的重构、去重和通用模板由并行会话独占负责，本专项不编辑、不暂存、不提交这两个文件。
- 开始实现前读取并行会话最终落地的规则，确认它明确指向 `unif-design/skills` 仓库的 `skills/design/`，且包含下节的可审计门禁。若尚未落地或内容不完整，只报告集成前置条件，不在本专项接管修改。
- 后续暂存使用本专项显式文件清单；提交前复核 staged paths，避免把并行会话改动带入本专项提交。

### 7.2 本专项必须执行的消费侧 Skill 门禁

并行会话最终规则应固化以下门禁；无论其文字如何组织，本专项实际交付都必须逐项执行：

- 目标仓库固定为 `unif-design/skills`，Skill 根目录固定为该仓库相对路径 `skills/design/`；不得把它误解为本仓任意同名目录或其他 Skill。
- 每次修改公共 API、类型、行为、依赖、原生配置、错误语义、示例或测试方式后，必须检查 `<unif-design/skills>/skills/design/`。
- 首先核对 `<unif-design/skills>/skills/design/SKILL.md`，再按实际影响检查 `<unif-design/skills>/skills/design/references/`、`<unif-design/skills>/skills/design/assets/` 和 `<unif-design/skills>/skills/design/scripts/`。
- 受影响时，在同一工作流同步更新上述文件及 Skill version；不能只改入口而遗漏被入口引用的模板、参考资料或脚本。
- LLM 已自动路由的完整 Props 不在 Skill 中重复维护；手写的快速开始、安装矩阵、关键差异、已知坑、示例、assets 和验证脚本仍须同步。
- 纯内部重构若确认不影响 Skill，也必须在最终交付说明中明确写出：`已检查 skills/design/，无需更新`。
- 如果 `unif-design/skills` 仓库不可访问，只能明确写出 `未能检查/同步 skills/design/`、原因及具体待改路径；不得声称已经检查、同步或通过该仓验证，也不得使用“已检查，无需更新”。
- 仓库可读但不可写时仍先完成影响检查：确认无影响可以报告“已检查，无需更新”；确认受影响则必须报告 `未能同步 skills/design/` 和待改文件，不能把只读检查冒充同步完成。
- 每次完成影响检查或文件同步后，只要 Skill 仓可执行，就必须先读取该仓自己的仓库指令，再运行其规定的校验命令和 doctor 测试；即使结论是“无需更新”也不能跳过。交付说明记录实际命令与结果，不在本仓硬编码未经核实的命令名。
- 交付说明必须落入以下三种可审计状态之一：列出已同步文件与 Skill version，并附通过的验证结果；写明 `已检查 skills/design/，无需更新`，并附通过的验证结果；或写明 `未能检查/同步/验证 skills/design/` 及阻塞原因。不能省略该结论，也不能在 doctor 失败时使用前两种完成态。

本轮最终验证必须执行一次该门禁，重点核对 RNGH/Reanimated/Worklets 安装矩阵以及所有 breaking component API。

## 8. 其他配置

修复 `.pr_agent.toml` 中不合法的 TOML 字符串引号转义：

- 只修复解析问题，不调整 PR review 策略或 CI 行为。
- 使用 TOML 可表达且语义等价的 quoting 方式。
- 根 `devDependencies` 增加零运行时依赖的 `smol-toml@^1.7.1`，新增 `scripts/check-config.js` 和 `yarn check:config`；脚本使用该 parser 读取并解析 `.pr_agent.toml`，解析失败输出文件名/错误并退出非零。

## 9. 生成与失败策略

执行 LLM 生成前先完成源文档扫描和链接/demo 校验，并在内存中构造完整 route/output map：

1. source 相对路径先统一为 POSIX 分隔，去掉 `.md` / `.mdx` 后执行 Unicode NFC；拒绝绝对路径、反斜杠、空段、`.` / `..` 段和控制字符。保留规范化后的原始大小写作为 canonical `relSlug`。
2. 每个 source 唯一物理输出为 `md/<relSlug>.md`。frontmatter slug、source-derived route 和 Docusaurus 实际 docs route 都只登记为该 source 的 route alias，不产生额外物理文件。
3. canonical output、route alias 和保留目标分别使用 `NFC + toLowerCase()` 后的 POSIX 字符串作为 collision key。相同 source 的大小写 alias 命中同一 key 时合并；不同 source 命中同一 key 时 fail-fast。这样碰撞结论不依赖宿主文件系统是否区分大小写。
4. 内部文档链接通过 route map 解析到 canonical output，再计算相对链接；索引和 `md/index.json` 同样只记录每个 source 一次。

以下问题全部在任何 staging 或正式产物写入前报错：

- source/frontmatter slug 越界或形成 unsafe output path；
- 两个不同 source 的 canonical output 或 route alias 使用同一个 collision key；
- route 与生成器保留目标冲突；
- 未知 Demo、失效内部文档链接或其他前述 parse 错误。

不能继续使用 warn+skip 或后写覆盖前写。

### 9.1 Staging

- 在 `website/static/` 下用 `fs.mkdtempSync` 创建唯一 sibling staging 目录。
- 一次性写入 staging 内的 `llms.txt`、`llms-full.txt` 和完整 `md/`；`md/index.json` 也属于该 bundle。
- 对 staging 再执行输出数量、route、链接、悬空 Demo 和目标路径校验。
- 所有失败都删除 staging，正式的三个目标保持逐字节不变。

### 9.2 Commit 与 rollback

- 只允许替换 `website/static/llms.txt`、`website/static/llms-full.txt`、`website/static/md/`，不得清理或改写 `static/img` 等其他资产。
- commit 前记录三个目标各自“存在/缺失”的 presence manifest，把存在的目标移动到唯一 backup 目录，再从 staging rename 三个新目标。
- 任一 rename/commit 步骤抛错时，删除已放入的部分新目标，并按 manifest 从 backup 恢复原文件/目录或原本的缺失状态；随后删除 staging。生成器报告失败时旧 bundle 的 bytes 与缺失状态必须完全一致。
- 全部成功后才删除 backup。新的完整 `md/` 替换旧目录，因此已删除 source 对应的 stale mirror 也被删除。
- 多目标替换是带 rollback 的事务边界，不宣称能抵抗进程被强杀或机器掉电的跨文件系统原子性。
- commit 文件操作通过窄接口注入，使测试可在临时目录确定性触发中途 rename 失败；生产入口仍使用真实 `fs` 实现。

任一输入或 commit 错误时：

- 脚本退出非零。
- 错误包含源文件及未知 demo/链接。
- 不留下部分更新的 `llms.txt`、`llms-full.txt` 或 `md/` mirror。

合法输入生成完成后再整体替换目标产物。重复执行必须幂等。

## 10. 验证

本专项执行：

```sh
yarn check:config
yarn workspace @unif/react-native-design-website typecheck
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website build
```

并检查：

- 生成后的 `llms.txt`、`llms-full.txt` 和 `md/` mirror 已提交。
- 无 `LiveDemo` 或未知 `*Demo` invocation 泄漏。
- 所有内部链接可从实际 Website `baseUrl` 解析。
- Website 代码和所有示例均使用最终公开 API。
- `yarn check:config` 使用锁定的 `smol-toml` 成功解析 `.pr_agent.toml`。
- 已读取并行会话最终落地的 `AGENTS.md` / `CLAUDE.md`，确认 Skill 门禁可执行；本专项的 staged paths 和提交均不包含这两个文件。
- 已按三态交付格式记录并处理本轮对 `<unif-design/skills>/skills/design/` 的影响；不可访问时没有虚报同步。
- 临时文件系统 fixture 已证明 validation failure 不改旧 bundle、commit failure 可逐字节 rollback、成功会清 stale 且不触碰 `static/img`、重复运行 hash 幂等。

## 11. 验收标准

- Website typecheck 的 `rect.ry` 基线错误消失。
- IconCatalog 可搜索和展示全部图标。
- exported LiveDemo、多 Demo 和直接 LiveDemo 均生成完整源码块。
- 未知 Demo 或失效内部链接在写产物前失败。
- LLM 索引和全文链接不依赖部署根路径。
- 所有 breaking API 在源码类型、示例、API 表和 LLM mirror 中完全一致。
- 文档不再保留 StatusDot、EntryCard、RadioGroup、Grid 或 VersionPill 的已知过时描述。
- canonical mirror 和 route alias 在大小写敏感/不敏感文件系统上产生相同文件清单与链接。
- 本轮按最终仓库门禁完成消费侧 Skill 影响检查、必要同步和 Skill 仓自身验证；并行 Agent 文件没有被本专项修改或带入提交。
