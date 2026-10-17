import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);

function run(relativeScript, scriptArgs) {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL(relativeScript, import.meta.url)), ...scriptArgs],
    { cwd: repositoryRoot, env: process.env, stdio: 'inherit' }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Preserve the example's discovery, forbidOnly and owner attestation gate.
run('../.yarn/releases/yarn-4.11.0.cjs', [
  'workspace',
  '@unif/react-native-design-example',
  'test',
  ...args,
]);

// The shared CI command supplies --coverage; ordinary local tests run once.
if (args.includes('--coverage')) run('./run-library-coverage.mjs', args);
