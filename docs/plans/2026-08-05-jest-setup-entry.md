# 发布受支持的 Jest 接线入口实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按已获批 spec(`docs/specs/2026-08-05-jest-setup-entry-design.md`)让 `@unif/react-native-design` 发布 `./jest-setup` 与 `./jest-preset` 两个子路径入口,`example/` 改吃入口,文档与 Skill 回改;随后 4 个消费仓各自迁移。

**Architecture:** 两个手写 CJS 文件放仓根(`jest-setup.js` / `jest-preset.js`),经 `package.json#exports` + `#files` 发布,不过 bob、不 import `src/`。`example/` 用 `@unif/react-native-design/jest-preset` 替换自己那份 config + setup,由此删除 3 处历史补丁。新增 `scripts/check-jest-entries.js` 做 gate。

**Tech Stack:** Node CJS、Jest 29/30、`@react-native/jest-preset` 0.86.2、`react-native-worklets/jest/resolver`、Yarn 4 workspaces、`node --test`。

---

## 全局约束(来自 spec §7,每个任务都适用)

- **不改 `src/` 任何文件。** 本次是 mock 侧方案;`src/theme/usePrefersReducedMotion.ts` 保持读 Reanimated 系统信号。
- **不新增 `dependencies`。** 入口 `require` 的全部是既有 `peerDependencies`:`react-native-gesture-handler`、`react-native-reanimated`、`react-native-worklets`、`react-native-safe-area-context`。
- **不改 `.github/workflows/ci.yml`**(组织模板下发)。
- 两个入口文件必须是 **CommonJS**(jest 直接 `require` preset,不经 transform)。
- 消费仓迁移(Task 9–12)是**独立 PR**,必须在 design 发布带入口的版本之后;不在本 PR 内提交。
- 分支:自 `main` 拉 `feat/jest-setup-entry`,首次写入前建好。
- 提交只暂存本任务文件;conventional commit;`main` 只经 PR + required CI 合入。

## 现状基线(执行前先复核,变了就停下报告)

- `yarn example test --maxWorkers=2`:15 suites / 101 tests 全绿,耗时 **58s**。
- `example/jest.config.js` 有 6 条 `moduleNameMapper`,其中 `^react-native-reanimated$` → `mock.js` 是要删的那条。
- `example/jest.setup.ts` 29 行:RNGH `jestSetup` + safe-area mock + RNGH `Pressable`/`GestureHandlerRootView` 壳 + `setUpTests()`。
- `example/src/__tests__/helpers/nativeMocks.ts` 76 行,其中 `installReducedMotionMock` / `restoreNativeMocks` 的 reanimated 部分是补丁。
- `example/src/__tests__/FeedbackScene.test.tsx:79-93` 有一份 `jest.mock('react-native-reanimated', …)`。
- `scripts/__tests__/example-showcase-contract.test.mjs:109-127` 写死了期望的 `moduleNameMapper`,含 reanimated 那条。

---

### Task 1: 入口文件 + 发布面

**Files:**
- Create: `jest-setup.js`
- Create: `jest-preset.js`
- Create: `jest-resolver.js`
- Modify: `package.json`(`exports`、`files`)
- Test: `scripts/__tests__/jest-entries.test.mjs`

**Interfaces:**
- Produces:`@unif/react-native-design/jest-setup`(副作用模块,无导出);`@unif/react-native-design/jest-preset`(导出对象,含 `resolver: string`(指向本包 `jest-resolver.js` 的绝对路径)、`setupFilesAfterEnv: string[]`、`transformIgnorePatterns: string[]`,以及 `@react-native/jest-preset` 的全部字段)。`jest-resolver.js` 不进 exports,仅随包分发。Task 2 的 gate 与 Task 3 的 example 都依赖这两个说明符。

- [ ] **Step 1: 写失败的测试**

创建 `scripts/__tests__/jest-entries.test.mjs`:

```js
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const require = createRequire(import.meta.url);
const manifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
);

test('两个 jest 入口都进了 exports 与 files', () => {
  assert.equal(manifest.exports['./jest-setup'], './jest-setup.js');
  assert.equal(manifest.exports['./jest-preset'], './jest-preset.js');
  assert.ok(manifest.files.includes('jest-setup.js'));
  assert.ok(manifest.files.includes('jest-preset.js'));
});

test('preset 可 require 且形状正确', () => {
  const preset = require(path.join(repositoryRoot, 'jest-preset.js'));
  // resolver 必须是本包的组合文件 —— 直接写 worklets 的 resolver 会把
  // RN preset 自带的 resolver(剥 react-native exports,深路径 mock 依赖它)顶掉。
  assert.ok(preset.resolver.endsWith('jest-resolver.js'));
  assert.ok(
    preset.setupFilesAfterEnv.some((entry) => entry.endsWith('jest-setup.js'))
  );
  assert.equal(preset.transformIgnorePatterns.length, 1);
  // 注意断言的是 pattern 里**字面出现**的片段:gesture-handler / reanimated 等
  // 在正则里位于 `react-native-(gesture-handler|…)` 交替组内,完整包名不会
  // 字面出现,不要断言完整包名。
  for (const fragment of [
    '@unif/react-native-design',
    '@sbaiahmed1/react-native-blur',
    'gesture-handler',
    'reanimated',
    'worklets',
    'safe-area-context',
    'svg',
    'reanimated-carousel',
  ]) {
    assert.ok(
      preset.transformIgnorePatterns[0].includes(fragment),
      `transformIgnorePatterns 少了 ${fragment}`
    );
  }
});

test('resolver 组合了 RN 与 worklets 两个上游', () => {
  const source = readFileSync(
    path.join(repositoryRoot, 'jest-resolver.js'),
    'utf8'
  );
  assert.ok(source.includes('@react-native/jest-preset/jest/resolver'));
  assert.ok(source.includes('react-native-worklets'));
});

test('setup 是 CJS 且只接线 design 自己的 peer', () => {
  const source = readFileSync(
    path.join(repositoryRoot, 'jest-setup.js'),
    'utf8'
  );
  assert.ok(!/^\s*import\s/mu.test(source), 'setup 必须是 CJS');
  assert.ok(!source.includes('../src'), 'setup 不得依赖库运行时代码');
  for (const peer of [
    'react-native-gesture-handler/jestSetup',
    'react-native-worklets',
    'react-native-safe-area-context/jest/mock',
    'react-native-reanimated',
  ]) {
    assert.ok(source.includes(peer), `setup 少了 ${peer}`);
  }
  for (const foreign of [
    'react-native-keyboard-controller',
    'react-native-device-info',
    '@react-native-community/netinfo',
  ]) {
    assert.ok(!source.includes(foreign), `setup 不该碰 ${foreign}`);
  }
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test scripts/__tests__/jest-entries.test.mjs`
Expected: FAIL —— `manifest.exports['./jest-setup']` 是 `undefined`,且 `jest-preset.js` 不存在。

