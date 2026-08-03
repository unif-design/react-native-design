# Design Example Showcase 设计规格

## 1. 背景

`example/` 目前仍是 React Native 0.85.3 的模板壳：

- workspace 名仍为 `react-native-designdd-example`，根 `yarn example` 指向另一个不存在的名称；
- `example/src/App.tsx` 导入不存在的 `react-native-designdd` 并调用旧模板 `multiply()`；
- example 没有自己的 typecheck/test，根 TypeScript/Jest 又明确排除 `example/`；
- RN、Babel、Metro、Jest、CLI 与根仓库的 RN 0.86.2 基线不一致；
- 没有任何 Design 组件展厅、主题诊断、主要状态或可复制文档。

用户已确认本轮不是做单一演示页，而是以 Design 为基础，覆盖**所有公开组件及主要状态**。
前置 runtime API 整改已在 `feat/runtime-api-remediation` 完成，本分支先 fast-forward
纳入该成果，再独立升级 example。

## 2. 目标

1. 把 example 升级为 RN `0.86.2`、React `19.2.3`、Design `0.20.0` 的真实新架构宿主。
2. 通过 8 个按需挂载的 scene 覆盖每个公开 UI/business 组件，并演示主要 variant、
   disabled/loading/selected/error/empty/fallback 等状态。
3. 同时演示公开 Theme、Icon、logger、testID、imperative host API，但不把内部 API
   或 deep import 当成公共能力。
4. 根装配、主题/字号、typed navigation、Android hardware back、scene draft、日志、
   Toast/Confirm host 均有可执行行为测试。
5. 建立从公共 barrel 到 scene catalog 的穷尽 contract：新增或删除公开组件时，
   example gate 必须失败，不能静默漏演示。
6. README、AGENTS、CONTRIBUTING、CI、Turbo 与双端 native build 入口均与真实命令一致。

## 3. 非目标

- 不修改 Design 组件的公共 API、行为、peer range、token 或 native runtime。
- 不把 `manual-tests/runtime-api` 的竞态/负向 harness 原样复制成展厅。
- 不新增业务 navigation/store 依赖；example 使用本地 typed reducer。
- 不手工改 token 或用局部 style 伪造主题。展厅只使用 `ThemeProvider.forceScheme`
  的公开入口实现 system/light/dark，并用 paired token swatch 解释亮暗角色。
- 不用自动化替代 VoiceOver、TalkBack、系统深浅色、reduced motion、旋转和真机手势验收。
- 不修改 Website 的逐组件正文或重新设计 library 组件。

## 4. 全局约束

### 4.1 版本与发布 contract

- example runtime 精确使用：
  - `react@19.2.3`
  - `react-native@0.86.2`
  - `@unif/react-native-design@workspace:*`
  - `react-native-gesture-handler@3.1.0`
  - `react-native-reanimated@4.5.3`
  - `react-native-worklets@0.11.3`
  - `react-native-reanimated-carousel@5.0.0`
  - `react-native-safe-area-context@5.8.0`
  - `react-native-svg@15.15.5`
  - `@sbaiahmed1/react-native-blur@4.6.2`
- RN toolchain 与 template 对齐为 `0.86.2`；CLI 精确 `20.1.0`。
- 根 `peerDependencies` 保持当前值，不因 example 升级而扩大或收紧。
- `check:runtime-peers` 只允许 root、example、website 三个
  Carousel 5 / RNGH 3 workspace warning；其他项目可控 warning 必须修复。
- 不用 `resolutions`、`packageExtensions` 或全局 warning filter 掩盖依赖问题。

### 4.2 导入与样式

- Design 的组件、hook、type、token、imperative API 只能从
  `@unif/react-native-design` 包根导入。
- 禁止 `src/`、`lib/`、`dist/` deep import；禁止导入 Confirm/Toast store、
  ButtonBase、TextFieldBase、Pulse driver、Carousel behavior 等内部符号。
- 所有业务颜色使用 `useColors()` / `useThemedStyles()` 的角色 token；
  `makeStyles` 必须定义在模块顶层。
- example 源码禁止 `console.*`、内联 hex/rgba、RN 自带 `Pressable`；
  有现成 Design 组件时不得手搓等价交互控件。
- 自定义可点区域若确有必要，只能使用 RNGH `Pressable`，并补全 role/label/state/hint。

### 4.3 根装配与 host

固定根结构：

