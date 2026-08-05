# Design Example Showcase 实施计划

> **For agents:** 必须使用 `subagent-driven-development` 按 Task 顺序执行；每个 Task
> 先写 RED、实现、提交，再做独立 task review。最终全部 Task 完成后再做一次全分支 review。

**Goal:** 将旧 RN 0.85.3 模板壳升级为 RN 0.86.2 Design 展厅，以 8 个按需挂载 scene
覆盖所有公开 UI/business component 与主要状态，并建立 exhaustive contract、文档、CI、
Turbo 和双端宿主证据。

**Architecture:** 根 `ShowcaseProvider` 持有 typed 单层导航、theme/fontScale 偏好、
scene drafts 与 bounded result log；它位于 `ThemeProvider` 外层，让后者只消费公开
`forceScheme/fontScale`；
只挂 active scene，Toast/Confirm Host 全局唯一。`componentCatalog` 是公开组件到主 scene
的唯一映射，Node contract 从公共 barrel 反向核对 exact set。

**Tech Stack:** React Native 0.86.2、React 19.2.3、TypeScript 6、
`@unif/react-native-design@workspace:*`、RNTL/Jest、Node contract scripts、Turbo。

---

## Global Constraints

- 规格：`docs/superpowers/specs/2026-08-03-example-showcase-design.md`。
- 只用 yarn；worktree/branch 为 `feat/example-showcase`。
- 所有 Design runtime/type 从 `@unif/react-native-design` 包根导入。
- 不改 library public API、public peer range、token、组件 runtime 或 Website 逐组件正文。
- example 精确使用 RN `0.86.2`、React `19.2.3`、Design `workspace:*` 与规格中的全部 peers。
- 只允许 root/example/website 三条 Carousel 5 / RNGH 3 workspace warning。
- 禁止 global override/resolution/package extension；禁止深导入、hex/rgba、`console.*`、
  RN `Pressable`/Touchable。
- 样式只用 token；`makeStyles` 模块顶层；文案简体中文；IconButton 必有 label。
- root order 固定为
  `GestureHandlerRootView > SafeAreaProvider > ShowcaseProvider > ThemeProvider > App + ConfirmHost + ToastHost`。
- Theme mode 只有 `system/light/dark`；fontScale 只有 `1/1.25/1.5/2`。
- Home 不 eager mount scene；Carousel/Blur/完整 Icon catalog 只在 active scene 按需挂载。
- 每个公开组件只有一个 catalog 主归属；可在 shell/组合中复用，但 coverage 不重复计数。
- 自动化不能冒充 VoiceOver/TalkBack、真机手势、系统主题/reduced motion 或旋转验收。

---

### Task 1: 升级 workspace、RN 0.86.2 shell 与双端 native contract

**Files:**

- Modify: `package.json`
- Modify: `.yarnrc.yml`
- Modify: `yarn.lock`
- Replace: `example/package.json`
- Replace: `example/babel.config.js`
- Modify: `example/metro.config.js`
- Create: `example/tsconfig.json`
- Modify: `example/jest.config.js`
- Create: `example/jest.setup.ts`
- Modify: `example/app.json`
- Modify: `example/index.js`
- Rename/Modify: `example/android/app/src/main/java/designdd/example/*`
- Modify: `example/android/app/build.gradle`
- Modify: `example/android/build.gradle`
- Modify: `example/android/settings.gradle`
- Modify: `example/android/gradle.properties`
- Modify: `example/android/app/src/main/AndroidManifest.xml`
- Rename/Modify: `example/ios/DesignddExample*`
- Modify: `example/ios/Podfile`
- Modify: `example/Gemfile`
- Create: `example/Gemfile.lock`
- Create: `example/ios/Podfile.lock`
- Create: `scripts/verify-example-showcase.mjs`
- Create: `scripts/__tests__/example-showcase-contract.test.mjs`
- Modify: `scripts/check-runtime-peers.js`
- Modify: `__tests__/scripts/check-runtime-peers.test.ts`

**Interfaces:**

- Produces:
  - workspace `@unif/react-native-design-example`
  - root `yarn example <script>`
  - `yarn verify:example-showcase`
  - RN 0.86.2 New Architecture Android/iOS shell
  - exact three-warning runtime peer contract

- [ ] **Step 1: 写 dependency/config RED**

新增 Node contract test，读取真实 manifests/config，先断言：