- [ ] **Step 3: 写 `jest-setup.js`**

```js
/* global jest */
// ↑ 根 eslint flat config 不给非测试目录注入 jest 全局,显式声明,否则 yarn lint 报 no-undef。
'use strict';

/**
 * `@unif/react-native-design/jest-setup` —— 把本库 9 个 runtime peer 里在 Jest 中
 * 需要替身的那 4 个接上各自的**官方** mock。放进消费者的 `setupFilesAfterEnv`。
 *
 * 为什么由库提供:这份接线完全由本库的 peer 集决定,peer range 一变它就得变。
 * 让每个消费仓自己推导的结果是 5 个仓 5 种写法、3 个仓各自踩同一个坑
 * (见 docs/specs/2026-08-05-jest-setup-entry-design.md §1)。
 *
 * `transformIgnorePatterns` 是 resolver 层配置,进不了 setup 文件 —— 那部分在
 * `./jest-preset.js`。
 */

// RNGH 官方 jest 桩:让 TurboModuleRegistry.getEnforcing('RNGestureHandlerModule') 不炸。
require('react-native-gesture-handler/jestSetup');

// worklets 的 native 侧在 Jest 里不存在,直接 import 会在 `loadUnpackersWithCode` 处崩。
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock')
);

// safe-area 官方 mock:零 inset + 透传 Provider。不接的话 SafeAreaProvider 子树整棵不渲染。
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// RNGH 3 的包根 Pressable 与 GestureDetector 换成不依赖手势的壳。
// Jest 不触发真实手势,壳不损失可验证行为;保留它们,消费者的用例才不必
// 每一个都包一层 GestureHandlerRootView(否则 RNGH 3 会抛
// "GestureDetector must be used as a descendant of GestureHandlerRootView")。
// 其余导出走真实实现。
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  Pressable: require('react-native').Pressable,
  GestureDetector: ({ children }) => children,
}));

// reanimated 走**真实模块** + 官方 setUpTests。
// 不要映射到 `react-native-reanimated/mock`:那是上游刻意残缺的便利 mock
// (src/mock.ts 里 19 处 `ADD ME IF NEEDED`),缺 useReducedMotion(本库
// usePrefersReducedMotion 直接调)与 useComposedEventHandler(RNGH 3 Pressable 要用),
// 且它的 useSharedValue 每次 render 返回新 Proxy,会让把 shared value 放进 effect
// 依赖数组的组件(本库 ToastHost)在 fake timers 下堆内存耗尽。
require('react-native-reanimated').setUpTests();
```

- [ ] **Step 4: 写 `jest-resolver.js`**

```js
'use strict';

/**
 * 组合两个上游 resolver —— 二者缺一都会静默坏掉一类场景:
 *
 * - RN 官方 resolver(`@react-native/jest-preset/jest/resolver.js`,该包无
 *   exports 字段,子路径 require 合法):临时剥掉 react-native 的 package
 *   exports,jest 才能解析 / mock 其深路径(如消费仓在 mock 的
 *   `react-native/Libraries/Utilities/Dimensions`)。
 * - worklets 官方 resolver(`react-native-worklets/jest/resolver`)的语义:
 *   对 worklets 相关请求过滤 .native.* extension,让 jest 走 web 实现,
 *   不触发 native init。
 *
 * jest 的 config `resolver` 是标量,直接写 worklets 的会把 RN 的顶掉,
 * 所以把 worklets 的 extension 过滤内联在这里,再委托给 RN 的 resolver。
 */

const reactNativeResolver = require('@react-native/jest-preset/jest/resolver.js');

module.exports = (request, options) => {
  if (
    options.basedir.includes('react-native-worklets') ||
    request.includes('react-native-worklets')
  ) {
    options = {
      ...options,
      extensions: options.extensions?.filter((ext) => !ext.includes('native')),
    };
  }
  return reactNativeResolver(request, options);
};
```

- [ ] **Step 5: 写 `jest-preset.js`**

