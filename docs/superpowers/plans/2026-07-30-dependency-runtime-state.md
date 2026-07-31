# Dependency and Runtime State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将库、Website 和临时原生验证宿主统一到 React Native 0.86.2，并用可测试的 ownership/CAS 状态机修复 Confirm、Toast、Pulse 与 reduced-motion 行为。

**Architecture:** 先锁定依赖、peer policy 和 RN 0.86.2 原生脚手架来源，再把命令式 Host 状态从 React 组件中抽成纯 Store。Confirm 使用单 active entry 和唯一 owner；Toast 使用 pending/delivery 双态、owner token 与 lease CAS；Pulse 由单一归一化层驱动 native/Web driver。后续 Input、Theme 和 Website 计划只消费这里产出的依赖基线、`usePrefersReducedMotion()` 和 runtime harness。

**Tech Stack:** React Native 0.86.2、React 19.2.3、TypeScript 6、Yarn 4.11、Jest 30、Reanimated 4.5.3、Worklets 0.11.3、RNGH 3.1、RNRC 5.0、Node.js、Ruby CocoaPods

## Global Constraints

- 支持平台固定为 React Native `>=0.86.0 <0.87.0`、React `>=19.2.3 <20.0.0`；本仓直接验证版本固定为 RN `0.86.2`、React `19.2.3`。
- Node engine 必须逐字使用 `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`。
- runtime 直接依赖固定为 RNGH `^3.1.0`、RNRC `^5.0.0`、Reanimated `~4.5.3`、Worklets `^0.11.3`；发布 peer 分别为 `>=3.0.0 <4.0.0`、`>=5.0.0 <6.0.0`、`>=4.5.2 <4.6.0`、`>=0.11.0 <0.12.0`。
- RNRC `5.0.0` 对 RNGH `>=2.9.0 <3.0.0` 的错误 metadata 只允许窄日志过滤和严格 checker；禁止全局忽略 peer、`--force`、`--legacy-peer-deps`、无效 `packageExtensions` 或 metadata patch。
- `example/` 不属于本轮依赖升级或原生验证来源；runtime harness 不读取、不复制该目录。
- 不保留旧 API alias 或兼容分支；公共依赖、行为和错误语义在对应原子提交中同步 README/Website 文档。
- 实施前重新读取最终版 `AGENTS.md` 与 `CLAUDE.md`；两文件由另一个会话维护，本计划不得编辑、暂存或提交它们。
- 每个公共改动都记录对 `/Users/liulijun/tongyi/design/skills/skills/design/` 的影响；最终同步和该仓 doctor/validation 统一由 `2026-07-30-website-llm-docs.md` 执行，无法访问时不得声称已同步。
- 所有源码测试遵守仓库边界：Jest 只测纯 Store/归一化/脚本逻辑，不新增 Host snapshot 或 renderer。

---

## File Structure

### New files

- `scripts/check-runtime-peers.js`：调用并解析 `yarn explain peer-requirements`，执行四个 runtime 包的严格 allowlist。
- `scripts/check-runtime-peers.d.ts`：为 Jest/TypeScript 暴露 peer parser 的确定类型。
- `__tests__/scripts/check-runtime-peers.test.ts`：用固定 Yarn 文本 fixture 覆盖合法例外与漂移失败。
- `src/components/ui/Confirm/store.ts`：Confirm 单 owner、单 active entry 的纯状态机。
- `src/components/ui/Toast/store.ts`：Toast pending/delivery、owner token、lease CAS 的纯状态机。
- `src/components/ui/Pulse/normalizePulseOptions.ts`：四个动画参数、诊断和静态判定的唯一归一化入口。
- `src/components/ui/Pulse/usePulseDriver.ts`：只消费 normalized options 的 native Reanimated driver。
- `src/components/ui/Pulse/usePulseDriver.web.ts`：只消费 normalized options 的 Web timer/CSS driver。
- `__tests__/components/ui/Pulse/normalizePulseOptions.test.ts`：参数边界和 reduced-motion 纯逻辑测试。
- `scripts/create-runtime-api-harness.js`：从锁文件中的官方 CLI/template 创建一次性 RN 0.86.2 app。
- `scripts/create-runtime-api-harness.d.ts`：为 harness 的 manifest/argv/provider helper 提供类型。
- `__tests__/scripts/create-runtime-api-harness.test.ts`：脚手架来源、argv 和依赖映射的纯测试。
- `manual-tests/runtime-api/RuntimeApiScreen.tsx`：跨计划逐步扩展的 native/Web 人工验证屏；本计划先覆盖 Confirm/Toast/Pulse。

### Modified files

- `package.json`、`website/package.json`、`yarn.lock`、`.yarnrc.yml`：版本、engine、provider、命令和窄 warning filter。
- `README.md`、`website/docs/getting-started.md`、`website/docs/UNIF-DESIGN.md`、`website/docs/troubleshooting.md`：RN 0.86.x 安装矩阵和 peer 例外。
- `src/theme/usePrefersReducedMotion.ts`、`src/theme/usePrefersReducedMotion.web.ts`：native 读取 Reanimated 系统设置，Web 保持 `matchMedia`。
- `src/components/ui/Confirm/confirm.ts`、`ConfirmHost.tsx`、`types.ts`、`styles.ts`、`index.ts`：Store facade、事件 Host 和横向 action 自有 flex。
- `__tests__/components/ui/Confirm/confirm.test.ts`：改测 `createConfirmStore()` 的全部生命周期。
- `website/docs/components/confirm.mdx`：唯一 Host、无 Host、重入和 cleanup settle 契约。
- `src/components/ui/Toast/toast.ts`、`ToastHost.tsx`、`ToastHost.web.tsx`、`types.ts`、`index.ts`：Store facade 和 delivery identity Host。
- `__tests__/components/ui/Toast/toast.test.ts`：latest-wins、重入、异常和 lease CAS。
- `website/docs/components/toast.mdx`：启动 pending、唯一 Host 和重投语义。
- `src/components/ui/Pulse/usePulse.ts`、`Pulse.tsx`、`PulseDot.tsx`、`types.ts`、`index.ts`：公共 hook 包装归一化和平台 driver。
- `src/components/ui/Skeleton/Skeleton.tsx`：复用 `from: 0.5` 的内部 defaults。
- `website/docs/components/pulse.mdx`、`website/docs/components/skeleton.mdx`、`website/docs/design/tokens/motion.md`：参数合法域和 reduced motion。

