#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDir, '..');
const contractRoot = path.resolve(process.argv[2] ?? repositoryRoot);
const testNamePattern = process.env.EXAMPLE_SHOWCASE_TEST_NAME_PATTERN;
const args = ['--test'];

if (testNamePattern) {
  args.push(`--test-name-pattern=${testNamePattern}`);
}
args.push(
  path.join(scriptsDir, '__tests__/example-showcase-contract.test.mjs')
);

const result = spawnSync(process.execPath, args, {
  cwd: repositoryRoot,
  env: {
    ...process.env,
    EXAMPLE_SHOWCASE_ROOT: contractRoot,
  },
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}
process.exitCode = result.status ?? 1;