```js
assert.equal(examplePackage.name, '@unif/react-native-design-example');
assert.equal(examplePackage.dependencies.react, '19.2.3');
assert.equal(examplePackage.dependencies['react-native'], '0.86.2');
assert.equal(
  examplePackage.dependencies['@unif/react-native-design'],
  'workspace:*'
);
```

精确断言规格中的 7 个其他 runtime peers、CLI `20.1.0`、RN presets `0.86.2`、
`test/typecheck/lint` scripts、Worklets plugin 最后、根 `example` script 指向真实 workspace。

Run:

```sh
node --test scripts/__tests__/example-showcase-contract.test.mjs
```

Expected: FAIL，指出旧 workspace、RN 0.85.3、缺 Design/peers/scripts/plugin。

- [ ] **Step 2: 写 native identity/permission RED**

contract 解析：

- app.json/name/displayName；
- Android namespace/applicationId/Kotlin package/New Arch/minSdk 24/autolinking；
- iOS project/scheme/module/app name、Podfile autolinking；
- Android 仅 INTERNET；iOS 不含 location/camera/photo usage key；
- iPhone portrait + landscape left/right；
- Gem/Pod lock 存在且未被 ignore。

Expected: 旧 `DesignddExample`、空 location permission、缺 locks 精确失败。

- [ ] **Step 3: 升级 workspace dependency graph**

`example/package.json`：

- name 改为 `@unif/react-native-design-example`；
- dependencies 使用规格精确 runtime graph；
- devDependencies 对齐 RN 0.86.2 template；
- 增加 RNTL `^13.3.3`、Jest 29、`react-test-renderer@19.2.3` 与 types；
- 删除 app 不需要的 `react-native-builder-bob`；
- scripts 增加 `test`、`typecheck`、`lint`。

`babel.config.js` 使用 bob workspace config + RN preset，`react-native-worklets/plugin`
必须最后。Metro 保持从 workspace source 消费根包，但不得读 `lib` 或 registry copy。

Run:

```sh
yarn install --immutable
yarn check:runtime-peers
yarn explain peer-requirements
```

更新 runtime peer checker allowlist/test，使三条且只三条批准 warning 通过。

- [ ] **Step 4: 对照 lock-pinned official template 升级原生 shell**

使用仓库已锁定的 CLI/template `20.1.0/0.86.2` 作为参考，原子同步：

```text
ReactNativeDesignExample
@unif/react-native-design-example
unif.reactnativedesign.example
```

不要在 repo 外浮动下载 latest。保留 minSdk 24、compile/target 36、Hermes、
New Architecture、autolinking。删除 iOS 空 location permission；不新增其他权限。

执行 Bundler/Pods，提交 lock；Pods 网络/缓存失败保留原始证据，不删除 lock gate。

- [ ] **Step 5: 写最小可编译 App**

暂时只装配：

```text
GestureHandlerRootView > SafeAreaProvider > ThemeProvider > Text
```

只从 `@unif/react-native-design` 导入 `ThemeProvider/useColors`，证明 workspace/runtime
解析已正确；Task 3 再替换为完整 shell。

- [ ] **Step 6: GREEN 与提交**

Run:

```sh
node --test scripts/__tests__/example-showcase-contract.test.mjs
yarn verify:example-showcase
yarn check:runtime-peers
yarn example typecheck
yarn example test --maxWorkers=2
yarn typecheck
yarn lint
git diff --check
```

Native best effort：

```sh
yarn example build:android
cd example && bundle install && bundle exec pod install --project-directory=ios
yarn example build:ios
```

```sh
git commit -m "chore: upgrade design example runtime"
```

---

### Task 2: 建立 exhaustive catalog、typed navigation 与持久 scene state

**Files:**

- Create: `example/src/catalog/componentCatalog.ts`
- Create: `example/src/navigation/exampleNavigation.ts`
- Create: `example/src/state/showcaseState.ts`
- Create: `example/src/state/ShowcaseProvider.tsx`
- Create: `example/src/state/useShowcase.ts`
- Create: `example/src/__tests__/componentCatalog.test.ts`
- Create: `example/src/__tests__/exampleNavigation.test.ts`
- Create: `example/src/__tests__/showcaseState.test.ts`
- Modify: `scripts/verify-example-showcase.mjs`
- Modify: `scripts/__tests__/example-showcase-contract.test.mjs`

**Interfaces:**