```text
GestureHandlerRootView
└─ SafeAreaProvider
      └─ ThemeProvider(forceScheme, fontScale)
      ├─ ShowcaseApp
      ├─ ConfirmHost（唯一）
      └─ ToastHost（唯一）
```

- `react-native-gesture-handler` side-effect import 位于 entry 最前。
- Host 全局唯一且常驻；scene 不得自行挂 Host。
- theme mode 只有 `system`、`light`、`dark`：system 传 `forceScheme={undefined}`，
  其余传公开的 `light` / `dark`。字号档位只有 `1`、`1.25`、`1.5`、`2`，由
  `normalizeFontScale()` 归一化后传入。
- `usePrefersReducedMotion()` 只展示系统事实；不提供假的本地 override。

## 5. 公开面覆盖

### 5.1 UI runtime

以下 40 个公开 UI component/host 必须各有唯一的主 scene：

```text
Avatar, BlurLayer, Button, Card, Carousel, Cell, List, Checkbox, Chip,
ConfirmHost, DrawerHeader, Empty, EntryCard, Form, FormGroup, FormRow, Grid,
Icon, IconButton, Input, Logo, NavBar, PasswordInput, Pulse, PulseDot, Radio,
Reveal, Search, Segmented, Skeleton, Spinner, StatusDot, Stepper, Switch,
TabBar, Tabs, Tag, Textarea, Thumbnail, ToastHost
```

以下公开操作/hook 必须在对应 scene 真实调用：

```text
confirm, toast, usePulse
```

### 5.2 business runtime

```text
GradientWash, RadialHalo, ScreenBackdrop, GlassStats, AvatarWithRing,
VersionPill, useSvgId
```

### 5.3 Theme、Icon 与 utils

Foundation scene 必须真实消费：

- `ThemeProvider`, `useTheme`, `useColors`, `useShadow`, `useFontScale`,
  `useThemedStyles`, `usePrefersReducedMotion`;
- `normalizeFontScale`, `scaleFontMetric`, `r`, `rf`;
- light/dark colors、shadow、palette、typography/spacing/radius/control/fixed/motion/blur tokens；
- `ICONS`, `ICON_NAMES`, `Icon`;
- `childTestID`;
- `createLogger`, `getLogLevel`, `setLogLevel`, `addTransport`,
  `removeTransport`, `consoleTransport`。

自定义 logger transport 只收集安全、预选文案到进程内 bounded log；不得记录输入值、
图片 URI 或环境路径。若修改全局 log level，Provider unmount 时恢复原值并移除 transport。
`consoleTransport` 只展示其公开身份，不挂入运行链路。

## 6. 信息架构

### 6.1 Home

- 品牌头、当前 system scheme、fontScale、reduced-motion 状态。
- 8 个 scene 入口，每个显示覆盖数量、主要状态与最后交互摘要。
- 不在 Home 预渲染 scene 组件；Carousel、Blur、Icon catalog 只在目标 scene 挂载。

### 6.2 Foundation & Icons

主归属：

```text
Icon + Theme/Icon/logger/testID 的全部公开 runtime
```

内容：

- 当前 theme context、fontScale 与 reduced-motion；
- `1 / 1.25 / 1.5 / 2` 字号控制；
- light/dark role token 对照、shadow/palette/scale/blur 指标；
- 可搜索、分批渲染的完整 `ICON_NAMES` catalog；
- logger level、custom transport 与 bounded event log。

Icon catalog 不一次挂载完整集合：搜索后按页/批次显示，提供“加载更多”，切页时保留查询。

### 6.3 Actions & Status

主归属：

```text
Button, IconButton, Chip, Tag, StatusDot
```

必须覆盖：

- Button 全 variant/size、block、左右 icon、disabled、loading；
- IconButton size/variant、disabled/loading、可访问名称；
- Chip static/clickable、selected、disabled、busy；
- Tag variant/size；
- StatusDot pending/active/done/error × flat/soft。

### 6.4 Feedback & Motion

主归属：

```text
Empty, Skeleton, Spinner, Pulse, PulseDot, Reveal, BlurLayer,
confirm, ConfirmHost, toast, ToastHost, usePulse
```

必须覆盖：

- Empty；Skeleton line/rect/circle；Spinner size；
- Pulse/PulseDot/usePulse、Reveal show/hide 与 reduced-motion 事实；
- BlurLayer soft/strong 及无原生 blur 时的边界文案；
- Toast info/success/error 与 top/center/bottom；
- Confirm normal/destructive、confirm/cancel；
- 连续触发时页面日志展示最终 settled 事实，不自行镜像内部 Store。

