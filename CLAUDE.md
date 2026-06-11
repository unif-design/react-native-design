# CLAUDE.md

## 仓库定位

`@unif/react-native-design` —— React Native 设计系统,包含 theme + icons + utils + UI 组件 + 少量通用业务复合组件。目标运行时:**RN 0.85 新架构**(Fabric + concurrent React)、React 19、TypeScript 6。

yarn workspaces 单仓库:库本体在根目录,两个 workspace —— `example/`(宿主 RN app)+ `website/`(Docusaurus 文档站,`llms.txt` 由 `website/scripts/build-llms.js` 从 `website/docs/` 生成,改组件 API 要同步改 docs)。`example/` 通过 `react-native-monorepo-config` 接入 Metro 直读 `src/`,所以改库的 JS 代码在 example 里热更新,不用重新构建原生。

## 常用命令

除非另注,命令都在仓库根目录执行。

```sh
yarn                  # 安装(yarn 4.11,node ≥ 24.13,见 .nvmrc)
yarn typecheck        # tsc(noEmit,strict + noUncheckedIndexedAccess)
yarn lint             # eslint **/*.{js,ts,tsx}
yarn lint --fix       # 自动修复
yarn test             # jest(跑根目录 __tests__/ 下的纯逻辑 utility 测试)
yarn test __tests__/theme/scale.test.ts   # 跑单文件
yarn test -t "pattern"                    # 按测试名过滤
yarn prepare          # react-native-builder-bob → lib/module + lib/typescript
yarn clean            # 清 lib/ + example 构建产物

# example 应用
yarn example start    # metro
yarn example ios      # 构建并跑 iOS
yarn example android  # 构建并跑 Android
```

**只用 yarn** —— 项目依赖 yarn workspaces(`packageManager: yarn@4.11.0`、`nodeLinker: node-modules`、`nmHoistingLimits: workspaces`)。pre-commit hook(lefthook)对 staged 文件跑 `eslint` + `tsc`。提交信息必须符合 conventional commits(commit-msg hook 用 commitlint 强校验)。

## 架构

改 / 加组件、token、icon、util 前先看本节对应小节,确认放哪、跟哪个约定走。

### 对外暴露(`src/index.tsx`)

包的 barrel 重新导出:

```
./theme            tokens、ThemeProvider、useTheme/useColors/useShadow、useThemedStyles、r/rf 缩放
./icons            ICONS 数据 + IconName 联合类型 + types
./utils/testID     childTestID 助手
./utils/logger     createLogger + console transport + setLogLevel
./components/ui    原子组件(Button、Card、Cell、NavBar、BottomSheet、Toast、……)
./components/business  复合组件(AvatarWithRing、Decorations、GlassStats、VersionPill)
```

`src/` 内部**不用 `@/` 别名**。库代码刻意走相对路径(见 commit `ace6229`)。`tsconfig.paths` 只把 `@unif/react-native-design` 映射到 `src/index`,目的是让 example 能按包名解析到本地。

### Theme 系统(`src/theme/`)

- **`ThemeProvider`** 读 `useColorScheme()`,只以 `scheme` 为依赖 `useMemo` 出 `{ scheme, colors, shadow }` —— 这个稳定引用是 `useThemedStyles` 缓存生效的契约。
- **`useThemedStyles(maker)`** —— `maker: (colors, shadow) => StyleSheet`,**必须**定义在模块顶层(从 `styles.ts` 导出),绝不写在组件里 inline 内联。

  > 为什么 — inline `maker` 每次渲染都是新引用 → 直接打穿 `useMemo([colors, shadow, maker])` 缓存。

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

每个组件一个独立目录,固定结构:

```
ComponentName/
  ComponentName.tsx     # 渲染
  types.ts              # 导出 Props + sizing/palette 类型
  styles.ts             # makeStyles + sizingFor() + paletteFor()
  index.ts              # barrel
```

共用模式:

- **`sizingFor(size)` + `paletteFor(variant, colors)`** —— `styles.ts` 里的纯函数,分别返回 `{ h, px, fs, br, gap }` 和 `{ bg, fg, border }`。
  - **谁用** `Button`、`Avatar`、`Tag` 等都遵循此约定。
  - **加 size/variant** `types.ts` 扩 union → 这两个函数里加 `case`。
- **`ButtonBase`** —— `Button` / `IconButton` 共享的内部 primitive。
  - 用 **render-prop `children`** 把 `{ sizing, palette }` 暴露给调用方,调用方自行组合内容(Icon + Text)。
  - 新的按钮型组件**不要**在 `ButtonBase` 外重复 chrome(Pressable / 尺寸 / palette / a11y)。
