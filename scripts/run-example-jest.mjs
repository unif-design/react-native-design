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
const expectedGovernedOwnerTestFiles = Object.freeze([
  'src/__tests__/App.test.tsx',
  'src/__tests__/FoundationScene.test.tsx',
  'src/__tests__/ActionsScene.test.tsx',
  'src/__tests__/FeedbackScene.test.tsx',
  'src/__tests__/FormsScene.test.tsx',
  'src/__tests__/NavigationScene.test.tsx',
  'src/__tests__/CollectionsScene.test.tsx',
  'src/__tests__/MediaScene.test.tsx',
  'src/__tests__/BusinessScene.test.tsx',
]);

if (forbidOnlyIndex < 0) {
  process.stderr.write(
    '[forbidOnly] example Jest 必须通过 focused/skipped test 门禁运行。\n'
  );
  process.exit(2);
}

args.splice(forbidOnlyIndex, 1);

class JestProductionGateError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'JestProductionGateError';
    this.code = code;
  }
}

function failGate(code, message) {
  throw new JestProductionGateError(code, message);
}

function canonicalPath(value, code, label) {
  try {
    return realpathSync(path.resolve(value));
  } catch (error) {
    failGate(code, `${label} 无法解析真实路径：${String(error)}`);
  }
}

function assertSafeProductionArguments(jestArgs) {
  for (let index = 0; index < jestArgs.length; index += 1) {
    const argument = jestArgs[index];
    if (
      argument === '--runInBand' ||
      argument === '--no-cache' ||
      argument === '--ci'
    ) {
      continue;
    }
    if (/^--maxWorkers=(?:[1-9]\d*|100%|[1-9]\d?%)$/u.test(argument)) {
      continue;
    }
    if (argument === '--maxWorkers') {
      const value = jestArgs[index + 1];
      if (
        typeof value === 'string' &&
        /^(?:[1-9]\d*|100%|[1-9]\d?%)$/u.test(value)
      ) {
        index += 1;
        continue;
      }
    }
    failGate(
      'JEST_PRODUCTION_ARGUMENT',
      `production example Jest 只接受 --maxWorkers、--runInBand、--no-cache 与 --ci；focused/selection/config/reporter/non-execution 参数必须改走 test:focused：${String(argument)}`
    );
  }
}

function assertExactStrings(actual, expected, code, label) {
  if (
    !Array.isArray(actual) ||
    actual.length !== expected.length ||
    actual.some((value, index) => value !== expected[index])
  ) {
    failGate(
      code,
      `${label} 漂移：expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`
    );
  }
}

function assertReporterContract(globalConfig, jestRoot) {
  const reporterPath = canonicalPath(
    path.join(jestRoot, 'jest.forbidOnlyReporter.js'),
    'JEST_REPORTER_CONTRACT',
    'production Jest reporter'
  );
  const reporters = globalConfig.reporters;
  const valid =
    Array.isArray(reporters) &&
    reporters.length === 2 &&
    Array.isArray(reporters[0]) &&
    reporters[0][0] === 'default' &&
    reporters[0][1] &&
    Object.keys(reporters[0][1]).length === 0 &&
    Array.isArray(reporters[1]) &&
    canonicalPath(
      reporters[1][0],
      'JEST_REPORTER_CONTRACT',
      'resolved production Jest reporter'
    ) === reporterPath &&
    reporters[1][1] &&
    Object.keys(reporters[1][1]).length === 0;
  if (!valid) {
    failGate(
      'JEST_REPORTER_CONTRACT',
      'resolved reporters 必须恰好保留 default 与 governed owner attestation reporter'
    );
  }
}

function discoverSelectedTests(jestRoot, configPath) {
  const result = spawnSync(
    process.execPath,
    [
      path.join(repositoryRoot, 'example/node_modules/jest/bin/jest.js'),
      '--config',
      configPath,
      '--listTests',
      '--json',
    ],
    {
      cwd: jestRoot,
      encoding: 'utf8',
      env: process.env,
    }
  );
  if (result.error || result.status !== 0) {
    failGate(
      'JEST_GOVERNED_SUITES_SELECTED',
      `无法取得 production Jest 最终 discovery set：${String(result.error ?? `${result.stdout}\n${result.stderr}`)}`
    );
  }
  try {
    const discovered = JSON.parse(result.stdout);
    if (!Array.isArray(discovered)) throw new Error('listTests 结果不是数组');
    return discovered.map((testPath) =>
      canonicalPath(
        testPath,
        'JEST_GOVERNED_SUITES_SELECTED',
        'discovered test path'
      )
    );
  } catch (error) {
    failGate(
      'JEST_GOVERNED_SUITES_SELECTED',
      `无法解析 production Jest discovery JSON：${String(error)}`
    );
  }
}

