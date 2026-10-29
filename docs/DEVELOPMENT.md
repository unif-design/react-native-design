# react-native-design 开发资料

本仓库维护 `@unif/react-native-design`，职责为基础设计库。

## 库能力技能

本库使用 unif-design 定位当前版本的公开能力、接入与排障资料。修改源码时同时采用 code-development 的库开发规则；设计、测试、审查和交付按当前阶段取得依据。应用仅消费库时可直接查公开类型和文档，无需先取得维护工作区。

## 目标契约

[本库新版本设计](../../unif-platform-architecture/libraries/react-native-design.md)定义职责、公共输入输出、状态和验证边界；[库版本原则](../../unif-platform-architecture/libraries/README.md)明确新旧版本独立。规范根默认是并列的 `unif-platform-architecture` 工作区，其他目录布局由任务提供实际位置。

目标契约用于新版本开发；当前可用接口以实际源码和发布版本为准。版本采用原则在上述库设计索引维护。

## 开发起点

按已定义的独立组件和实际共享的组件族维护。已有清晰的接口可以继续采用，新增或调整公共面直接按新契约实现，不建立旧版本兼容层。

当前可定位的源码与验证入口：

- [公共源码入口](../src/index.tsx)
- [组件源码](../src/components/)
- [主题源码](../src/theme/)
- [类型消费](../type-tests/)
- [示例](../example/)

命令与依赖版本以 [package.json](../package.json)、锁文件及实际安装为准，验证接线见 [.github/workflows](../.github/workflows/)。本文件不复制通用开发、测试或交付规则；按 AGENTS.md 的阶段技能取得所需规范。

历史 spec、plan 和审查记录用于溯源，不作为当前使用文档或新需求入口。

玻璃材质的当前接口和平台回退见 [GlassLayer 文档](../website/docs/components/glass-layer.mdx)与[主题契约](../../unif-platform-architecture/libraries/react-native-design/theme.md)。

全量系统材质范围与内容层边界见[54 个公开组件覆盖记录](reviews/2026-10-11-liquid-glass-coverage.md)，原生可复验场景见 [Liquid Glass 手工验证宿主](../manual-tests/liquid-glass/README.md)。

RN `0.88.0` / React `19.3.0` 开发基线、库与 example 四项 100% 覆盖、原生宿主范围和实际构建证据见[升级与覆盖记录](reviews/2026-10-16-rn88-coverage.md)。

本仓开发使用 `.nvmrc` 的 Node `24.13.0`；允许范围为 RN `0.88.0` 的
`^22.13.0 || ^24.3.0 || >= 26.0.0`，在根 `devEngines` 和两个私有 workspace 的
`engines` 中声明。公开包 `engines` 保留 RN `0.86+` 消费者的已有范围，不能据此选择本仓开发工具链。
Yarn 4 不执行 npm 的 `devEngines` 校验，本仓实际开发与 CI 使用 `.nvmrc`。

标准 CI 命令 `yarn test --maxWorkers=2 --coverage` 先运行原 example gate（含 owner attestation），
成功后执行库与 example 的完整四项 100% 覆盖门槛；无 `--coverage` 时只运行 example gate。

## 临时验证宿主

仅在已授权的打包消费或真机验证中使用；日常文档与组件修改不执行此构建流程。

```sh
yarn create:runtime-harness
```

该命令**现场生成**一个一次性的 RN `0.88.0` app,用于人工验证 Jest 覆盖不到的部分:真实 native / Web 结构、44pt 命中框、a11y tree、reduced motion 与命令式 API 的竞态。

它做的事:

1. `yarn prepare` + `yarn pack` 打包**当前源码**,harness 装的是 `file:` tarball,不是 registry 上的版本;
2. 用 `yarn.lock` 里钉死的官方 `@react-native-community/cli@20.2.0` + `@react-native-community/template@0.88.0` 生成脚手架 —— 两者的版本、template 自带的 React / RN / CLI 版本、以及锁文件里的 `checksum` 都会先校验,任一不符立即失败;
3. 枚举根 `peerDependencies` 的**每一个**非 optional 项,从根 direct range 精确匹配 `yarn.lock` locator,并交叉验证 installed version 与 peer range;`@babel/core` / `@react-native/metro-config` 也走同一链路,在首次安装前写成精确版本;
4. 配好 Babel(`react-native-worklets/plugin` 排最后)、Metro、RNGH root import,拷入 `manual-tests/runtime-api/RuntimeApiScreen.tsx`,并逐文件核对生成的 Podfile / Android Gradle 文件与 installed template 捕获的摘要;
5. 首次 `yarn install` 只在脚本自持的临时 app 内生成 `yarn.lock`,随后立即以同一 manifest / lock 执行 `yarn install --immutable` 最终复验,再执行 `bundle install` + `bundle exec pod install`;完整流程成功后才保留并打印绝对路径与全部 provider 版本。

边界:

- app 只建在**脚本自持的系统临时目录**里(`fs.mkdtempSync`),**不接受调用方传目录**;脚手架之后的任一步失败也会递归删除自己那一个临时路径,只有完整成功才保留。
- **完全不读、不写、不复制持久 `example/`** —— 两者职责不同：`example/` 提供公共面
  coverage 与可运行 RN `0.88.0` native shell；临时 runtime harness 专门验证 packed
  tarball、负向路径与竞态，不替代展厅。
- 生成物不入库。

随后在**打印出来的那个目录**里执行(不是在本仓):

```sh
yarn android
yarn ios
```

harness 不继承本仓 `check:runtime-peers` 的 workspace 精确 allowlist；安装输出会如实暴露这条已知的 RNRC / RNGH peer warning，等同消费端实际可见结果。

## SVG Web 版本与平台支持

原生库与 example 继续使用正式 `react-native-svg@15.16.0`；Website 单独固定正式 `15.15.5`，并从 Website 的依赖解析 SVG。15.16.0 的 Android 音效依赖会进入 Webpack 的 Web 模块图（[上游问题 #3086](https://github.com/software-mansion/react-native-svg/issues/3086)）；15.15.5 的 Web 实现不包含这条依赖。该选择只影响文档站，保留原生 15.16.0 的资源解析修复。

不使用 Yarn 依赖补丁或 SVG IgnorePlugin，不关闭导出警告。升级 Website 的 SVG 版本前，验证完整站点构建、SVG 图形／渐变／裁剪、点击与卸载。切换版本后先执行 `yarn workspace @unif/react-native-design-website exec docusaurus clear`，再执行该 workspace 的 `build`，避免复用旧构建缓存。

支持 Web 的组件继续通过真实 React Native Web 实现演示；只有没有 Web 实现的原生 SDK 能力提示到 iOS／Android 示例体验。构建或类型错误不能直接作为“不支持 Web”的判断依据。RN 整库类型改造已停止，本仓未应用 RN 源码或类型补丁。

## LLM 文档生成

`website/docs` 是使用文档源；运行 `node website/scripts/build-llms.js` 可单独生成。共同实现由组织 `templates/llms` 分发，维护源后使用 `sync-llms.cjs` 同步，不手改生成副本。

索引按任务列出单页，全文位于 Optional；包版本取当前 package.json。`node website/scripts/build-llms.test.js` 验证公共生成契约与本库资料，文档站构建沿既有 CI 运行。