```ts
export type SceneId =
  | 'foundation'
  | 'actions'
  | 'feedback'
  | 'forms'
  | 'navigation'
  | 'collections'
  | 'media'
  | 'business';

export type RouteId = 'home' | SceneId;
export type ThemeMode = 'system' | 'light' | 'dark';
export type FontScalePreset = 1 | 1.25 | 1.5 | 2;
export type NavigationState =
  | readonly ['home']
  | readonly ['home', SceneId];
```

Provider produces preferences、typed scene drafts、bounded results、navigate/back/reset APIs。

- [ ] **Step 1: 写 catalog exact-set RED**

`componentCatalog` 显式列出规格中的 40 UI component/host、7 business runtime，
每项 `{id, scene, states}`。另列 `requiredRuntimeApis` 覆盖 theme/icon/logger/testID/
imperative hooks。

Node contract 从 `src/components/ui/index.ts` 和 business barrel 解析 runtime exports：

- Uppercase public component exact set 等于 catalog；
- `confirm/toast/usePulse/useSvgId` 在 required set；
- 每个 component 恰有一个主 scene；
- 8 个 scene 均非空。

先运行 contract，Expected: FAIL，catalog 不存在。

- [ ] **Step 2: 写 navigation RED**

覆盖：

```ts
expect(navigate(['home'], 'forms')).toEqual(['home', 'forms']);
expect(navigate(['home', 'forms'], 'forms')).toEqual(['home', 'forms']);
expect(navigate(['home', 'forms'], 'media')).toEqual(['home', 'media']);
expect(back(['home', 'forms'])).toEqual(['home']);
expect(back(['home'])).toEqual(['home']);
```

另测 `shouldConsumeHardwareBack`：child true、home false。

- [ ] **Step 3: 写 state/log/privacy RED**

State 必须：

- theme mode/fontScale 只接收 literal preset；
- 8 个 scene draft 可按 scene 更新，切 route 不丢；
- reset 只重置目标 scene；
- result log 新在前、上限 50、id 单调；
- action summary 是调用方提供的安全文案，不保存 password/input/image URI。

测试必须证明 password action 只写长度/状态，不出现原始值。

- [ ] **Step 4: 最小实现 Provider**

Provider 接口：

```ts
type ShowcaseContextValue = {
  state: ShowcaseState;
  navigate: (scene: SceneId) => void;
  back: () => boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setFontScale: (scale: FontScalePreset) => void;
  updateScene: <K extends SceneId>(
    scene: K,
    updater: (current: SceneStateMap[K]) => SceneStateMap[K]
  ) => void;
  resetScene: (scene: SceneId) => void;
  appendResult: (input: SafeResultInput) => void;
  clearResults: () => void;
};
```

不要引入 AsyncStorage。Provider 安装 public custom logger transport 时保存旧 log level，
unmount 恢复并 remove transport；transport 只写 safe record metadata。

- [ ] **Step 5: GREEN 与提交**

Run:

```sh
yarn example test componentCatalog exampleNavigation showcaseState --runInBand
yarn verify:example-showcase
yarn example typecheck
yarn lint
git diff --check
```

```sh
git commit -m "feat: add design showcase model"
```

---

### Task 3: 组合根 Provider、Home、Foundation 与 Icon catalog

**Files:**

- Create: `example/src/app/AppProviders.tsx`
- Create: `example/src/app/ExampleRouter.tsx`
- Create: `example/src/shared/ShowcaseScaffold.tsx`
- Create: `example/src/shared/SectionCard.tsx`
- Create: `example/src/shared/ResultPanel.tsx`
- Create: `example/src/screens/HomeScreen.tsx`
- Create: `example/src/showcases/foundation/FoundationScene.tsx`
- Create: `example/src/showcases/foundation/IconCatalog.tsx`
- Replace: `example/src/App.tsx`
- Create: `example/src/__tests__/App.test.tsx`
- Create: `example/src/__tests__/FoundationScene.test.tsx`
- Create: `example/src/__tests__/helpers/nativeMocks.ts`

**Interfaces:**

- Root order 与 Host 唯一性严格遵守规格。
- Router 只挂 current route；scene draft 留在 Provider。
- Foundation 消费全部 Theme/Icon/logger/testID required APIs。

- [ ] **Step 1: 写 root/provider RED**

RNTL/可观察 probe 覆盖：

- root provider 顺序；
- `ConfirmHost` / `ToastHost` 各 1；
- Theme mode system 时 `forceScheme` undefined，light/dark 为 literal；
- fontScale 四档；
- Home 只显示 scene cards，不出现 `foundation-screen` 等 scene marker；
- 导航到 Foundation 只挂 Foundation，back 回 Home；
- Android BackHandler child consume、home 不 consume、unmount remove。

