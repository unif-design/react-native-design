# 参与贡献

欢迎提交任何规模的改进。交流与代码评审请遵守项目的
[Code of Conduct](./CODE_OF_CONDUCT.md)。组织级 CI、发版、人工依赖升级、PR review 和
branch protection 说明见
[AUTOMATION.md](https://github.com/unif-design/.github/blob/main/AUTOMATION.md)。

## 开发环境

本仓使用 Yarn 4 workspaces：

- 根 workspace：`@unif/react-native-design`。
- example workspace：`@unif/react-native-design-example`，RN `0.87.1` + React
  `19.2.3`，native app 名为 `ReactNativeDesignExample`。
- Website workspace：`@unif/react-native-design-website`。

Node 版本以 [`.nvmrc`](./.nvmrc) 为准。只使用 Yarn，从 repo root 安装：

```sh
yarn install --immutable
```

不要使用 npm、`--force`、`--legacy-peer-deps` 或全局 peer warning 忽略。example 通过
Metro 直接读取根 `src/`，JavaScript 修改不需要重建 library；native 依赖或原生配置变化后
需要重新安装 Pods/重建 app。

## Example showcase

从 repo root 启动 Metro 和 app：

```sh
yarn example start
yarn example android
yarn example ios
```

iOS 首次运行或 native 依赖变化后，从 repo root 执行：

```sh
(cd example && bundle install)
(cd example && bundle exec pod install --project-directory=ios)
```

只构建 binary 时：

```sh
yarn example build:android
yarn example build:ios
```

完整使用说明与未执行的真机/a11y矩阵见
[`example/README.md`](example/README.md)。Simulator 或自动化结果不能写成 VoiceOver、
TalkBack、真机手势、系统主题/reduced motion 或旋转 PASS。

## 提交前门禁

先运行与改动直接相关的最小测试，再从 repo root 运行受影响的完整 gate：

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
```

涉及 Website 时再运行：

```sh
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
```

涉及 public API、类型、组件行为、peer 或 native contract 时，同步 source/barrel、tests、
example、README、Website/llms 和对应 Skill。`src/icons/data.ts` 是生成物，不得手改。

## 常用 scripts

- `yarn install --immutable`：按 lockfile 安装 workspace 依赖。
- `yarn typecheck`：根 TypeScript contract。
- `yarn lint`：根 ESLint。
- `yarn lint --fix`：修复可自动处理的 lint/format 问题。
- `yarn test --maxWorkers=2`：根 Jest。
- `yarn prepare`：生成 `lib/module` 与 `lib/typescript`。
- `yarn verify:example-showcase`：运行 example exhaustive + mutation contract。
- `yarn example typecheck`：example TypeScript。
- `yarn example lint`：example ESLint。
- `yarn example test --maxWorkers=2`：example Jest/RNTL。
- `yarn example start|android|ios`：Metro 与双端 app。
- `yarn example build:android|build:ios`：双端 binary build。

## Commit 与 Pull Request

Commit 使用 Conventional Commits，例如 `fix:`、`feat:`、`refactor:`、`docs:`、`test:`、
`chore:`。提交前检查 `git diff --check`、`git status --short` 与 diff 范围，只暂存当前任务
文件。

Pull Request 应聚焦单一目标，说明验证命令与未执行/环境 BLOCKED 项，并复核文档。涉及 API
或实现方向的大改先开 issue 讨论。`main` 只通过 PR + required CI 合入。

## 发布

版本与 npm 发布由合并后的 release workflow 管理。除明确应急任务外，不手工改版本、创建
tag 或运行 `npm publish`。