### 6.5 Form Controls

主归属：

```text
Input, PasswordInput, Textarea, Search, Checkbox, Radio, Switch, Stepper,
Form, FormGroup, FormRow
```

必须覆盖：

- controlled 与 uncontrolled 文本入口分开实例；
- idle/focus/filled/error/disabled/editable；
- leading/trailing display/action slot 与 44pt action；
- Password 显隐；Search clear/submit；
- checkbox/radio/switch 受控 checked、disabled；
- Stepper min/max/step/zero-range/disabled；
- FormRow required/error live region；
- 切换 scene 后 draft 保留。

### 6.6 Navigation & Selection

主归属：

```text
NavBar, DrawerHeader, Tabs, Segmented, TabBar
```

必须覆盖：

- NavBar default/brand/transparent 与具名 action；
- DrawerHeader；
- Tabs selected/item disabled/global disabled；
- Segmented sm/md、selected/disabled；
- TabBar selected、badge；
- Android hardware back：scene → Home；Home 返回 `false` 交给系统。

### 6.7 Collections & Layout

主归属：

```text
Card, Cell, List, Grid, EntryCard, Carousel
```

必须覆盖：

- Card default/plain/bare/fill；
- Cell static/action/control、arrow/danger/disabled；
- List grouped/flush/divider；
- Grid static/clickable、columns/card/badge；
- EntryCard static/clickable；
- Carousel empty/one/multiple、display/action、indicator position、autoplay/loop/ref control；
- reduced-motion 下明确标注 autoplay 被停止。

### 6.8 Media & Identity

主归属：

```text
Avatar, Thumbnail, Logo
```

必须覆盖：

- Avatar sizes/variants、monogram、合法远程/本地 source、invalid/load failure fallback；
- Thumbnail `uri` 与 `source` 两条公开入口、size/selected、具名/装饰 image、失败 fallback；
- Logo 有名/装饰；
- 使用可控 HTTPS fixture 与本地静态 fixture；网络失败必须有正常空态。

### 6.9 Business Composites

主归属：

```text
GradientWash, RadialHalo, ScreenBackdrop, GlassStats, AvatarWithRing,
VersionPill, useSvgId
```

必须覆盖：

- 同屏多实例 `useSvgId` 不冲突；
- simple/custom gradient、halo、warmOrange/custom backdrop；
- GlassStats 2–4 列；
- AvatarWithRing sizes；
- VersionPill 各 status。

## 7. 本地状态与导航

### 7.1 typed navigation

```ts
type RouteId = 'home' | SceneId;
type NavigationState = readonly ['home'] | readonly ['home', SceneId];
```

- `navigate(scene)` 永远归一化为 `['home', scene]`，重复点击不积栈。
- NavBar back 与 Android `hardwareBackPress` 共用同一 reducer。
- Home hardware back 返回 `false`；scene 返回 `true` 并回 Home。
- BackHandler 使用稳定订阅 + current route ref，unmount 必须 remove。

### 7.2 Showcase state

- 只挂当前 scene；各 scene draft 存在根 Provider 中，返回后保留。
- 状态只在当前进程内，不引入 AsyncStorage。
- interaction log 上限 50，新事件在前；只保存组件名、动作名、安全结果。
- 重组件状态（Carousel ref、动画 driver、Image attempt）留在 active screen，本地卸载即释放；
  可复现 draft（selected/inputs/toggles）才提升到 Provider。

## 8. a11y 与主题

- Button/IconButton 使用组件默认 role；IconButton 始终显式 `accessibilityLabel`。
- Switch/Checkbox/Radio 使用 `checked`；Tabs/TabBar/Segmented 使用 `selected`。
- 自定义状态反馈使用 `accessibilityRole="alert"` / live region，但避免重复播报。
- 装饰 Icon/Image/Gradient 隐藏 a11y；具名媒体提供 label。
- disabled/loading 必须同时在视觉、handler 与 accessibility state 生效。
- 所有文本为简体中文。
- system/forced light/forced dark、fontScale 四档、reduced motion 进入 README 手工矩阵。

## 9. 自动化 contract

新增 `scripts/verify-example-showcase.mjs` 与测试，至少验证：