不要只对 mock 元素做 snapshot；捕获 public props 并真实触发 handler。

- [ ] **Step 2: 写 Home/Foundation RED**

Home 8 个 scene 入口；Foundation 覆盖：

- current scheme/fontScale/reduced motion；
- theme mode 与 fontScale 控制；
- light/dark token paired swatch、shadow/palette/scale/blur metrics；
- searchable icon catalog，初始只显示固定 batch，加载更多增加；
- query/loadedCount 跨路由保留；
- logger action 进入 bounded ResultPanel，custom transport cleanup。

- [ ] **Step 3: 实现 root 与 shared layout**

只用 public Design components/tokens。`ShowcaseScaffold` 提供 NavBar、ScrollView、
reset/result 区域；ResultPanel 最新结果 live region，历史按需展开，不一次渲染 50 条详情。

Icon catalog 使用 `ICON_NAMES` 分批、`Icon` 渲染；搜索为空使用 `Empty`，不得用
RN Pressable 自制 item。

- [ ] **Step 4: GREEN 与提交**

Run:

```sh
yarn example test App FoundationScene --runInBand
yarn example test --runInBand
yarn example typecheck
yarn lint
rg -n "console\\.|#[0-9A-Fa-f]{3,8}|rgba\\(|from ['\"]react-native-design|@unif/react-native-design/(src|lib|dist)|\\bPressable\\b" example/src
git diff --check
```

Expected: tests/type/lint 通过；forbidden scan 无命中。

```sh
git commit -m "feat: build design showcase shell"
```

---

### Task 4: 实现 Actions 与 Feedback/Motion scenes

**Files:**

- Create: `example/src/showcases/actions/ActionsScene.tsx`
- Create: `example/src/showcases/feedback/FeedbackScene.tsx`
- Create: `example/src/__tests__/ActionsScene.test.tsx`
- Create: `example/src/__tests__/FeedbackScene.test.tsx`
- Modify: `example/src/app/ExampleRouter.tsx`

**Interfaces:**

- Actions 主归属：`Button/IconButton/Chip/Tag/StatusDot`。
- Feedback 主归属：
  `Empty/Skeleton/Spinner/Pulse/PulseDot/Reveal/BlurLayer/confirm/toast/usePulse`。
- Host 仍只在 root。

- [ ] **Step 1: 先读本地 canonical API**

实现前定点读取对应 `website/static/md/components/*.md`、public types 与现有 tests。
若文档与源码不一致，以 public types/实现为准，并在 report 记录。

- [ ] **Step 2: 写 Actions RED**

行为测试覆盖：

- Button variant/size 切换、loading/disabled handler 不触发；
- IconButton 每个实例有 label；
- Chip selected/disabled/busy；
- Tag variant/size；
- StatusDot 4 status × 2 tone；
- action 更新 safe result，切路由再返回状态保留。

- [ ] **Step 3: 写 Feedback RED**

覆盖：

- Skeleton 3 shape、Spinner、Empty；
- Reveal show/hide；
- Pulse/PulseDot/usePulse options；
- reduced motion 事实展示；
- BlurLayer 只有用户开启“加载真实 Blur 演示”才挂载；
- Toast 三 kind/三 position；
- Confirm normal/destructive 与 confirm/cancel；
- imperative promise settled 后写真实可见结果，不能用 toast 自己当唯一证据。

- [ ] **Step 4: 最小实现与 GREEN**

动画/native edge 在 Jest 只 mock Reanimated/Blur driver；screen 仍必须验证 public props、
可访问名称和结果状态。不得断言第三方 mock 的内部 DOM。

Run:

```sh
yarn example test ActionsScene FeedbackScene --runInBand
yarn example test --runInBand
yarn example typecheck
yarn lint
git diff --check
```

```sh
git commit -m "feat: add design actions and feedback scenes"
```

---

### Task 5: 实现 Forms 与 Navigation/Selection scenes

**Files:**

- Create: `example/src/showcases/forms/FormsScene.tsx`
- Create: `example/src/showcases/navigation/NavigationScene.tsx`
- Create: `example/src/__tests__/FormsScene.test.tsx`
- Create: `example/src/__tests__/NavigationScene.test.tsx`
- Modify: `example/src/app/ExampleRouter.tsx`