### Deleted files

- `src/components/ui/Pulse/usePulse.web.ts`：删除会绕过公共归一化层的同名平台入口，平台差异下沉到 `usePulseDriver(.web).ts`。

## Plan Order and Cross-Plan Interfaces

1. 本计划必须最先执行并全部通过。
2. Input 计划消费 `usePrefersReducedMotion(): boolean` 和 `manual-tests/runtime-api/RuntimeApiScreen.tsx`。
3. Theme/平台/Icon 计划继续扩展同一 harness fixture，并消费 RN 0.86.2/React 19.2.3 基线。
4. Website/LLM/Docs 计划做最终 mirror、verification matrix 与 `skills/design` 同步。

---

### Task 1: Lock RN 0.86.2 and enforce the runtime peer policy

**Files:**

- Modify: `package.json`
- Modify: `website/package.json`
- Modify: `.yarnrc.yml`
- Modify: `yarn.lock`
- Create: `scripts/check-runtime-peers.js`
- Create: `scripts/check-runtime-peers.d.ts`
- Create: `__tests__/scripts/check-runtime-peers.test.ts`
- Modify: `README.md`
- Modify: `website/docs/getting-started.md`
- Modify: `website/docs/UNIF-DESIGN.md`
- Modify: `website/docs/troubleshooting.md`

**Interfaces:**

- Consumes: Yarn 4.11 text output from `yarn explain peer-requirements` and `semver.satisfies(version, range, { includePrerelease: true })`.
- Produces:
  - root command `yarn check:runtime-peers`
  - `parseRequirementList(output: string): PeerRequirementSummary[]`
  - `parseRequirementDetail(hash: string, output: string): PeerRequirementDetail`
  - `auditRuntimePeers(summaries: readonly PeerRequirementSummary[], details: ReadonlyMap<string, PeerRequirementDetail>): PeerAuditResult`
  - installed RN 0.86.2 dependency/toolchain baseline used by all later tasks.

- [ ] **Step 1: Add failing peer parser fixtures**

Create `__tests__/scripts/check-runtime-peers.test.ts` with fixtures that reproduce both workspaces and an unrelated failure:

```ts
import { describe, expect, test } from '@jest/globals';
import {
  auditRuntimePeers,
  parseRequirementDetail,
  parseRequirementList,
} from '../../scripts/check-runtime-peers';

const LIST = [
  'pc850d5 → ✘ @unif/react-native-design@workspace:. provides react-native-gesture-handler@npm:3.1.0',
  'pwebsite → ✘ @unif/react-native-design-website@workspace:website provides react-native-gesture-handler@npm:3.1.0',
  'punrelated → ✘ @unif/react-native-design@workspace:. provides react@npm:19.2.3',
].join('\n');

const rootDetail = [
  'Package @unif/react-native-design@workspace:. is requested to provide react-native-gesture-handler by its descendants',
  '',
  '@unif/react-native-design@workspace:.',
  '├─ react-native-reanimated-carousel@npm:5.0.0 (via >=2.9.0 <3.0.0)',
  '└─ @unif/consumer@workspace:. (via >=3.0.0 <4.0.0)',
  '',
  '✘ Package @unif/react-native-design@workspace:. provides react-native-gesture-handler with version 3.1.0, which does not satisfy all requests.',
  '  The combined requested range is >=2.9.0 <3.0.0',
].join('\n');

test('只接受 root 与 website 的 RNRC 5.0.0/RNGH 3 已知例外', () => {
  const summaries = parseRequirementList(LIST);
  const details = new Map([
    ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
    [
      'pwebsite',
      parseRequirementDetail(
        'pwebsite',
        rootDetail.replaceAll(
          '@unif/react-native-design@workspace:.',
          '@unif/react-native-design-website@workspace:website'
        )
      ),
    ],
  ]);
  expect(auditRuntimePeers(summaries, details)).toEqual({
    knownExceptions: ['pc850d5', 'pwebsite'],
    errors: [],
  });
});

test.each([
  ['RNRC version 漂移', rootDetail.replace('5.0.0', '5.1.0')],
  ['RNRC range 漂移', rootDetail.replace('>=2.9.0 <3.0.0', '>=2.9.0 <4.0.0')],
  ['RNGH major 漂移', rootDetail.replaceAll('3.1.0', '4.0.0')],
])('%s 时失败', (_name, detailText) => {
  const summaries = parseRequirementList(LIST.split('\n')[0] ?? '');
  const details = new Map([
    ['pc850d5', parseRequirementDetail('pc850d5', detailText)],
  ]);
  expect(auditRuntimePeers(summaries, details).errors).not.toHaveLength(0);
});
```

- [ ] **Step 2: Run the focused test and confirm the parser is absent**

Run:

```bash
yarn test __tests__/scripts/check-runtime-peers.test.ts
```

Expected: FAIL because `scripts/check-runtime-peers.js` and its exports do not exist.

- [ ] **Step 3: Implement the strict parser and CLI**

Create `scripts/check-runtime-peers.js`. Keep parsing and policy pure; only `main()` may spawn Yarn:

```js
#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { execFileSync } = require('node:child_process');
const semver = require('semver');

const RUNTIME_PACKAGES = new Set([
  'react-native-gesture-handler',
  'react-native-reanimated-carousel',
  'react-native-reanimated',
  'react-native-worklets',
]);
const REQUIRED_PROVIDERS = new Set([
  '@unif/react-native-design@workspace:.',
  '@unif/react-native-design-website@workspace:website',
]);
const KNOWN_REQUESTER = 'react-native-reanimated-carousel@npm:5.0.0';
const KNOWN_RANGE = '>=2.9.0 <3.0.0';

function parseRequirementList(output) {
  return output
    .split(/\r?\n/u)
    .map((line) => {
      const match = line.match(
        /^(p[a-z0-9]+)\s+→\s+✘\s+(.+?)\s+provides\s+([^@\s]+)@npm:([^\s]+)/u
      );
      return match
        ? {
            hash: match[1],
            providerLocator: match[2],
            packageName: match[3],
            providerVersion: match[4],
          }
        : null;
    })
    .filter(Boolean);
}

function parseRequirementDetail(hash, output) {
  const provider = output.match(
    /^Package (.+?) is requested to provide ([^\s]+) by its descendants/mu
  );
  const version = output.match(
    /provides ([^\s]+) with version ([^,\s]+), which does not satisfy/u
  );
  const requests = [
    ...output.matchAll(/[├└]─\s+(.+?)\s+\(via (.+?)\)$/gmu),
  ].map((match) => ({ requester: match[1], range: match[2] }));
  if (!provider || !version || requests.length === 0) {
    throw new Error(`${hash}: 无法解析 yarn explain peer-requirements 明细`);
  }
  return {
    hash,
    providerLocator: provider[1],
    packageName: provider[2],
    providerVersion: version[2],
    requests,
  };
}

function auditRuntimePeers(summaries, details) {
  const knownExceptions = [];
  const errors = [];
  const seenProviders = new Set();
  for (const summary of summaries) {
    if (!RUNTIME_PACKAGES.has(summary.packageName)) continue;
    const detail = details.get(summary.hash);
    if (!detail) {
      errors.push(`${summary.hash}: 缺少 runtime peer 明细`);
      continue;
    }
    const knownRequest = detail.requests.filter(
      (request) => request.requester === KNOWN_REQUESTER
    );
    const otherRequests = detail.requests.filter(
      (request) => request.requester !== KNOWN_REQUESTER
    );
    const allowed =
      detail.packageName === 'react-native-gesture-handler' &&
      semver.satisfies(detail.providerVersion, '>=3.0.0 <4.0.0') &&
      knownRequest.length === 1 &&
      knownRequest[0].range === KNOWN_RANGE &&
      otherRequests.every((request) =>
        semver.satisfies(detail.providerVersion, request.range, {
          includePrerelease: true,
        })
      );
    if (!allowed) {
      errors.push(`${summary.hash}: 未获准的 runtime peer failure`);
      continue;
    }
    knownExceptions.push(summary.hash);
    seenProviders.add(detail.providerLocator);
  }
  for (const provider of REQUIRED_PROVIDERS) {
    if (!seenProviders.has(provider)) {
      errors.push(`缺少 ${provider} 的 RNRC 5/RNGH 3 审计项`);
    }
  }
  return { knownExceptions, errors };
}

function runYarn(args) {
  const yarn = path.resolve(__dirname, '../.yarn/releases/yarn-4.11.0.cjs');
  return execFileSync(process.execPath, [yarn, ...args], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
  });
}

function main() {
  const summaries = parseRequirementList(
    runYarn(['explain', 'peer-requirements'])
  );
  const runtimeSummaries = summaries.filter((item) =>
    RUNTIME_PACKAGES.has(item.packageName)
  );
  const details = new Map(
    runtimeSummaries.map((item) => [
      item.hash,
      parseRequirementDetail(
        item.hash,
        runYarn(['explain', 'peer-requirements', item.hash])
      ),
    ])
  );
  const result = auditRuntimePeers(summaries, details);
  if (result.errors.length > 0) {
    throw new Error(result.errors.join('\n'));
  }
  for (const hash of result.knownExceptions) {
    console.log(
      `KNOWN_EXCEPTION ${hash}: react-native-reanimated-carousel@5.0.0 requests RNGH ${KNOWN_RANGE}; provider is validated RNGH 3.x`
    );
  }
}

module.exports = {
  auditRuntimePeers,
  parseRequirementDetail,
  parseRequirementList,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[check-runtime-peers] ${error.message}`);
    process.exitCode = 1;
  }
}
```

Create the matching declarations in `scripts/check-runtime-peers.d.ts`:

```ts
export type PeerRequirementSummary = {
  hash: string;
  providerLocator: string;
  packageName: string;
  providerVersion: string;
};
export type PeerRequest = { requester: string; range: string };
export type PeerRequirementDetail = PeerRequirementSummary & {
  requests: PeerRequest[];
};
export type PeerAuditResult = {
  knownExceptions: string[];
  errors: string[];
};
export declare function parseRequirementList(
  output: string
): PeerRequirementSummary[];
export declare function parseRequirementDetail(
  hash: string,
  output: string
): PeerRequirementDetail;
export declare function auditRuntimePeers(
  summaries: readonly PeerRequirementSummary[],
  details: ReadonlyMap<string, PeerRequirementDetail>
): PeerAuditResult;
```

- [ ] **Step 4: Pin every package and engine value**

Apply these exact manifest changes:

```json
{
  "scripts": {
    "check:runtime-peers": "node scripts/check-runtime-peers.js"
  },
  "devDependencies": {
    "@babel/core": "^7.29.7",
    "@react-native-community/cli": "20.1.0",
    "@react-native-community/template": "0.86.2",
    "@react-native/babel-preset": "0.86.2",
    "@react-native/eslint-config": "0.86.2",
    "@react-native/jest-preset": "0.86.2",
    "@react-native/metro-config": "0.86.2",
    "react": "19.2.3",
    "react-native": "0.86.2",
    "react-native-gesture-handler": "^3.1.0",
    "react-native-reanimated": "~4.5.3",
    "react-native-reanimated-carousel": "^5.0.0",
    "react-native-worklets": "^0.11.3",
    "semver": "^7.8.5"
  },
  "peerDependencies": {
    "react": ">=19.2.3 <20.0.0",
    "react-native": ">=0.86.0 <0.87.0",
    "react-native-gesture-handler": ">=3.0.0 <4.0.0",
    "react-native-reanimated": ">=4.5.2 <4.6.0",
    "react-native-reanimated-carousel": ">=5.0.0 <6.0.0",
    "react-native-worklets": ">=0.11.0 <0.12.0"
  },
  "engines": {
    "node": "^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0"
  }
}
```

In `website/package.json`, set React/React DOM to `^19.2.3`, RN to `0.86.2`, the four runtime packages to the same direct ranges, add `@babel/core@^7.29.7` and `@react-native/metro-config@0.86.2` to `devDependencies`, and use the same Node engine string.

Add only these scoped filters to `.yarnrc.yml`:

```yaml
logFilters:
  - pattern: "*react-native-gesture-handler*version 3.*doesn't satisfy*react-native-reanimated-carousel*"
    level: discard
  - pattern: '*react-native-gesture-handler*version 3.*does not satisfy*react-native-reanimated-carousel*'
    level: discard