```js
'use strict';

/**
 * `@unif/react-native-design/jest-preset` —— RN 官方 preset + 本库需要的
 * resolver / transform 放行清单 / setup 接线。消费者:
 *
 *   module.exports = { preset: '@unif/react-native-design/jest-preset' };
 *
 * 需要再放行别的包时,spread 本 preset 的 transformIgnorePatterns[0] 后自行追加。
 * 前提:消费者装有 @react-native/jest-preset(RN 应用测试的既有 devDependency)。
 */

const reactNativePreset = require('@react-native/jest-preset');

module.exports = {
  ...reactNativePreset,
  // 组合 resolver:worklets 的 .native.* 过滤 + RN 官方的 exports 剥离,见该文件注释。
  resolver: require.resolve('./jest-resolver.js'),
  setupFilesAfterEnv: [
    ...(reactNativePreset.setupFilesAfterEnv ?? []),
    require.resolve('./jest-setup.js'),
  ],
  // 本库与这些 peer 都发 ESM / TS 源码,RN preset 默认只放行
  // react-native / @react-native / @react-native-community 三个前缀。
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@unif/react-native-design|@sbaiahmed1/react-native-blur|react-native-(gesture-handler|reanimated|worklets|safe-area-context|svg|reanimated-carousel))/)',
  ],
};
```

- [ ] **Step 6: 加进 `package.json` 的 `exports` 与 `files`**

`exports` 里 `"./package.json"` 之后加三行:

```json
    "./jest-setup": "./jest-setup.js",
    "./jest-preset": "./jest-preset.js",
    "./jest-preset/jest-preset": "./jest-preset.js",
```

第三行不是笔误:jest 会给非相对的 `preset` 说明符无条件追加 `/jest-preset`
(`jest-config` `normalize.js` 的 `PRESET_NAME`),没有这条别名,文档化的
`preset: '@unif/react-native-design/jest-preset'` 会直接 Validation Error。
详见 `docs/specs/2026-08-05-jest-setup-entry-design.md` §4.1。

`files` 数组里 `"docs-home.css"` 之后加三行:

```json
    "jest-setup.js",
    "jest-preset.js",
    "jest-resolver.js",
```

- [ ] **Step 7: 跑测试确认通过**

Run: `node --test scripts/__tests__/jest-entries.test.mjs`
Expected: PASS,4 个 test 全过。

- [ ] **Step 8: 确认打包产物含入口**

Run: `yarn prepare && yarn pack --out /tmp/design-jest-entry.tgz && tar -tzf /tmp/design-jest-entry.tgz | grep jest-`
Expected: 输出 `package/jest-preset.js`、`package/jest-setup.js`、`package/jest-resolver.js` 三行。

- [ ] **Step 9: 提交**

```bash
git add jest-setup.js jest-preset.js jest-resolver.js package.json scripts/__tests__/jest-entries.test.mjs
git commit -m "feat: 发布 jest-setup / jest-preset 接线入口"
```

---

### Task 2: 把入口纳入 gate

**Files:**
- Create: `scripts/check-jest-entries.js`
- Modify: `package.json`(`scripts`)
- Test: 复用 Task 1 的 `scripts/__tests__/jest-entries.test.mjs`

**Interfaces:**
- Consumes:Task 1 的 `jest-setup.js` / `jest-preset.js` / `package.json` 字段。
- Produces:`yarn check:jest-entries`,失败退出码非零。

- [ ] **Step 1: 写 gate 脚本**

创建 `scripts/check-jest-entries.js`:

```js
#!/usr/bin/env node
'use strict';

// 发布面 gate:两个 Jest 入口必须同时出现在 exports 与 files,且 preset 可 require、
// 形状正确。漏任一项都会让消费者拿到一个 "Cannot find module" 的包。

const path = require('node:path');
const fs = require('node:fs');

const repositoryRoot = path.join(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
);

const failures = [];
const entries = [
  ['./jest-setup', 'jest-setup.js'],
  ['./jest-preset', 'jest-preset.js'],
  // jest 解析 preset 说明符时会追加 /jest-preset,这条别名没了,消费者的
  // preset: '@unif/react-native-design/jest-preset' 直接 Validation Error。
  ['./jest-preset/jest-preset', 'jest-preset.js'],
];

for (const [subpath, file] of entries) {
  if (manifest.exports[subpath] !== `./${file}`) {
    failures.push(`exports["${subpath}"] 应为 "./${file}"`);
  }
  if (!manifest.files.includes(file)) {
    failures.push(`files 缺 "${file}"`);
  }
  if (!fs.existsSync(path.join(repositoryRoot, file))) {
    failures.push(`${file} 不存在`);
  }
}

if (!manifest.files.includes('jest-resolver.js')) {
  failures.push('files 缺 "jest-resolver.js"');
}
if (!fs.existsSync(path.join(repositoryRoot, 'jest-resolver.js'))) {
  failures.push('jest-resolver.js 不存在');
}

if (failures.length === 0) {
  const preset = require(path.join(repositoryRoot, 'jest-preset.js'));
  if (
    typeof preset.resolver !== 'string' ||
    !preset.resolver.endsWith('jest-resolver.js')
  ) {
    failures.push('jest-preset 的 resolver 必须指向本包 jest-resolver.js');
  }
  if (
    !Array.isArray(preset.setupFilesAfterEnv) ||
    !preset.setupFilesAfterEnv.some((entry) => entry.endsWith('jest-setup.js'))
  ) {
    failures.push('jest-preset 的 setupFilesAfterEnv 没指向 jest-setup.js');
  }
  if (
    !Array.isArray(preset.transformIgnorePatterns) ||
    !preset.transformIgnorePatterns[0].includes('@unif/react-native-design')
  ) {
    failures.push('jest-preset 的 transformIgnorePatterns 没放行本库');
  }
}

if (failures.length > 0) {
  process.stderr.write(
    `[check-jest-entries] ${failures.join('\n[check-jest-entries] ')}\n`
  );
  process.exit(1);
}

process.stdout.write('[check-jest-entries] jest 入口发布面 OK\n');
```

- [ ] **Step 2: 挂进 `package.json#scripts`**

在 `"check:icons"` 之后加:

```json
    "check:jest-entries": "node scripts/check-jest-entries.js",
```

- [ ] **Step 3: 跑 gate 确认通过**

Run: `yarn check:jest-entries`
Expected: 输出 `[check-jest-entries] jest 入口发布面 OK`,退出码 0。

- [ ] **Step 4: 确认 gate 真的会失败**

Run:
```bash
node -e "const f='package.json';const m=JSON.parse(require('fs').readFileSync(f));delete m.exports['./jest-setup'];require('fs').writeFileSync(f,JSON.stringify(m,null,2)+'\n')"
yarn check:jest-entries; echo "exit=$?"
git checkout -- package.json
```
Expected: 打印 `exports["./jest-setup"] 应为 "./jest-setup.js"`,`exit=1`;随后 `git checkout` 还原。

- [ ] **Step 5: 接进 CI(`.github/workflows/example-showcase.yml`)**

`ci.yml` 是组织模板不能动,根 jest 又忽略 `scripts/__tests__/`(`testPathIgnorePatterns`),所以新 gate 若不显式接线,CI 里**永远不会跑**。`example-showcase.yml` 是本仓自有 workflow(AGENTS.md:「example 专项 gate 位于 `.github/workflows/example-showcase.yml`」),在其 install 步骤之后、showcase 验证之前加一步:

```yaml
      - name: Check jest entries
        run: |
          yarn check:jest-entries
          node --test scripts/__tests__/jest-entries.test.mjs
```

(缩进对齐该文件现有 steps;若文件里 steps 用其他排布,保持一致。)

- [ ] **Step 6: 提交**

```bash
git add scripts/check-jest-entries.js package.json .github/workflows/example-showcase.yml
git commit -m "chore: 加 check:jest-entries 守住入口发布面"
```

---

### Task 3: example 改吃入口(config 与 setup)

**Files:**
- Modify: `example/jest.config.js`
- Modify: `example/jest.setup.ts`
- Modify: `scripts/__tests__/example-showcase-contract.test.mjs:109-127`(及同文件对 `preset` / `setupFilesAfterEnv` 的其他断言)
- Modify: `turbo.json`(`example#test` 的 inputs)

**Interfaces:**
- Consumes:Task 1 的 `@unif/react-native-design/jest-preset` 与 `/jest-setup`。
- Produces:example 的 jest 配置形态,Task 5 的契约测试断言它。

**背景(两条都不能省):**

1. **必须用 preset 字符串,不能 spread preset 对象。** jest 对 `preset` 有专门的合并语义:preset 的 `setupFiles` / `setupFilesAfterEnv` **前置拼接**到 config 的之前、`moduleNameMapper` 合并、`resolver` 在 config 缺省时补位。手工 spread 后再写 `moduleNameMapper: {…}` 会把 RN preset 的 `'^react-native($|/.*)'` 钉住条目整个覆盖掉 —— root 与 example 各有一份 react-native,丢了这条就是两份 RN 运行时同场。字符串形式还顺带让 example 走与消费者完全相同的 exports 子路径解析。
2. **workspace 双拷贝要用 mapper 钉住。** root 与 example 各有一份 reanimated / worklets / safe-area-context 物理拷贝(FeedbackScene / CollectionsScene 现有的 `../../../node_modules/...` 双路径 mock 就是这个问题的既有绕法)。`jest.mock` 的注册 key 与 importer 的解析**都经过 `moduleNameMapper`**(证据:今天 FeedbackScene 对 reanimated 的 override 正是靠 mapper 统一了 key 才生效),所以把这三个包的 bare specifier 钉到 example 那份**真实**拷贝,preset 里 jest-setup 的 `jest.mock` 与所有 importer 就落在同一个 key 上。独立消费者只有一份 node_modules,不需要这些条目。

- [ ] **Step 1: 改 `example/jest.config.js`**

整文件替换为:

```js
// design 的接线由包自己提供(见仓根 jest-preset.js / jest-setup.js);example 吃
// 自己的狗粮,走与消费者相同的 preset 字符串解析路径(经 package.json#exports),
// 每次改接线都被本仓 15 个 suite 回归覆盖。
module.exports = {
  preset: '@unif/react-native-design/jest-preset',
  testMatch: ['**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    // example 测的是当前源码,不是已发布产物
    '^@unif/react-native-design$': '<rootDir>/../src/index.tsx',
    // 以下都是 workspace 双拷贝钉住条目:root 与 example 各有一份物理拷贝,
    // bare specifier 统一钉到 example 这份**真实**拷贝,preset 里 jest-setup 的
    // jest.mock 注册 key 与所有 importer 才会对齐(jest.mock 的 key 解析同样
    // 经过本 mapper)。独立消费者只有一份 node_modules,不需要这些。
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-native-gesture-handler$':
      '<rootDir>/node_modules/react-native-gesture-handler/src/index.ts',
    '^react-native-reanimated$':
      '<rootDir>/node_modules/react-native-reanimated',
    '^react-native-worklets$': '<rootDir>/node_modules/react-native-worklets',
    '^react-native-safe-area-context$':
      '<rootDir>/node_modules/react-native-safe-area-context',
  },
  // preset 的 setupFilesAfterEnv(jest-setup.js)由 jest 前置拼接,这里只列 example 自己的
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  reporters: ['default', '<rootDir>/jest.forbidOnlyReporter.js'],
  // transformIgnorePatterns 不写 —— 继承 preset(内容与原先 example 自己那份逐字相同)
};
```

注意与旧配置的两个语义差异:reanimated / worklets 的 mapper 从「指到 mock 文件」变成「指到真实包根做身份钉住」—— mock 职责移交给了 preset 的 jest-setup;safe-area-context 是新增钉住条目。

