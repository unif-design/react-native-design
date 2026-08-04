# Jest Actual Execution Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the production example Jest wrapper fail-closed when executable config evaluates differently between preflight and the actual Jest process.

**Architecture:** Keep the existing strict user-argument and preflight checks, then convert the canonical preflight discovery set into wrapper-owned actual Jest arguments. Force exact test paths, the canonical attestation reporter, and a non-zero failure code at the CLI boundary; extend the reporter attestation from nine owners to the complete expected execution set.

**Tech Stack:** Node.js ESM/CJS, Jest 29, `node:test`, Yarn 4, Turbo.

## Global Constraints

- Work only in the existing linked worktree on `feat/example-showcase`; preserve unrelated and ignored SDD artifacts.
- Do not change public library APIs, UI behavior, dependencies, lockfile, native projects, Website content, or the focused Jest runner.
- `example/package.json#test` remains `node ../scripts/run-example-jest.mjs --forbidOnly`.
- User-provided production arguments remain limited to `--runInBand`, `--no-cache`, `--ci`, and valid `--maxWorkers` forms.
- The actual production Jest process must execute the complete canonical preflight discovery set and all nine App/scene owner suites.
- The actual process must use the canonical `example/jest.forbidOnlyReporter.js` even if executable config returns another reporter list.
- Any missing or unexpected actual test path, missing owner, malformed attestation, or reporter failure must produce a non-zero exit.
- Keep `.github/workflows/ci.yml` byte-identical with SHA-256 `d2ac60869b254ee49490126e5a31a803a31be5e52f9c4de4343ef9de1b99552b`.
- Use strict TDD: add the conditional-config regression first, observe the current false-green behavior make the new assertion fail, then implement the minimum production change.

---

### Task 1: Bind the actual Jest process to the preflight execution set

**Files:**
- Modify: `scripts/run-example-jest.mjs`
- Modify: `example/jest.forbidOnlyReporter.js`
- Modify: `scripts/__tests__/example-showcase-contract.test.mjs`
- Verify only: `scripts/verify-example-showcase.mjs`
- Verify only: `turbo.json`

**Interfaces:**
- Consumes: the existing `resolveProductionGate()` result, canonical owner list, strict user argument allowlist, and `EXAMPLE_SHOWCASE_JEST_ATTESTATION` payload.
- Produces: wrapper-owned actual Jest arguments and an attestation payload with `requiredTestPaths: string[]` plus `expectedTestPaths: string[]`.
- Produces stable output codes `JEST_EXECUTION_SET_COMPLETED` and `JEST_GOVERNED_SUITES_COMPLETED`.

- [ ] **Step 1: Add the conditional-config regression and observe RED**

Add a fixture helper that writes a production config with a safe literal base and an actual-process-only override:

```js
const safeConfig = {
  // existing fixture config fields
  reporters: ['default', '<rootDir>/jest.forbidOnlyReporter.js'],
};

module.exports = process.env.EXAMPLE_SHOWCASE_JEST_ATTESTATION
  ? {
      ...safeConfig,
      testMatch: ['**/exampleNavigation.test.ts'],
      reporters: ['default'],
    }
  : safeConfig;
```

The test must first prove `verifyExampleShowcase(fixture)` does not throw, then run the real production wrapper and require all of:

```js
assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
assert.match(output, /JEST_EXECUTION_SET_COMPLETED count=/u);
assert.match(output, /JEST_GOVERNED_SUITES_COMPLETED count=9/u);
assert.doesNotMatch(output, /Test Suites:\s+1 passed, 1 total/u);
```

Run only the named regression:

```sh
node --test --test-name-pattern='production Jest actual execution contract survives phase-dependent config' scripts/__tests__/example-showcase-contract.test.mjs
```

Expected RED: the wrapper itself exits zero after one ordinary suite / three tests, but the new completion-marker assertion fails because the actual config removed the reporter and owner suites.

- [ ] **Step 2: Extend reporter attestation tests and observe RED**

Update the reporter fixture payload to carry `expectedTestPaths`. Add focused cases for:

```text
clean exact expected set        -> both completion markers, no error
missing non-owner expected file -> JEST_EXECUTION_SET_COMPLETED error
unexpected completed file       -> JEST_EXECUTION_SET_COMPLETED error
missing owner                   -> JEST_GOVERNED_SUITES_COMPLETED error
malformed/duplicate/outside set -> JEST_ATTESTATION_CONFIG error
```

Expected RED before reporter implementation: the new payload shape or exact-set assertions fail for the intended missing behavior, not from fixture setup errors.

- [ ] **Step 3: Build wrapper-owned actual Jest arguments**

Make `assertReporterContract()` return the canonical reporter path. Make `resolveProductionGate()` return the complete canonical `discoveredTests` array in addition to the root and required owners. Build actual arguments only after all user arguments have passed `assertSafeProductionArguments()`:

```js
function buildActualJestArguments(jestArgs, discoveredTests, reporterPath) {
  return [
    ...jestArgs,
    '--runTestsByPath',
    '--reporters=default',
    `--reporters=${reporterPath}`,
    '--testFailureExitCode=1',
    ...discoveredTests,
  ];
}
```

Pass the same canonical `discoveredTests` as `expectedTestPaths` in the attestation. Do not add any wrapper bypass, user-facing selection option, or change to `test:focused`.

- [ ] **Step 4: Make the forced reporter verify the exact actual set**

In `parseAttestation()` require absolute, unique `expectedTestPaths`; require every owner path to be in that expected set and every path to stay inside the attested root. In `onRunComplete()` compare the completed set against the expected set in both directions:

```js
const missingExpected = expectedTestPaths.filter(
  (testPath) => !completedTestPaths.has(testPath)
);
const unexpectedCompleted = [...completedTestPaths].filter(
  (testPath) => !expectedTestPathSet.has(testPath)
);
```

Keep the owner-specific failure marker. On a clean run, print the exact execution-set completion count and then the owner completion count.

- [ ] **Step 5: Run targeted GREEN and mutation checks**

Run:

```sh
node --test --test-name-pattern='production Jest actual execution contract survives phase-dependent config|actual Jest reporter' scripts/__tests__/example-showcase-contract.test.mjs
yarn example test --maxWorkers=2
```

Expected: the conditional config cannot produce a one-suite false green; clean production output contains exact execution-set completion and `count=9` owner completion. Confirm the original mutation from `final-fix-review-1.md` is now either forced to the full set with both markers or exits non-zero.

- [ ] **Step 6: Run the affected complete gates**

Run:

```sh
yarn example typecheck
yarn example lint
yarn typecheck
yarn lint
yarn verify:example-showcase
yarn turbo run test --filter=@unif/react-native-design-example --dry=json
git diff --check
shasum -a 256 .github/workflows/ci.yml
git status --short
```

Expected: every command exits zero; verifier CLI seam and all formal contracts pass; Turbo still hashes the wrapper, verifier, reporter, and shared gate; CI digest is unchanged.

- [ ] **Step 7: Self-review and commit**

Review the task diff for unrelated changes, source-text-only tests, test-only production escape hatches, and any weakening of the user argument allowlist. Write the SDD report with exact RED/GREEN commands, outputs, test counts, commit range, and concerns. Commit only the task files:

```sh
git add scripts/run-example-jest.mjs example/jest.forbidOnlyReporter.js scripts/__tests__/example-showcase-contract.test.mjs
git commit -m "fix: bind actual example Jest execution"
```