```

The checker remains authoritative even if Yarn changes which of the two wordings it emits.
When a released RNRC version correctly accepts RNGH 3, upgrade RNRC and remove
both filters plus the known-exception branch in the same change; the checker
must then prove that all four runtime packages have zero failed requirements.

- [ ] **Step 5: Regenerate the lockfile and verify dependency metadata**

Run:

```bash
yarn install
yarn install --immutable
yarn test __tests__/scripts/check-runtime-peers.test.ts
yarn check:runtime-peers
yarn typecheck
```

Expected:

- install resolves RN `0.86.2`, CLI `20.1.0`, template `0.86.2`, Reanimated `4.5.3`, Worklets `0.11.3`;
- immutable install emits no filtered RNRC/RNGH warning;
- checker prints exactly two `KNOWN_EXCEPTION` lines, one for root and one for Website;
- focused Jest and TypeScript pass.

- [ ] **Step 6: Update installation and support docs atomically**

In the four listed docs, publish the exact RN/React/Node/runtime matrix from Global Constraints. State that Worklets consumers must provide compatible Babel/Metro peers and that this repository’s Yarn filter does not propagate with the npm package. For RNRC 5.0.0 + RNGH 3, document only a package-manager-specific narrow allowlist/filter or accepting that one warning; never recommend global peer suppression.

Run:

```bash
rg -n "React Native 0\\.85|RN 0\\.85|0\\.85\\+|Node(\\.js)?.*>=18" README.md website/docs
```

Expected: no matches in current-support prose.

- [ ] **Step 7: Commit only Task 1 files**

```bash
git add package.json website/package.json yarn.lock .yarnrc.yml scripts/check-runtime-peers.js scripts/check-runtime-peers.d.ts __tests__/scripts/check-runtime-peers.test.ts README.md website/docs/getting-started.md website/docs/UNIF-DESIGN.md website/docs/troubleshooting.md
git diff --cached --name-only
git commit -m "chore: align runtime dependencies with react native 0.86"
```

Expected staged list excludes `AGENTS.md`, `CLAUDE.md`, `example/` and all later-task files.

---

### Task 2: Make native reduced-motion state real

**Files:**

- Modify: `src/theme/usePrefersReducedMotion.ts`
- Modify: `src/theme/usePrefersReducedMotion.web.ts`
- Modify: `website/docs/design/tokens/motion.md`
- Modify: `website/docs/UNIF-DESIGN.md`

**Interfaces:**

- Consumes: `useReducedMotion(): boolean` from `react-native-reanimated@4.5.3`.
- Produces: public `usePrefersReducedMotion(): boolean`, with native system state and Web `matchMedia('(prefers-reduced-motion: reduce)')`.

- [ ] **Step 1: Replace the native constant implementation**

Use the Reanimated signal directly:

```ts
import { useReducedMotion } from 'react-native-reanimated';

/** native:读取 iOS/Android 系统“减弱动态效果”设置。 */
export function usePrefersReducedMotion(): boolean {
  return useReducedMotion();
}
```

Keep the Web sibling’s listener, but update its comments so they no longer claim native always returns `false` or that Reanimated automatically covers every consumer.

- [ ] **Step 2: Verify platform resolution and public declarations**

Run:

```bash
yarn typecheck
yarn prepare
rg -n "usePrefersReducedMotion" lib/typescript/src/theme
```

Expected: typecheck/build pass and the public declaration remains `usePrefersReducedMotion(): boolean`.

- [ ] **Step 3: Update motion documentation**

Document that native reads Reanimated’s system signal, Web reads `matchMedia`, and Pulse/Switch/Carousel/Reveal must explicitly branch on the hook rather than assuming their animation engine handles the preference.

- [ ] **Step 4: Commit**

```bash
git add src/theme/usePrefersReducedMotion.ts src/theme/usePrefersReducedMotion.web.ts website/docs/design/tokens/motion.md website/docs/UNIF-DESIGN.md
git diff --cached --name-only
git commit -m "fix: read native reduced motion preference"
```

---

### Task 3: Replace Confirm pub/sub with a single-owner Store

**Files:**

- Create: `src/components/ui/Confirm/store.ts`
- Modify: `src/components/ui/Confirm/confirm.ts`
- Modify: `src/components/ui/Confirm/ConfirmHost.tsx`
- Modify: `src/components/ui/Confirm/types.ts`
- Modify: `src/components/ui/Confirm/styles.ts`
- Modify: `src/components/ui/Confirm/index.ts`
- Modify: `__tests__/components/ui/Confirm/confirm.test.ts`
- Modify: `website/docs/components/confirm.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `ConfirmOptions` and module-level `createLogger('confirm')`.
- Produces:
  - `ConfirmEntry { id: number; options: Readonly<ConfirmOptions>; settled: boolean; resolve(result: boolean): void }`
  - `ConfirmEvent = { type: 'show'; entry: ConfirmEntry } | { type: 'clear'; id: number }`
  - `createConfirmStore(log): ConfirmStore`
  - internal facade `registerConfirmHost(subscriber): ConfirmHostLease | null`
  - internal facade `settleConfirm(entry, result): boolean`
  - unchanged public `confirm(options): Promise<boolean>` and `<ConfirmHost />`.

- [ ] **Step 1: Rewrite the pure Store tests first**

Replace the old `_subs` tests with direct `createConfirmStore()` tests. Include this identity regression:

```ts
test('旧 entry 的重复 settle 不影响新 active entry', async () => {
  const events: ConfirmEvent[] = [];
  const store = createConfirmStore(testLog);
  const lease = store.registerHost((event) => events.push(event));
  expect(lease).not.toBeNull();

  const first = store.request({ title: 'A' });
  const entryA = events.find(
    (event): event is Extract<ConfirmEvent, { type: 'show' }> =>
      event.type === 'show'
  )!.entry;
  expect(store.settle(entryA, true)).toBe(true);
  await expect(first).resolves.toBe(true);

  events.length = 0;
  const second = store.request({ title: 'B' });
  const entryB = (events[0] as Extract<ConfirmEvent, { type: 'show' }>).entry;
  expect(store.settle(entryA, false)).toBe(false);
  expect(store.activeEntry()).toBe(entryB);
  store.settle(entryB, false);
  await expect(second).resolves.toBe(false);
});
```

Also cover: no Host, reentry, subscriber throw, settle once, duplicate owner inert, non-owner release, and owner cleanup settling its held entry.

- [ ] **Step 2: Run the focused suite and confirm failure**

Run:

```bash
yarn test __tests__/components/ui/Confirm/confirm.test.ts
```

Expected: FAIL because `createConfirmStore`, `ConfirmEvent` and owner leases do not exist.

- [ ] **Step 3: Implement `ConfirmStore`**

Use this explicit interface in `store.ts`:

```ts
export type ConfirmEntry = {
  id: number;
  options: Readonly<ConfirmOptions>;
  settled: boolean;
  resolve: (result: boolean) => void;
};

export type ConfirmEvent =
  | { type: 'show'; entry: ConfirmEntry }
  | { type: 'clear'; id: number };

export type ConfirmHostLease = {
  readonly ownerToken: symbol;
  release(heldEntry: ConfirmEntry | null): void;
};

export type ConfirmStore = {
  request(options: ConfirmOptions): Promise<boolean>;
  registerHost(
    subscriber: (event: ConfirmEvent) => void
  ): ConfirmHostLease | null;
  settle(entry: ConfirmEntry, result: boolean): boolean;
  activeEntry(): ConfirmEntry | null;
};
```

The implementation must follow this ordering:

```ts
function settle(entry: ConfirmEntry, result: boolean): boolean {
  if (entry.settled || active !== entry) return false;
  entry.settled = true;
  active = null;
  entry.resolve(result);
  const current = owner;
  if (current?.subscriber) {
    try {
      current.subscriber({ type: 'clear', id: entry.id });
    } catch (error) {
      log.error('ConfirmHost clear subscriber 抛错', error);
      if (owner?.token === current.token) owner = null;
    }
  }
  return true;
}
```

`request()` must check active, then owner, then create the Promise/entry, assign `active`, and synchronously send `show` in `try/catch`. A throwing subscriber settles `false` and invalidates only the captured owner. `release(heldEntry)` must compare its opaque token, remove the subscriber first, settle the matching held entry `false`, then release the owner; a rejected duplicate lease is represented by `null` and has no cleanup effect.

- [ ] **Step 4: Wire the facade and Host to Store events**

`confirm.ts` owns one Store instance:

```ts
const store = createConfirmStore(log);

export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  store.request(options);
export const registerConfirmHost = store.registerHost;
export const settleConfirm = store.settle;
```

These internal functions are imported only by `ConfirmHost.tsx`; `Confirm/index.ts` must continue exporting only `confirm`, `ConfirmHost`, and `ConfirmOptions`.

In the Host subscriber, write the synchronous ref before React state:

```ts
const subscriber = (event: ConfirmEvent) => {
  if (event.type === 'show') {
    pendingRef.current = event.entry;
    setEntry(event.entry);
    return;
  }
  if (pendingRef.current?.id === event.id) {
    pendingRef.current = null;
    setEntry((current) => (current?.id === event.id ? null : current));
  }
};
```

Register once. If registration returns `null`, keep that mount permanently inert. Cleanup calls `lease.release(pendingRef.current)`; confirm/cancel/backdrop/system-back all call `settleConfirm(entry, result)` and never call an entry resolver directly.

In `styles.ts`, give each Confirm action slot its own `flex: 1`; remove dependence on `Button block` for main-axis sizing.

- [ ] **Step 5: Run focused and package verification**

Run:

```bash
yarn test __tests__/components/ui/Confirm/confirm.test.ts
yarn typecheck
yarn lint src/components/ui/Confirm __tests__/components/ui/Confirm/confirm.test.ts
```

Expected: all pass; no `_subs`, flattened `ConfirmEntry`, or direct `.resolve(...)` remains outside the Store.

- [ ] **Step 6: Update docs and the runtime screen**

Document unique Host ownership, no-Host immediate `false`, active reentry `false`, subscriber failure `false`, and owner cleanup settling the active Promise. Add harness controls that:

```tsx
const runConfirm = async () => {
  const result = await confirm({
    title: 'Runtime Confirm',
    message: '验证 settle',
  });
  setConfirmResult(String(result));
};
```

Render `<ConfirmHost />` exactly once and expose the result as visible text.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Confirm __tests__/components/ui/Confirm/confirm.test.ts website/docs/components/confirm.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "fix: make confirm lifecycle deterministic"
```

---

### Task 4: Replace Toast pub/sub with pending/delivery lease CAS

**Files:**

- Create: `src/components/ui/Toast/store.ts`
- Modify: `src/components/ui/Toast/toast.ts`
- Modify: `src/components/ui/Toast/ToastHost.tsx`
- Modify: `src/components/ui/Toast/ToastHost.web.tsx`
- Modify: `src/components/ui/Toast/types.ts`
- Modify: `src/components/ui/Toast/index.ts`
- Modify: `__tests__/components/ui/Toast/toast.test.ts`
- Modify: `website/docs/components/toast.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: normalized public `ToastEntry` values created by `toast.ts`.
- Produces:
  - `ToastDelivery { entry: ToastEntry; ownerToken: symbol; leaseId: number }`
  - `createToastStore(log): ToastStore`
  - `registerToastHost(subscriber): ToastHostLease | null`
  - `publishToast(entry): void`
  - `completeToast(ownerToken, leaseId, entryId): boolean`
  - `isCurrentToastDelivery(delivery): boolean`.

- [ ] **Step 1: Add the CAS regression suite**

Write pure tests for latest-wins, atomic drain, duplicate owner, throw/retry and old callbacks. Include the reentrant B case:

```ts
test('投递 A 时同步发布 B，A 随后抛错也只回存 B', () => {
  const store = createToastStore(testLog);
  const a = entry(1, 'A');
  const b = entry(2, 'B');
  store.publish(a);
  const lease = store.registerHost((delivery) => {
    expect(delivery.entry).toBe(a);
    store.publish(b);
    throw new Error('host failed after B');
  });

  expect(lease).toBeNull();
  expect(store.pendingEntry()).toBe(b);
  expect(store.currentDelivery()).toBeNull();

  const deliveries: ToastDelivery[] = [];
  const next = store.registerHost((delivery) => deliveries.push(delivery));
  expect(next).not.toBeNull();
  expect(deliveries[0]?.entry).toBe(b);
});
```

Add separate assertions for: `complete(A)` before throw does not revive A; owner cleanup during callback preserves latest pending; owner A cleanup then owner B receives the same entry under a new `leaseId`; stale `complete` fails all three identity checks.

- [ ] **Step 2: Run the focused suite and confirm failure**

Run:

```bash
yarn test __tests__/components/ui/Toast/toast.test.ts
```

Expected: FAIL because `createToastStore` and `ToastDelivery` do not exist.

- [ ] **Step 3: Implement the pure Store**

Use this interface:

```ts
export type ToastDelivery = {
  entry: ToastEntry;
  ownerToken: symbol;
  leaseId: number;
};

export type ToastHostLease = {
  readonly ownerToken: symbol;
  release(): void;
};

export type ToastStore = {
  publish(entry: ToastEntry): void;
  registerHost(
    subscriber: (delivery: ToastDelivery) => void
  ): ToastHostLease | null;
  complete(ownerToken: symbol, leaseId: number, entryId: number): boolean;
  isCurrent(delivery: ToastDelivery): boolean;
  pendingEntry(): ToastEntry | null;
  currentDelivery(): ToastDelivery | null;
};
```

`beginDelivery()` must assign delivery before invoking the subscriber:

```ts
function beginDelivery(entry: ToastEntry, capturedOwner: Owner): void {
  const delivery = {
    entry,
    ownerToken: capturedOwner.token,
    leaseId: ++leaseId,
  };
  pending = null;
  delivered = delivery;
  try {
    capturedOwner.subscriber(delivery);
  } catch (error) {
    log.error('ToastHost subscriber 抛错', error);
    if (owner?.token !== capturedOwner.token) return;
    owner = null;
    if (delivered?.ownerToken === capturedOwner.token) {
      pending = delivered.entry;
      delivered = null;
    }
  }
}
```

`publish(entry)` always replaces the current logical message: with no owner it sets `pending`; with an owner it begins a new delivery immediately. `complete()` requires owner token, lease id and entry id equality. `release()` first invalidates the owner, then moves that owner’s unfinished current delivery back to `pending`, preserving a newer pending entry under latest-wins rules.

- [ ] **Step 4: Wire `toast.ts` and both Hosts**

`toast.ts` keeps public input normalization but replaces `_subs.forEach` with `publishToast(entry)`. No Host is a supported path and must not warn.

Both Hosts keep this synchronous ref:

```ts
type DeliveryIdentity = {
  ownerToken: symbol;
  leaseId: number;
  entryId: number;
};
const currentDeliveryRef = useRef<DeliveryIdentity | null>(null);
```

The subscriber must cancel old timer/RAF/animations, assign the identity ref, then call React state setters. Every timer, RAF, native animation completion and Web transition cleanup checks both the ref and `isCurrentToastDelivery(delivery)` before changing UI or calling `completeToast(...)`. Cleanup order is: clear the ref, cancel all callbacks/animations, then `lease.release()`. A duplicate Host keeps no subscriber and never auto-promotes.

- [ ] **Step 5: Run focused verification**

Run:

```bash
yarn test __tests__/components/ui/Toast/toast.test.ts
yarn typecheck
yarn lint src/components/ui/Toast __tests__/components/ui/Toast/toast.test.ts
```

Expected: all pass; `toast()` before Host retains the newest entry, and no `_subs` export remains.

- [ ] **Step 6: Update docs and manual controls**

Document latest-wins before Host, one owner, incomplete delivery requeue on owner cleanup, and internal-only entry/lease identity. Add three harness actions: publish before toggling Host on, publish A then B quickly, and remount the owner to verify B re-delivery.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Toast __tests__/components/ui/Toast/toast.test.ts website/docs/components/toast.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "fix: make toast delivery lease safe"
```

---

### Task 5: Normalize Pulse once and split only the platform driver

**Files:**

- Create: `src/components/ui/Pulse/normalizePulseOptions.ts`
- Create: `src/components/ui/Pulse/usePulseDriver.ts`
- Create: `src/components/ui/Pulse/usePulseDriver.web.ts`
- Create: `__tests__/components/ui/Pulse/normalizePulseOptions.test.ts`
- Modify: `src/components/ui/Pulse/usePulse.ts`
- Delete: `src/components/ui/Pulse/usePulse.web.ts`
- Modify: `src/components/ui/Pulse/Pulse.tsx`
- Modify: `src/components/ui/Pulse/PulseDot.tsx`
- Modify: `src/components/ui/Pulse/types.ts`
- Modify: `src/components/ui/Pulse/index.ts`
- Modify: `src/components/ui/Skeleton/Skeleton.tsx`
- Modify: `website/docs/components/pulse.mdx`
- Modify: `website/docs/components/skeleton.mdx`
- Modify: `website/docs/design/tokens/motion.md`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: public `PulseOptions`, `usePrefersReducedMotion(): boolean`.
- Produces:
  - `PulseDefaults { duration: number; delay: number; from: number; to: number }`
  - `PulseDiagnostic { field: keyof PulseDefaults; received: unknown; fallback: number }`
  - `NormalizedPulseOptions extends PulseDefaults { isStatic: boolean; diagnostics: readonly PulseDiagnostic[] }`
  - `normalizePulseOptions(input, defaults): NormalizedPulseOptions`
  - `shouldAnimatePulse(normalized, reducedMotion): boolean`
  - internal `usePulseWithDefaults(options, defaults, scope)` and public `usePulse(options?)`.

- [ ] **Step 1: Write boundary tests**

Create tests using exact defaults:

```ts
const BASE = { duration: 700, delay: 0, from: 0.6, to: 1 } as const;
const DOT = { ...BASE, from: 0.5 } as const;

test.each([
  [{ duration: 0 }, 'duration', 700],
  [{ duration: 2 ** 31 }, 'duration', 700],
  [{ delay: -1 }, 'delay', 0],
  [{ from: Number.NaN }, 'from', 0.6],
  [{ to: Number.POSITIVE_INFINITY }, 'to', 1],
])('非法输入 %p 使用 fallback', (input, field, fallback) => {
  const result = normalizePulseOptions(input, BASE);
  expect(result[field as keyof typeof BASE]).toBe(fallback);
  expect(result.diagnostics.map((item) => item.field)).toContain(field);
});

test('from === to 为静态，from > to 保持反向值', () => {
  expect(normalizePulseOptions({ from: 0.5, to: 0.5 }, DOT).isStatic).toBe(
    true
  );
  expect(normalizePulseOptions({ from: 0.9, to: 0.2 }, BASE)).toMatchObject({
    from: 0.9,
    to: 0.2,
    isStatic: false,
  });
});

test('静态或 reduced motion 都不启动 driver', () => {
  const moving = normalizePulseOptions({}, BASE);
  const still = normalizePulseOptions({ from: 1, to: 1 }, BASE);
  expect(shouldAnimatePulse(moving, true)).toBe(false);
  expect(shouldAnimatePulse(still, false)).toBe(false);
});
```

- [ ] **Step 2: Run and confirm failure**

Run:

```bash
yarn test __tests__/components/ui/Pulse/normalizePulseOptions.test.ts
```

Expected: FAIL because the normalization module is absent.

- [ ] **Step 3: Implement the pure normalizer**

Use strict field validation without clamp/truncation:

```ts
const MAX_TIMER = 2 ** 31;