- [ ] **Step 2: 改 `example/jest.setup.ts`,只留 example 自己的东西**

整文件替换为:

```ts
// design 自身的 peer 接线来自 `@unif/react-native-design/jest-setup`
// (由 jest.config.js 的 preset 带入)。本文件只放 example 特有的替身。

// App.test.tsx 要断言根装配里有且只有一个 GestureHandlerRootView,
// 给它一个可查询的 testID —— 这是测试缝,不是 design 接线的一部分。
jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler');
  const React = require('react');
  const { Pressable, View } = require('react-native');

  return {
    ...actual,
    Pressable,
    GestureDetector: ({ children }: { children: unknown }) => children,
    GestureHandlerRootView: function MockGestureHandlerRootView({
      children,
      ...props
    }: import('react').ComponentProps<typeof import('react-native').View>) {
      return React.createElement(
        View,
        { ...props, testID: 'capture-gesture-root' },
        children
      );
    },
  };
});
```

- [ ] **Step 3: 同步契约测试的期望配置**

`scripts/__tests__/example-showcase-contract.test.mjs`:

1. 第 109–127 行的 `moduleNameMapper` 期望块改为与 Step 1 的新 config 逐项一致:`'^react-native-reanimated$'` / `'^react-native-worklets$'` 指向真实包根(不再是 `mock.js` / `src/mock.ts`),新增 `'^react-native-safe-area-context$'` 项。
2. 第 993 行 `assert.deepEqual(jestConfig.setupFilesAfterEnv, ['<rootDir>/jest.setup.ts'])` **保持不变** —— 契约测试读的是 raw config 文件,preset 的前置拼接发生在 jest 运行时,raw 文件里仍只有这一项。
3. `grep -n "@react-native/jest-preset" scripts/__tests__/example-showcase-contract.test.mjs scripts/verify-example-showcase.mjs` —— 所有对 example config `preset` 字段值的断言改为 `'@unif/react-native-design/jest-preset'`。若 verify 脚本本体也有此类断言,一并改。

- [ ] **Step 4: 把三个入口文件加进 turbo inputs**

`turbo.json` 的 `@unif/react-native-design-example#test` 的 `inputs` 数组(现有 `"$TURBO_ROOT$/example/jest.config.js"` 附近)加三行 —— example 测试现在依赖它们,不加则改接线时 turbo 缓存不失效、CI 假绿:

```json
        "$TURBO_ROOT$/jest-setup.js",
        "$TURBO_ROOT$/jest-preset.js",
        "$TURBO_ROOT$/jest-resolver.js",
```

- [ ] **Step 5: 跑 example 测试,记录失败清单**

Run: `yarn example test --maxWorkers=2`
Expected: **会失败**。预期失败集中在 `App` / `FeedbackScene` / `CollectionsScene` 三个 suite,原因是 `installReducedMotionMock` 靠给模块对象赋值打补丁,而真实 reanimated 是 babel 编译的 ESM namespace(getter 不可写),赋值不生效。把实际失败清单记下来交给 Task 4。若失败面超出这三个 suite(尤其出现 "Native part not initialized" / 两份 RN 实例类报错),说明钉住条目没起作用,停下报告,不要继续。

---

### Task 4: 清掉 reduced-motion 的两处历史补丁

**Files:**
- Modify: `example/src/__tests__/helpers/nativeMocks.ts`
- Modify: `example/src/__tests__/FeedbackScene.test.tsx:79-93`
- Modify: `example/src/__tests__/{App,CollectionsScene,FeedbackScene}.test.tsx`(调用处)

**Interfaces:**
- Consumes:Task 3 后的 example 配置(真实 reanimated)。
- Produces:`mockReducedMotion(value: boolean): void` —— 供需要模拟「已开启减弱动效」的 suite 使用。

- [ ] **Step 1: 写失败的测试**

先确认现状:运行 `yarn example test --maxWorkers=2 2>&1 | grep -c "✕"`,记下失败数(Task 3 Step 5 的清单)。这一步的「失败测试」就是 Task 3 遗留的那批。

- [ ] **Step 2: 用官方 `jest.mock` 工厂替换赋值式补丁**

`example/src/__tests__/helpers/nativeMocks.ts` 里删除 `installReducedMotionMock` 与 `restoreNativeMocks` 中的 reanimated 部分(`ReanimatedMotionMock` 类型、两处 `jest.requireActual('react-native-reanimated')`),`restoreNativeMocks` 只保留 `Platform.OS` 还原。新建 `example/src/__tests__/helpers/reducedMotion.ts`:

```ts
// reanimated 的 useReducedMotion() 是模块加载时的快照,没法在运行时改。
// 要模拟「系统已开启减弱动效」只能用 jest.mock 工厂 —— 直接给模块对象赋值
// 不生效(babel 编译的 ESM namespace 是 getter,不可写)。
let reducedMotion = false;

export function setReducedMotion(value: boolean): void {
  reducedMotion = value;
}

export function reanimatedWithReducedMotion(): unknown {
  const actual = jest.requireActual<Record<string, unknown>>(
    'react-native-reanimated'
  );
  return { ...actual, useReducedMotion: () => reducedMotion };
}
```

- [ ] **Step 3: 在需要的 suite 顶层挂工厂**

`App.test.tsx`、`CollectionsScene.test.tsx`、`FeedbackScene.test.tsx` 三个文件顶层各加一次(`jest.mock` 会被提升到 import 之前,工厂里只能 `require`):

```ts
jest.mock('react-native-reanimated', () =>
  require('./helpers/reducedMotion').reanimatedWithReducedMotion()
);
```

原来调用 `installReducedMotionMock(true)` / `(false)` 的地方改为 `setReducedMotion(true)` / `(false)`,并在 `afterEach` 里 `setReducedMotion(false)` 复位。

