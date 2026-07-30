# React Native Design 全量整改总览

> 日期：2026-07-30
>
> 基线：`main@5049571`（`v0.20.0`）
>
> 状态：设计已确认，待书面审阅
>
> 方案：A——严格契约重构，允许 breaking change，不保留旧 API 兼容层

## 1. 目标

一次性修复当前全仓代码审查确认的非 CI 问题，覆盖依赖兼容矩阵、命令式 Host、输入状态、交互与无障碍、Theme 字体缩放、跨平台布局、图片身份、SVG/Icon 生成、Website 和 LLM 文档生成。

本轮以“让错误用法尽量在 TypeScript 或构建阶段失败”为目标，不为旧调用方式增加 deprecated alias、双入口或运行时猜测。

## 2. 基线与边界

当前基线：

- 根仓库 `yarn lint`、`yarn typecheck`、`yarn test --runInBand` 均通过。
- Website typecheck 已知失败：`IconCatalog.tsx` 向 `rect` 传入类型中不存在的 `ry`。
- Carousel 已迁移到稳定版 `react-native-reanimated-carousel@5`，本轮在该实现上继续修复，不回退旧版 API。

明确不做：

- 不修改 CI、Turbo cache、release workflow 或 branch protection。
- 不整改 `example/` 工程。它继续保留旧 RN `0.85.3` shell，既不作为本轮 RN `0.86.2` 支持证据，也不被临时 harness 复制；不得修改、暂存或提交其中任何文件。
- 不引入新的状态管理、表单、MDX AST 或组件测试框架。
- 不进行与本次审查发现无关的视觉重设计或全仓重构。
- 不修改或提交 `AGENTS.md` / `CLAUDE.md`；这两个文件由同一分支上的并行会话负责。本轮只在其最终内容落地后读取并执行其中的文档与消费侧 Skill 同步门禁，不覆盖、不回退其变更。

## 3. 全局设计原则

1. **单一事实来源**：一个状态只允许一个公开控制入口。
2. **身份绑定**：Promise resolver、timer、RAF、动画回调和 cleanup 只能操作所属 entry。
3. **显式语义**：交互、展示、disabled、busy 和 accessible name 不从任意 `ReactNode` 推断。
4. **真实命中区域**：本轮确认存在裁剪或空白不可点问题的小型控件，由实际布局节点提供 44pt，不用 `hitSlop` 掩盖错误布局。
5. **跨平台同构**：公开容器层级和 style 语义一致，只在动画驱动等平台差异处使用兄弟实现。
6. **文字只缩放一次**：`fontScale` 仅作用于 `fontSize`、`lineHeight`、`letterSpacing`。
7. **无法保真就失败**：构建输入不合法时 fail-fast，不生成看似成功但错误的产物。
8. **最小抽象**：只提取本轮需要复用的纯函数，不引入通用事件总线等额外框架。

## 4. 依赖基线

根包 `devDependencies` 和 Website `dependencies` 同步采用：

| 依赖                               | 直接依赖  |
| ---------------------------------- | --------- |
| `react-native`                     | `0.86.2`  |
| `react-native-gesture-handler`     | `^3.1.0`  |
| `react-native-reanimated-carousel` | `^5.0.0`  |
| `react-native-reanimated`          | `~4.5.3`  |
| `react-native-worklets`            | `^0.11.3` |

根包保留 React `19.2.3` 精确版本，Website 的 `react` / `react-dom` 下限同步提高为 `^19.2.3`。根包与 RN 版本绑定的 `@react-native/babel-preset`、`@react-native/eslint-config`、`@react-native/jest-preset` 全部从 `0.85.3` 升为 `0.86.2`。根包和 Website 的 `engines.node` 统一为 RN `0.86.2` 发布 metadata 要求的 `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`；仓库现有 `.nvmrc` `24.13.0` 位于该范围内，无需改动。

发布 peer contract：

| 依赖                               | peer range         |
| ---------------------------------- | ------------------ |
| `react`                            | `>=19.2.3 <20.0.0` |
| `react-native`                     | `>=0.86.0 <0.87.0` |
| `react-native-gesture-handler`     | `>=3.0.0 <4.0.0`   |
| `react-native-reanimated-carousel` | `>=5.0.0 <6.0.0`   |
| `react-native-reanimated`          | `>=4.5.2 <4.6.0`   |
| `react-native-worklets`            | `>=0.11.0 <0.12.0` |

