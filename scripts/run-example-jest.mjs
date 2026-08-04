import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyExampleTestRegistrations } from './verify-example-showcase.mjs';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDirectory, '..');
const args = process.argv.slice(2);
const forbidOnlyIndex = args.indexOf('--forbidOnly');

if (forbidOnlyIndex < 0) {
  process.stderr.write(
    '[forbidOnly] example Jest 必须通过 focused/skipped test 门禁运行。\n'
  );
  process.exit(2);
}

args.splice(forbidOnlyIndex, 1);
const contractRoot = path.resolve(
  process.env.EXAMPLE_SHOWCASE_ROOT ?? repositoryRoot
);
try {
  verifyExampleTestRegistrations(contractRoot);
} catch (error) {
  const detail =
    error && typeof error === 'object' && 'code' in error
      ? `${String(error.code)}: ${String(error.message)}`
      : String(error);
  process.stderr.write(`[forbidOnly] ${detail}\n`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [
    path.join(repositoryRoot, 'example/node_modules/jest/bin/jest.js'),
    ...args,
  ],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  }
);

if (result.error) {
  process.stderr.write(`[forbidOnly] 无法启动 Jest：${String(result.error)}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
