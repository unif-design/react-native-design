# AGENTS.md
<!-- BEGIN UNIF REACT NATIVE STANDARD -->

## 共享标准启动

你维护的仓库是 `react-native-design`。本区块只负责启动与失效保护;完整共享流程由
`rn-library` Skill 管理,marker 外只保存本仓特有规则。

开始任何任务前:

1. 运行 `git status --short --branch`;位于 `main` 时,在首次写入前创建语义明确的任务分支。
2. 保留已有改动,不得覆盖、暂存或提交与当前任务无关的文件。
3. 查找并读取 `rn-library` 与 `design` Skill,两者叠加使用。
4. Skill 缺失时,按当前 Agent 选择一条全局安装命令:

```sh
# Codex
npx skills add unif-design/skills --skill rn-library --skill design --global --agent codex --yes

# Claude Code
npx skills add unif-design/skills --skill rn-library --skill design --global --agent claude-code --yes
```

安装完成后重新读取两个 Skill。安装失败、需要认证或仍无法读取时停止修改并报告,不得跳过
共享门禁。仓库正文只能补充或收紧共享规则;发现真实冲突时如实报告。

<!-- END UNIF REACT NATIVE STANDARD -->

## 仓库定位

`@unif/react-native-design` —— React Native 设计系统,包含 theme + icons + utils + UI 组件 + 少量通用业务复合组件。当前依赖与构建基线是 React Native `0.86.2`、React `19.2.3`、TypeScript 6;发布 contract 为 `react-native >=0.86.0 <0.87.0`、`react >=19.2.3 <20.0.0`。

yarn workspaces 单仓库:库本体在根目录;`example/` 的实际 workspace 名是 `react-native-designdd-example`,`website/` 的实际 workspace 名是 `@unif/react-native-design-website`。`example/` 仍是启用新架构的 RN `0.85.3` 现有版本 shell,通过 `react-native-monorepo-config` 让 Metro 直读 `src/`;不得把它作为 RN `0.86.2` 支持证据。

## Runtime API 整改契约

`docs/superpowers/specs/2026-07-30-runtime-api-full-remediation-design.md` 及其 Dependency / Runtime、Input / a11y、Theme / platform / icons、Website / LLM plans 是已批准契约。当前新 Store、platform driver、strict Input API、type fixture、runtime harness 与对应检查命令尚未全部落地;下文标注「整改目标」的内容是开发强制约束,不是当前能力。

- **已落地**:验证基线升到 React Native `0.86.2` + React `19.2.3`,`@react-native/babel-preset` / `eslint-config` / `jest-preset` / `metro-config` 同步到 `0.86.2`,lockfile 重解析,发布 contract 收紧为 `react-native >=0.86.0 <0.87.0`、`react >=19.2.3 <20.0.0`,`scripts/check-runtime-peers.js` + `yarn check:runtime-peers` 可运行并有 `__tests__/scripts/check-runtime-peers.test.ts` 覆盖。
- **尚未落地**:临时 native harness(`yarn create:runtime-harness`)、图标检查(`yarn check:icons`)和人工验收矩阵。这三项真实通过前,只能说依赖与发布 contract 已对齐 RN `0.86.x`,不得声称运行时支持已完成验收。
- 目标文件或 script 不存在时先实现并验证;不得把 plans 文字、源码推断、空白或 TODO 记为 PASS。

## 常用命令

除非另注,命令都在仓库根目录执行。

```sh
yarn install --immutable                     # 按现有 lockfile 安装
yarn typecheck                               # 根 tsc
yarn lint             # eslint **/*.{js,ts,tsx}
yarn lint --fix
yarn test --runInBand                        # 根 __tests__ 的 Node 环境逻辑测试
yarn test __tests__/theme/scale.test.ts       # 单文件
yarn test -t "pattern"                        # 按测试名过滤
yarn prepare                                 # bob → lib/module + lib/typescript
yarn clean

# 当前 example 是启用新架构的 RN 0.85.3 shell;不作为 RN 0.86 验收宿主
yarn --cwd example start
yarn --cwd example ios
yarn --cwd example android

# website 的真实 workspace 名
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build:llms
yarn workspace @unif/react-native-design-website build
```

