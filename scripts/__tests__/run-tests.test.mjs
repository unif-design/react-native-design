import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url));

test('the development Node declarations match the actual RN toolchain and CI version', () => {
  const readJson = (filename) =>
    JSON.parse(readFileSync(path.join(repositoryRoot, filename), 'utf8'));
  const rnRange = readJson('node_modules/react-native/package.json').engines
    .node;
  const manifest = readJson('package.json');
  assert.equal(manifest.devEngines.runtime.version, rnRange);
  assert.equal(readJson('example/package.json').engines.node, rnRange);
  assert.equal(readJson('website/package.json').engines.node, rnRange);
  assert.equal(
    readJson('node_modules/@react-native/metro-config/package.json').engines
      .node,
    rnRange
  );
  assert.ok(semver.subset(rnRange, manifest.engines.node));
  assert.ok(
    semver.satisfies(
      readFileSync(path.join(repositoryRoot, '.nvmrc'), 'utf8').trim(),
      rnRange
    )
  );
});

function runFixture(args, failures = {}) {
  const root = realpathSync(
    mkdtempSync(path.join(os.tmpdir(), 'design-test-entry-'))
  );
  try {
    mkdirSync(path.join(root, 'scripts'), { recursive: true });
    mkdirSync(path.join(root, '.yarn/releases'), { recursive: true });
    copyFileSync(
      path.join(repositoryRoot, 'scripts/run-tests.mjs'),
      path.join(root, 'scripts/run-tests.mjs')
    );
    const trace = path.join(root, 'trace.jsonl');
    for (const [name, filename] of [
      ['example', '.yarn/releases/yarn-4.11.0.cjs'],
      ['coverage', 'scripts/run-library-coverage.mjs'],
    ]) {
      writeFileSync(
        path.join(root, filename),
        `${filename.endsWith('.cjs') ? "const { appendFileSync } = require('node:fs');" : "import { appendFileSync } from 'node:fs';"}
appendFileSync(process.env.TEST_ENTRY_TRACE, JSON.stringify({ name: ${JSON.stringify(name)}, args: process.argv.slice(2), cwd: process.cwd() }) + '\\n');
process.exit(${failures[name] ?? 0});
`
      );
    }
    const result = spawnSync(
      process.execPath,
      [path.join(root, 'scripts/run-tests.mjs'), ...args],
      {
        cwd: os.tmpdir(),
        env: { ...process.env, TEST_ENTRY_TRACE: trace },
        encoding: 'utf8',
      }
    );
    assert.ifError(result.error);
    const calls = readFileSync(trace, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    for (const call of calls) assert.equal(call.cwd, root);
    return { result, calls };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('root test uses the serial runner; daily tests retain the governed example entry', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
  );
  assert.equal(manifest.scripts.test, 'node scripts/run-tests.mjs');
  const { result, calls } = runFixture(['--maxWorkers=2']);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    calls.map(({ name, args }) => ({ name, args })),
    [
      {
        name: 'example',
        args: [
          'workspace',
          '@unif/react-native-design-example',
          'test',
          '--maxWorkers=2',
        ],
      },
    ]
  );
});

test('the CI coverage invocation executes example attestation before full coverage', () => {
  const args = ['--maxWorkers=2', '--coverage'];
  const { result, calls } = runFixture(args);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(
    calls.map(({ name, args: forwarded }) => ({ name, args: forwarded })),
    [
      {
        name: 'example',
        args: [
          'workspace',
          '@unif/react-native-design-example',
          'test',
          ...args,
        ],
      },
      { name: 'coverage', args },
    ]
  );
});

test('a failed example gate prevents coverage from hiding its exit status', () => {
  const { result, calls } = runFixture(['--coverage'], { example: 2 });
  assert.equal(result.status, 2);
  assert.deepEqual(
    calls.map(({ name }) => name),
    ['example']
  );
});

test('a failed complete coverage gate fails the standard CI command', () => {
  const { result, calls } = runFixture(['--coverage'], { coverage: 1 });
  assert.equal(result.status, 1);
  assert.deepEqual(
    calls.map(({ name }) => name),
    ['example', 'coverage']
  );
});
