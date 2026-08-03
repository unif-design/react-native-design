# Task 1 实施报告：Design example runtime / RN 0.86.2 shell

## 结果

已完成 `@unif/react-native-design-example` workspace、RN 0.86.2 New
Architecture 双端 shell、精确三条 runtime peer 例外门禁，以及可真实挂载
`GestureHandlerRootView > SafeAreaProvider > ThemeProvider > Text` 的最小 App。

本任务没有修改公共 API、Website 内容或 `.github/workflows/ci.yml`。

## 实现摘要

- example runtime graph 精确锁定：
  - React `19.2.3`
  - React Native `0.86.2`
  - Blur `4.6.2`
  - RNGH `3.1.0`
  - Reanimated `4.5.3`
  - Reanimated Carousel `5.0.0`
  - Safe Area `5.8.0`
  - SVG `15.15.5`
  - Worklets `0.11.3`
- CLI 固定为 `20.1.0`，RN Babel/Jest/Metro/TypeScript presets 固定为
  `0.86.2`；Jest 使用 29 系、RNTL 使用 `^13.3.3`，删除 example 对 Bob
  的多余 devDependency。
- Babel 保持 Bob workspace source config，Worklets plugin 位于最后；
  Metro 继续直接消费仓库根源码，不读取 `lib` 或 registry copy。
- Android/iOS identity 原子改为：
  - app/module：`ReactNativeDesignExample`
  - workspace：`@unif/react-native-design-example`
  - native id：`unif.reactnativedesign.example`
- Android 保留 minSdk 24、compile/target 36、Hermes、New Architecture 与
  autolinking，仅声明 INTERNET 权限。
- iOS 保留 autolinking/New Architecture，移除空 location usage key，不增加
  camera/photo/location 权限；iPhone 支持 portrait、landscape left/right。
- 提交 `Gemfile.lock` 与 `Podfile.lock`；CocoaPods 成功识别并 codegen/autolink
  Blur、RNGH、Reanimated、Safe Area、SVG、Worklets 六个 native module。
- runtime peer checker 只批准 root/example/website 三个 workspace 上
  RNRC 5 对 RNGH 3 的已验证 metadata 例外；新增第四 provider、版本/range/
  requester 漂移均会失败。
- 新增独立 verifier 及真实 mutation 测试。Jest 测试宿主显式统一 monorepo
  root/example 的 React 与 RNGH 实例，并使用 Reanimated、Worklets、Safe Area
  官方 mock，避免重复 React renderer 与 native TurboModule 假失败。

## TDD 证据

1. 初始 dependency/native contract：8 tests 中 7 个失败，准确指出旧 workspace、
   RN 0.85.3、缺 runtime graph/scripts/plugin、旧双端 identity 与缺 locks。
2. runtime peer 单测先出现 4 个失败，均为 example provider 尚未获准；实现后
   20/20 通过。
3. verifier mutation 测试最初发现子进程继承 `NODE_TEST_CONTEXT` 后被
   `node:test` 递归保护跳过；仅在测试子进程边界清除此变量后，manifest 与
   Android namespace 两个真实 mutation 均被拒绝。
4. example TypeScript/Jest 依次暴露 workspace source types、Reanimated ESM、
   两份 RNGH、Safe Area native host、两份 React renderer 问题；逐项加入最小
   wiring/mock 后，真实 App 挂载测试通过。
5. 最终 contract 10/10 通过，其中包括两个负向 mutation 测试。

## 最终门禁

| 命令 | 退出码 | 结果 |
| --- | ---: | --- |
| `yarn install --immutable` | 0 | lock 不变；仅输出已知/既存 peer warnings |
| `yarn explain peer-requirements` | 0 | 完成完整 peer 图解释 |
| `node --test scripts/__tests__/example-showcase-contract.test.mjs` | 0 | 10/10 |
| `yarn verify:example-showcase` | 0 | 10/10 |
| `yarn check:runtime-peers` | 0 | 恰好三条 `KNOWN_EXCEPTION` |
| `yarn test __tests__/scripts/check-runtime-peers.test.ts --runInBand` | 0 | 20/20 |
| `yarn example typecheck` | 0 | 通过 |
| `yarn example test --maxWorkers=2` | 0 | 1 suite / 1 test |
| `yarn example lint` | 0 | 通过 |
| `yarn typecheck` | 0 | 通过 |
| `yarn lint` | 0 | 通过 |
| `git diff --check` | 0 | 通过 |

`yarn install --immutable` 仍会显示 root ESLint 9 与 RN 0.86 ESLint config 所需
ESLint 8 的三个 peer hash，以及依赖树中既存的非 runtime peer 提示；它们不属于
本任务批准的 runtime 例外。`yarn check:runtime-peers` 的输出严格只有
root/example/website 三条 RNRC 5 / RNGH 3 例外。

## 依赖与原生工具链证据边界

- 首次普通 `yarn install`：退出 1，`registry.yarnpkg.com` DNS
  `ENOTFOUND`。沙箱外网络申请因当前使用额度被自动拒绝。
- 随后使用仓库已有、由 RN 0.86.2 official template 产生的 lock 数据和本机
  Yarn cache 完成离线解析；临时 seed 脚本已删除。最终
  `yarn install --immutable` 退出 0，证明提交的 `yarn.lock` 可复现。
- 默认 `bundle install`：退出 17，无法访问 `index.rubygems.org`；
  `bundle install --local`：退出 7，本项目路径没有完整本地 gem source。
- 初次 Pod 安装确认六个 native module 与 New Architecture 后，先后被
  CocoaPods 用户 cache 权限和 DoubleConversion/Hermes 网络下载阻断。
- 复用仓库 camera showcase 已锁定的 CocoaPods 1.15.2 vendor bundle，以及
  umeng showcase 已下载的 RN Core、RN Dependencies、Hermes 0.86.2 本地官方
  artifacts 后，`pod install --no-repo-update` 退出 0：
  `82 dependencies / 81 total pods installed`。生成的未跟踪
  `.xcworkspace` 未纳入提交，`Podfile.lock` 已保留。
- `yarn example build:android`：退出 1；Gradle 启动前即报告
  `Unable to locate a Java Runtime`，环境未安装 JDK。
- `yarn example build:ios`：退出 1，底层 `xcodebuild` 退出 66。进一步
  `xcodebuild -list` 显示沙箱无法连接 `CoreSimulatorService`，且禁止写
  `~/Library/Logs/CoreSimulator`。申请沙箱外复跑因当前使用额度被自动拒绝，
  未绕过授权继续执行。

## 自检与剩余关注点

- contracts 覆盖 exact manifests、Babel/Metro/Jest、native identity、
  permissions/orientations、locks、runtime mutation；双端配置与锁内版本一致。
- 原生工程已成功完成 Pod integration/codegen，但受宿主环境限制，Android/iOS
  二进制 build 未取得 GREEN；需要在有 JDK 且可访问 CoreSimulatorService 的
  开发机或 CI 上补跑两条 build 命令。
- CocoaPods 生成目录、iOS workspace、临时 lock seed 均未进入提交。
