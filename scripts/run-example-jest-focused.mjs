import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyExampleTestRegistrations } from './verify-example-showcase.mjs';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDirectory, '..');
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const forbidOnlyIndex = args.indexOf('--forbidOnly');

if (forbidOnlyIndex < 0) {
  process.stderr.write(
    '[forbidOnly:focused] focused example Jest 仍必须通过 registration 门禁。\n'
  );
  process.exit(2);
}

args.splice(forbidOnlyIndex, 1);

class FocusedJestRootBindingError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'FocusedJestRootBindingError';
    this.code = code;
  }
}

function failRootBinding(code, message) {
  throw new FocusedJestRootBindingError(code, message);
}

function canonicalPath(value, code, label) {
  try {
    return realpathSync(path.resolve(value));
  } catch (error) {
    failRootBinding(code, `${label} 无法解析真实路径：${String(error)}`);
  }
}

function isPathInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return (
    relative === '' ||
    (relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

async function resolveContractRoot(jestArgs) {
  const { buildArgv } = require(
    path.join(repositoryRoot, 'example/node_modules/jest-cli/build/run.js')
  );
  const { readConfigs } = require(
    path.join(repositoryRoot, 'example/node_modules/jest-config/build/index.js')
  );
  let argv;
  let resolvedConfigs;
  try {
    argv = await buildArgv(jestArgs);
    const projects = Array.isArray(argv.projects)
      ? argv.projects
      : [process.cwd()];
    resolvedConfigs = await readConfigs(argv, projects);
  } catch (error) {
    failRootBinding(
      'JEST_CONFIG_ROOT',
      `无法按 Jest 29 规则解析 config/rootDir：${String(error)}`
    );
  }

  const projectRoots = [
    ...new Set(
      resolvedConfigs.configs.map((config) =>
        canonicalPath(config.rootDir, 'JEST_CONFIG_ROOT', 'Jest rootDir')
      )
    ),
  ];
  if (resolvedConfigs.configs.length !== 1 || projectRoots.length !== 1) {
    failRootBinding(
      'JEST_PROJECT_ROOT_COUNT',
      `focused example Jest 只允许一个 project/rootDir，projects=${resolvedConfigs.configs.length} roots=${projectRoots.length}`
    );
  }

  const [jestRoot] = projectRoots;
  const [projectConfig] = resolvedConfigs.configs;
  const discoveryRoots = Array.isArray(projectConfig.roots)
    ? projectConfig.roots.map((root) =>
        canonicalPath(root, 'JEST_DISCOVERY_ROOT_MISMATCH', 'Jest config.roots')
      )
    : [];
  if (discoveryRoots.length !== 1 || discoveryRoots[0] !== jestRoot) {
    failRootBinding(
      'JEST_DISCOVERY_ROOT_MISMATCH',
      `Jest config.roots 必须唯一且精确等于 actual root：root=${jestRoot} roots=${discoveryRoots.join(',') || '无'}`
    );
  }
  const contractRoot = path.dirname(jestRoot);
  const governedTestRoot = canonicalPath(
    path.join(contractRoot, 'example'),
    'JEST_ROOT_LAYOUT',
    'governed example root'
  );
  if (governedTestRoot !== jestRoot) {
    failRootBinding(
      'JEST_ROOT_LAYOUT',
      `Jest rootDir 必须是 contract root 下的 example：actual=${jestRoot}`
    );
  }

  if (process.env.EXAMPLE_SHOWCASE_ROOT) {
    const environmentRoot = canonicalPath(
      process.env.EXAMPLE_SHOWCASE_ROOT,
      'JEST_ROOT_MISMATCH',
      'EXAMPLE_SHOWCASE_ROOT'
    );
    if (environmentRoot !== contractRoot) {
      failRootBinding(
        'JEST_ROOT_MISMATCH',
        `EXAMPLE_SHOWCASE_ROOT 与 actual Jest root 不一致：env=${environmentRoot} derived=${contractRoot}`
      );
    }
  }

  if (argv.runTestsByPath) {
    if (!Array.isArray(argv._) || argv._.length === 0) {
      failRootBinding(
        'JEST_TEST_PATH_REQUIRED',
        '--runTestsByPath 必须提供至少一个真实 test path'
      );
    }
    for (const testPath of argv._) {
      const canonicalTestPath = canonicalPath(
        path.resolve(process.cwd(), String(testPath)),
        'JEST_TEST_PATH_INVALID',
        '--runTestsByPath'
      );
      if (!isPathInside(jestRoot, canonicalTestPath)) {
        failRootBinding(
          'JEST_TEST_PATH_OUTSIDE_ROOT',
          `--runTestsByPath 必须位于 actual Jest root 内：root=${jestRoot} path=${canonicalTestPath}`
        );
      }
    }
  }

  return contractRoot;
}

try {
  const contractRoot = await resolveContractRoot(args);
  verifyExampleTestRegistrations(contractRoot);
} catch (error) {
  const detail =
    error && typeof error === 'object' && 'code' in error
      ? `${String(error.code)}: ${String(error.message)}`
      : String(error);
  process.stderr.write(`[forbidOnly:focused] ${detail}\n`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [path.join(repositoryRoot, 'example/node_modules/jest/bin/jest.js'), ...args],
  {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  }
);

if (result.error) {
  process.stderr.write(
    `[forbidOnly:focused] 无法启动 Jest：${String(result.error)}\n`
  );
  process.exit(1);
}

process.exit(result.status ?? 1);