当前验证平台固定为 React Native `0.86.2` + React `19.2.3`，发布 contract 只承诺 RN `0.86.x` 与 React 19（下限 `19.2.3`、不含 React 20）；RN 自身仍负责约束每个 0.86 patch 所需的更精确 React patch。本库不再用 `*` 暗示未经验证的 RN/React major。Reanimated `4.5.3` 与 Worklets `0.11.3` 的发布 metadata 都覆盖 RN `0.86.x`。Worklets `0.11.x` 与支持它的 Reanimated `4.5.2+` 作为一个原子升级单元；根仓库锁在最新 `4.5.3` patch 线，不自动越到 4.6。RNRC 5 已由维护者验证可在 RNGH 3 上运行；Yarn 无法用 `packageExtensions`、`patch:` 或 `resolutions` 重写其已发布 peer range，因此仓库只窄过滤这一条安装误报，并用独立 `check-runtime-peers` 严格审计已知例外及其他 runtime peer，不 fork 第三方源码、不全局压制 `YN0060`。

根包和 Website 还直接提供 Worklets 所需的 `@babel/core@^7.29.7` 与 `@react-native/metro-config@0.86.2`；这两项属于 workspace 工具链，不加入本库发布 peers。根 `devDependencies` 另以精确版本加入 `@react-native-community/cli@20.1.0` 和 `@react-native-community/template@0.86.2`，只供临时原生 harness 使用；`20.1.0` 来自该 `0.86.2` 官方 template 自身的 manifest，不传播为库 peer 或 Website runtime dependency。

详细设计见[依赖与 Runtime 状态设计](./2026-07-30-dependency-runtime-state-design.md)。

## 5. 专项拆分与实施顺序

本轮保留一个 feature 分支和一次最终交付，但按四个边界清晰的专项依次形成实施计划、编码、局部验证和 review：

1. [依赖与 Runtime 状态](./2026-07-30-dependency-runtime-state-design.md)
   - 依赖矩阵；先完成 Theme 设计中跨专项共用的 `usePrefersReducedMotion` 前置，再实现 Confirm、Toast、Pulse/Skeleton。
2. [Input、交互与无障碍](./2026-07-30-input-interaction-a11y-design.md)
   - 输入状态和公共交互契约、44pt 命中区域、组件语义。
3. [Theme、平台、资源与 Icons](./2026-07-30-theme-platform-icons-design.md)
   - 字体缩放、图片语义 identity、Web/native 布局、SVG ID、Icon 构建。
4. [Website、LLM 与文档](./2026-07-30-website-llm-docs-design.md)
   - Website 修复、文档同步、LLM mirror 生成、配置修复和消费侧 Skill 同步审计。

专项之间允许共享已批准的纯函数，但不允许创建新的兼容层。上述顺序是实施任务分组，不是把公开文档延迟到第 4 项的理由：每个公共 API、类型、行为或依赖修改都必须在同一原子实施提交中同步对应 Website MDX、README（适用时）与测试；第 4 项负责生成器、站点专项修复和最终全量一致性审计。公共 barrel 和生成物同样随其来源修改同步更新。

## 6. 测试策略

遵循仓库现有边界：design 层不新增组件 snapshot 或大面积 renderer 测试。需要稳定验证的状态判断应提取为纯逻辑后测试：

- Confirm entry identity、幂等 settle 和 Host ownership。
- Toast latest-wins、pending drain 和 ownership。
- Pulse 数值归一化。
- Search controlled/uncontrolled 状态转换所依赖的纯逻辑（仅在确有独立逻辑时提取）。
- fontScale、`imageSourceKey`、SVG ID 消毒。
- Icon SVG 校验和分类完整性。
- LLM 链接及 exported `LiveDemo` 提取。

组件层行为通过 TypeScript 契约、局部静态检查和 Website 构建验证，不为本轮新增测试框架。

需要真实 iOS/Android 宿主的 case 使用 `manual-tests/runtime-api/` 中受根 `tsc` 覆盖的验收 screen/fixture，以及 `scripts/create-runtime-api-harness.js`：

