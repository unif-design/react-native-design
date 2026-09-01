# Design 组件展厅

这是 `@unif/react-native-design-example` 的持久 RN `0.86.2` 新架构宿主。它从
`@unif/react-native-design` public package root 消费当前工作区源码，用 8 个按路由挂载的
scene 展示全部公开组件及主要状态。

## 1. 安装

Node 版本以仓库根 `.nvmrc` 为准，只使用 Yarn 4。从 repo root 执行：

```sh
yarn install --immutable
```

不要在根目录或 `example/` 使用 npm、`--force`、`--legacy-peer-deps`。安装日志中的
Carousel 5 / RNGH 3 workspace warning 由 `yarn check:runtime-peers` 的窄 allowlist 审核；
普通 `yarn install` 的其他既存 peer warning 不能被描述成同一条 contract。

## 2. 安装 iOS Pods

首次运行 iOS 或 native 依赖、Podfile、lockfile 变化后，从 repo root 执行：

```sh
(cd example && bundle install)
(cd example && bundle exec pod install --project-directory=ios)
```

必须通过 Bundler 使用 `example/Gemfile.lock`；不要直接运行系统 `pod install`。

## 3. 启动 Metro

在一个终端中，从 repo root 执行：

```sh
yarn example start
```

Metro 通过 `react-native-monorepo-config` 监听仓库根目录，并把
`@unif/react-native-design` 解析到本地 public source。

## 4. Simulator 与真机

保持 Metro 运行，再从 repo root 的新终端启动目标平台：

```sh
# Android emulator 或已连接 Android 真机
yarn example android

# iOS Simulator
yarn example ios
```

iOS 真机请用 Xcode 打开
`example/ios/ReactNativeDesignExample.xcworkspace`，选择已配置签名的设备运行。只构建、不启动
app 时，从 repo root 执行：

```sh
yarn example build:android
yarn example build:ios
```

原生命令成功只能证明对应 binary 构建完成；Simulator 结果不能冒充真机手势、系统设置或
a11y 验收。

## 5. 八个场景

Home 显示每个 scene 的主归属组件数量、主要状态与最近一次安全交互摘要。返回 Home 时当前
scene 会卸载，可复现 draft 保存在根 Provider 中。

| Scene ID      | 标题           | 主覆盖                                                                            |
| ------------- | -------------- | --------------------------------------------------------------------------------- |
| `foundation`  | 基础能力与图标 | Theme、token、Icon 全集、logger、testID                                           |
| `actions`     | 操作与状态     | Button、IconButton、Chip、Tag、StatusDot                                          |
| `feedback`    | 反馈与浮层     | Empty、Skeleton、Spinner、Pulse、Reveal、Blur、Toast、Confirm                     |
| `forms`       | 表单与输入     | Input、PasswordInput、Textarea、Search、选择控件、Stepper（xs 横向触控 < 44pt / formatValue）、Form |
| `navigation`  | 导航组件       | NavBar、DrawerHeader、Tabs、Segmented、TabBar                                     |
| `collections` | 容器与集合     | Card、Ribbon、Cell、List、Grid、EntryCard、Carousel                               |
| `media`       | 媒体展示       | Avatar、Thumbnail、Logo、remote image success/failure                             |
| `business`    | 业务复合组件   | GradientWash、RadialHalo、ScreenBackdrop、GlassStats、AvatarWithRing、VersionPill |

Collections 中 Carousel 默认不挂载；开启后可切换 empty/one/multiple、display/action、
indicator、autoplay、loop 和 ref 控制。Media 默认使用项目控制的 success fixture
`https://unif-design.github.io/react-native-design/img/logo.png`，并用固定的 invalid-image
fixture
`https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png`
分别展示成功与 native decode 失败路径；结果日志不会保存原始 URI。Jest 只验证 source wiring 与 native
load/error event 后的组件状态，不代表真实网络、缓存或 native decode 已通过。

## 6. 主题、字号与减少动态效果

在「基础能力与图标」scene 中操作：

- 主题模式：`system`、`light`、`dark`；`system` 读取设备当前 scheme。
- fontScale：`1 / 1.25 / 1.5 / 2`，通过公开 `normalizeFontScale()` 进入根
  `ThemeProvider`。
- reduced motion：只展示 `usePrefersReducedMotion()` 读取到的系统事实，没有本地伪造
  override。请在系统设置中切换后重新验证 Pulse、Reveal 与 Carousel autoplay。

## 7. 自动化

以下命令全部从 repo root 执行：

```sh
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
```

自动化覆盖 public catalog、route、Host 唯一性、主要交互与配置 contract，但不能替代屏幕
阅读器、系统主题、真机、旋转、原生 Blur 或真实网络验收。

## 8. 人工验收矩阵

下面不预填 PASS。完成某一环境的真实操作并保留证据后，才可在对应交付记录中更新状态。

| 项目                         | 核对内容                                                                                        | 状态       |
| ---------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| Android emulator             | 启动、8 scenes、portrait/landscape、Android hardware back                                       | 待人工执行 |
| Android 真机                 | 手势、性能、system theme、remote image success/failure                                          | 待人工执行 |
| iOS Simulator                | 启动、8 scenes、portrait/landscape                                                              | 待人工执行 |
| iOS 真机                     | 签名、手势、system theme、remote image success/failure                                          | 待人工执行 |
| system/light/dark            | 系统、强制浅色、强制深色下 token 与可读性                                                       | 待人工执行 |
| fontScale                    | 1 / 1.25 / 1.5 / 2 下布局、截断与动态文字                                                       | 待人工执行 |
| reduced motion               | 系统开/关；Pulse、Reveal、Carousel autoplay                                                     | 待人工执行 |
| portrait/landscape           | Android 与 iOS 旋转、滚动和安全区                                                               | 待人工执行 |
| VoiceOver                    | 角色、名称、state、顺序、live region、装饰隐藏                                                  | 待人工执行 |
| TalkBack                     | 角色、名称、state、顺序、live region、装饰隐藏                                                  | 待人工执行 |
| remote image success/failure | 使用上述 success/invalid-image fixture 核对真实 HTTP、缓存、native decode、fallback 与 URI 隐私 | 待人工执行 |
| Toast/Confirm                | 位置、类型、确认/取消、连续触发后的 settled 结果                                                | 待人工执行 |
| Carousel action/autoplay     | display/action、ref、loop、指示器与 reduced motion 停播                                         | 待人工执行 |
| Android hardware back        | scene 回 Home；Home 将事件交还系统                                                              | 待人工执行 |
| Blur soft/strong/fallback    | 真机 soft/strong 与不支持原生 Blur 时的边界表现                                                 | 待人工执行 |

## 9. 复制边界

业务 app 可以复制 scene 中的组合思路和 public props，但所有组件、hook、type、token、
imperative API 都必须从 `@unif/react-native-design` package root 导入。不要复制或导入本仓
`src/`、`lib/`、`dist/`、Store、ButtonBase、TextFieldBase、Pulse driver 等内部路径；也不要
把 example 的 reducer、测试 mock 或本地 fixture 当成 library public API。
