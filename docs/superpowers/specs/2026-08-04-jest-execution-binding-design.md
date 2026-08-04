# Jest Actual Execution Binding Design

## Context

The production example Jest wrapper currently validates one evaluation of
`example/jest.config.js`, discovers the expected owner suites, and then starts a
new Jest process with `EXAMPLE_SHOWCASE_JEST_ATTESTATION`. Because the config is
executable JavaScript, the actual process can evaluate a different config. A
fixture proved that the static verifier and wrapper both return zero while the
actual process runs only `exampleNavigation.test.ts` and removes the attestation
reporter.

This remediation is limited to the production example Jest gate. It does not
change public library APIs, UI behavior, dependencies, native projects, Website
content, or the focused developer runner.

## Considered Approaches

### 1. Give every phase the same environment

This closes the demonstrated `EXAMPLE_SHOWCASE_JEST_ATTESTATION` branch, but a
config can still branch on `process.argv`, the executable path, or another
phase-specific process detail. It treats one trigger rather than the contract.

### 2. Serialize Jest's entire resolved config

The wrapper could serialize Jest 29's normalized internal config and execute the
snapshot. This most closely resembles an atomic config snapshot, but couples the
repository to undocumented Jest structures and normalization details. It is a
large compatibility surface for a small gate.

### 3. Force the observable actual execution contract (selected)

The wrapper will turn its preflight discovery set into internal Jest arguments:

- `--runTestsByPath` followed by every canonical discovered test path;
- `--reporters=default` plus the canonical attestation reporter path;
- `--testFailureExitCode=1`.

These arguments are generated after user arguments pass the existing strict
allowlist. Users still cannot supply selection, config, reporter, or non-execution
arguments. Jest CLI options override values returned by executable config, so a
phase-dependent config cannot shrink the selected files, remove the reporter, or
convert a reporter failure into exit zero.

The attestation payload will contain both:

- the nine canonical required owner paths; and
- the complete preflight discovery set.

The forced reporter will record completed paths and fail unless the actual set
exactly contains every expected discovered test and every required owner. It will
emit separate stable completion markers for the full execution set and the owner
set. Unexpected completed paths also fail, keeping the actual set equal to the
preflight set rather than merely a superset.

This approach binds the behavior the gate promises without serializing Jest
internals. Config drift can still make the run fail, but it cannot make an
incomplete run succeed.

## Error and Output Contract

- Existing user-argument rejection remains `JEST_PRODUCTION_ARGUMENT`.
- Malformed attestation remains `JEST_ATTESTATION_CONFIG`.
- A missing or unexpected actual suite uses
  `JEST_EXECUTION_SET_COMPLETED` and returns non-zero.
- A missing canonical owner continues to use
  `JEST_GOVERNED_SUITES_COMPLETED` and returns non-zero.
- A clean production run prints both completion counts.

## Test Design

The regression test must name the real break: an executable config returns the
safe full config during preflight and, only in the actual attested process,
returns `exampleNavigation.test.ts` plus `reporters: ['default']`.

TDD evidence is mandatory:

1. Before the production change, the mutation passes the full static verifier,
   the production wrapper exits zero, runs one suite / three tests, and emits no
   owner-completed marker.
2. After the production change, the same mutation may execute the forced full
   set or fail earlier, but it must never exit zero without both exact completion
   markers.
3. A clean wrapper run must execute the complete discovered set and all nine
   owners.
4. Reporter-focused tests must cover missing expected files, unexpected files,
   malformed payloads, and the clean exact set.
5. Existing selection/config/reporter argument rejection and focused runner
   behavior remain unchanged.

## Verification and Boundaries

Required task gates are the targeted contract test, production example Jest,
example typecheck/lint, root typecheck/lint, `yarn verify:example-showcase`, Turbo
test dry-run input coverage, `git diff --check`, worktree status, and the protected
shared CI digest.

Native builds and device/manual matrices are unaffected because this remediation
changes only JavaScript test-gate files. Existing JDK/CocoaPods environment
limitations remain recorded and are not reclassified as passes.
