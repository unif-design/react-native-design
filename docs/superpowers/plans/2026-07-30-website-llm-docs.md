# Website, LLM, Documentation, and Design Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将最终源码契约同步到 Website、事务化 LLM mirror、部署安全链接和独立 `skills/design`，并形成可审计的完整验证记录。

**Architecture:** LLM 生成器拆为 Markdown/MDX 转换、canonical route map 和三目标事务提交三个纯边界，所有输入先在内存验证，再用 sibling staging + backup rollback 替换正式 bundle。Website docs 继续作为完整 API 唯一来源；消费侧 Skill 只维护安装矩阵、关键差异、模板和 doctor，并在独立仓库单独提交/验证。最终 verification matrix 只记录真实执行结果。

**Tech Stack:** Node.js、Docusaurus 3、React Native Web、smol-toml 1.7、Yarn 4.11、React Native 0.86.2、Python 3/Bash Skill validators

## Global Constraints

- 必须在前三份实施计划全部完成后执行；最终源码类型是 Website API 表、示例、LLM mirror 和 Skill 手写指导的唯一依据。
- Website docs 是 LLM 完整 API 的唯一内容来源；不得在 README、AGENTS/CLAUDE 或 Skill 中复制全量 props。
- 每个 source 只生成一个 canonical mirror：`md/<保留大小写的 source relSlug>.md`；frontmatter slug 只是 route alias。
- 所有生成链接使用相对路径，不硬编码域名、`/docs/...` 部署根或 `/react-native-design/`。
- unknown Demo、失效内部链接、unsafe path、大小写/Unicode collision 必须在 staging 前 fail-fast。
- 正式生成只可替换 `website/static/llms.txt`、`website/static/llms-full.txt`、`website/static/md/`；`static/img` 等其他资产绝不改写。
- `AGENTS.md` / `CLAUDE.md` 由另一个会话独占；本计划只读取最终内容并验证门禁，不编辑、不暂存、不提交。
- 消费侧仓库固定为 `/Users/liulijun/tongyi/design/skills`，目标固定为该仓相对路径 `skills/design/`；不得写成本仓同名目录、`skills/unif-design/` 或 `skills/umeng-share/`。
- Skill 仓是独立 git 仓库；修改前需要实际写权限，单独显式暂存、提交，不能混入本仓 commit。
- 本轮存在平台、依赖和 breaking API 变更，`skills/design` version 从 `0.3.1` 升为 `0.4.0`。
- Skill 交付必须是三态之一：已同步（列文件/version/验证）、已检查无需更新（含验证）、未能检查/同步/验证（列原因与路径）；doctor/validator 失败不得使用前两种完成态。
- 用户要求忽略 CI 测试；本计划仍执行与本次改动直接相关的本地 typecheck、Jest、Website build、生成器 fault-injection、native harness 和 Skill doctor/validator。

---

## File Structure

### Repository configuration

- `scripts/check-config.js` / `.d.ts`：用 `smol-toml` 解析 `.pr_agent.toml`。
- `__tests__/scripts/check-config.test.ts`：合法/非法 TOML 的纯 parser seam。
- `.pr_agent.toml`：只修复无效 quoting，不改变 review 策略。

### LLM generator

- `website/scripts/llms/markdown.js`：frontmatter、code protection、balanced export Demo、LiveDemo/invocation 和正文链接 token。
- `website/scripts/llms/routes.js`：safe relSlug、NFC/casefold collision、alias→canonical map 和相对 mirror link。
- `website/scripts/llms/bundle.js`：内存 bundle、staging validation、三目标 commit/rollback。
- `website/scripts/build-llms.js`：薄 CLI，读取真实 Website config/docs 并调用上述模块。
- `website/scripts/build-llms.test.js`：Node assert + 临时目录 + 注入 file ops 的完整单测/集成测试。

### Final docs and evidence

- `website/docs/**/*.md(x)`：最终 API/行为/支持矩阵审计。
- `website/static/llms.txt`、`llms-full.txt`、`md/`：事务生成并提交的镜像。
- `docs/superpowers/verification/2026-07-30-runtime-api-remediation.md`：命令、平台和人工 case 的真实结果。

### Independent consumer Skill repository

- `/Users/liulijun/tongyi/design/skills/skills/design/SKILL.md`
- `/Users/liulijun/tongyi/design/skills/skills/design/references/a11y.md`
- `/Users/liulijun/tongyi/design/skills/skills/design/references/recipes.md`
- `/Users/liulijun/tongyi/design/skills/skills/design/references/theming.md`
- `/Users/liulijun/tongyi/design/skills/skills/design/assets/App.host-wiring.tsx`
- `/Users/liulijun/tongyi/design/skills/skills/design/assets/babel.config.js`
- `/Users/liulijun/tongyi/design/skills/skills/design/assets/metro.config.js`
- `/Users/liulijun/tongyi/design/skills/skills/design/scripts/doctor.sh`
- `/Users/liulijun/tongyi/design/skills/skills/design/scripts/doctor.test.sh`

---

### Task 1: Parse repository configuration and repair Website baseline examples

**Files:**

- Create: `scripts/check-config.js`
- Create: `scripts/check-config.d.ts`
- Create: `__tests__/scripts/check-config.test.ts`
- Modify: `.pr_agent.toml`
- Modify: `package.json`
- Modify: `yarn.lock`
- Modify: `website/src/pages/index.tsx`

**Interfaces:**

- Consumes: `smol-toml.parse(string)`.
- Produces:
  - root `yarn check:config`
  - `parseTomlConfig(source: string, filename: string): Record<string, unknown>`
  - valid homepage examples using final ThemeProvider/Button API.

- [ ] **Step 1: Add failing parser tests**

```ts
import { describe, expect, test } from '@jest/globals';
import { parseTomlConfig } from '../../scripts/check-config';

test('当前 PR Agent 中文/双引号内容可解析', () => {
  const result = parseTomlConfig(
    `[pr_code_suggestions]\nextra_instructions = '不要给"考虑重构"这种空泛建议。'\n`,
    '.pr_agent.toml'
  );
  expect(result).toEqual({
    pr_code_suggestions: {
      extra_instructions: '不要给"考虑重构"这种空泛建议。',
    },
  });
});

test('错误包含文件名和 parser 原因', () => {
  expect(() =>
    parseTomlConfig(
      '[x]\nvalue = "不要给"考虑重构"这种空泛建议"\n',
      'broken.toml'
    )
  ).toThrow(/broken\.toml/u);
});
```

- [ ] **Step 2: Run the focused test**

```bash
yarn test __tests__/scripts/check-config.test.ts
```