根 `package.json#scripts.example` 当前指向不存在的 `@unif/react-native-design-example`,所以不要使用 `yarn example ...`;按上面的 `yarn --cwd example ...` 执行。`yarn check:runtime-peers` 已落地可运行;整改计划中的 `yarn create:runtime-harness` 和 `yarn check:icons` 尚无对应 script,在真正落地前只是验收目标,不得声称已运行。

**只用 yarn** —— 项目依赖 yarn workspaces(`packageManager: yarn@4.11.0`、`nodeLinker: node-modules`、`nmHoistingLimits: workspaces`)。pre-commit hook(lefthook)对 staged 文件跑 `eslint` + `tsc`。

## 架构

改 / 加组件、token、icon、util 前先看本节对应小节,确认放哪、跟哪个约定走。

### 对外暴露(`src/index.tsx`)

包的 barrel 重新导出:

```
./theme            tokens、ThemeProvider、useTheme/useColors/useShadow、useThemedStyles、r/rf 缩放
./icons            ICONS 数据 + IconName 联合类型 + types
./utils/testID     childTestID 助手
./utils/logger     createLogger + console transport + setLogLevel
./components/ui    原子组件(Button、Card、Cell、NavBar、Toast、Confirm、……)
./components/business  复合组件(AvatarWithRing、Decorations、GlassStats、VersionPill)
```

`src/` 内部**不用 `@/` 别名**。库代码刻意走相对路径(见 commit `ace6229`)。`tsconfig.paths` 只把 `@unif/react-native-design` 映射到 `src/index`,目的是让 example 能按包名解析到本地。

### Theme 系统(`src/theme/`)

- **当前 `ThemeProvider`** 读 `useColorScheme()`,并接收默认值为 `1` 的 `fontScale`;当前 memo 依赖是 `[scheme, fontScale]`,context value 为 `{ scheme, colors, shadow, fontScale }`。`useThemedStyles` 已把 maker 产物中的 `fontSize` / `lineHeight` / `letterSpacing` 乘以该值,但 render 期动态 typography 不会因此自动覆盖,且当前 raw `fontScale` 尚未校验。
- **`useThemedStyles(maker)`** 的 `maker: (colors, shadow) => StyleSheet` 必须定义在模块顶层;其当前缓存依赖为 `[colors, shadow, fontScale, maker]`。

  > 为什么 — inline `maker` 每次 render 都产生新引用,会直接打穿 memo 缓存。
- **整改目标** —— 增加并公开 `normalizeFontScale`、`scaleFontMetric`、`useFontScale`;仅接受有限正数且不设上限,非法值回退 `1`。静态和动态文字 metric 恰好缩放一次;Icon、Spinner、spacing、控件尺寸、border radius 和 `fixed.*` 不随 fontScale 缩放。`ThemeContext` 默认值改为 `undefined` 并从公共 barrel 移除,缺 Provider 的 dev 诊断必须在 effect 中真实可达。当前实现是 `createContext(...null)` 却检查 `undefined`,不得声称该告警已经生效。

- **颜色 token** —— role-based(`primary`、`surfaceContainer`、`foregroundMuted`、`glassTintLight`……)。
  - **暗色** 切换的是同一个 role 后面的 hex。
  - **别归一化** alpha:很多 alpha 值在亮/暗之间故意不同(`colors.ts` 有逐条注释)。
- **Shadow token** —— 暗色下把*大多数* key 的 `shadowOpacity`/`elevation` 置零。
  - **默认** 暗色用 `surface*` 5 层亮度阶梯表达深度,而不是 shadow。
  - **例外** `floating`、`glassBar`、`brandAvatar` 都明确注释了原因 —— 新加 shadow 时保持这个模式。