export function normalizePulseOptions(
  input: PulseOptions = {},
  defaults: PulseDefaults
): NormalizedPulseOptions {
  const diagnostics: PulseDiagnostic[] = [];
  const pick = (
    field: keyof PulseDefaults,
    valid: (value: number) => boolean
  ): number => {
    const received = input[field];
    if (received === undefined) return defaults[field];
    if (typeof received === 'number' && valid(received)) return received;
    diagnostics.push({ field, received, fallback: defaults[field] });
    return defaults[field];
  };
  const duration = pick(
    'duration',
    (value) => Number.isFinite(value) && value >= 1 && value < MAX_TIMER
  );
  const delay = pick(
    'delay',
    (value) => Number.isFinite(value) && value >= 0 && value < MAX_TIMER
  );
  const from = pick(
    'from',
    (value) => Number.isFinite(value) && value >= 0 && value <= 1
  );
  const to = pick(
    'to',
    (value) => Number.isFinite(value) && value >= 0 && value <= 1
  );
  return { duration, delay, from, to, isStatic: from === to, diagnostics };
}

export const shouldAnimatePulse = (
  options: NormalizedPulseOptions,
  reducedMotion: boolean
): boolean => !reducedMotion && !options.isStatic;
```

- [ ] **Step 4: Make one common hook own normalization and diagnostics**

`usePulse.ts` is the only public implementation:

```ts
const BASE_DEFAULTS: PulseDefaults = {
  duration: 700,
  delay: 0,
  from: 0.6,
  to: 1,
};

export function usePulseWithDefaults(
  options: PulseOptions | undefined,
  defaults: PulseDefaults,
  scope: string
) {
  const normalized = useMemo(
    () => normalizePulseOptions(options, defaults),
    [
      options?.duration,
      options?.delay,
      options?.from,
      options?.to,
      defaults.duration,
      defaults.delay,
      defaults.from,
      defaults.to,
    ]
  );
  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      for (const item of normalized.diagnostics) {
        loggerForScope(scope).warn(
          `${item.field}=${String(item.received)} 无效，已回退为 ${item.fallback}`
        );
      }
    }
  }, [normalized.diagnostics, scope]);
  return usePulseDriver(normalized);
}

export function usePulse(options: PulseOptions = {}) {
  return usePulseWithDefaults(options, BASE_DEFAULTS, 'Pulse');
}
```

Instantiate the three loggers at module scope and make `loggerForScope` an
exhaustive switch over the fixed scopes `Pulse`, `PulseDot`, and `Skeleton`;
it must never create a logger during render.

The native/Web `usePulseDriver` siblings accept only `NormalizedPulseOptions`. Both call `shouldAnimatePulse`; reduced/static output is `{ opacity: options.to }`. Native starts `withRepeat` only when true. Web validates before creating timeout/interval, cancels both on cleanup, and returns narrow RNW transition properties instead of reading raw public props.

`PulseDot` and `Skeleton` call `usePulseWithDefaults(..., { duration: 700, delay: 0, from: 0.5, to: 1 }, ...)`. Delete `usePulse.web.ts`.

- [ ] **Step 5: Run focused and platform compile checks**

Run:

```bash
yarn test __tests__/components/ui/Pulse/normalizePulseOptions.test.ts
yarn typecheck
yarn prepare
```

Expected: pass; generated module contains common `usePulse` plus both resolved driver artifacts, and no raw duration reaches `setInterval`/`withTiming`.

- [ ] **Step 6: Update docs and runtime screen**

Document `[1, 2^31)` duration, `[0, 2^31)` delay, opacity `[0,1]`, no implicit clamp/rounding, reverse pulse, `from === to`, and reduced-motion static `to`. Remove claims that Web runs a worklet. Add harness controls for invalid duration, reverse opacity, equal endpoints and reduced-motion observation.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Pulse src/components/ui/Skeleton/Skeleton.tsx __tests__/components/ui/Pulse/normalizePulseOptions.test.ts website/docs/components/pulse.mdx website/docs/components/skeleton.mdx website/docs/design/tokens/motion.md manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "fix: normalize pulse animation state"
```

---

### Task 6: Build a lockfile-derived RN 0.86.2 runtime harness

**Files:**

- Create: `scripts/create-runtime-api-harness.js`
- Create: `scripts/create-runtime-api-harness.d.ts`
- Create: `__tests__/scripts/create-runtime-api-harness.test.ts`
- Modify: `package.json`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`
- Modify: `README.md`

**Interfaces:**

- Consumes:
  - installed `@react-native-community/cli@20.1.0`
  - installed `@react-native-community/template@0.86.2`
  - template manifest React `19.2.3` / RN `0.86.2`
  - root pack tarball and root `.yarn/releases/yarn-4.11.0.cjs`
  - `manual-tests/runtime-api/RuntimeApiScreen.tsx`.
- Produces:
  - root command `yarn create:runtime-harness`
  - `buildScaffoldArgs(templatePath, targetDirectory): string[]`
  - `buildHarnessManifest(rootManifest, resolvedVersions, tarballPath): object`
  - a generated `RuntimeApiHarness` in an owned system temp directory, ready for native build/manual execution.

- [ ] **Step 1: Write pure harness contract tests**

```ts
test('脚手架 argv 同时固定 RN 和本地 template', () => {
  expect(buildScaffoldArgs('/installed/template', '/tmp/runtime-123')).toEqual([
    'init',
    'RuntimeApiHarness',
    '--version',
    '0.86.2',
    '--template',
    '/installed/template',
    '--pm',
    'yarn',
    '--directory',
    '/tmp/runtime-123/RuntimeApiHarness',
    '--skip-install',
    '--skip-git-init',
  ]);
});

