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

`@unif/react-native-design` 是 React Native 设计系统，公开 theme、Icon、utils、40 个 UI
runtime/host 和 6 个 business component。当前根验证基线与持久 example 的版本事实：

- RN `0.86.2`。
- React `19.2.3`。
- 发布 contract 以 `package.json#peerDependencies` 为准。

Yarn workspaces：

- 根目录：`@unif/react-native-design` library。
- `example/`：`@unif/react-native-design-example`，原生名
  `ReactNativeDesignExample`，New Architecture + Hermes，Metro 直读根 `src/`。
- `website/`：`@unif/react-native-design-website`。

持久 `example/` 负责 public coverage 与双端 native shell。`yarn create:runtime-harness`
生成临时 packed tarball 宿主，负责负向/竞态专项验证；两者不能互相冒充。VoiceOver、
TalkBack、系统 reduced motion、旋转和真机仍以人工证据为准。

## 常用命令

除特别注明外都从 repo root 执行，只使用 Yarn：

```sh
yarn install --immutable
yarn check:config
yarn check:runtime-peers
yarn check:icons
yarn check:jest-entries
yarn verify:example-showcase

yarn typecheck
yarn lint
yarn test --maxWorkers=2
yarn prepare

yarn example typecheck
yarn example lint
yarn example test --maxWorkers=2
yarn example start
yarn example android
yarn example ios
yarn example build:android
yarn example build:ios

(cd example && bundle install)
(cd example && bundle exec pod install --project-directory=ios)

yarn workspace @unif/react-native-design-website typecheck
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website build
```

`yarn check:runtime-peers` 精确审核 root/example/website 三个 Carousel 5 / RNGH 3
workspace warning。不要添加 global resolution、package extension、`--force`、
`--legacy-peer-deps` 或全局 warning discard。

## 公共面与目录

`src/index.tsx` 只通过以下 barrel 暴露公共 API：

```text
src/theme
src/icons
src/utils/testID
src/utils/logger
src/components/ui
src/components/business
```

除 barrel 外，`package.json#exports` 还发布 `./jest-setup` 与 `./jest-preset` 两个
Jest 接线入口（仓根手写 CJS，不过 bob、不 import `src/`）。改动它们要同步
`yarn check:jest-entries`、`scripts/__tests__/jest-*.test.mjs`、`example/jest.config.js`、
`.github/workflows/example-showcase.yml`（根 jest 不扫 `scripts/__tests__/`，那个
workflow 是这两条 gate 唯一进 CI 的路径）、Website 测试页与 `design` Skill。

- library 内部使用相对 import；example 只从 `@unif/react-native-design` package root
  导入，禁止 `src/`、`lib/`、`dist/` deep import。
- `ui/` 是无业务上下文的原子组件；`business/` 是通用复合组件。navigation、store、业务
  workflow 留在消费者。
- 新增、删除或重命名 public runtime 时，同步 barrel、types/tests、Website/llms、
  `example/src/catalog/componentCatalog.ts` 与 `yarn verify:example-showcase`。
- `src/icons/data.ts` 是生成物。修改 `src/icons/svg/*.svg` 或生成器后运行真实生成、脚本测试、
  `yarn check:icons` 和 `yarn typecheck`；禁止手改生成物。

## Theme、样式与媒体

- `ThemeProvider` 支持 `forceScheme` 和经 `normalizeFontScale()` 归一化的 `fontScale`。
  `useFontScale()` / `scaleFontMetric()` 处理动态文字 metric；字号、行高、字距恰好缩放一次，
  spacing、控件、Icon、Spinner 与 `fixed.*` 不随 fontScale 缩放。
- `useThemedStyles(maker)` 的 maker 必须位于模块顶层。业务颜色只走 `useColors()` role
  token；渐变序列走 palettes；shadow 走 `useShadow()`。
- example 源码禁止内联 hex/rgba、`console.*`、RN `Pressable`/Touchable。可点区域优先使用
  Design 组件；确需自定义时使用 RNGH Pressable 并补全 a11y。
- Avatar、Thumbnail、Logo 走公开 source contract。Thumbnail 的 `uri` / `source` 严格
  二选一；结果日志不得保存输入值、图片 URI 或环境路径。

## 交互与 a11y 当前契约