- **缩放(`r`、`rf`)** —— 设计基准宽 = `402pt`(iPhone 17 Pro)。
  - `r(n)` 走 `PixelRatio.roundToNearestPixel`(避免 @3x 屏 0.5px 缝隙)。
  - `rf(n)` 字号 moderate 缩放,系数 `0.3`(对中文字号最友好)。
  - **不缩放** `fixed.*` 物理常量(`hitTarget`、`navbarH`、`tabbarH`、`hairline`)—— 不要再套 `r()`。
- **`palettes.ts`** —— *渐变序列* 专用,那些塞不进 role-based `ColorTokens` 的设计调色板(如 4 stop `warmOrangePalette.light/dark`)。新加 palette 走这里,不要往 `colors.ts` 塞。

### 组件约定

每个组件一个独立目录,常见渲染结构:

```
ComponentName/
  ComponentName.tsx     # 渲染
  types.ts              # 导出 Props + sizing/palette 类型
  styles.ts             # makeStyles + sizingFor() + paletteFor()
  index.ts              # barrel
```

纯 Store、normalizer、platform driver 与测试辅助按职责增加独立文件,不强塞进上述四件套;内部类型不进入根公共 barrel。

共用模式:

- **`sizingFor(size)` + `paletteFor(variant, colors)`** —— `styles.ts` 里的纯函数,分别返回 `{ h, px, fs, br, gap }` 和 `{ bg, fg, border }`。
  - **谁用** `Button`、`Avatar`、`Tag` 等都遵循此约定。
  - **加 size/variant** `types.ts` 扩 union → 这两个函数里加 `case`。
- **`ButtonBase`** —— `Button` / `IconButton` 共享的内部 primitive。
  - 用 **render-prop `children`** 把 `{ sizing, palette }` 暴露给调用方,调用方自行组合内容(Icon + Text)。
  - 新的按钮型组件**不要**在 `ButtonBase` 外重复 chrome(Pressable / 尺寸 / palette / a11y)。
- **命令式 API 当前基线** —— `toast()` / `confirm()` 仍使用模块级 `Set<Subscriber>`;这是待整改实现,不能作为新代码范式。
  - **Confirm 整改目标**:抽出纯 `ConfirmStore`,只允许一个 Host owner 和一个 active entry;所有关闭路径统一走 identity-guarded、幂等的 `settle`,无 Host、重入、subscriber 异常和 owner cleanup 都必须确定性 resolve。
  - **Toast 整改目标**:抽出独立 `ToastStore`,使用 latest-wins pending / delivery、owner token、`leaseId` 和 entry id 的 CAS;Host 前调用保留最新消息,旧 timer / RAF / animation / owner 回调不得完成或隐藏新 delivery。Confirm / Toast 语义不同,不得抽成泛型事件总线;Store / lease / event 类型不得进入根公共 barrel。
- **平台分叉当前基线** —— Metro / bob 按 `*.web.*` 自动选平台兄弟文件;当前 Pulse 仍由 `usePulse.ts` / `usePulse.web.ts` 各自读取 raw props。
  - **platform driver 整改目标**:公共 hook / component 先统一完成 state、validation 和 normalization,平台差异只下沉到 driver。Pulse 必须由单源 `usePulse.ts` 调用只接收 `NormalizedPulseOptions` 的 `usePulseDriver.ts` / `usePulseDriver.web.ts`,并删除会绕过公共层的 `usePulse.web.ts`。公开容器层级和 style 语义须跨平台一致;只有动画驱动等差异使用兄弟实现。native `usePrefersReducedMotion` 必须读取真实系统设置,不能继续恒返回 `false`。
- **`ui/` vs `business/`**:
  - **`ui/`** 原子且无业务上下文。
  - **`business/`** 复合,但*仍保持通用* —— 任何耦合 navigation / store / 业务流程(SMS 验证码、屏幕布局)的东西留在消费者仓库,不要进这里。

### Input / 交互 / a11y 整改目标(尚未实现)

