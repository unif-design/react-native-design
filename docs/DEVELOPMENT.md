# react-native-design 开发资料

本仓库维护 `@unif/react-native-design`，职责为基础设计库。

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

## 临时验证宿主

仅在已授权的打包消费或真机验证中使用；日常文档与组件修改不执行此构建流程。

```sh
yarn create:runtime-harness
```

该命令**现场生成**一个一次性的 RN `0.86.3` app,用于人工验证 Jest 覆盖不到的部分:真实 native / Web 结构、44pt 命中框、a11y tree、reduced motion 与命令式 API 的竞态。

它做的事:

1. `yarn prepare` + `yarn pack` 打包**当前源码**,harness 装的是 `file:` tarball,不是 registry 上的版本;
2. 用 `yarn.lock` 里钉死的官方 `@react-native-community/cli@20.1.0` + `@react-native-community/template@0.86.3` 生成脚手架 —— 两者的版本、template 自带的 React / RN / CLI 版本、以及锁文件里的 `checksum` 都会先校验,任一不符立即失败;
3. 枚举根 `peerDependencies` 的**每一个**非 optional 项,从根 direct range 精确匹配 `yarn.lock` locator,并交叉验证 installed version 与 peer range;`@babel/core` / `@react-native/metro-config` 也走同一链路,在首次安装前写成精确版本;
4. 配好 Babel(`react-native-worklets/plugin` 排最后)、Metro、RNGH root import,拷入 `manual-tests/runtime-api/RuntimeApiScreen.tsx`,并逐文件核对生成的 Podfile / Android Gradle 文件与 installed template 捕获的摘要;
5. 首次 `yarn install` 只在脚本自持的临时 app 内生成 `yarn.lock`,随后立即以同一 manifest / lock 执行 `yarn install --immutable` 最终复验,再执行 `bundle install` + `bundle exec pod install`;完整流程成功后才保留并打印绝对路径与全部 provider 版本。

边界:

- app 只建在**脚本自持的系统临时目录**里(`fs.mkdtempSync`),**不接受调用方传目录**;脚手架之后的任一步失败也会递归删除自己那一个临时路径,只有完整成功才保留。
- **完全不读、不写、不复制持久 `example/`** —— 两者职责不同：`example/` 提供公共面
  coverage 与可运行 RN `0.86.3` native shell；临时 runtime harness 专门验证 packed
  tarball、负向路径与竞态，不替代展厅。
- 生成物不入库。

随后在**打印出来的那个目录**里执行(不是在本仓):

```sh
yarn android
yarn ios
```

harness 不继承本仓 `check:runtime-peers` 的 workspace 精确 allowlist；安装输出会如实暴露这条已知的 RNRC / RNGH peer warning，等同消费端实际可见结果。

## LLM 文档生成

`website/docs` 是使用文档源；运行 `node website/scripts/build-llms.js` 可单独生成。共同实现由组织 `templates/llms` 分发，维护源后使用 `sync-llms.cjs` 同步，不手改生成副本。

索引按任务列出单页，全文位于 Optional；包版本取当前 package.json。`node website/scripts/build-llms.test.js` 验证公共生成契约与本库资料，文档站构建沿既有 CI 运行。