- Input、Textarea、Search 首次 render 锁定 controlled/uncontrolled mode；受控必须同时给
  `value` + `onChangeText`，非受控只用 `defaultValue`。PasswordInput 只走受控入口；
  `TextFieldHandle` 只有 `focus()` / `blur()`。
- Button/IconButton 的 `onPress` 必填；IconButton 必须有非空 `accessibilityLabel`。
  disabled/loading 移除有效 handler，loading 同时报告 disabled + busy。
- Cell 使用 static/action/control 严格分支；Carousel 使用 display/action 严格分支。
  action Carousel 必须同时给 `onPressItem` 与 `getAccessibilityLabel`，reduced motion 下停止
  autoplay，单页不渲染 Pagination。
- Checkbox/Radio/Switch 报告 `accessibilityState.checked`；Tabs/TabBar/Segmented 报告
  `accessibilityState.selected`。这是 a11y 状态名，不是受控 prop 名：prop 只有 Checkbox 叫
  `checked`，Radio/Switch/Tabs/Segmented 用 `value`，TabBar 用 `active`。
  装饰 View/Image/SVG 隐藏完整 a11y 子树，状态反馈避免重复播报。
- `ConfirmStore` 栈式 owner（后挂载接管、卸载归还）+ 单 active、identity-guarded settle；
  `ToastStore` 同构栈式 owner + latest-wins pending/delivery、owner token 与 lease/CAS。
  owner 切换时前任收 clear：Confirm 两个方向都把 active 结算为 `false`；Toast 分方向 ——
  被接管丢弃在途投递，归还则整条交回前任重投（Modal 内 toast 后立刻关窗那条不能丢）。
  多 Host 是合法用法（RN `Modal` 内自挂），不再告警。Store 内部类型不进入 public barrel。
- Pulse 由公共 normalization 层调用 native/Web driver；`usePrefersReducedMotion` 读取真实
  平台设置，不能用本地假 override 代替系统事实。

## Example showcase contract

`example/src/app/AppProviders.tsx` 的固定装配是：

```text
GestureHandlerRootView
└─ SafeAreaProvider
   └─ ShowcaseProvider
      └─ ThemeProvider
         ├─ ExampleRouter
         ├─ ConfirmHost（唯一）
         └─ ToastHost（唯一）
```

Router 只挂当前 scene；typed navigation 只有 Home 或 Home + 一个 scene。8 个 canonical
scene 为 foundation/actions/feedback/forms/navigation/collections/media/business，标题与
Home、真实 `ShowcaseScaffold`、README 必须一致。scene draft 存在根 Provider，重动画、
Carousel ref 与 Image attempt 留在 active screen，路由卸载即释放。

`scripts/verify-example-showcase.mjs` 是 production gate：它验证 public exact coverage、真实
scene consumption、route/title/Home/README 闭环、根 Host 唯一性、禁用源码模式、版本与
native identity、CI 和 Turbo contract。测试 mutation 必须先通过 clean fixture，再确认目标
真实改变，并断言稳定的 typed error code；不得依赖 test-name filter 或缺文件假绿。

## 测试与交付

- 根 Jest 使用 Node 环境，覆盖 Store、normalizer、helper、脚本与配置 contract；公开合法/
  非法调用由 `type-tests/` 和根 `yarn typecheck` 覆盖。
- example Jest/RNTL 覆盖根装配、typed navigation、scene state 与组件可观察行为；不要把
  第三方 mock 的存在当成组件行为证据。
- 改 public API、行为、类型、peer 或 native 配置时，同步 source/barrel、tests、example、
  README、Website/llms 与对应 Skill。只改 example/CI/docs 时也要核对这些范围并说明为何
  public API、peer 与 Website 组件正文无需变化。
- `.github/workflows/ci.yml` 来自组织模板，禁止单仓修改。example 专项 gate 位于
  `.github/workflows/example-showcase.yml`，不运行 native；共享 CI 继续负责 Website 与双端
  native。
- 提交前运行相关最小测试与完整受影响 gate，检查 `git diff --check`、`git status --short`
  和 diff 范围。只暂存本任务文件，使用 conventional commit；`main` 只经 PR + required CI
  合入，不手工发布。

## 注释风格

代码标识符保持英文。注释优先说明非显而易见的中文 why，不复述代码；严格输入、a11y、
竞态、token alpha、dark shadow 与 native 平台差异尤其要保留决策原因。