以下四条都是已批准的开发约束,当前源码仍保留宽 Input props、可选 `onPress` 和旧 Carousel 行为;不得当成现有公共能力。

- Input、Textarea、Search 必须用严格 controlled / uncontrolled 联合并在首次 render 锁定 mode;`defaultValue` 只初始化一次。PasswordInput 删除 `inputProps`,只保留顶层受控入口;公开 `TextFieldHandle` 只能 `focus()` / `blur()`,不能暴露 `clear()` / `setNativeProps()`。
- TextField slot 改为库可验证的 display / action 配置;action 必须有 handler 和 accessible name。输入 slot、Switch、Stepper 使用真实至少 `44pt` 的布局 frame,不靠会被裁剪的 `hitSlop`;固定命中尺寸不经过 `r()` 或 fontScale。
- Button / IconButton 的 `onPress` 必填;disabled / loading 时移除有效 handler,loading 同时上报 `disabled` 和 `busy`。所有真实操作必须有可访问名称和真实 state;装饰内容使用共享隐藏 props,且只落到库内本地 View / Image,不得透传给未知第三方组件。
- Carousel 使用 display / action 联合:只有同时提供 `onPressItem` 和 `getAccessibilityLabel` 的分支才渲染 Pressable;纯展示 slide 使用 View。reduced motion 下强制停止 autoplay;`data.length <= 1` 不渲染 Pagination 也不保留高度;多页 Pagination 由本地 View 隐藏 a11y tree。

### Icons

- **`src/icons/data.ts` 是生成物,不要手改**(头部有 `AUTO-GENERATED — DO NOT EDIT BY HAND`)—— `scripts/build-icons.js` 从 `src/icons/svg/*.svg` 生成。
  - **支持** 解析零依赖纯 regex(仅末尾用仓内 prettier 格式化输出),识别 `<path>` / `<rect>` / `<circle>`;元素级 `fill="currentColor"`(→ 主题色)、`stroke="none"`(纯 fill 不描边)、`opacity` 均抽取并由 `Icon.tsx` 透传。
  - **fail-fast** 违反限制(不支持元素 polyline/polygon/line/g…、单引号属性、空图标、`viewBox` ≠ `0 0 24 24`、元素属性值含 `/`)脚本列出文件名 `exit 1`,不再静默产坏数据 —— 校验逻辑见 `collectSvgIssues`,测试 `__tests__/scripts/build-icons.test.ts`。
- **加图标流程** —— 扔 SVG 到 `src/icons/svg/` → `node scripts/build-icons.js`(生成物已是 prettier 格式、再生成幂等;不规范会 `exit 1` 阻断并提示文件名)→ `yarn typecheck`。`IconName` 是闭集,组件 prop `IconName` 类型会自动同步。
- **SVG 规范** —— `Icon.tsx` 把 `fill: 'currentColor'` 替换为当前 stroke 色,使生成的 path 继承主题色。属性要求:

  | 属性 | 值 |
  | --- | --- |
  | `viewBox` | `0 0 24 24` |
  | `stroke` | `currentColor` |
  | `stroke-width` | `1.75` |
  | `stroke-linecap` | `round` |
  | `stroke-linejoin` | `round` |

  **纯 fill 元素**(实心方块/圆点,如 `stop` / 计数器圆点)用元素级 `fill="currentColor" stroke="none"` 表达(根可保留 `fill="currentColor"`);否则会继承根描边、变成空心或加粗。

- **Icon 整改目标** —— `build-icons` 改为移除 comment 后的 full-tag stack scanner:文档只能有一个根 `svg`,其直接叶子只能是 `path` / `rect` / `circle`;根和 shape 都使用 attribute allowlist,未知标签、未知属性、硬编码颜色、非法数值或结构错误必须在写文件前 fail-fast。规范根必须精确包含 `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`。
- **Icon gate 整改目标** —— 增加非写工作区的 `yarn check:icons`:在两个独立临时目录调用真实生成器,逐字节比较 temp A、temp B 和 committed `src/icons/data.ts`,任一不一致退出非零。命令落地后,每次 SVG / 生成器修改都必须先更新正式生成物,再运行脚本单测、`yarn check:icons` 与 `yarn typecheck`。