async function resolveProductionGate(jestArgs) {
  assertSafeProductionArguments(jestArgs);
  const { buildArgv } = require(
    path.join(repositoryRoot, 'example/node_modules/jest-cli/build/run.js')
  );
  const { readConfigs } = require(
    path.join(repositoryRoot, 'example/node_modules/jest-config/build/index.js')
  );
  let resolvedConfigs;
  try {
    const argv = await buildArgv(jestArgs);
    const projects = Array.isArray(argv.projects)
      ? argv.projects
      : [process.cwd()];
    resolvedConfigs = await readConfigs(argv, projects);
  } catch (error) {
    failGate(
      'JEST_CONFIG_ROOT',
      `无法按 Jest 29 规则解析 production config：${String(error)}`
    );
  }

  if (resolvedConfigs.configs.length !== 1) {
    failGate(
      'JEST_PROJECT_ROOT_COUNT',
      `production example Jest 只允许一个 project，实际=${resolvedConfigs.configs.length}`
    );
  }
  const [projectConfig] = resolvedConfigs.configs;
  const jestRoot = canonicalPath(
    projectConfig.rootDir,
    'JEST_CONFIG_ROOT',
    'Jest rootDir'
  );
  const invocationRoot = canonicalPath(
    process.cwd(),
    'JEST_CONFIG_ROOT',
    'production Jest cwd'
  );
  if (invocationRoot !== jestRoot) {
    failGate(
      'JEST_CONFIG_ROOT',
      `production example Jest 必须从 resolved example root 调用：cwd=${invocationRoot} root=${jestRoot}`
    );
  }

  const discoveryRoots = Array.isArray(projectConfig.roots)
    ? projectConfig.roots.map((root) =>
        canonicalPath(root, 'JEST_DISCOVERY_ROOT_MISMATCH', 'Jest config.roots')
      )
    : [];
  if (discoveryRoots.length !== 1 || discoveryRoots[0] !== jestRoot) {
    failGate(
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
    failGate(
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
      failGate(
        'JEST_ROOT_MISMATCH',
        `EXAMPLE_SHOWCASE_ROOT 与 actual Jest root 不一致：env=${environmentRoot} derived=${contractRoot}`
      );
    }
  }

  assertExactStrings(
    projectConfig.testMatch,
    ['**/*.test.[jt]s?(x)'],
    'JEST_CONFIG_SELECTION',
    'resolved testMatch'
  );
  assertExactStrings(
    projectConfig.testPathIgnorePatterns,
    ['/node_modules/'],
    'JEST_CONFIG_SELECTION',
    'resolved testPathIgnorePatterns'
  );
  assertExactStrings(
    projectConfig.testRegex,
    [],
    'JEST_CONFIG_SELECTION',
    'resolved testRegex'
  );
  if (
    projectConfig.filter !== undefined ||
    projectConfig.skipFilter !== false ||
    (Array.isArray(projectConfig.modulePathIgnorePatterns) &&
      projectConfig.modulePathIgnorePatterns.length > 0)
  ) {
    failGate(
      'JEST_CONFIG_SELECTION',
      'resolved filter/ignore config 不得缩小 production discovery set'
    );
  }
  assertReporterContract(resolvedConfigs.globalConfig, jestRoot);

  const gateContract = require(path.join(jestRoot, 'jest.showcaseGate.js'));
  const ownerFiles = gateContract.governedOwnerTestFiles;
  assertExactStrings(
    ownerFiles,
    expectedGovernedOwnerTestFiles,
    'JEST_GOVERNED_SUITE_CONTRACT',
    'governed owner suite contract'
  );
  const requiredTestPaths = ownerFiles.map((relativePath) =>
    canonicalPath(
      path.join(jestRoot, relativePath),
      'JEST_GOVERNED_SUITE_CONTRACT',
      `governed owner suite ${String(relativePath)}`
    )
  );
  const configPath = canonicalPath(
    path.join(jestRoot, 'jest.config.js'),
    'JEST_CONFIG_ROOT',
    'production jest.config.js'
  );
  const discoveredTests = new Set(discoverSelectedTests(jestRoot, configPath));
  const missingSelected = requiredTestPaths.filter(
    (testPath) => !discoveredTests.has(testPath)
  );
  if (missingSelected.length > 0) {
    failGate(
      'JEST_GOVERNED_SUITES_SELECTED',
      `production discovery 缺少 governed owner suites：${missingSelected.join(',')}`
    );
  }
  process.stderr.write(
    `[showcaseOwners] JEST_GOVERNED_SUITES_SELECTED count=${requiredTestPaths.length}\n`
  );
  return { contractRoot, jestRoot, requiredTestPaths };
}

let gate;
try {
  gate = await resolveProductionGate(args);
  verifyExampleTestRegistrations(gate.contractRoot);
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
  [path.join(repositoryRoot, 'example/node_modules/jest/bin/jest.js'), ...args],
  {
    cwd: gate.jestRoot,
    env: {
      ...process.env,
      EXAMPLE_SHOWCASE_JEST_ATTESTATION: JSON.stringify({
        rootDir: gate.jestRoot,
        requiredTestPaths: gate.requiredTestPaths,
      }),
    },
    stdio: 'inherit',
  }
);

if (result.error) {
  process.stderr.write(`[forbidOnly] 无法启动 Jest：${String(result.error)}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