- [ ] **Step 4: 删掉 FeedbackScene 那份重复的 reanimated mock**

`example/src/__tests__/FeedbackScene.test.tsx:79-93` 整块 `jest.mock('react-native-reanimated', () => { … useSharedValue: … })` 删除 —— `useReducedMotion` 由 Step 3 的工厂提供,`useSharedValue` 用真实实现(引用本来就稳定,该补丁是为残缺 mock 打的)。

- [ ] **Step 5: 跑 example 测试确认全绿**

Run: `yarn example test --maxWorkers=2`
Expected: 15 suites / 101 tests 全 PASS。

- [ ] **Step 6: 连跑 3 次确认不 flake,并记录耗时**

Run: `for i in 1 2 3; do yarn example test --maxWorkers=2 2>&1 | tail -3; done`
Expected: 三次都 15/101 全绿。记录三次耗时;基线 58s,若稳定超过 116s(2×)按 spec §6 停下报告,考虑回到「mock + 入口内补齐缺口」形态。

- [ ] **Step 7: 提交**

```bash
git add example/jest.config.js example/jest.setup.ts example/src/__tests__/ scripts/__tests__/example-showcase-contract.test.mjs
git commit -m "refactor(example): 改吃 design 的 jest 入口,删掉两处 reduced-motion 补丁"
```

---

### Task 5: 消费者路径的端到端证据

**Files:**
- Create: `scripts/__tests__/jest-preset-consumer.test.mjs`

**Interfaces:**
- Consumes:Task 1 的打包产物。
- Produces:一个可重复执行的消费者验证,证明「只写 `preset: '@unif/react-native-design/jest-preset'`」可用。

- [ ] **Step 1: 写测试**

创建 `scripts/__tests__/jest-preset-consumer.test.mjs` —— 它不真的跑 npm install(太慢、要联网),而是断言 preset 在**当前 workspace 解析下**能被 jest 消费所需的三项都指向真实存在的文件:

```js
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const require = createRequire(import.meta.url);
const preset = require(path.join(repositoryRoot, 'jest-preset.js'));

test('preset 引用的三个文件都真实存在', () => {
  assert.ok(existsSync(preset.resolver), `resolver 不存在:${preset.resolver}`);
  for (const entry of preset.setupFilesAfterEnv) {
    assert.ok(existsSync(entry), `setup 不存在:${entry}`);
  }
});

test('setup 里 require 的 peer 入口都真实存在', () => {
  for (const specifier of [
    'react-native-gesture-handler/jestSetup',
    'react-native-worklets/lib/module/mock',
    'react-native-safe-area-context/jest/mock',
    'react-native-reanimated',
  ]) {
    assert.doesNotThrow(
      () => require.resolve(specifier, { paths: [repositoryRoot] }),
      `解析不到 ${specifier}`
    );
  }
});
```

- [ ] **Step 2: 跑测试确认通过**

Run: `node --test scripts/__tests__/jest-preset-consumer.test.mjs`
Expected: 2 个 test 全 PASS。

- [ ] **Step 3: 人工端到端验证(一次性,结果记进 PR 描述)**

```bash
yarn prepare && yarn pack --out /tmp/design.tgz
mkdir -p /tmp/design-consumer && cd /tmp/design-consumer
# package.json 里装 tarball + 9 个 peer + jest/@testing-library/react-native/react-test-renderer,
# npm overrides 收窄 RNRC 的 RNGH 请求(见 website/docs/getting-started.md)
npm install
printf "module.exports = { preset: '@unif/react-native-design/jest-preset' };\n" > jest.config.js
# 写一个渲染 Button / Switch / Carousel / ToastHost(fake timers)的用例
npx jest
```
Expected: 全绿。把命令与输出贴进 PR 描述,作为 spec §5.1 的证据。

- [ ] **Step 4: 提交**

```bash
git add scripts/__tests__/jest-preset-consumer.test.mjs
git commit -m "test: 加 jest preset 消费者路径断言"
```

---

### Task 6: 文档回改

**Files:**
- Modify: `website/docs/testing.md`
- Modify: `website/docs/troubleshooting.md`(`#jest--单元测试` 一节)
- Modify: `README.md`
- Modify: `website/static/llms.txt`、`llms-full.txt`、`md/**`(生成物)

- [ ] **Step 1: 改 `website/docs/testing.md` 的「最小可用配方」**

开头的「本库不发 mock 入口」整段改写为「本库发布 `./jest-setup` 与 `./jest-preset` 两个入口」。「最小可用配方」换成:

````markdown
```sh
yarn add -D jest @react-native/jest-preset @babel/core \
  @testing-library/react-native react-test-renderer
```

```js
// jest.config.js
module.exports = { preset: '@unif/react-native-design/jest-preset' };
```
````

原来那份逐条配方整体下移到新的「不使用入口时的手工等价物」小节,并说明它就是 `jest-setup.js` 的内容。

- [ ] **Step 2: 改「每一条为什么必需」表**

表格保留(它解释入口在替你做什么),但表头改为「入口替你做的这一条,自己写时漏了会看到」。删掉「别把 reanimated 映射到它自己的 mock」那个 `:::caution` 块里「上面的配方只映射 worklets」的措辞,改为说明入口用的是真实 reanimated。

- [ ] **Step 3: 改 `troubleshooting.md`**

`#jest--单元测试` 一节的每条「解法」首句统一改为「用 `preset: '@unif/react-native-design/jest-preset'`」,原逐条解法作为「手工接线时」的补充留在后面。

- [ ] **Step 4: 改 `README.md`**

