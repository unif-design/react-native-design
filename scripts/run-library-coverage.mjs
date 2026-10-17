import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyExampleTestRegistrations } from './verify-example-showcase.mjs';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
verifyExampleTestRegistrations(repositoryRoot);
const result = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL('../node_modules/jest/bin/jest.js', import.meta.url)),
    '--config',
    'jest.coverage.config.js',
    '--coverage',
    ...process.argv.slice(2),
  ],
  { cwd: repositoryRoot, env: process.env, stdio: 'inherit' }
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