Expected: FAIL because the checker does not exist.

- [ ] **Step 3: Implement the checker**

```js
#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parse } = require('smol-toml');

function parseTomlConfig(source, filename) {
  try {
    return parse(source);
  } catch (error) {
    throw new Error(`${filename}: ${error.message}`, { cause: error });
  }
}

function main() {
  const filename = path.resolve(__dirname, '../.pr_agent.toml');
  parseTomlConfig(fs.readFileSync(filename, 'utf8'), filename);
  console.log('[check-config] .pr_agent.toml OK');
}

module.exports = { parseTomlConfig };

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[check-config] ${error.message}`);
    process.exitCode = 1;
  }
}
```

Declare the function in `scripts/check-config.d.ts`.

- [ ] **Step 4: Fix only TOML quoting and add the dependency/command**

Change the invalid line to a TOML literal string:

```toml
extra_instructions = '用中文,引用具体行号,给可落地的代码改进(不要给"考虑重构"这种空泛建议)。'
```

Add root `devDependencies.smol-toml = "^1.7.1"` and:

```json
{
  "scripts": {
    "check:config": "node scripts/check-config.js"
  }
}
```

Run `yarn install`; do not change any review/CI policy text.

- [ ] **Step 5: Repair final homepage sample APIs**

In `website/src/pages/index.tsx`, replace the complete displayed snippet—not only one token—with a self-contained current API example:

```tsx
import { useState } from 'react';
import { Button, ThemeProvider } from '@unif/react-native-design';