test('manifest 使用本地 tarball并完整提供 runtime peers', () => {
  const manifest = buildHarnessManifest(
    rootManifest,
    resolved,
    '/tmp/design.tgz'
  );
  expect(manifest.dependencies).toMatchObject({
    '@unif/react-native-design': 'file:/tmp/design.tgz',
    'react': '19.2.3',
    'react-native': '0.86.2',
    'react-native-gesture-handler': '3.1.0',
    'react-native-reanimated-carousel': '5.0.0',
    'react-native-reanimated': '4.5.3',
    'react-native-worklets': '0.11.3',
  });
});
```

Add failures for CLI/template version drift, template React/RN drift, missing lock checksum, caller-supplied directory, and any path under `example/`.
Add a provider-map fixture containing every current non-optional root peer:
`@sbaiahmed1/react-native-blur`, React, RN, RNGH, RNRC, Reanimated,
safe-area-context, SVG, and Worklets. Removing any one concrete provider must
make the helper throw with that peer name.

- [ ] **Step 2: Run and confirm failure**

Run:

```bash
yarn test __tests__/scripts/create-runtime-api-harness.test.ts
```

Expected: FAIL because harness helpers do not exist.

- [ ] **Step 3: Implement deterministic scaffold preparation**

The script must:

1. create its own parent with `fs.mkdtempSync(path.join(os.tmpdir(), 'unif-runtime-api-'))`;
2. run `yarn prepare`;
3. run `yarn pack --out <owned-temp>/unif-react-native-design.tgz`;
4. resolve CLI/template through `require.resolve('<pkg>/package.json')`;
5. assert exact package versions and the template manifest’s React/RN values;
6. locate both packages in `yarn.lock` and require non-empty `checksum:` entries;
7. invoke local `rnc-cli` via `process.execPath` with `buildScaffoldArgs(...)`;
8. validate generated `package.json`, `android/`, `ios/`, `babel.config.js`, `metro.config.js`, and CLI `20.1.0`;
9. enumerate every non-optional key in root `peerDependencies`, resolve its
   exact locator version from the current install/`yarn.lock`, fail on any
   missing provider, and write all of them to the harness manifest; this
   includes `@sbaiahmed1/react-native-blur`, safe-area-context and SVG in
   addition to React/RN and the four runtime packages;
10. copy the root Yarn 4.11 release into the app, write `nodeLinker: node-modules`, and install immutable dependencies;
11. configure `react-native-worklets/plugin` last in Babel, RNGH root import/provider, Metro config, and copy the checked-in screen;
12. assert the generated Podfile and Android Gradle/settings files still
    contain the RN 0.86.2 template markers captured from the installed
    template, then run `bundle exec pod install` from generated `ios/`;
13. print the final absolute harness path and every exact resolved provider
    version, and keep the directory for the manual build.

Use `execFileSync` argument arrays for every child process. Do not accept a destination argument, do not use shell interpolation, and never recursively delete anything except the exact owned temp path after a failed generation.

Export and declare:

```ts
export declare const EXPECTED: {
  cli: '20.1.0';
  template: '0.86.2';
  react: '19.2.3';
  reactNative: '0.86.2';
};
export declare function buildScaffoldArgs(
  templatePath: string,
  targetDirectory: string
): string[];
export declare function buildHarnessManifest(
  rootManifest: Record<string, unknown>,
  resolvedVersions: Readonly<Record<string, string>>,
  tarballPath: string
): Record<string, unknown>;
```

- [ ] **Step 4: Register the command and finish the base screen**

Add:

```json
{
  "scripts": {
    "create:runtime-harness": "node scripts/create-runtime-api-harness.js"
  }
}
```

The screen must import only the package root and exercise `ThemeProvider`, `GestureHandlerRootView`, one `ConfirmHost`, one toggleable `ToastHost`, Confirm, Toast, Pulse, PulseDot and Skeleton. It must compile under strict RN 0.86 types and give every Button/IconButton a real handler.

- [ ] **Step 5: Run pure verification and a real generation**

Run:

```bash
yarn test __tests__/scripts/create-runtime-api-harness.test.ts
yarn typecheck
yarn prepare
yarn create:runtime-harness
```

Expected: tests/build pass; the command prints a temp path whose manifest is RN 0.86.2/React 19.2.3 and whose pods installed successfully. Record the path for the later plans; do not commit the generated app.

Run before and after generation:

```bash
git status --short -- example
git diff --exit-code -- example
git diff --cached --exit-code -- example
```

Expected: every invocation is empty/exits 0 before and after generation, proving the harness did not use, alter, stage, or create files in the legacy example shell.

- [ ] **Step 6: Document the harness**

In README, explain that `yarn create:runtime-harness` packs the current source, uses the lockfile-pinned official template, creates only a system-temp app, and intentionally ignores `example/`. Include the printed follow-up commands:

```bash
yarn android
yarn ios
```

These are run inside the generated path during final manual verification, not from this repository.

- [ ] **Step 7: Commit**

```bash
git add scripts/create-runtime-api-harness.js scripts/create-runtime-api-harness.d.ts __tests__/scripts/create-runtime-api-harness.test.ts manual-tests/runtime-api/RuntimeApiScreen.tsx package.json README.md
git diff --cached --name-only
git commit -m "test: add react native 0.86 runtime harness"
```

---

## Plan Verification Gate

- [ ] Run all plan-local checks:

```bash
yarn install --immutable
yarn check:runtime-peers
yarn test __tests__/scripts/check-runtime-peers.test.ts __tests__/scripts/create-runtime-api-harness.test.ts __tests__/components/ui/Confirm/confirm.test.ts __tests__/components/ui/Toast/toast.test.ts __tests__/components/ui/Pulse/normalizePulseOptions.test.ts
yarn typecheck
yarn lint
yarn prepare
```

- [ ] Confirm no stale public support text:

```bash
rg -n "React Native 0\\.85|RN 0\\.85|0\\.85\\+|react-native-worklets[^\\n]*0\\.(9|10)" README.md website/docs package.json website/package.json
```

Expected: no current-support matches.

- [ ] Confirm ownership internals are not publicly exported:

```bash
rg -n "ConfirmEntry|ConfirmEvent|ConfirmHostLease|ToastDelivery|ToastHostLease" src/components/ui/index.ts src/index.tsx lib/typescript/src/index.d.ts
```

Expected: no matches.

- [ ] Inspect `/Users/liulijun/tongyi/design/skills/skills/design/` and record affected sections for the final sync: RN/React/Node matrix, Worklets Babel/Metro, unique Host semantics, Pulse ranges and reduced motion. Do not report “synced” until the final plan edits and validates that separate repository.

- [ ] Verify repository boundaries:

```bash
git status --short
git log --oneline --max-count=6
```

Expected: implementation commits contain no `AGENTS.md`, `CLAUDE.md`, `example/`, generated harness, or external Skill repository files.