- **命令式 API**(`toast()`、`confirm()`)—— 模块级 `Set<Subscriber>` 注册表,配合在 app 根附近渲染一次的 `<ToastHost />` / `<ConfirmHost />`。`confirm()` 强制同一时间只有 1 个对话框,重入直接 `Promise.resolve(false)`。
- **`*.web.tsx` 兄弟文件**(如 `BlurLayer.web.tsx`)—— web 特化实现,Metro / bob 按平台自动选。
- **`ui/` vs `business/`**:
  - **`ui/`** 原子且无业务上下文。
  - **`business/`** 复合,但*仍保持通用* —— 任何耦合 navigation / store / 业务流程(SMS 验证码、屏幕布局)的东西留在消费者仓库,不要进这里。

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

### Utils

- **`createLogger(scope)`** —— 每个模块一次(`const log = createLogger('Icon')`)。
  - **level** `debug | info | warn | error`;默认 `__DEV__` 下 `debug`、生产 `warn`。
  - **transport** 通过 `addTransport(t)` 接入(每个 transport 带 `id`,再次 add 时按 id 去重)。
  - **抛错静默** transport 抛错由调用方静默吞掉 —— 日志不能拖累业务。
- **`childTestID(parent, id, override?)`** —— 列表型组件(Tabs、Segmented、Grid……)拼 `parent-childId` 的标准助手。用它替代 inline 的 `?? \`${parent}-${id}\`` 三元。

### 测试

- **位置** —— 仓库根 `__tests__/`,**不**与源码 colocate,目录结构镜像 `src/`(`__tests__/theme/`、`__tests__/utils/`……)。
- **只覆盖纯逻辑 utility**(`scale` / `logger` / `childTestID`)。**design 层不重复测组件行为** —— 新增测试时遵循这条边界,只补纯函数 / hook 逻辑。

  > 为什么 — 组件用法由消费者层(portal)的集成测试 cover → 在这里写组件 snapshot 是冗余。

- **jest env** —— `package.json` 的 `jest.testEnvironment: 'node'` 显式覆盖 `@react-native/jest-preset` 默认的 RN env;等真要测 RN 组件时再考虑切回 / 隔离 preset。

  > 为什么 — RN 0.85 preset 内置 `jest-environment-node@29` 跟顶层 `jest@30` mismatch → `resetModules` 时报 `clearMocksOnScope is not a function`。

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

## 文档与 skill 同步

改组件 / API / 类型、或想知道消费者怎么接入本库时看这里。

- **逐组件 API / props / variant / size 全量** → 文档站 + 远程 llms.txt(按需 fetch,**不在本仓正文镜像**):
  - 文档站:https://unif-design.github.io/react-native-design/
  - llms 索引:https://unif-design.github.io/react-native-design/llms.txt
  - llms 全文:https://unif-design.github.io/react-native-design/llms-full.txt
- **website docs 是 llms.txt 的唯一来源** —— 改了组件 / API / 类型,**同步改对应 `website/docs/components/<name>.mdx`** 再 `yarn workspace website build:llms` 重生成(`website/scripts/build-llms.js`),否则 AI 读到的会过时。**不要**把全量 API 复制进 CLAUDE.md 或代码注释。
- **改 API 也要同步消费侧 skill** —— skill `unif-design`(`unif-design/skills` 仓 `skills/unif-design/SKILL.md`):**手写部分**(快速开始 / 坑 / `assets/` 模板)手动改;**全量 props** 已路由 llms.txt,随 docs 自动跟随。
- **作为消费者接入** → Agent Skill `unif-design`(`unif` 插件),装:`/plugin marketplace add unif-design/skills` → `/plugin install unif@unif-skills`。经核实的组件 API / token 规则 / 与原生 RN 的关键差异,是接入侧首选入口。
- CI / release / native-lint 约定见 `README` + `.github/`。

## 自动化流程标准

CI / 发版 / 依赖管理 / PR review / branch protection 全套自动化的配置 + 排查 SOP,**集中维护在 org 共享文档**:

→ https://github.com/unif-design/.github/blob/main/AUTOMATION.md

本仓库是该文档的参考实例(具体路径、ruleset 勾选项、release-it 配置都以这个 repo 为标本)。

## 仓库内注释风格

现有代码用中文记录非显而易见决策的 **why** —— 比如某 token 为什么亮暗 alpha 不同、为什么暗色把多数 shadow 置零、为什么 `toast.ts` 用小写文件名(APFS 大小写冲突)、为什么 memoization 依赖列表恰好是这几项。保持这个标准:能不写注释就不写,但当读者会想"为什么要这样写"时,就写一句把 why 讲清楚。