「文档」区那条测试链接的括注从「本库不发 mock 入口,Jest 里要接的是底层 peer」改为「一行接入 `@unif/react-native-design/jest-preset`」。

- [ ] **Step 5: 回改 `design` Skill(独立仓 `unif-design/skills`,独立 PR)**

在 `/Users/liulijun/tongyi/design/skills` 拉分支,改两处:

- `skills/design/SKILL.md` 的「测试」节:代码块换成 `module.exports = { preset: '@unif/react-native-design/jest-preset' };`,四条 bullet 压缩成「入口替你接好了 RNGH / worklets / safe-area 的官方 mock 与真实 reanimated」+ 保留断言与 ThemeProvider 两条。
- `skills/design/references/setup.md` 的「Jest 接入」:同样改为一行接入,原逐条配方降级为「不使用入口时的手工等价物」。
- `metadata.version` 打补丁位;跑 `python3 scripts/format_markdown.py --fix`、`python3 scripts/validate_repository.py`、`python3 scripts/validate_portal_consistency.py`、`for f in skills/*/scripts/doctor.test.sh; do bash "$f"; done`,四项全绿。

**注意:** `~/.claude/plugins/marketplaces/skills` 是 marketplace 缓存 clone,不是源仓库,不要在那里改。

- [ ] **Step 6: 重新生成 llms 并跑门禁**

Run:
```bash
yarn workspace @unif/react-native-design-website build:llms
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
```
Expected: 四条全部退出码 0;`build-llms.test.js` 94 PASS / 0 FAIL;docusaurus build 无 broken link(`onBrokenLinks: 'throw'`)。

- [ ] **Step 7: 提交**

```bash
git add website README.md
git commit -m "docs: 测试文档改为一行接入 jest 入口"
```

---

### Task 7: AGENTS.md 与全量门禁

**Files:**
- Modify: `AGENTS.md`(「常用命令」「公共面与目录」两节)

- [ ] **Step 1: 改 `AGENTS.md`**

「常用命令」的 `yarn check:icons` 之后加 `yarn check:jest-entries`。「公共面与目录」里 `src/index.tsx` 那段之后加一句:

```text
除 barrel 外,`package.json#exports` 还发布 `./jest-setup` 与 `./jest-preset` 两个
Jest 接线入口(仓根手写 CJS,不过 bob、不 import `src/`)。改动它们要同步
`yarn check:jest-entries`、`example/jest.config.js`、Website 测试页与 `design` Skill。
```

- [ ] **Step 2: 跑全量受影响门禁**

Run:
```bash
yarn typecheck && yarn lint && yarn test --maxWorkers=2
yarn check:config && yarn check:icons && yarn check:runtime-peers && yarn check:jest-entries
node --test scripts/__tests__/jest-entries.test.mjs scripts/__tests__/jest-preset-consumer.test.mjs
yarn example typecheck && yarn example lint && yarn example test --maxWorkers=2
yarn verify:example-showcase
```
Expected: 全部退出码 0。`yarn verify:example-showcase` 较慢(实测 >10min),留足时间。

- [ ] **Step 3: 检查 diff 范围**

Run: `git diff --check && git status --short`
Expected: `git diff --check` 无输出;`git status` 只有本任务涉及的文件,`src/` 无改动。

- [ ] **Step 4: 提交并开 PR**

```bash
git add AGENTS.md
git commit -m "docs: AGENTS 记录 jest 入口发布面与联动范围"
git push -u origin feat/jest-setup-entry
gh pr create --title "feat: 发布受支持的 Jest 接线入口" --body "..."
```

PR 描述里必须包含 Task 5 Step 3 的端到端验证输出、Task 4 Step 6 的三次耗时,以及 spec 链接。

---

### Task 8: 发布

- [ ] **Step 1: 等 required CI 绿**

Run: `gh pr checks --watch`
Expected: 全绿。**不手工改 npm 版本、不手工打 tag、不 `npm publish`** —— 合并后由 release workflow 自动发。

- [ ] **Step 2: 合并后记录版本号**

Run: `gh release view --json tagName -q .tagName`
把版本号记下来,Task 9–12 的 `yarn add` 要用。

---

## 后续:消费仓迁移(独立 PR,必须在上面发布之后)

每仓一个 PR。通用步骤:升 `@unif/react-native-design` 到带入口的版本 → 删掉该仓自写的 design 相关接线 → 接入口 → 跑该仓全量测试 → 对比耗时。**只删 design 的 peer 接线**(RNGH / reanimated / worklets / safe-area),该仓自己的 peer(keyboard-controller、device-info、netinfo、nitro-modules、ble-manager 等)一律保留。

### Task 9: `unif/portal`

**Files:** `jest.config.js`、`jest.setup.ts`

- [ ] 删 `jest.setup.ts` 里这几段:`require('react-native-gesture-handler/jestSetup')`、`jest.mock('react-native-gesture-handler', …)`、`jest.mock('react-native-worklets', …)`、`jest.mock('react-native-reanimated', …)`(含 `useReducedMotion` 与 `useSharedValue` 两个补丁)、`jest.mock('react-native-safe-area-context', …)`。
- [ ] `jest.mock('react-native-gesture-handler/ReanimatedSwipeable', …)` **保留** —— 那是 portal 用到、design 不导出的子路径。
- [ ] `jest.config.js`:`resolver` 改为 `require('@unif/react-native-design/jest-preset').resolver`;design 入口挂 **`setupFilesAfterEnv`**(新增该字段,portal 现有 `setupFiles` 保留给它剩下的自有 mock)。**不能挂 `setupFiles`**:reanimated `setUpTests()` 内部 `expect.extend`(`src/jestUtils/index.ts:314`),`setupFiles` 阶段测试框架未装好,matcher 会沿 fallback 链注册到独立 expect 实例上 —— 不崩,但 `toHaveAnimatedStyle` 在用例里静默不可用。
- [ ] PR 里注明一个顺带修复:portal 现在的 `resolver: 'react-native-worklets/jest/resolver'` 把 RN preset 自带 resolver(剥 react-native 的 exports,portal 对 `react-native/Libraries/Utilities/Dimensions` 的深路径 mock 依赖它)顶掉了;design 的组合 resolver 把这个行为找回来。迁移后跑一次 Dimensions 相关 snapshot 验证。
- [ ] `transformIgnorePatterns` 保留 portal 自己那份(它还要放行 `@react-navigation`、`github-slugger`、`marked`),但在注释里指明 design 部分的来源。
- [ ] Run: `yarn test`(portal 的全量命令以其 AGENTS.md 为准),确认全绿且覆盖率阈值不跌。

### Task 10: `design/react-native-umeng`

**Files:** `example/jest.config.js`、`example/jest.setup.ts`

- [ ] 删 `example/jest.setup.ts` 全部 5 段 design 接线(RNGH jestSetup / RNGH 壳 / worklets / reanimated + `useReducedMotion` 补丁 / safe-area),文件若空则删除并从 config 移除引用。
- [ ] `example/jest.config.js` 改吃 `@unif/react-native-design/jest-preset`,保留该仓自己的 `moduleNameMapper`(指向本仓 `src/`)。
- [ ] Run: 该仓的 example 测试命令,确认全绿。

### Task 11: `design/react-native-camera`

**Files:** `jest.setup.ts`

- [ ] 该仓手写了整份 reanimated mock(含 `useRef` 持久化 SharedValue)、RNGH、carousel 壳、worklets 空 virtual mock、safe-area。删掉 reanimated / worklets / RNGH / safe-area 四段,改接入口。
- [ ] `jest.mock('react-native-reanimated-carousel', …)` 那段**先保留**并单独评估:camera 是否真的用到 Carousel,若只是为了让 design 的 barrel 能 import,接入口后可一并删。
- [ ] Run: 该仓测试命令,确认全绿。

### Task 12: `design/react-native-hms-scan`

**Files:** `jest.setup.ts`

- [ ] 该仓目前把 `@unif/react-native-design` 整个渲染成轻量桩来绕开接线问题。接入口后评估能否改渲染真实组件 —— 若可以,删掉桩,测试从此覆盖真实 design 行为(这是本次迁移收益最大的一仓);若该仓有意不测 design 组件,保留桩并在注释里改写理由(从「加载不了」改为「有意不测」)。
- [ ] 同时删掉那两处 `jest.mock('./example/node_modules/…')` 的双路径写法(它们是为绕 workspace 解析写的)。
- [ ] Run: 该仓测试命令,确认全绿。

---

## 自检

**Spec 覆盖:** §4.1 三个文件 → Task 1;§4.2 setup 内容 → Task 1 Step 3;§4.3 preset + resolver → Task 1 Step 4/5;§4.4 接入形态 → Task 6 Step 1;§5.1 tarball 端到端 → Task 5 Step 3;§5.2/5.3 example → Task 3/4;§5.4 发布面 → Task 1 Step 8;§5.5 gate → Task 2(含 CI 接线);§5.6 文档 → Task 6;§2.3 消费仓迁移 → Task 9–12;§6 耗时风险 → Task 4 Step 6;§6 双拷贝风险 → Task 3 背景 + Step 1;§6 resolver 覆盖风险 → Task 1 Step 4。

**类型一致:** `reanimatedWithReducedMotion()` / `setReducedMotion(value)` 在 Task 4 Step 2 定义、Step 3 使用,名称一致;`preset.resolver` / `preset.setupFilesAfterEnv` / `preset.transformIgnorePatterns` 在 Task 1 Step 5 定义,Task 1 Step 1、Task 2、Task 5、Task 9 均按此名使用;`jest-resolver.js` 在 Task 1 Step 4 定义,Step 1 测试、Step 6 files、Task 2 gate、Task 3 turbo inputs 均引用同名。

**审查记录(2026-08-05,执行前二轮审查修入):**

1. Task 1 测试原断言 `transformIgnorePatterns` 含完整包名 —— 但 `react-native-gesture-handler` 等在正则交替组内不字面出现,断言必假红。已改为断言字面片段。
2. 原 preset 直接用 worklets resolver,会顶掉 RN preset 自带 resolver(剥 react-native exports,深路径 mock 依赖它;实测 `@react-native/jest-preset/jest-preset.js` 确有 `resolver` 字段)。已改为组合 `jest-resolver.js`。
3. 原 Task 3 用对象 spread 接 preset,丢 jest 的 preset 合并语义(RN 的 `^react-native($|/.*)` 钉住条目会被 config 的 moduleNameMapper 覆盖);且未处理 workspace 双拷贝(root 与 example 各一份 reanimated / worklets / safe-area,`ls example/node_modules` 实证)。已改为 preset 字符串 + 三条钉住 mapper。
4. `setUpTests()` 实测调 `expect.extend`(reanimated `src/jestUtils/index.ts:303-326`,带 fallback 链)→ 入口必须挂 `setupFilesAfterEnv`;portal 迁移(Task 9)原来的「待实测」已改为定论。
5. 新 gate 原本没有 CI 接线点(ci.yml 模板锁定、根 jest 忽略 scripts/__tests__)→ Task 2 Step 5 接进 `example-showcase.yml`;三个入口文件加进 turbo inputs(Task 3 Step 4),否则改接线时 example 缓存假绿。
6. 根 eslint flat config 不给非测试目录注入 jest 全局 → `jest-setup.js` 顶部显式 `/* global jest */`。
