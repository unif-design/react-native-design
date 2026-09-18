import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDir, '../..');

test('正式 verifier 不受环境变量过滤并拒绝损坏的 manifest', () => {
  const fixture = mkdtempSync(
    path.join(os.tmpdir(), 'react-native-design-verifier-')
  );
  try {
    mkdirSync(path.join(fixture, 'example'), { recursive: true });
    copyFileSync(
      path.join(repositoryRoot, 'package.json'),
      path.join(fixture, 'package.json')
    );
    const manifestPath = path.join(fixture, 'example/package.json');
    copyFileSync(
      path.join(repositoryRoot, 'example/package.json'),
      manifestPath
    );
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.dependencies['react-native-safe-area-context'] = '5.7.0';
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const env = {
      ...process.env,
      EXAMPLE_SHOWCASE_TEST_NAME_PATTERN: '绝不会匹配任何 contract',
    };
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts/verify-example-showcase.mjs'),
        fixture,
      ],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env,
      }
    );
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1, output);
    assert.match(output, /5\.7\.0/u);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('check mode validates current inputs without running verifier regressions', () => {
  const run = (root) =>
    spawnSync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts/verify-example-showcase.mjs'),
        '--check',
        root,
      ],
      { cwd: repositoryRoot, encoding: 'utf8' }
    );
  const success = run(repositoryRoot);
  assert.equal(success.status, 0, success.stdout + success.stderr);
  assert.doesNotMatch(success.stdout, /TAP version|# tests|tests passed/);
  const fixture = mkdtempSync(path.join(os.tmpdir(), 'design-check-mode-'));
  try {
    mkdirSync(path.join(fixture, 'example'));
    copyFileSync(
      path.join(repositoryRoot, 'package.json'),
      path.join(fixture, 'package.json')
    );
    writeFileSync(path.join(fixture, 'example/package.json'), '{}');
    const failure = run(fixture);
    assert.notEqual(failure.status, 0);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

test('workflow scopes keep docs light and checker changes complete', () => {
  const workflow = readFileSync(
    path.join(repositoryRoot, '.github/workflows/example-showcase.yml'),
    'utf8'
  );
  assert.match(
    workflow,
    /verify-example-showcase:\n {4}needs: changes\n {4}if: \$\{\{ !cancelled\(\) \}\}/
  );
  assert.match(workflow, /run: test "\$CHANGES_RESULT" = success/);
  const outputs = Object.fromEntries(
    [...workflow.matchAll(/^ {6}([a-z]+): \$\{\{ (.*) \}\}$/gm)].map((m) => [
      m[1],
      m[2],
    ])
  );
  const selected = (name, scope, inputs = {}) =>
    outputs[name].split(' || ').some((part) => {
      const match =
        /^steps\.(scope|inputs)\.outputs\.([a-z_]+) == 'true'$/.exec(part);
      assert.ok(match, part);
      return (match[1] === 'scope' ? scope : inputs)[match[2]] === true;
    });
  for (const scope of [
    { website: true },
    { instructions: true },
    { example: true, code: true, shared: true },
    { js: true, code: true },
  ]) {
    assert.equal(selected('checker', scope), false);
  }
  assert.equal(selected('contract', { instructions: true }), true);
  assert.equal(selected('example', { instructions: true }), false);
  assert.equal(selected('example', { example: true, shared: true }), true);
  assert.equal(selected('checker', { manifest_runtime: true }), true);
  assert.equal(selected('checker', {}, { checker: true }), true);
  for (const file of [
    'example/GUIDE.md',
    '.pr_agent.toml',
    '.gitattributes',
    'website/docusaurus.config.ts',
    'website/static/img/logo.png',
    'website/static/example-fixtures/media-decode-failure-v1.png',
  ]) {
    assert.ok(workflow.includes("- '" + file + "'"), file);
  }
  const checker = workflow
    .split('            checker:')[1]
    .split('\n  verify-example-showcase:')[0];
  for (const file of [
    'scripts/run-example-jest.mjs',
    'scripts/run-example-jest-focused.mjs',
    'example/jest.config.js',
    'example/jest.focused.config.js',
    'example/jest.forbidOnlyReporter.js',
    'example/jest.showcaseGate.js',
  ]) {
    assert.ok(checker.includes("- '" + file + "'"), file);
  }
  assert.match(
    workflow,
    /if: needs\.changes\.outputs\.contract == 'true'\n {8}run: node scripts\/verify-example-showcase\.mjs --check/
  );
  assert.match(
    workflow,
    /if: needs\.changes\.outputs\.checker == 'true'\n {8}run: yarn verify:example-showcase/
  );
  assert.doesNotMatch(
    workflow,
    /run: yarn (lint|typecheck|test --maxWorkers=2|prepare)\n/
  );
});
