#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDir, '..');
const contractRoot = path.resolve(process.argv[2] ?? repositoryRoot);
const args = ['--test'];

args.push(
  path.join(scriptsDir, '__tests__/example-showcase-contract.test.mjs')
);

const env = {
  ...process.env,
  EXAMPLE_SHOWCASE_ROOT: contractRoot,
};
delete env.EXAMPLE_SHOWCASE_TEST_NAME_PATTERN;
// 集成测试也会调用正式 verifier；不继承 node:test 的递归保护标记。
delete env.NODE_TEST_CONTEXT;

const result = spawnSync(process.execPath, args, {
  cwd: repositoryRoot,
  env,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}
process.exitCode = result.status ?? 1;