- 根命令 `yarn create:runtime-harness` 以 `fs.mkdtemp` 创建唯一系统临时父目录，再调用根仓库锁定的本地 `rnc-cli@20.1.0`，以 `--version 0.86.2`、指向已安装 `@react-native-community/template@0.86.2` 的绝对本地路径、`--skip-install` 和 `--skip-git-init` 在其下展开干净 app。脚本先校验 CLI/template package 版本、template 中 React/RN 精确版本及 lockfile checksum，再允许 scaffold；不能从 registry 的浮动 `latest` 获取工具，也不能接受或递归清理 caller 路径，更不能读取/复制 `example/`。
- 脚本先要求当前库 `yarn prepare` 成功，再把 pack 产物写入临时父目录并叠加验收 screen。依赖映射以当前根 `peerDependencies` 的全部 non-optional key 为单一来源：脚本若发现任何 peer 没有 concrete harness provider 就 fail-fast。React/RN 固定为 `19.2.3` / `0.86.2`；其余 provider 从根 workspace 的 direct range 与当前 `yarn.lock` 解析出**精确 locator version**并写入临时 manifest，当前映射覆盖 `@sbaiahmed1/react-native-blur`、RNGH、RNRC、Reanimated、Worklets、safe-area-context 和 SVG，另直接提供 Worklets 所需 Babel/Metro provider。写回后再次断言生成 manifest、Babel/Metro 配置、iOS Podfile 与 Android Gradle 文件都来自 RN `0.86.2` template，再在临时目录安装。这样开发依赖仍采用总览中的 range，而每次验收记录的是同一 lockfile 的确切版本。临时 Babel config 启用匹配的 Worklets plugin，App 入口按 RNGH 要求初始化并使用 `GestureHandlerRootView`；任一 scaffold、版本断言、build、install 或 pod 准备失败都退出非零，不能产出“可用”结论。
- fixture 提供错误播报、44pt frame、reduced motion、a11y tree、Carousel、Reveal、Spinner、Thumbnail 和图片 `A₁ → B → A₂` 的可操作场景与稳定 testID。脚本输出临时路径和实际 `yarn ios` / `yarn android` 复现命令；Web case 使用 Website 对应组件页与浏览器 accessibility/layout inspector。
- 临时 app 和运行日志不提交；命令、设备/OS、结果及截图或 inspector 证据写入 checked-in 验收矩阵。`example/` 前后 hash/status 必须一致。

## 7. 最终验收

实现完成后，从仓库根目录执行：

```sh
yarn install --immutable
yarn check:runtime-peers
yarn check:config
yarn check:icons
yarn lint
yarn typecheck
yarn test --runInBand
yarn prepare
yarn workspace @unif/react-native-design-website typecheck
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website build
git diff --check
git diff --cached --check
```

此外必须确认：

- 安装输出不显示 RNRC/RNGH 的已验证 metadata 误报；`yarn check:runtime-peers` 明确报告 `KNOWN_EXCEPTION`，且四个 runtime 包不存在其他失败 peer requirement。
- `yarn check:icons` 在两个独立临时输出中生成 `data.ts`，逐字节比较两份结果和仓内 `src/icons/data.ts`，并在差异时退出非零；验证过程不改工作区。SVG 或生成器有预期变化时，先运行正式生成更新仓内文件，再由该检查证明完整性和幂等。
- LLM mirror 不包含悬空 `*Demo` invocation，所有内部链接在 Website `baseUrl` 下有效。
- 源码导出、类型声明、Website API 表和生成文档一致。
- `yarn check:config` 使用仓内锁定的 TOML parser 成功解析 `.pr_agent.toml`。
- `docs/superpowers/verification/2026-07-30-runtime-api-remediation.md` 已按规定格式分别记录 RN `0.86.2` iOS、Android 和受支持 Web 浏览器的人工验收矩阵；每行含环境、步骤、预期、实际、证据和状态，所有必需项均为 `PASS`，没有空白、`TODO` 或把未执行写成通过。
- `yarn create:runtime-harness` 已从 checked-in fixture 生成可运行的临时 RN app；矩阵记录其临时路径/生成日志和 iOS、Android 启动命令结果，验收前后 `git diff --exit-code -- example` 均为零。
- 已读取并行会话最终落地的 `AGENTS.md` / `CLAUDE.md`，且本轮没有修改、暂存或回退这两个文件；若并行变更尚未完成，只能报告集成前置条件未完成，不能自行接管。
- 已检查消费侧 `<unif-design/skills>/skills/design/` 是否受本轮变更影响；若受影响，列出同步的 `SKILL.md`、`references/`、`assets/`、`scripts/` 和 Skill version。
- Skill 仓可执行时，无论更新还是“无需更新”都已运行该仓自身规定的校验与 doctor 测试并记录实际结果；不可访问、受影响但不可写或验证失败时明确报告未完成状态和具体待改路径，不虚报同步或验证。
- 本轮每次暂存和提交前都按显式文件列表复核，提交中不包含并行会话或用户的其他改动。

## 8. 完成定义

- Confirm Promise 在所有生命周期路径有且仅有一次 settle，旧 entry 不影响新 entry。
- Toast 在 Host 挂载前调用时保留最新一条，并由首个合法 Host 消费。
- 所有输入组件只有一个文本事实来源，公共 prop 不会被内部默认值覆盖。
- 所有可操作控件具备 handler、accessible name 和正确 state；本轮确认存在命中缺陷的输入 slot、Switch、Stepper 使用实际至少 44pt 的交互 frame。
- `fontScale` 覆盖所有文字 metric，且不改变图标、间距、控件尺寸或命中目标。
- Web/native 的公开布局和 style 语义一致。
- 图片失败状态以语义 source 而非对象引用重置。
- Icon 和 LLM 生成器对无法保真的输入 fail-fast。
- 已按最终仓库门禁完成 `skills/design/` 影响检查、必要同步与 Skill 仓自身验证，并以三态之一如实交付。
- 第 7 节验证全部通过。