**Interfaces:**

- Forms 主归属：
  `Input/PasswordInput/Textarea/Search/Checkbox/Radio/Switch/Stepper/Form/FormGroup/FormRow`。
- Navigation 主归属：`NavBar/DrawerHeader/Tabs/Segmented/TabBar`。

- [ ] **Step 1: 写 Forms RED**

必须覆盖：

- controlled/uncontrolled 分开，不运行时切 mode；
- Input/Textarea idle/filled/error/disabled/editable；
- leading/trailing display 与 action slot，action 有 name；
- Password 显隐但 log 只记录长度；
- Search clear/submit；
- Checkbox/Radio/Switch checked 与 disabled；
- Stepper min/mid/max/step/zero range/disabled；
- FormRow required/error live region；
- TextField ref 只调用 focus/blur；
- 跨路由 draft 保留、reset 只清 forms。

- [ ] **Step 2: 写 Navigation RED**

覆盖：

- NavBar 3 variant、action/display slot；
- DrawerHeader；
- Tabs item/global disabled、selected；
- Segmented sm/md、selected/disabled；
- TabBar selected/badge；
- component specimen selection 不改变 App route；
- Android app hardware back 仍只影响 App typed navigation。

- [ ] **Step 3: 实现与 GREEN**

所有受控组件使用 public literal props；禁止 `as any` 绕过严格 union。错误/结果区域使用
live region，disabled 不得保留有效 action。

Run:

```sh
yarn example test FormsScene NavigationScene --runInBand
yarn example test --runInBand
yarn example typecheck
yarn lint
git diff --check
```

```sh
git commit -m "feat: add design form and navigation scenes"
```

---

### Task 6: 实现 Collections、Media 与 Business scenes

**Files:**

- Create: `example/src/showcases/collections/CollectionsScene.tsx`
- Create: `example/src/showcases/media/MediaScene.tsx`
- Create: `example/src/showcases/business/BusinessScene.tsx`
- Create: `example/src/__tests__/CollectionsScene.test.tsx`
- Create: `example/src/__tests__/MediaScene.test.tsx`
- Create: `example/src/__tests__/BusinessScene.test.tsx`
- Modify: `example/src/app/ExampleRouter.tsx`

**Interfaces:**

- Collections 主归属：`Card/Cell/List/Grid/EntryCard/Carousel`。
- Media 主归属：`Avatar/Thumbnail/Logo`。
- Business 主归属：
  `GradientWash/RadialHalo/ScreenBackdrop/GlassStats/AvatarWithRing/VersionPill/useSvgId`。

- [ ] **Step 1: 写 Collections RED**

覆盖：

- Card default/plain/bare/fill；
- Cell static/action/control、arrow/danger/disabled；
- List grouped/flush/divider；
- Grid static/action、columns/card/badge；
- EntryCard static/action；
- Carousel 默认不挂载；开启后覆盖 empty/one/multiple、display/action、
  bottom/overlay、autoplay/loop/ref；
- reduced motion 时 autoplay 停止；
- 离开 scene 后 Carousel unmount，draft 保留。

- [ ] **Step 2: 写 Media RED**

使用稳定本地 fixture + 可编辑 HTTPS fixture：

- Avatar size/variant/monogram/source/fallback；
- Thumbnail `uri`/`source`、size/selected、named/decorative；
- Image error 后显示正常 fallback/Empty，保留 metadata；
- Logo named/decorative；
- 不把本地/远程 URI 写入 result log。

- [ ] **Step 3: 写 Business RED**

覆盖：

- 同屏 `useSvgId` 输出唯一；
- GradientWash simple/custom；
- RadialHalo；
- ScreenBackdrop warmOrange/custom；
- GlassStats 2/3/4 columns；
- AvatarWithRing sizes；
- VersionPill status；
- decorative SVG/gradient 不进入 a11y tree。

- [ ] **Step 4: 实现与 GREEN**

Run:

```sh
yarn example test CollectionsScene MediaScene BusinessScene --runInBand
yarn example test --runInBand
yarn example typecheck
yarn lint
yarn verify:example-showcase
git diff --check
```

```sh
git commit -m "feat: complete design component scenes"
```

---

### Task 7: 完成 exhaustive gates、README、AGENTS、CI/Turbo 与全量验证

**Files:**