export function App() {
  const [started, setStarted] = useState(false);
  return (
    <ThemeProvider forceScheme="dark">
      <Button
        label={started ? '已开始' : '开始使用'}
        onPress={() => setStarted(true)}
      />
    </ThemeProvider>
  );
}
```

Ensure executable page JSX and rendered code tokens both use final required Button/IconButton handlers.

- [ ] **Step 6: Verify and commit**

```bash
yarn check:config
yarn test __tests__/scripts/check-config.test.ts
yarn workspace @unif/react-native-design-website typecheck
yarn typecheck
```

```bash
git add scripts/check-config.js scripts/check-config.d.ts __tests__/scripts/check-config.test.ts .pr_agent.toml package.json yarn.lock website/src/pages/index.tsx
git diff --cached --name-only
git commit -m "fix: validate repository config"
```

---

### Task 2: Parse exported LiveDemo definitions without touching code examples

**Files:**

- Create: `website/scripts/llms/markdown.js`
- Modify: `website/scripts/build-llms.test.js`
- Modify: `website/scripts/build-llms.js`

**Interfaces:**

- Consumes: one MD/MDX body string.
- Produces:
  - `protectCode(source): ProtectedSource`
  - `findBalancedEnd(source, start): number`
  - `collectExportedDemos(source): DemoCollection`
  - `normalizeDemoDefinition(definition, sourceName): string`
  - `convertMdxBody(source, sourceName): string`.

- [ ] **Step 1: Replace the minimal tests with parser fixtures**

Keep existing frontmatter/index helper assertions. The file remains a dependency-free Node script, so define its tiny synchronous runner before the fixtures:

```js
function test(name, run) {
  try {
    run();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n`);
    throw error;
  }
}

const count = (value, needle) => value.split(needle).length - 1;
```

Then add:

```js
test('exported function/const and multiple demos are emitted once', () => {
  const source = [
    'export const SHARED = { label: "共享" };',
    'export function FirstDemo() {',
    '  const [on, setOn] = useState(false);',
    '  return (',
    '    <LiveDemo>',
    '      <Button label={on ? SHARED.label : "关"} onPress={() => setOn(!on)} />',
    '    </LiveDemo>',
    '  );',
    '}',
    'export const SecondDemo = () => {',
    '  const value = { nested: { ok: true } };',
    '  return <Text>{String(value.nested.ok)}</Text>;',
    '};',
    '<FirstDemo />',
    '<SecondDemo />',
  ].join('\n');
  const output = convertMdxBody(source, 'multi.mdx');
  assert.strictEqual(count(output, 'function FirstDemo'), 1);
  assert.strictEqual(count(output, 'const SecondDemo'), 1);
  assert.strictEqual(count(output, 'const SHARED'), 1);
  assert.strictEqual(count(output, '<FirstDemo />'), 0);
  assert.strictEqual(count(output, '<SecondDemo />'), 0);
  assert.strictEqual(count(output, 'LiveDemo'), 0);
});
```

Add a direct `<LiveDemo>` preceded by a non-Demo `export const` support definition, nested JSX/object/hook, and unknown `<MissingDemo />` failure. Assert the support definition is prepended to the first generated `tsx` block exactly once and does not remain as bare MDX.

- [ ] **Step 2: Add fence and inline-code protection fixtures**

```js
const protectedText = [
  '~~~tsx',
  'export const FakeDemo = () => <LiveDemo />;',
  '<UnknownDemo />',
  '~~~',
  '正文 `export const InlineDemo = () => <LiveDemo />` 保留。',
].join('\n');
assert.strictEqual(
  convertMdxBody(protectedText, 'protected.mdx'),
  protectedText
);
```

Also test a longer backtick fence whose inner content contains a shorter fence run; only the same character/run length closes it.

- [ ] **Step 3: Run the Node test**

```bash
node website/scripts/build-llms.test.js
```

Expected: FAIL because `convertMdxBody` and exported Demo support do not exist.

- [ ] **Step 4: Implement protected ranges**

`protectCode` scans lines for an opener matching `^ {0,3}(\x60{3,}|~{3,})` and closes only on the same character and run length. Replace each fenced range with a sentinel such as `\u0000PROTECTED_0\u0000`.

Then scan non-fence text for inline backtick runs. A run closes only on the same number of backticks. Protect the complete span including delimiters. Return:

```js
{
  source: maskedSource,
  restore(value) {
    return value.replace(/\u0000PROTECTED_(\d+)\u0000/gu, (_match, index) =>
      protectedRanges[Number(index)]
    );
  },
}
```

- [ ] **Step 5: Implement a balanced JavaScript/JSX scanner**

`findBalancedEnd` walks characters while tracking:

- `()`, `[]`, `{}` stack;
- single/double/template strings and escape state;
- line/block comments;
- `${...}` nested template expressions.

It returns only when the export declaration’s outer stack is empty and the declaration ends at `;` or a function body closing brace. It throws with source position for mismatched/unclosed input.

Implement the scanner as an explicit context stack, not a regular-expression suffix guess:

```js
const CLOSING_TO_OPENING = {
  ')': '(',
  ']': '[',
  '}': '{',
};

function findBalancedEnd(source, start) {
  const root = { kind: 'code', terminator: null, stack: [] };
  const contexts = [root];
  const isFunctionDeclaration = /^export\s+(?:async\s+)?function\b/u.test(
    source.slice(start)
  );
  let sawFunctionBody = false;

  for (let index = start; index < source.length; ) {
    const context = contexts.at(-1);
    const character = source[index];
    const next = source[index + 1];

    if (context.kind === 'line-comment') {
      if (character === '\n') contexts.pop();
      else index += 1;
      continue;
    }
    if (context.kind === 'block-comment') {
      if (character === '*' && next === '/') {
        contexts.pop();
        index += 2;
      } else {
        index += 1;
      }
      continue;
    }
    if (context.kind === 'string') {
      if (character === '\\') index += 2;
      else if (character === context.quote) {
        contexts.pop();
        index += 1;
      } else {
        index += 1;
      }
      continue;
    }
    if (context.kind === 'template') {
      if (character === '\\') {
        index += 2;
      } else if (character === '`') {
        contexts.pop();
        index += 1;
      } else if (character === '$' && next === '{') {
        contexts.push({ kind: 'code', terminator: '}', stack: [] });
        index += 2;
      } else {
        index += 1;
      }
      continue;
    }

    if (character === '/' && next === '/') {
      contexts.push({ kind: 'line-comment' });
      index += 2;
      continue;
    }
    if (character === '/' && next === '*') {
      contexts.push({ kind: 'block-comment' });
      index += 2;
      continue;
    }
    if (character === "'" || character === '"') {
      contexts.push({ kind: 'string', quote: character });
      index += 1;
      continue;
    }
    if (character === '`') {
      contexts.push({ kind: 'template' });
      index += 1;
      continue;
    }
    if (character === '(' || character === '[' || character === '{') {
      if (
        context === root &&
        isFunctionDeclaration &&
        character === '{' &&
        context.stack.length === 0
      ) {
        sawFunctionBody = true;
      }
      context.stack.push(character);
      index += 1;
      continue;
    }
    if (Object.hasOwn(CLOSING_TO_OPENING, character)) {
      if (context.terminator === character && context.stack.length === 0) {
        contexts.pop();
        index += 1;
        continue;
      }
      const opening = context.stack.pop();
      if (opening !== CLOSING_TO_OPENING[character]) {
        throw new Error(`mismatched ${character} at ${index}`);
      }
      index += 1;
      if (
        context === root &&
        isFunctionDeclaration &&
        sawFunctionBody &&
        context.stack.length === 0 &&
        character === '}'
      ) {
        while (source[index] === ' ' || source[index] === '\t') index += 1;
        return source[index] === ';' ? index + 1 : index;
      }
      continue;
    }
    if (context === root && context.stack.length === 0 && character === ';') {
      return index + 1;
    }
    index += 1;
  }

  throw new Error(`unclosed export declaration at ${start}`);
}
```

Add direct unit cases for comment delimiters, escaped quotes, nested template expressions, mismatched delimiters and EOF before closure so every state above is exercised.

- [ ] **Step 6: Collect support definitions and replace exported Demos**

On protected source, recognize top-level declarations only:

```js
/^ {0,3}export\s+(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\b/gmu
/^ {0,3}export\s+const\s+([A-Za-z_$][\w$]*)\s*=/gmu
```

Run every matched declaration through `findBalancedEnd`, preserve source order, and replace its range with an empty line:

- names ending in `Demo` go into the Demo map; reject duplicates;
- other named declarations go into an ordered `supportDefinitions` list;
- remove only the leading `export ` from stored code.

`normalizeDemoDefinition` converts unprotected `<LiveDemo ...>...</LiveDemo>` wrappers inside a stored Demo definition to React fragments while retaining the surrounding function/const, hooks, objects and JSX. It uses the same balanced tag conversion as direct LiveDemo handling, rejects mismatched/multiple overlapping wrappers, and asserts the normalized definition contains no unprotected `LiveDemo`.

Second pass:

- direct `<LiveDemo ...>body</LiveDemo>` → one `tsx` fence containing body;
- `<NameDemo />` → one `tsx` fence containing the normalized collected definition;
- unknown self-closing names ending `Demo` → throw `${sourceName}: unknown Demo NameDemo`;
- ordinary MDX/Docusaurus components remain.

Prepend the ordered `supportDefinitions` to the first generated `tsx` fence in that document, separated by one blank line, and mark them emitted. Later fences do not duplicate them. If support definitions exist but the document produces no direct or named Demo fence, throw an orphan-support error instead of silently dropping executable source.

Remove import declarations only outside protected ranges. After supported function/const collection, any remaining top-level `export` throws `${sourceName}: unsupported export at <line>` rather than being silently dropped. Final scan rejects remaining unprotected `LiveDemo`, bare support sentinels, or self-closing `*Demo`. Restore protected content last. This makes current `Logo`, `Grid`, `Thumbnail`, `Search`, and `TabBar` examples retain their helper wrapper/data exactly once.

- [ ] **Step 7: Keep `build-llms.js` as a temporary facade and verify**

Import/re-export `parseFrontmatter`, `convertMdxBody` and existing formatting helpers through `build-llms.js`, but do not yet replace filesystem generation; Tasks 3–4 do that.

```bash
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website typecheck
```

- [ ] **Step 8: Commit**

```bash
git add website/scripts/llms/markdown.js website/scripts/build-llms.js website/scripts/build-llms.test.js
git diff --cached --name-only
git commit -m "feat: extract exported live demos"
```

---

### Task 3: Build one canonical mirror and resolve every internal link through a route map

**Files:**

- Create: `website/scripts/llms/routes.js`
- Modify: `website/scripts/llms/markdown.js`
- Modify: `website/scripts/build-llms.test.js`
- Modify: `website/scripts/build-llms.js`

**Interfaces:**

- Consumes: source relative paths/frontmatter and Markdown link targets.
- Produces:
  - `normalizeRelSlug(value, sourceName): string`
  - `collisionKey(value): string`
  - `buildRouteMap(documents): RouteMap`
  - `rewriteInternalLinks(markdown, document, routeMap): string`
  - one canonical `md/<relSlug>.md` per source.

- [ ] **Step 1: Add canonical/alias/collision tests**

```js
test('uppercase source and lowercase alias share one output', () => {
  const docs = [document('UNIF-DESIGN.md', { slug: '/unif-design' })];
  const map = buildRouteMap(docs);
  assert.strictEqual(map.documents[0].outputPath, 'md/UNIF-DESIGN.md');
  assert.strictEqual(
    map.resolve('/docs/UNIF-DESIGN').outputPath,
    'md/UNIF-DESIGN.md'
  );
  assert.strictEqual(
    map.resolve('/docs/unif-design').outputPath,
    'md/UNIF-DESIGN.md'
  );
  assert.strictEqual(map.documents.length, 1);
});
```

Add two-source case-only canonical collision, route alias collision, NFC-equivalent Unicode collision, absolute path, backslash, empty/dot/dot-dot segment and control character failures.

- [ ] **Step 2: Add link conversion tests**

Cover:

```js
const output = rewriteInternalLinks(
  '[Button](/docs/components/button#props) [Next](../getting-started) [Web](https://x) [Mail](mailto:a@b) [Here](#local)',
  sourceDocument,
  routeMap
);
assert(output.includes('(button.md#props)'));
assert(output.includes('(../getting-started.md)'));
assert(output.includes('(https://x)'));
assert(output.includes('(mailto:a@b)'));
assert(output.includes('(#local)'));
```

Missing internal routes must throw with source file and original target.

- [ ] **Step 3: Run and confirm failures**

```bash
node website/scripts/build-llms.test.js
```

- [ ] **Step 4: Implement safe canonical slugs**

```js
function collisionKey(value) {
  return value.normalize('NFC').toLowerCase();
}

function normalizeRelSlug(value, sourceName) {
  if (
    typeof value !== 'string' ||
    value === '' ||
    value.startsWith('/') ||
    /^[A-Za-z]:/u.test(value) ||
    value.includes('\\') ||
    /[\u0000-\u001F\u007F]/u.test(value)
  ) {
    throw new Error(
      `${sourceName}: unsafe relative slug ${JSON.stringify(value)}`
    );
  }
  const segments = value.split('/');
  if (
    segments.some(
      (segment) => segment === '' || segment === '.' || segment === '..'
    )
  ) {
    throw new Error(`${sourceName}: unsafe path segment in ${value}`);
  }
  return segments.map((segment) => segment.normalize('NFC')).join('/');
}
```

Strip `.md`/`.mdx` before calling it. Preserve resulting case in `relSlug`.

- [ ] **Step 5: Build route aliases without duplicate outputs**

Each document registers:

- canonical output `md/${relSlug}.md`;
- source route `/docs/${relSlug}`;
- frontmatter route `/docs/${frontmatterSlugWithoutLeadingSlash}`;
- Docusaurus index route represented by explicit frontmatter slug (`components/overview.md` → `/docs/components`).

Use `collisionKey()` for output and alias maps. The same source may register case-equivalent aliases; different source ids may not. Check reserved formal targets before output construction.

- [ ] **Step 6: Rewrite Markdown links**

Protect code first. For every Markdown link target:

- leave `http:`, `https:`, `mailto:` and fragment-only links unchanged;
- split and retain `#fragment`;
- resolve absolute `/docs/...` directly;
- resolve relative docs targets against the source route directory;
- look up only in the route map;
- compute POSIX relative path from current canonical output directory to target canonical output;
- append fragment.

Never derive a physical filename from a frontmatter slug.

- [ ] **Step 7: Make index/full links deployment-relative**

`llms.txt` uses `md/...` links and `llms-full.txt` as the full entry, never leading `/`. `md/index.json` records one entry per source with its canonical relative mirror. Full-document source metadata also points to canonical source/mirror.

- [ ] **Step 8: Verify and commit**

```bash
node website/scripts/build-llms.test.js
```

```bash
git add website/scripts/llms/routes.js website/scripts/llms/markdown.js website/scripts/build-llms.js website/scripts/build-llms.test.js
git diff --cached --name-only
git commit -m "feat: canonicalize llm document routes"
```

---

### Task 4: Make LLM bundle replacement transactional and rollback-safe

**Files:**

- Create: `website/scripts/llms/bundle.js`
- Modify: `website/scripts/build-llms.js`
- Modify: `website/scripts/build-llms.test.js`

**Interfaces:**

- Consumes: converted documents and route map from Tasks 2–3.
- Produces:
  - `buildBundle(site): BundleFiles`
  - `validateBundle(bundle, routeMap): void`
  - `commitBundle(staticDir, bundle, fileOps = REAL_FILE_OPS): void`
  - CLI with validation-before-write and three-target rollback.

- [ ] **Step 1: Add success/idempotence fixture**

In a fresh temp site, precreate:

- old `llms.txt`, `llms-full.txt`, `md/old-stale.md`;
- `static/img/sentinel.bin`;
- docs including `UNIF-DESIGN.md`, frontmatter alias, direct/exported demos and internal links.

After two successful runs assert:

- only canonical `md/UNIF-DESIGN.md` exists;
- stale mirror is gone;
- sentinel bytes/hash unchanged;
- no `.llms-stage-*`/`.llms-backup-*`;
- the second bundle file list and every SHA-256 match the first.

- [ ] **Step 2: Add pre-write validation failure fixture**

Use an unknown Demo or dead link. Snapshot the old formal bundle’s presence, file list and bytes plus sentinel before generation. Assert every snapshot is unchanged and no staging/backup remains.

- [ ] **Step 3: Add mid-commit fault injection fixtures**

Inject file ops whose `renameSync` throws after one formal target has already been installed. Run two variants:

1. all three old targets existed;
2. one or more old targets were originally absent.

Assert rollback restores exact old bytes and exact absent/present state, removes partial new targets and leaves sentinel untouched.

Add a third fault at the backup phase: the first old target moves successfully, the second backup rename throws, and no staged target has been installed. Assert the first target is restored, the second/third untouched targets are never removed or overwritten, and the original error remains the reported cause.

- [ ] **Step 4: Run and confirm failures**

```bash
node website/scripts/build-llms.test.js
```

- [ ] **Step 5: Build the complete bundle in memory**

Use:

```js
{
  'llms.txt': Buffer.from(indexText),
  'llms-full.txt': Buffer.from(fullText),
  'md/index.json': Buffer.from(JSON.stringify(entries, null, 2) + '\n'),
  ...canonicalPageBuffers,
}
```

Before creating staging, validate:

- expected document/output counts;
- every index entry resolves to an existing canonical page;
- every rewritten internal link resolves within the bundle or is external/fragment;
- no unprotected LiveDemo/unknown Demo;
- no unsafe/colliding target.

- [ ] **Step 6: Stage only under `website/static/`**

```js
const stage = fileOps.mkdtempSync(path.join(staticDir, '.llms-stage-'));
```

Write exactly `llms.txt`, `llms-full.txt`, and a complete `md/` tree inside it. Re-read staged bytes and repeat output count/path/link/demo validation. On failure, remove only `stage`; formal targets stay untouched.

- [ ] **Step 7: Implement presence-aware commit and rollback**

```js
const FORMAL_TARGETS = ['llms.txt', 'llms-full.txt', 'md'];
let backup;
let presence;
try {
  presence = new Map(
    FORMAL_TARGETS.map((name) => [
      name,
      fileOps.existsSync(path.join(staticDir, name)),
    ])
  );
  backup = fileOps.mkdtempSync(path.join(staticDir, '.llms-backup-'));
} catch (preCommitError) {
  try {
    fileOps.rmSync(stage, { recursive: true, force: true });
  } catch (cleanupError) {
    throw buildPreCommitError(preCommitError, cleanupError, stage);
  }
  throw preCommitError;
}
const backedUp = new Set();
const installed = new Set();
```

Commit:

1. move each existing formal target to backup and add its name to `backedUp` only after that rename succeeds;
2. rename each staged target into its formal path and add its name to `installed` only after that rename succeeds;
3. after all three succeed, the formal bundle is complete; remove the now-empty stage and then backup outside the rollback `try`.

Catch:

1. remove only names in `installed`, in reverse formal-target order;
2. restore only names in `backedUp`, in reverse order; an originally present target whose backup rename failed was never moved and must be left untouched;
3. for every target originally absent, ensure formal path is absent;
4. always remove stage;
5. remove backup only if every restoration step succeeded; otherwise preserve it and include its exact path in the error for manual recovery;
6. rethrow the original error, appending every rollback error without replacing the original cause.

Use this control shape:

```js
try {
  for (const name of FORMAL_TARGETS) {
    if (!presence.get(name)) continue;
    fileOps.renameSync(path.join(staticDir, name), path.join(backup, name));
    backedUp.add(name);
  }
  for (const name of FORMAL_TARGETS) {
    fileOps.renameSync(path.join(stage, name), path.join(staticDir, name));
    installed.add(name);
  }
} catch (commitError) {
  const rollbackErrors = [];
  for (const name of [...installed].reverse()) {
    try {
      fileOps.rmSync(path.join(staticDir, name), {
        recursive: true,
        force: true,
      });
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  for (const name of [...backedUp].reverse()) {
    try {
      fileOps.renameSync(path.join(backup, name), path.join(staticDir, name));
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  for (const name of FORMAL_TARGETS.filter((item) => !presence.get(item))) {
    try {
      fileOps.rmSync(path.join(staticDir, name), {
        recursive: true,
        force: true,
      });
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  try {
    fileOps.rmSync(stage, { recursive: true, force: true });
  } catch (error) {
    rollbackErrors.push(error);
  }
  if (rollbackErrors.length === 0) {
    try {
      fileOps.rmSync(backup, { recursive: true, force: true });
    } catch (error) {
      rollbackErrors.push(error);
    }
  }
  throw buildCommitError(commitError, rollbackErrors, backup);
}

try {
  fileOps.rmSync(stage, { recursive: true, force: true });
  fileOps.rmSync(backup, { recursive: true, force: true });
} catch (cleanupError) {
  throw buildCleanupError(cleanupError, {
    formalTargetsComplete: true,
    stage,
    backup,
  });
}
```

Keep successful-install cleanup outside the rename catch: once backup deletion has begun, a cleanup error must report that all formal targets are already complete and preserve any remaining recovery path; it must not attempt a destructive “rollback” from a potentially partially deleted backup.

The narrow `fileOps` interface includes only methods actually used (`existsSync`, `mkdirSync`, `mkdtempSync`, `readFileSync`, `writeFileSync`, `readdirSync`, `statSync`, `renameSync`, `rmSync`).

- [ ] **Step 8: Convert `build-llms.js` to a thin CLI**

It resolves Website root/config/docs, calls `buildBundle`, then `commitBundle`. Missing `docs/` is an error with nonzero exit, not success. Export pure functions only from focused modules; CLI catches once and sets exit code 1.

- [ ] **Step 9: Verify and commit**

```bash
node website/scripts/build-llms.test.js
```

Expected: every success, validation-failure, rollback and idempotence fixture passes without touching real `website/static`.

```bash
git add website/scripts/llms/bundle.js website/scripts/build-llms.js website/scripts/build-llms.test.js
git diff --cached --name-only
git commit -m "feat: publish llm docs transactionally"
```

---

### Task 5: Audit every final public contract and regenerate the canonical bundle

**Files:**

- Modify: `README.md`
- Modify: `website/docs/getting-started.md`
- Modify: `website/docs/migration.md`
- Modify: `website/docs/troubleshooting.md`
- Modify: `website/docs/skills.md`
- Modify: `website/docs/UNIF-DESIGN.md`
- Modify: `website/docs/design/tokens/typography.md`
- Modify: `website/docs/design/tokens/motion.md`
- Modify: `website/docs/components/avatar-with-ring.mdx`
- Modify: `website/docs/components/avatar.mdx`
- Modify: `website/docs/components/button.mdx`
- Modify: `website/docs/components/carousel.mdx`
- Modify: `website/docs/components/cell.mdx`
- Modify: `website/docs/components/checkbox.mdx`
- Modify: `website/docs/components/confirm.mdx`
- Modify: `website/docs/components/decorations.mdx`
- Modify: `website/docs/components/entry-card.mdx`
- Modify: `website/docs/components/form.mdx`
- Modify: `website/docs/components/grid.mdx`
- Modify: `website/docs/components/icon-button.mdx`
- Modify: `website/docs/components/icons.mdx`
- Modify: `website/docs/components/input.mdx`
- Modify: `website/docs/components/loading.mdx`
- Modify: `website/docs/components/logo.mdx`
- Modify: `website/docs/components/navbar.mdx`
- Modify: `website/docs/components/password-input.mdx`
- Modify: `website/docs/components/pulse.mdx`
- Modify: `website/docs/components/radio.mdx`
- Modify: `website/docs/components/reveal.mdx`
- Modify: `website/docs/components/search.mdx`
- Modify: `website/docs/components/skeleton.mdx`
- Modify: `website/docs/components/status-dot.mdx`
- Modify: `website/docs/components/stepper.mdx`
- Modify: `website/docs/components/switch.mdx`
- Modify: `website/docs/components/tag.mdx`
- Modify: `website/docs/components/text-field.mdx`
- Modify: `website/docs/components/textarea.mdx`
- Modify: `website/docs/components/thumbnail.mdx`
- Modify: `website/docs/components/toast.mdx`
- Modify: `website/docs/components/version-pill.mdx`
- Regenerate: `website/static/llms.txt`
- Regenerate: `website/static/llms-full.txt`
- Replace generated tree: `website/static/md/`

**Interfaces:**

- Consumes: final root `.d.ts`, source behavior and all docs changed atomically in Plans 1–3.
- Produces: no stale API/support prose and one canonical, deployment-relative LLM bundle.

- [ ] **Step 1: Audit support/install text**

All current support prose must state:

- RN `0.86.x`, React `>=19.2.3 <20.0.0`;
- Node `^20.19.4 || ^22.13.0 || ^24.3.0 || >= 25.0.0`;
- RNGH 3, RNRC 5, Reanimated peer `>=4.5.2 <4.6.0` (repo `~4.5.3`), Worklets 0.11 (repo `^0.11.3`);
- consumer Babel/Metro providers and worklets plugin;
- narrow RNRC 5.0.0/RNGH 3 warning policy, with no global ignore.

Run:

```bash
rg -n "React Native 0\\.85|RN 0\\.85|0\\.85\\+" README.md website/docs
rg -n "\"node\"\\s*:\\s*\">=18|Node(\\.js)?.*>=18" README.md website/package.json website/docs
```

Expected: both scans empty.

- [ ] **Step 2: Audit every breaking component/type**

Compare generated `lib/typescript/src/index.d.ts` and source against docs for:

- Confirm, Toast, Pulse/PulseDot/Skeleton;
- Input/Textarea/TextField, Search, PasswordInput;
- Button/IconButton, NavBar;
- Checkbox/Radio/Switch;
- Cell, Stepper, Carousel;
- Logo, Grid, DrawerHeader, VersionPill;
- Thumbnail;
- Theme/fontScale/reduced motion;
- useSvgId, Reveal, Spinner, Avatar image identity;
- Icon build/catalog.

Every removed prop disappears from examples and API tables. Every new root type/helper has an exact signature.

- [ ] **Step 3: Correct known stale behavior claims**

Explicitly fix:

- StatusDot `accessibilityLabel`;
- EntryCard label behavior;
- RadioGroup already having group role plus now requiring a group name;
- Grid action semantics already conditional on handler;
- VersionPill outer combined accessibility plus visible status;
- Search/Password no native `clear()`/`setNativeProps()` ref;
- Web Pulse no worklet claim.

- [ ] **Step 4: Fix Skill links in Website prose**

`website/docs/skills.md` must link to:

```text
https://github.com/unif-design/skills/tree/main/skills/design
```

Run:

```bash
rg -n "skills/(unif-design|umeng-share)" --glob "!docs/superpowers/specs/**" .
```

Expected: no repository-tree path uses either old Skill name. Marketplace/repository name `unif-design/skills` remains valid and is not rewritten.

- [ ] **Step 5: Generate through the real transactional CLI**

Record the pre-generation image sentinel:

```bash
shasum -a 256 website/static/img/logo.png
```

Then generate:

```bash
yarn workspace @unif/react-native-design-website build:llms
shasum -a 256 website/static/img/logo.png
git diff --exit-code -- website/static/img
```

Confirm:

- exactly one `website/static/md/UNIF-DESIGN.md`;
- no lowercase duplicate mirror;
- no stale files for deleted docs;
- `llms.txt` links begin `md/`;
- full entry is `llms-full.txt`;
- internal links are relative and preserve fragments;
- the two printed `static/img/logo.png` hashes are byte-for-byte identical and the scoped diff is empty.

- [ ] **Step 6: Run Website verification**

```bash
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
```

Expected: all pass; no unknown Demo/dead link/`rect.ry`/old API compile error.

- [ ] **Step 7: Commit source docs and generated bundle together**

```bash
git add \
  README.md \
  website/docs/getting-started.md \
  website/docs/migration.md \
  website/docs/troubleshooting.md \
  website/docs/skills.md \
  website/docs/UNIF-DESIGN.md \
  website/docs/design/tokens/typography.md \
  website/docs/design/tokens/motion.md \
  website/docs/components/avatar-with-ring.mdx \
  website/docs/components/avatar.mdx \
  website/docs/components/button.mdx \
  website/docs/components/carousel.mdx \
  website/docs/components/cell.mdx \
  website/docs/components/checkbox.mdx \
  website/docs/components/confirm.mdx \
  website/docs/components/decorations.mdx \
  website/docs/components/entry-card.mdx \
  website/docs/components/form.mdx \
  website/docs/components/grid.mdx \
  website/docs/components/icon-button.mdx \
  website/docs/components/icons.mdx \
  website/docs/components/input.mdx \
  website/docs/components/loading.mdx \
  website/docs/components/logo.mdx \
  website/docs/components/navbar.mdx \
  website/docs/components/password-input.mdx \
  website/docs/components/pulse.mdx \
  website/docs/components/radio.mdx \
  website/docs/components/reveal.mdx \
  website/docs/components/search.mdx \
  website/docs/components/skeleton.mdx \
  website/docs/components/status-dot.mdx \
  website/docs/components/stepper.mdx \
  website/docs/components/switch.mdx \
  website/docs/components/tag.mdx \
  website/docs/components/text-field.mdx \
  website/docs/components/textarea.mdx \
  website/docs/components/thumbnail.mdx \
  website/docs/components/toast.mdx \
  website/docs/components/version-pill.mdx \
  website/static/llms.txt \
  website/static/llms-full.txt \
  website/static/md
git diff --cached --name-only
git diff --cached --check
git commit -m "docs: synchronize runtime api documentation"
```

Before commit, ensure `AGENTS.md` and `CLAUDE.md` are absent from staged paths.

---

### Task 6: Synchronize the independent `skills/design` consumer Skill

**Files:**

- Modify: `/Users/liulijun/tongyi/design/skills/skills/design/SKILL.md`
- Modify: `/Users/liulijun/tongyi/design/skills/skills/design/references/a11y.md`
- Modify: `/Users/liulijun/tongyi/design/skills/skills/design/references/recipes.md`
- Modify: `/Users/liulijun/tongyi/design/skills/skills/design/references/theming.md`
- Modify: `/Users/liulijun/tongyi/design/skills/skills/design/assets/App.host-wiring.tsx`
- Create: `/Users/liulijun/tongyi/design/skills/skills/design/assets/babel.config.js`
- Create: `/Users/liulijun/tongyi/design/skills/skills/design/assets/metro.config.js`
- Modify: `/Users/liulijun/tongyi/design/skills/skills/design/scripts/doctor.sh`
- Modify: `/Users/liulijun/tongyi/design/skills/skills/design/scripts/doctor.test.sh`

**Interfaces:**

- Consumes: final docs/LLM URLs and API/dependency contracts from Tasks 1–5.
- Produces:
  - `design` Skill metadata version `0.4.0`
  - RN 0.86 consumer setup templates
  - doctor coverage for the runtime version matrix and worklets plugin
  - one independently validated Skill-repo commit.

- [ ] **Step 1: Check access and read the Skill repository rules**

Run read-only:

```bash
git -C /Users/liulijun/tongyi/design/skills status --short --branch
sed -n '1,320p' /Users/liulijun/tongyi/design/skills/AGENTS.md
```

If the repository cannot be read, stop this task and set final state to `未能检查/同步/验证 skills/design/` with the exact error/path. If readable but writes require sandbox approval, request permission for this exact repository before any edit.

Preserve unrelated dirty files; only the nine listed paths belong to this task.

- [ ] **Step 2: Bump and update `SKILL.md` without mirroring all props**

Set:

```yaml
metadata:
  version: '0.4.0'
```

Change positioning to RN 0.86 New Architecture. Add a compact `## 快速开始` that states the exact React/RN/Node/runtime matrix and routes full props to canonical LLM links.

Add concise hand-written guardrails for:

- unique Confirm/Toast Hosts and their no-Host semantics;
- strict TextField mode and `TextFieldHandle` focus/blur only;
- required Button/IconButton actions;
- required accessible names and explicit Cell/Carousel branches;
- Worklets plugin last, Babel/Metro peer providers;
- the one narrow RNRC 5.0.0/RNGH 3 metadata warning.

Do not paste component API tables already generated in `llms.txt`.

- [ ] **Step 3: Update focused references**

`references/theming.md` adds:

```tsx
<ThemeProvider fontScale={userFontScale}>
  <App />
</ThemeProvider>
```

and root imports for `normalizeFontScale`, `scaleFontMetric`, `useFontScale`, plus the “only text metrics, exactly once” boundary and real native/Web reduced motion.

`references/a11y.md` documents:

- Button/IconButton actions and busy/disabled;
- Checkbox/Radio visible-label union;
- required `Radio.Group` and Switch labels;
- Stepper contextual name;
- Cell outer action vs control ownership;
- decorative Logo/Drawer/Pagination behavior.

`references/recipes.md` updates host uniqueness/lifecycle and uses explicit Cell `extra.kind` plus strict TextField examples.

- [ ] **Step 4: Update/create executable assets**

`assets/App.host-wiring.tsx` keeps exactly one ConfirmHost/ToastHost and notes that duplicates are rejected:

```tsx
<GestureHandlerRootView style={{ flex: 1 }}>
  <ThemeProvider>
    {children}
    <ConfirmHost />
    <ToastHost />
  </ThemeProvider>
</GestureHandlerRootView>
```

Create `assets/babel.config.js`:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
```

Create `assets/metro.config.js`:

```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = mergeConfig(getDefaultConfig(__dirname), {});
```

Reference both assets from `SKILL.md`; explicitly state the worklets plugin stays last.

- [ ] **Step 5: Extend doctor version/config checks**

Keep doctor’s `[ok]/[warn]/[missing]` report semantics. Add a Node helper that reads declared or installed versions and reports these requirements:

```text
react >=19.2.3 <20
react-native >=0.86.0 <0.87.0
react-native-gesture-handler >=3 <4
react-native-reanimated-carousel >=5 <6
react-native-reanimated >=4.5.2 <4.6
react-native-worklets >=0.11 <0.12
@babel/core 7.x
@react-native/metro-config 0.86.x
```

Inspect `babel.config.js` text and report `[ok]` only when `react-native-worklets/plugin` is the final plugin entry; report `[warn]` when missing/misordered. Detect the RNRC/RNGH known combination and print one scoped informational warning rather than recommending downgrade/global ignore.

- [ ] **Step 6: Expand self-contained doctor fixtures**

`doctor.test.sh` must create:

1. a fully valid RN 0.86 fixture with all packages, Babel plugin last, Metro config and clean source;
2. an RN 0.85/Reanimated 4.4/Worklets 0.9 fixture that yields version warnings;
3. a Worklets plugin missing/misordered fixture;
4. existing deep import/hard-coded color/RN Pressable/console bad-smell fixture.

Assert concrete `[ok]`, `[warn]`, `[missing]` lines and keep cleanup limited to its `mktemp -d` directories.

- [ ] **Step 7: Run the Skill repository’s own checks**

From `/Users/liulijun/tongyi/design/skills`:

```bash
bash skills/design/scripts/doctor.test.sh
python3 scripts/validate_repository.py
python3 scripts/validate_portal_consistency.py
```

Then run the repository-wide doctor loop required by its `AGENTS.md`:

```bash
for test_file in skills/*/scripts/doctor.test.sh; do bash "$test_file"; done
```

Expected: every command exits 0. A failure means the final state is not “已同步”.

- [ ] **Step 8: Commit only the design Skill paths in the independent repo**

```bash
git -C /Users/liulijun/tongyi/design/skills add skills/design/SKILL.md skills/design/references/a11y.md skills/design/references/recipes.md skills/design/references/theming.md skills/design/assets/App.host-wiring.tsx skills/design/assets/babel.config.js skills/design/assets/metro.config.js skills/design/scripts/doctor.sh skills/design/scripts/doctor.test.sh
git -C /Users/liulijun/tongyi/design/skills diff --cached --name-only
git -C /Users/liulijun/tongyi/design/skills commit -m "feat(design): sync react native 0.86 guidance"
```

Expected: only `skills/design/` paths are staged; version is `0.4.0`.

- [ ] **Step 9: Record the auditable sync state**

For successful sync, record:

```text
已同步 skills/design/：
- SKILL.md（version 0.4.0）
- references/a11y.md
- references/recipes.md
- references/theming.md
- assets/App.host-wiring.tsx
- assets/babel.config.js
- assets/metro.config.js
- scripts/doctor.sh
- scripts/doctor.test.sh
验证：design doctor、repository validators、全仓 doctor loop 均通过。
```

If write/validation was unavailable, record `未能同步/验证 skills/design/` plus exact failed command/path; never reuse the success text.

---

### Task 7: Execute the final runtime matrix and create evidence-backed verification

**Files:**

- Create: `docs/superpowers/verification/2026-07-30-runtime-api-remediation.md`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx` only if a real run reveals a fixture defect

**Interfaces:**

- Consumes: all four plans, generated Website, RN 0.86.2 harness, Skill validation results.
- Produces: a checked-in matrix whose required rows all have real `PASS`, plus exact commands/evidence and Skill three-state result.

- [ ] **Step 1: Run the complete static command matrix**

```bash
yarn install --immutable
yarn check:config
yarn check:runtime-peers
yarn check:icons
yarn test --runInBand
yarn typecheck
yarn lint
yarn prepare
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
```

Capture exit code and concise output/evidence path for each command. A failing command must be fixed and rerun; do not document a stale failure followed by an unrecorded pass.

If any command exposes a source, docs, generated-output or manual-fixture defect, stop this task and return to the owning Task 1–6. Make and verify a scoped commit there before restarting this matrix; Task 7 must not broadly stage opportunistic source/docs fixes.

- [ ] **Step 2: Verify generated files are deterministic and scoped**

Hash the three LLM targets and `website/static/img/logo.png`, run generation again, and confirm:

- LLM hashes/file list remain identical;
- image sentinel hash remains identical;
- no staging/backup directory remains;
- `git diff` after the second generation is empty for generated targets.

Also prove the excluded legacy app stayed untouched:

```bash
git diff --exit-code -- example
```

- [ ] **Step 3: Generate a fresh native app and run both platforms**

```bash
yarn create:runtime-harness
```

Inside the printed temp app:

```bash
yarn android
yarn ios
```

Use the checked-in RuntimeApiScreen. Record actual device/simulator name, OS, RN `0.86.2`, build result, evidence file and observed result.

Serve the already-built Website in a separate shell:

```bash
yarn workspace @unif/react-native-design-website serve --host 127.0.0.1 --port 3000
```

Open it in every Web browser claimed by the verification document, record the real browser/version, and execute the Web rows against `http://127.0.0.1:3000`. A successful SSR/build alone is not a browser PASS.

- [ ] **Step 4: Execute all required manual case IDs**

The verification document uses columns:

```text
Case ID | Platform/OS + RN | Build/device | Preconditions | Steps | Expected | Actual | Evidence | Result
```

Required case IDs:

- `RT-CONFIRM-01..05`: no Host, reentry, duplicate Host, owner cleanup, stale clear;
- `RT-TOAST-01..06`: pre-Host latest-wins, A→B, duplicate Host, cleanup/re-delivery, stale timer/RAF/native callback;
- `RT-PULSE-01..04`: invalid timer, reverse, static endpoints, reduced motion;
- `IN-TEXT-01..08`: controlled/uncontrolled/mode lock, clear/submit order, narrow ref, height/style/slot, error announce;
- `IN-A11Y-01..08`: Button busy, names, Switch 44pt/reduced, Cell branches, Stepper actions, Carousel branches, hidden display/status;
- `TH-FONT-01..03`: valid/invalid/large scale and geometry non-scaling;
- `TH-IMAGE-01..03`: equivalent identity, true change, A₁→B→A₂ late error;
- `PL-REVEAL-01..02`, `PL-SPINNER-01`, `PL-THUMB-01..03`;
- `ICON-ID-01`, `ICON-CATALOG-01`;
- `WEB-LLM-01..04`: LiveDemo, relative links/baseUrl, canonical case alias, rollback/idempotence.

Append a row only after executing that case. `Actual` states what was observed and `Evidence` names a real path/URL/log. Overall completion requires every required row `PASS`; `BLOCKED` is truthful interim status but not completion.

- [ ] **Step 5: Record the Skill three-state conclusion**

Copy exactly one result from Task 6:

1. `已同步 skills/design/` plus files/version/commands;
2. `已检查 skills/design/，无需更新` plus reason/commands (not expected for this breaking release);
3. `未能检查/同步/验证 skills/design/` plus blocker.

Because this release changes public APIs/dependencies/native config, a truthful completed result is expected to be state 1.

- [ ] **Step 6: Commit verification and any evidence-safe fixture fixes**

If a real run found a defect in `RuntimeApiScreen.tsx`, fix it under the owning component task, rerun the affected static/native cases, and commit that file separately before writing the verification result:

```bash
git add manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git diff --cached --check
git commit -m "fix: repair runtime verification fixture"
```

Then stage only the evidence document:

```bash
git add docs/superpowers/verification/2026-07-30-runtime-api-remediation.md
git diff --cached --name-only
git diff --cached --check
git commit -m "test: verify runtime api remediation"
```

Do not commit generated temp apps, simulator caches, videos larger than repository policy, or `AGENTS.md`/`CLAUDE.md`.

---

## Final Delivery Gate

- [ ] Re-read final `AGENTS.md` and `CLAUDE.md`; confirm they point to `unif-design/skills` → `skills/design/` and contain an auditable sync gate. If incomplete, report it as a parallel-session integration issue without editing those files.

- [ ] Run stale-support/path scans:

```bash
rg -n "React Native 0\\.85|RN 0\\.85|0\\.85\\+" README.md website/docs
rg -n "\"node\"\\s*:\\s*\">=18|Node(\\.js)?.*>=18" README.md website/package.json website/docs
rg -n "skills/(unif-design|umeng-share)" --glob "!docs/superpowers/specs/**" .
rg -n "inputProps=|statusColor=|<Logo[^>]*\\blabel=|NavBarSlotConfig|TextInputRef|ThemeContext" README.md src website type-tests lib/typescript/src/index.d.ts
```

Expected: no stale current-support, old Skill-tree path, removed API or private ThemeContext matches outside explicit historical migration snippets.

- [ ] Run final root/Website verification once more:

```bash
yarn install --immutable
yarn check:config
yarn check:runtime-peers
yarn check:icons
yarn test --runInBand
yarn typecheck
yarn lint
yarn prepare
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
```

- [ ] Run final Skill verification from `/Users/liulijun/tongyi/design/skills`:

```bash
bash skills/design/scripts/doctor.test.sh
python3 scripts/validate_repository.py
python3 scripts/validate_portal_consistency.py
for test_file in skills/*/scripts/doctor.test.sh; do bash "$test_file"; done
```

- [ ] Check both repositories:

```bash
git status --short --branch
git diff --check
git diff --cached --check
git status --short -- example
git diff --exit-code -- example
git diff --cached --exit-code -- example
git -C /Users/liulijun/tongyi/design/skills status --short --branch
git -C /Users/liulijun/tongyi/design/skills diff --check
```

Expected: only intentionally uncommitted parallel-session `AGENTS.md`/`CLAUDE.md` changes may remain in the library repo; the Skill task’s listed paths are committed in its own repo.

- [ ] Final delivery message must list:

- RN 0.86.2/runtime dependency result;
- public breaking API/state/theme/platform/Icon result;
- Website/LLM generation and local verification commands;
- native Android/iOS harness evidence;
- exact Skill three-state conclusion and Skill commit/version;
- any truthful remaining blocker, without claiming CI coverage the user asked to ignore.