1. example workspace 名、RN/React/Design/peer/toolchain 精确版本；
2. Worklets Babel plugin 最后、Metro 本地 source 映射、新架构/minSdk/autolinking；
3. iOS/Android app 名一致；无 camera/location/photo 等额外权限；
4. iOS Pod/Gem lock 被追踪；方向 contract 一致；
5. `componentCatalog` 与 `src/components/ui/index.ts`、business barrel 的公开 component
   exact set 相等；每个 component 唯一主 scene；
6. Theme/hooks/imperative/utils 的 required coverage set 无遗漏；
7. `ConfirmHost` / `ToastHost` / `ThemeProvider` / `GestureHandlerRootView` 各唯一；
8. example 只从包根导入，无 deep import、硬编码色、RN Pressable、`console.*`；
9. Home 不 import/render 具体 scene heavy component；
10. README 的安装、Metro、双端、8 scenes、系统主题/a11y/设备矩阵命令可复制。

contract tests 必须用临时 mutation 证明缺组件、重复 Host、错版本、错误 plugin 顺序、
deep import、硬编码颜色与缺 README 命令会失败。

## 10. Native 宿主

- 使用 lock-pinned RN 0.86.2 official template 对照升级，不延续 0.85 私有差异。
- app/workspace/native 标识统一为 `ReactNativeDesignExample` /
  `@unif/react-native-design-example`，Android applicationId/namespace 与 Kotlin package
  原子同步。
- Android：
  - minSdk 24、compile/target 36；
  - New Architecture/Hermes 开启；
  - 仅保留 Metro 所需 INTERNET，不加设备权限；
  - 默认支持 portrait/landscape。
- iOS：
  - New Architecture/autolinking；
  - 无 location/camera/photo 等 usage description；
  - iPhone 支持 portrait + landscape left/right，iPad 保持合法全方向；
  - 提交 `Gemfile.lock`、`Podfile.lock`，Pod install 使用 Bundler；
  - simulator build 是本库合法自动化边界；真机仍做手势/a11y人工验收。

## 11. CI 与 Turbo

- 根脚本修复为真实 `@unif/react-native-design-example` workspace。
- CI 显式运行：
  - `yarn check:config`
  - `yarn check:runtime-peers`
  - `yarn check:icons`
  - `yarn verify:example-showcase`
  - `yarn example typecheck`
  - `yarn example test --maxWorkers=2`
  - 根 lint/typecheck/test/prepare
- Turbo 只生成 Design example 的 native tasks，使用 `$TURBO_ROOT$` inputs：
  root package/lock/config/src、example package/config/src、目标平台 native 文件；
  Android/iOS 对侧 generated 目录不参与。
- CI path filters 覆盖 example source、Jest/Babel/Metro、contract scripts、lock/native 文件，
  不因纯 Website 文档变更运行 native build。

## 12. 文档

- 根 README 把“旧 0.85 shell”更新为 RN 0.86.2 showcase。
- `example/README.md` 顺序：

```text
安装 → Pods → Metro → simulator/真机 → 8 scenes → 主题模式/fontScale/reduced motion
→ 自动化命令 → 手工 a11y/旋转/网络失败矩阵 → 复制边界
```

- AGENTS 更新 workspace 名、版本、真实命令、example 作为 RN 0.86.2 验证宿主的边界。
- CONTRIBUTING 修复 `yarn example` 命令。
- 文档不声称自动化完成 VoiceOver/TalkBack/真机验收。

## 13. 验收

### 自动化

- immutable install 只保留精确三条批准的 Carousel/RNGH warning；
- example typecheck/Jest、根 typecheck/lint/Jest/prepare 全绿；
- example showcase contract 与 mutation tests 全绿；
- runtime peers/icons/config gates 全绿；
- Turbo dry-run 仅包含两个真实 native task且 inputs 完整；
- Pods deployment、Android/iOS build 在环境允许时通过；环境阻塞保留原始证据，不删 gate。

### 人工

- Android emulator/真机、iOS simulator/真机；
- system/forced light/forced dark；
- fontScale 1/1.25/1.5/2；
- reduced motion on/off；
- portrait/landscape；
- VoiceOver/TalkBack；
- remote image success/failure；
- Toast/Confirm、Carousel action/autoplay、hardware back。

### 安全

- 无 secret、设备数据或持久化用户输入；
- 无新增敏感权限；
- 无 public API/peer 变更；
- worktree clean，所有实现 commit 留在 `feat/example-showcase`。