- Modify: `scripts/verify-example-showcase.mjs`
- Modify: `scripts/__tests__/example-showcase-contract.test.mjs`
- Modify: `README.md`
- Replace: `example/README.md`
- Modify: `AGENTS.md`
- Modify: `CONTRIBUTING.md`
- Create: `.github/workflows/example-showcase.yml`
- Verify unchanged: `.github/workflows/ci.yml`
- Modify: `turbo.json`

**Interfaces:**

- Consumes Tasks 1–6 的真实入口、catalog、scripts、native identifiers。
- Produces exhaustive mutation contract、可复制文档、精确 CI/Turbo graph 与最终证据。

- [ ] **Step 1: 完成 exhaustive contract RED**

临时 mutation 必须分别证明会失败：

- 删除一个 catalog component；
- 同一 component 重复主归属；
- 漏 required runtime API；
- 重复 Host/ThemeProvider/Gesture root；
- Home eager import 一个 heavy scene；
- deep import、旧包名、hex/rgba、console、RN Pressable；
- RN/peer/toolchain/version/plugin/native identity drift；
- README 漏安装/Pods/Metro/build/scene/theme/a11y 命令。

contract 还要验证 route registry、catalog scene、README scene exact set 相等。

- [ ] **Step 2: 更新文档**

根 README：

- 删除“旧 0.85 shell 不可作为证据”；
- 写 RN 0.86.2 showcase 入口、8 scenes、真实命令与仍需人工验收的边界。

example README 按规格第 12 节顺序，明确：

- 所有命令 cwd；
- Bundler/Pods；
- Android/iOS simulator/真机；
- theme mode/fontScale/reduced motion；
- remote image failure；
- VoiceOver/TalkBack/旋转/Carousel/Blur/Confirm/Toast matrix；
- example 只消费 public package root，不能复制内部路径；
- 自动化结果不能冒充真机/a11y PASS。

AGENTS/CONTRIBUTING 更新 workspace 名、真实 scripts、版本事实与 gate。

- [ ] **Step 3: 增加 repo-specific example workflow**

共享 `.github/workflows/ci.yml` 必须继续与组织 template 逐字一致，不在本仓直接修改。
新增 `example-showcase.yml`，不使用 workflow-level `on.paths`，显式运行：

```sh
yarn check:config
yarn check:runtime-peers
yarn check:icons
yarn verify:example-showcase
yarn example typecheck
yarn example test --maxWorkers=2
```

共享 CI 继续负责根 lint/typecheck/test/prepare、Website llms/type/build 与双端 native；
新 workflow 负责 example JS/config gate。增加 executable contract 逐字比较共享 CI/template，
防本任务制造单仓 drift。

- [ ] **Step 4: 修复 Turbo**

使用 package-qualified tasks：

```text
@unif/react-native-design-example#build:android
@unif/react-native-design-example#build:ios
@unif/react-native-design-example#test
```

inputs 使用 `$TURBO_ROOT$` 覆盖规格第 11 节，dry-run 必须只有真实 example tasks，
不出现 website `<NONEXISTENT>` native task，且 nested `example/src/**` 全部入图。

- [ ] **Step 5: 完整 JS/Website gate**

Run:

```sh
yarn install --immutable
yarn check:config
yarn check:runtime-peers
yarn check:icons
yarn verify:example-showcase
yarn example typecheck
yarn example lint
yarn example test --maxWorkers=2
yarn typecheck
yarn lint
yarn test --maxWorkers=2
yarn prepare
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
yarn turbo run test --dry=json
yarn turbo run build:android --filter=@unif/react-native-design-example --dry=json
yarn turbo run build:ios --filter=@unif/react-native-design-example --dry=json
```

Expected: 全部 exit 0；install 只有三条批准 workspace warning。

- [ ] **Step 6: Native gate**

Run:

```sh
yarn example build:android
cd example && bundle exec pod install --project-directory=ios
yarn example build:ios
```

本机缺 JDK/SDK/Xcode/prebuilt/network 时保存原始失败证据；不得删除/弱化 CI gate，
不得用 Website 或 simulator 冒充真机/a11y矩阵。

- [ ] **Step 7: 最终规格核对与提交**

逐条对照规格 13 节；确认：

- public component exact coverage；
- 8 scene state/major variants；
- theme/fontScale/back/host/lazy mount/a11y；
- RN0.86.2/native/locks；
- public API/peer/Website component docs 无意外 diff；
- worktree 无 generated coverage/Pods/build。

Run:

```sh
git diff --check
git status --short
git diff --stat
```

```sh
git commit -m "docs: document design component showcase"
```