### Utils

- **`createLogger(scope)`** —— 每个模块一次(`const log = createLogger('Icon')`)。
  - **level** `debug | info | warn | error`;默认 `__DEV__` 下 `debug`、生产 `warn`。
  - **transport** 通过 `addTransport(t)` 接入(每个 transport 带 `id`,再次 add 时按 id 去重)。
  - **抛错静默** transport 抛错由调用方静默吞掉 —— 日志不能拖累业务。
- **`childTestID(parent, id, override?)`** —— 列表型组件(Tabs、Segmented、Grid……)拼 `parent-childId` 的标准助手。用它替代 inline 的 `?? \`${parent}-${id}\`` 三元。

### 测试

- Jest 测试位于根 `__tests__/`,目录按源码 / 能力镜像。当前范围不只是 utils,还包含 Confirm / Toast 逻辑、组件 styles / sizing、Theme transform 和 Icon 脚本。
- `package.json` 当前固定 `testEnvironment: 'node'`。新增 Jest 测试只覆盖纯 Store、状态机、normalizer、helper 和脚本逻辑;不新增组件 snapshot 或 renderer。
- 整改目标会新增 `type-tests/public-api.tsx`,由根 `yarn typecheck` 编译合法调用和 `@ts-expect-error` fixture,不要放进 `__tests__/`。真实 native / Web 结构、44pt frame、a11y tree、reduced motion 和竞态通过 `manual-tests/runtime-api/`、临时 RN `0.86.2` harness 与 Website 验证,并把真实证据写入 verification matrix。

- **jest env** —— `package.json` 的 `jest.testEnvironment: 'node'` 显式覆盖 `@react-native/jest-preset` 默认的 RN env。

  > 为什么 — `@react-native/jest-preset` 的默认 RN env 会拖入与顶层 `jest@30` 不匹配的 `jest-environment-node@29`,`resetModules` 时报 `clearMocksOnScope is not a function`。现已同时把 `jest-environment-node` 固定到 `30.4.1`,两侧对齐;`testEnvironment: 'node'` 仍显式保留,不要因为「看起来是默认值」删掉。

### TypeScript 严格度

`tsconfig.json` 开了更严的一档:`strict`、`noUncheckedIndexedAccess`、`noUnusedLocals`、`noUnusedParameters`、`noImplicitReturns`、`noFallthroughCasesInSwitch`、`verbatimModuleSyntax`,以及 RN 的 `react-native-strict-api` customCondition。明显后果:

- strict-api 不再导出 `StyleSheet.NamedStyles` —— `useThemedStyles.ts` 里有本地 `NamedStyles<T>` shim。
- `verbatimModuleSyntax` 下类型导入必须显式标 `import type { ... }`。
- 索引访问返回 `T | undefined` —— 用之前先 narrow。

### 构建(`react-native-builder-bob`)

`yarn prepare` 输出到 `lib/`:
- `lib/module` —— ESM(`esm: true`)
- `lib/typescript` —— `.d.ts`,用 `tsconfig.build.json`(继承 `tsconfig.json`,排除 `example/`、`lib/`)

`package.json#exports` 把 `.` 映射到 `source: src/index.tsx`(workspace 消费者)+ `default: lib/module/index.js` + `types: lib/typescript/src/index.d.ts`。不要破坏这个三元组。

## 仓库内注释风格

现有代码用中文记录非显而易见决策的 **why** —— 比如某 token 为什么亮暗 alpha 不同、为什么暗色把多数 shadow 置零、为什么 `toast.ts` 用小写文件名(APFS 大小写冲突)、为什么 memoization 依赖列表恰好是这几项。保持这个标准:能不写注释就不写,但当读者会想"为什么要这样写"时,就写一句把 why 讲清楚。
