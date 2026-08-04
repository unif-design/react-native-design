import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as showcaseVerifier from '../verify-example-showcase.mjs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDir, '../..');
const root = process.env.EXAMPLE_SHOWCASE_ROOT
  ? path.resolve(process.env.EXAMPLE_SHOWCASE_ROOT)
  : repositoryRoot;
const exampleRoot = path.join(root, 'example');
const require = createRequire(import.meta.url);

const read = (relativePath) =>
  readFileSync(path.join(root, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(read(relativePath));

function withFixture(relativePaths, run) {
  const fixture = mkdtempSync(
    path.join(os.tmpdir(), 'react-native-design-example-contract-')
  );
  try {
    for (const relativePath of relativePaths) {
      const target = path.join(fixture, relativePath);
      mkdirSync(path.dirname(target), { recursive: true });
      copyFileSync(path.join(repositoryRoot, relativePath), target);
    }
    return run(fixture);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function runContractMutation(fixture, testNamePattern) {
  const env = {
    ...process.env,
    EXAMPLE_SHOWCASE_ROOT: fixture,
  };
  delete env.EXAMPLE_SHOWCASE_TEST_NAME_PATTERN;
  delete env.NODE_TEST_CONTEXT;
  return spawnSync(
    process.execPath,
    [
      '--test',
      `--test-name-pattern=${testNamePattern}`,
      path.join(
        repositoryRoot,
        'scripts/__tests__/example-showcase-contract.test.mjs'
      ),
    ],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
      env,
    }
  );
}

function prepareFixtureExampleRuntime(fixture) {
  const fixtureRoot = realpathSync(fixture);
  const fixtureExampleRoot = path.join(fixtureRoot, 'example');
  const rootModules = path.join(fixtureRoot, 'node_modules');
  const exampleModules = path.join(fixtureExampleRoot, 'node_modules');
  if (!existsSync(rootModules)) {
    symlinkSync(path.join(repositoryRoot, 'node_modules'), rootModules, 'dir');
  }
  if (!existsSync(exampleModules)) {
    symlinkSync(
      path.join(repositoryRoot, 'example/node_modules'),
      exampleModules,
      'dir'
    );
  }
  return { fixtureExampleRoot, fixtureRoot };
}

function createFixtureJestConfig(fixture, overrides = {}) {
  const { fixtureExampleRoot } = prepareFixtureExampleRuntime(fixture);
  const baseConfig = require(
    path.join(repositoryRoot, 'example/jest.config.js')
  );
  return {
    ...baseConfig,
    rootDir: fixtureExampleRoot,
    cacheDirectory: path.join(fixture, '.jest-cache'),
    preset: path.join(
      repositoryRoot,
      'example/node_modules/@react-native/jest-preset'
    ),
    setupFilesAfterEnv: [path.join(repositoryRoot, 'example/jest.setup.ts')],
    moduleNameMapper: {
      ...baseConfig.moduleNameMapper,
      '^@unif/react-native-design$': path.join(repositoryRoot, 'src/index.tsx'),
      '^react$': path.join(repositoryRoot, 'example/node_modules/react'),
      '^react/(.*)$': path.join(
        repositoryRoot,
        'example/node_modules/react/$1'
      ),
      '^react-native-gesture-handler$': path.join(
        repositoryRoot,
        'example/node_modules/react-native-gesture-handler/src/index.ts'
      ),
      '^react-native-reanimated$': path.join(
        repositoryRoot,
        'example/node_modules/react-native-reanimated/mock.js'
      ),
      '^react-native-worklets$': path.join(
        repositoryRoot,
        'example/node_modules/react-native-worklets/src/mock.ts'
      ),
    },
    ...overrides,
  };
}

function writeFixtureProductionJestConfig(fixture, overrides = {}) {
  const { fixtureExampleRoot } = prepareFixtureExampleRuntime(fixture);
  writeFileSync(
    path.join(fixtureExampleRoot, 'jest.config.js'),
    `module.exports = ${JSON.stringify(
      createFixtureJestConfig(fixture, overrides),
      null,
      2
    )};\n`
  );
  return fixtureExampleRoot;
}

function writePhaseDependentFixtureProductionJestConfig(fixture) {
  const { fixtureExampleRoot } = prepareFixtureExampleRuntime(fixture);
  const productionConfig = readFileSync(
    path.join(repositoryRoot, 'example/jest.config.js'),
    'utf8'
  ).replace('module.exports = {', 'const safeConfig = {');
  writeFileSync(
    path.join(fixtureExampleRoot, 'jest.config.js'),
    [
      productionConfig.trimEnd(),
      '',
      'module.exports = process.env.EXAMPLE_SHOWCASE_JEST_ATTESTATION',
      '  ? {',
      '      ...safeConfig,',
      "      testMatch: ['**/exampleNavigation.test.ts'],",
      "      reporters: ['default'],",
      '      testFailureExitCode: 0,',
      '    }',
      '  : safeConfig;',
      '',
    ].join('\n')
  );
  return fixtureExampleRoot;
}

function writeArgvSensitiveFixtureProductionJestConfig(fixture) {
  const { fixtureExampleRoot } = prepareFixtureExampleRuntime(fixture);
  const productionConfig = readFileSync(
    path.join(repositoryRoot, 'example/jest.config.js'),
    'utf8'
  ).replace('module.exports = {', 'const safeConfig = {');
  writeFileSync(
    path.join(fixtureExampleRoot, 'jest.config.js'),
    [
      productionConfig.trimEnd(),
      '',
      'module.exports =',
      '  !process.env.EXAMPLE_SHOWCASE_JEST_ATTESTATION ||',
      "  process.argv.includes('--runTestsByPath')",
      '    ? safeConfig',
      '    : {',
      '        ...safeConfig,',
      "        testMatch: ['**/exampleNavigation.test.ts'],",
      "        reporters: ['default'],",
      '        testFailureExitCode: 0,',
      '      };',
      '',
    ].join('\n')
  );
  return fixtureExampleRoot;
}

function runExampleJestWrapper(
  fixture,
  args,
  { cwd = repositoryRoot, showcaseRoot = fixture } = {}
) {
  prepareFixtureExampleRuntime(fixture);
  const env = { ...process.env };
  if (showcaseRoot === undefined) {
    delete env.EXAMPLE_SHOWCASE_ROOT;
  } else {
    env.EXAMPLE_SHOWCASE_ROOT = realpathSync(showcaseRoot);
  }

  return spawnSync(
    process.execPath,
    [
      path.join(repositoryRoot, 'scripts/run-example-jest.mjs'),
      '--forbidOnly',
      ...args,
    ],
    {
      cwd,
      encoding: 'utf8',
      env,
    }
  );
}

function runExampleFocusedJestWrapper(
  fixture,
  args,
  { cwd = repositoryRoot, showcaseRoot = fixture } = {}
) {
  prepareFixtureExampleRuntime(fixture);
  const env = { ...process.env };
  if (showcaseRoot === undefined) {
    delete env.EXAMPLE_SHOWCASE_ROOT;
  } else {
    env.EXAMPLE_SHOWCASE_ROOT = realpathSync(showcaseRoot);
  }

  return spawnSync(
    process.execPath,
    [
      path.join(repositoryRoot, 'scripts/run-example-jest-focused.mjs'),
      '--forbidOnly',
      ...args,
    ],
    {
      cwd,
      encoding: 'utf8',
      env,
    }
  );
}

function runExampleAcceptanceTest(
  fixture,
  testFile,
  { showcaseRoot = fixture } = {}
) {
  const { fixtureExampleRoot } = prepareFixtureExampleRuntime(fixture);
  return runExampleFocusedJestWrapper(
    fixture,
    [
      '--config',
      JSON.stringify(
        createFixtureJestConfig(fixture, { reporters: ['default'] })
      ),
      '--runInBand',
      '--runTestsByPath',
      path.join(fixtureExampleRoot, 'src/__tests__', testFile),
    ],
    { showcaseRoot }
  );
}

function withActualJestReporterFixture(run) {
  const fixture = realpathSync(
    mkdtempSync(
      path.join(os.tmpdir(), 'react-native-design-actual-jest-reporter-')
    )
  );
  const outsideFixture = realpathSync(
    mkdtempSync(
      path.join(os.tmpdir(), 'react-native-design-outside-jest-reporter-')
    )
  );
  try {
    const testRoot = path.join(fixture, 'src/__tests__');
    mkdirSync(testRoot, { recursive: true });
    const ownerNames = [
      'App',
      'FoundationScene',
      'ActionsScene',
      'FeedbackScene',
      'FormsScene',
      'NavigationScene',
      'CollectionsScene',
      'MediaScene',
      'BusinessScene',
    ];
    const requiredTestPaths = ownerNames.map((name) =>
      path.join(testRoot, `${name}.test.js`)
    );
    const nonOwnerTestPath = path.join(testRoot, 'NonOwner.test.js');
    const outsideExpectedTestPath = path.join(
      outsideFixture,
      'OutsideExpected.test.js'
    );
    const expectedTestPaths = [...requiredTestPaths, nonOwnerTestPath];
    for (const testPath of expectedTestPaths) {
      writeFileSync(
        testPath,
        `test(${JSON.stringify(path.basename(testPath))}, () => { expect(1).toBe(1); });\n`
      );
    }
    writeFileSync(
      outsideExpectedTestPath,
      "test('outside expected', () => { expect(1).toBe(1); });\n"
    );
    const configPath = path.join(fixture, 'jest.config.cjs');
    writeFileSync(
      configPath,
      `module.exports = ${JSON.stringify({
        rootDir: fixture,
        testEnvironment: 'node',
        testMatch: ['**/*.test.js'],
        reporters: [
          'default',
          path.join(repositoryRoot, 'example/jest.forbidOnlyReporter.js'),
        ],
        transform: {},
      })};\n`
    );

    const runReporter = ({
      attestation,
      attestedExpectedTestPaths = expectedTestPaths,
      attestedRequiredTestPaths = requiredTestPaths,
      selectedTestPaths = expectedTestPaths,
    } = {}) => {
      const env = {
        ...process.env,
        EXAMPLE_SHOWCASE_JEST_ATTESTATION: JSON.stringify(
          attestation ?? {
            rootDir: fixture,
            requiredTestPaths: attestedRequiredTestPaths,
            expectedTestPaths: attestedExpectedTestPaths,
          }
        ),
      };
      return spawnSync(
        process.execPath,
        [
          path.join(repositoryRoot, 'example/node_modules/jest/bin/jest.js'),
          '--config',
          configPath,
          '--runInBand',
          '--runTestsByPath',
          ...selectedTestPaths,
        ],
        { cwd: fixture, encoding: 'utf8', env }
      );
    };

    return run({
      expectedTestPaths,
      fixture,
      nonOwnerTestPath,
      outsideExpectedTestPath,
      requiredTestPaths,
      runReporter,
    });
  } finally {
    rmSync(fixture, { recursive: true, force: true });
    rmSync(outsideFixture, { recursive: true, force: true });
  }
}

const expectedRuntimeDependencies = {
  '@sbaiahmed1/react-native-blur': '4.6.2',
  '@unif/react-native-design': 'workspace:*',
  'react': '19.2.3',
  'react-native': '0.86.2',
  'react-native-gesture-handler': '3.1.0',
  'react-native-reanimated': '4.5.3',
  'react-native-reanimated-carousel': '5.0.0',
  'react-native-safe-area-context': '5.8.0',
  'react-native-svg': '15.15.5',
  'react-native-worklets': '0.11.3',
};

const expectedTemplateDevDependencies = {
  '@react-native-community/cli': '20.1.0',
  '@react-native-community/cli-platform-android': '20.1.0',
  '@react-native-community/cli-platform-ios': '20.1.0',
  '@react-native/babel-preset': '0.86.2',
  '@react-native/eslint-config': '0.86.2',
  '@react-native/jest-preset': '0.86.2',
  '@react-native/metro-config': '0.86.2',
  '@react-native/typescript-config': '0.86.2',
};

const catalogContractFiles = [
  'example/src/catalog/componentCatalog.ts',
  'src/index.tsx',
  'src/components/ui/index.ts',
  'src/components/business/index.ts',
  'src/theme/index.ts',
  'src/icons/index.ts',
  'src/icons/types.ts',
  'src/icons/data.ts',
  'src/utils/testID/index.ts',
  'src/utils/logger/index.ts',
];

function listFiles(relativeDirectory, predicate = () => true) {
  const absoluteDirectory = path.join(repositoryRoot, relativeDirectory);
  const files = [];
  for (const entry of readdirSync(absoluteDirectory)) {
    const relativePath = path.join(relativeDirectory, entry);
    const absolutePath = path.join(repositoryRoot, relativePath);
    if (statSync(absolutePath).isDirectory()) {
      files.push(...listFiles(relativePath, predicate));
    } else if (predicate(relativePath)) {
      files.push(relativePath);
    }
  }
  return files;
}

const sourceContractFiles = [
  ...catalogContractFiles,
  ...listFiles('example/src', (relativePath) =>
    /\.[jt]sx?$/u.test(relativePath)
  ),
  'package.json',
  'README.md',
  'AGENTS.md',
  'CONTRIBUTING.md',
  '.gitattributes',
  'turbo.json',
  '.github/workflows/ci.yml',
  '.github/workflows/example-showcase.yml',
  'example/package.json',
  'example/README.md',
  'example/babel.config.js',
  'example/metro.config.js',
  'example/jest.config.js',
  'example/jest.focused.config.js',
  'example/jest.forbidOnlyReporter.js',
  'example/jest.showcaseGate.js',
  'example/tsconfig.json',
  'example/app.json',
  'example/index.js',
  'example/android/app/build.gradle',
  'example/android/build.gradle',
  'example/android/settings.gradle',
  'example/android/gradle.properties',
  'example/android/app/src/main/AndroidManifest.xml',
  'example/android/app/src/main/java/unif/reactnativedesign/example/MainActivity.kt',
  'example/android/app/src/main/java/unif/reactnativedesign/example/MainApplication.kt',
  'example/ios/Podfile',
  'example/Gemfile',
  'example/Gemfile.lock',
  'example/ios/Podfile.lock',
  'example/ios/ReactNativeDesignExample/AppDelegate.swift',
  'example/ios/ReactNativeDesignExample/Info.plist',
  'example/ios/ReactNativeDesignExample.xcodeproj/project.pbxproj',
  'example/ios/ReactNativeDesignExample.xcodeproj/xcshareddata/xcschemes/ReactNativeDesignExample.xcscheme',
  'website/docusaurus.config.ts',
  'website/static/img/logo.png',
  'website/static/example-fixtures/media-decode-failure-v1.png',
  'scripts/run-example-jest.mjs',
  'scripts/run-example-jest-focused.mjs',
];

const runtimeAcceptanceFiles = [
  ...sourceContractFiles,
  'example/jest.setup.ts',
  'example/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
];

function mutateFixtureFile(fixture, relativePath, mutate, label) {
  const target = path.join(fixture, relativePath);
  const source = readFileSync(target, 'utf8');
  const mutated = mutate(source);
  assert.notEqual(mutated, source, `${label} fixture 未发生变化`);
  writeFileSync(target, mutated);
}

function removeButtonLoadingCatalogState(source) {
  return source.replace(
    "states: ['变体', '尺寸', '通栏', '前后图标', '禁用', '加载']",
    "states: ['变体', '尺寸', '通栏', '前后图标', '禁用']"
  );
}

function removeButtonLoadingSpecimen(source) {
  const startMarker = '            <Button\n              label="加载按钮"';
  const start = source.indexOf(startMarker);
  if (start < 0) return source;
  const endMarker = '            />';
  const end = source.indexOf(endMarker, start);
  if (end < 0) return source;
  return `${source.slice(0, start)}${source.slice(end + endMarker.length + 1)}`;
}

function proofCallBlock(source, coverageName, proofId) {
  const marker = `  ${coverageName}.prove('${proofId}', () => {`;
  const start = source.indexOf(marker);
  if (start < 0) return undefined;
  const endMarker = '\n  });';
  const end = source.indexOf(endMarker, start);
  if (end < 0) return undefined;
  return source.slice(start, end + endMarker.length);
}

function replaceProofCall(source, coverageName, proofId, replacement) {
  const block = proofCallBlock(source, coverageName, proofId);
  return block ? source.replace(block, replacement) : source;
}

function removeRoutedStatusDotSpecimens(source) {
  return source.replaceAll('<StatusDot\n', '<Tag\n');
}

function removeSelectableChipSpecimen(source) {
  const startMarker = '            <Chip\n              label="可选择标签"';
  const start = source.indexOf(startMarker);
  if (start < 0) return source;
  const endMarker = '            />';
  const end = source.indexOf(endMarker, start);
  if (end < 0) return source;
  return `${source.slice(0, start)}${source.slice(end + endMarker.length + 1)}`;
}

function removeStateContractEntry(source, stateId) {
  const idMarker = `    id: '${stateId}',`;
  const idIndex = source.indexOf(idMarker);
  if (idIndex < 0) return source;
  const start = source.lastIndexOf('  {\n', idIndex);
  const nextEntry = source.indexOf("\n  {\n    id: '", idIndex);
  const contractEnd = source.indexOf('\n] as const', idIndex);
  const end = nextEntry >= 0 ? nextEntry + 1 : contractEnd;
  if (start < 0 || end < 0) return source;
  return `${source.slice(0, start)}${source.slice(end)}`;
}

function assertVerifierCode(fixture, expectedCode, label) {
  assert.throws(
    () => showcaseVerifier.verifyExampleShowcase(fixture),
    (error) => {
      assert.ok(
        error instanceof showcaseVerifier.ExampleShowcaseVerificationError,
        `${label} 必须抛 typed verifier error`
      );
      assert.equal(error.code, expectedCode, label);
      return true;
    },
    label
  );
}

function captureVerifierError(fixture) {
  try {
    showcaseVerifier.verifyExampleShowcase(fixture);
    return undefined;
  } catch (error) {
    return error;
  }
}

function plistArray(plist, key) {
  const match = plist.match(
    new RegExp(`<key>${key}</key>\\s*<array>([\\s\\S]*?)</array>`, 'u')
  );
  assert.ok(match, `Info.plist 缺少 ${key}`);
  return [...match[1].matchAll(/<string>([^<]+)<\/string>/gu)].map(
    (item) => item[1]
  );
}

test('example workspace 提供 Design 的完整 RN 0.86.2 runtime graph', () => {
  const examplePackage = readJson('example/package.json');

  assert.equal(examplePackage.name, '@unif/react-native-design-example');
  assert.deepEqual(examplePackage.dependencies, expectedRuntimeDependencies);
  for (const [name, version] of Object.entries(
    expectedTemplateDevDependencies
  )) {
    assert.equal(examplePackage.devDependencies[name], version, name);
  }
  assert.equal(
    examplePackage.devDependencies['@testing-library/react-native'],
    '^13.3.3'
  );
  assert.equal(examplePackage.devDependencies.jest, '^29.6.3');
  assert.equal(examplePackage.devDependencies['react-test-renderer'], '19.2.3');
  assert.equal(
    examplePackage.devDependencies['react-native-builder-bob'],
    undefined
  );
});

test('workspace scripts 暴露真实 example 及完整本地 gate', () => {
  const rootPackage = readJson('package.json');
  const examplePackage = readJson('example/package.json');

  assert.equal(
    rootPackage.scripts.example,
    'yarn workspace @unif/react-native-design-example'
  );
  assert.equal(
    rootPackage.scripts['verify:example-showcase'],
    'node --test scripts/__tests__/verify-example-showcase.test.mjs && node scripts/verify-example-showcase.mjs'
  );
  assert.ok(
    existsSync(path.join(root, 'scripts/verify-example-showcase.mjs')),
    'verify:example-showcase 入口必须存在'
  );
  assert.equal(
    examplePackage.scripts.test,
    'node ../scripts/run-example-jest.mjs --forbidOnly'
  );
  assert.equal(
    examplePackage.scripts['test:focused'],
    'node ../scripts/run-example-jest-focused.mjs --forbidOnly --config jest.focused.config.js'
  );
  assert.ok(
    existsSync(path.join(root, 'scripts/run-example-jest-focused.mjs')),
    'focused development runner 必须与 production gate 隔离'
  );
  assert.deepEqual(
    require(path.join(root, 'example/jest.config.js')).reporters,
    ['default', '<rootDir>/jest.forbidOnlyReporter.js']
  );
  assert.equal(examplePackage.scripts.typecheck, 'tsc --noEmit');
  assert.equal(examplePackage.scripts.lint, 'eslint .');
  assert.ok(
    existsSync(path.join(root, 'example/.eslintrc.js')),
    'example 必须包含 official template ESLint config'
  );
  assert.equal(
    read('example/.eslintrc.js'),
    "module.exports = {\n  root: true,\n  extends: '@react-native',\n};\n"
  );
});

test('root Jest 与 node:test showcase contract 保持 runner 边界', () => {
  const rootPackage = readJson('package.json');

  assert.equal(
    rootPackage.scripts['verify:example-showcase'],
    'node --test scripts/__tests__/verify-example-showcase.test.mjs && node scripts/verify-example-showcase.mjs'
  );
  assert.deepEqual(rootPackage.jest.testPathIgnorePatterns, [
    '/node_modules/',
    '<rootDir>/website/',
    '<rootDir>/example/',
    '<rootDir>/scripts/__tests__/',
  ]);
});

test('runner 边界 mutation gate 拒绝 seam 或 Jest ignore 漂移', () => {
  const mutations = [
    {
      label: 'verify script 跳过 CLI seam test',
      code: 'WORKSPACE_SCRIPTS',
      mutate: (source) =>
        source.replace(
          'node --test scripts/__tests__/verify-example-showcase.test.mjs && node scripts/verify-example-showcase.mjs',
          'node scripts/verify-example-showcase.mjs'
        ),
    },
    {
      label: 'root Jest 误收集 node:test',
      code: 'ROOT_JEST_NODE_TEST_BOUNDARY',
      mutate: (source) =>
        source.replace(
          '<rootDir>/scripts/__tests__/',
          '<rootDir>/scripts/contracts/'
        ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        'package.json',
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }
});

test('Yarn 不全局丢弃 peer warning', () => {
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, '.yarn/releases/yarn-4.11.0.cjs'),
      'config',
      'get',
      'logFilters',
      '--json',
    ],
    {
      cwd: root,
      encoding: 'utf8',
    }
  );
  const output = `${result.stdout}\n${result.stderr}`;
  assert.equal(result.status, 0, output);
  const filters = JSON.parse(result.stdout);

  assert.deepEqual(
    filters.filter((filter) => filter.level === 'discard'),
    []
  );
});

test('Babel/Metro/Jest 使用 RN 0.86 workspace source contract', () => {
  const babelConfig = require(path.join(exampleRoot, 'babel.config.js'));
  const metroConfig = require(path.join(exampleRoot, 'metro.config.js'));
  const jestConfig = require(path.join(exampleRoot, 'jest.config.js'));

  assert.equal(babelConfig.presets[0], 'module:@react-native/babel-preset');
  assert.ok(Array.isArray(babelConfig.plugins), 'Babel 缺少 plugins 数组');
  assert.equal(
    babelConfig.plugins.at(-1),
    'react-native-worklets/plugin',
    'Worklets plugin 必须是最后一个 Babel plugin'
  );
  assert.ok(
    babelConfig.overrides.some(
      (override) =>
        override.include === path.join(root, 'src') &&
        String(override.presets[0][0]).includes(
          'react-native-builder-bob/configs/babel-preset.js'
        )
    ),
    'Babel 必须用 bob config 转译根 workspace source'
  );
  assert.ok(metroConfig.watchFolders.includes(root));
  assert.equal(
    metroConfig.resolver.extraNodeModules['@unif/react-native-design'],
    root
  );
  assert.equal(jestConfig.preset, '@react-native/jest-preset');
  assert.deepEqual(jestConfig.setupFilesAfterEnv, ['<rootDir>/jest.setup.ts']);
  assert.match(
    read('example/tsconfig.json'),
    /@react-native\/typescript-config/u
  );
});

test('app registry 与 Android identity 原子同步并保留 New Architecture', () => {
  const app = readJson('example/app.json');
  const index = read('example/index.js');
  const appGradle = read('example/android/app/build.gradle');
  const rootGradle = read('example/android/build.gradle');
  const settings = read('example/android/settings.gradle');
  const properties = read('example/android/gradle.properties');
  assert.ok(
    existsSync(
      path.join(
        exampleRoot,
        'android/app/src/main/java/unif/reactnativedesign/example/MainActivity.kt'
      )
    ),
    'Android MainActivity 尚未迁移到 unif.reactnativedesign.example'
  );
  const activity = read(
    'example/android/app/src/main/java/unif/reactnativedesign/example/MainActivity.kt'
  );
  const application = read(
    'example/android/app/src/main/java/unif/reactnativedesign/example/MainApplication.kt'
  );

  assert.deepEqual(app, {
    name: 'ReactNativeDesignExample',
    displayName: 'ReactNativeDesignExample',
  });
  assert.ok(
    index.indexOf("import 'react-native-gesture-handler';") <
      index.indexOf("import { AppRegistry } from 'react-native';")
  );
  assert.match(appGradle, /namespace "unif\.reactnativedesign\.example"/u);
  assert.match(appGradle, /applicationId "unif\.reactnativedesign\.example"/u);
  assert.match(appGradle, /autolinkLibrariesWithApp\(\)/u);
  assert.match(rootGradle, /minSdkVersion = 24/u);
  assert.match(rootGradle, /compileSdkVersion = 36/u);
  assert.match(rootGradle, /targetSdkVersion = 36/u);
  assert.match(settings, /autolinkLibrariesFromCommand\(\)/u);
  assert.match(settings, /rootProject\.name = 'ReactNativeDesignExample'/u);
  assert.match(properties, /^newArchEnabled=true$/mu);
  assert.match(properties, /^hermesEnabled=true$/mu);
  assert.match(activity, /^package unif\.reactnativedesign\.example$/mu);
  assert.match(
    activity,
    /getMainComponentName\(\): String = "ReactNativeDesignExample"/u
  );
  assert.match(application, /^package unif\.reactnativedesign\.example$/mu);
});

test('Android manifest 仅声明 INTERNET 权限', () => {
  const manifest = read('example/android/app/src/main/AndroidManifest.xml');
  const permissions = [
    ...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"\s*\/>/gu),
  ].map((match) => match[1]);

  assert.deepEqual(permissions, ['android.permission.INTERNET']);
});

test('iOS project/scheme/module/app identity 原子同步且保持 autolinking', () => {
  assert.ok(
    existsSync(
      path.join(
        exampleRoot,
        'ios/ReactNativeDesignExample.xcodeproj/project.pbxproj'
      )
    ),
    'iOS project 尚未改名为 ReactNativeDesignExample'
  );
  const project = read(
    'example/ios/ReactNativeDesignExample.xcodeproj/project.pbxproj'
  );
  const scheme = read(
    'example/ios/ReactNativeDesignExample.xcodeproj/xcshareddata/xcschemes/ReactNativeDesignExample.xcscheme'
  );
  const delegate = read(
    'example/ios/ReactNativeDesignExample/AppDelegate.swift'
  );
  const podfile = read('example/ios/Podfile');

  assert.doesNotMatch(project, /DesignddExample|designdd\.example/u);
  assert.match(project, /ReactNativeDesignExample\.app/u);
  assert.match(
    project,
    /PRODUCT_BUNDLE_IDENTIFIER = "?unif\.reactnativedesign\.example"?;/u
  );
  assert.match(project, /PRODUCT_NAME = ReactNativeDesignExample/u);
  assert.doesNotMatch(scheme, /DesignddExample/u);
  assert.match(scheme, /container:ReactNativeDesignExample\.xcodeproj/u);
  assert.match(delegate, /withModuleName: "ReactNativeDesignExample"/u);
  assert.match(podfile, /target 'ReactNativeDesignExample' do/u);
  assert.match(podfile, /config = use_native_modules!/u);
});

test('iOS 不声明敏感 usage key 且 iPhone 支持三种指定方向', () => {
  assert.ok(
    existsSync(
      path.join(exampleRoot, 'ios/ReactNativeDesignExample/Info.plist')
    ),
    'iOS app group 尚未改名为 ReactNativeDesignExample'
  );
  const plist = read('example/ios/ReactNativeDesignExample/Info.plist');
  const usageKeys = [
    ...plist.matchAll(
      /<key>(NS(?:Location|Camera|Photo)[^<]*UsageDescription)<\/key>/gu
    ),
  ].map((match) => match[1]);

  assert.deepEqual(usageKeys, []);
  assert.deepEqual(plistArray(plist, 'UISupportedInterfaceOrientations'), [
    'UIInterfaceOrientationPortrait',
    'UIInterfaceOrientationLandscapeLeft',
    'UIInterfaceOrientationLandscapeRight',
  ]);
});

test('Gem/Pod locks 存在且没有被 ignore', () => {
  for (const relativePath of [
    'example/Gemfile.lock',
    'example/ios/Podfile.lock',
  ]) {
    assert.ok(
      existsSync(path.join(root, relativePath)),
      `${relativePath} 必须存在`
    );
    const ignored = spawnSync(
      'git',
      ['check-ignore', '-q', '--', relativePath],
      {
        cwd: root,
      }
    );
    assert.equal(ignored.status, 1, `${relativePath} 不得被 .gitignore 排除`);
  }
});

test('catalog 与 public runtime barrels 保持 exhaustive contract', () => {
  assert.equal(typeof showcaseVerifier.verifyExampleShowcase, 'function');
  assert.equal(
    typeof showcaseVerifier.ExampleShowcaseVerificationError,
    'function'
  );
  assert.doesNotThrow(() => showcaseVerifier.verifyExampleShowcase(root));
});

test('catalog mutation gate 拒绝缺项、重复 id 与错误 scene', () => {
  const mutations = [
    {
      name: '缺项',
      expectedCode: 'CATALOG_COMPONENT_SET',
      mutate(source) {
        return source.replace(
          "  {\n    id: 'Avatar',\n    scene: 'media',\n    states: ['brand/info/soft/neutral', 'xs/sm/md/lg/xl', '图片', '回退文字'],\n  },\n",
          ''
        );
      },
    },
    {
      name: '重复 id',
      expectedCode: 'CATALOG_COMPONENT_DUPLICATE',
      mutate(source) {
        return source.replace("    id: 'BlurLayer',", "    id: 'Avatar',");
      },
    },
    {
      name: '错误 scene',
      expectedCode: 'CATALOG_SCENE_MAPPING',
      mutate(source) {
        return source.replace(
          "    id: 'Icon',\n    scene: 'foundation',",
          "    id: 'Icon',\n    scene: 'actions',"
        );
      },
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(
        () => showcaseVerifier.verifyExampleShowcase(fixture),
        `${mutation.name} clean fixture 必须先完整通过`
      );
      const catalogPath = path.join(
        fixture,
        'example/src/catalog/componentCatalog.ts'
      );
      const source = readFileSync(catalogPath, 'utf8');
      const mutated = mutation.mutate(source);
      assert.notEqual(mutated, source, `${mutation.name} fixture 未发生变化`);
      writeFileSync(catalogPath, mutated);

      assert.throws(
        () => showcaseVerifier.verifyExampleShowcase(fixture),
        (error) => {
          assert.ok(
            error instanceof showcaseVerifier.ExampleShowcaseVerificationError,
            `${mutation.name} 必须抛 typed verifier error`
          );
          assert.equal(error.code, mutation.expectedCode, mutation.name);
          return true;
        }
      );
    });
  }
});

test('required runtime API mutation gate 拒绝 catalog 漏项', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'required runtime API clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/catalog/componentCatalog.ts',
      (source) => source.replace("  'useSvgId',\n", ''),
      '删除 useSvgId required runtime API'
    );
    assertVerifierCode(
      fixture,
      'REQUIRED_RUNTIME_API_SET',
      '删除 useSvgId required runtime API'
    );
  });
});

test('mutation gate 拒绝 runtime manifest 的精确版本漂移', () => {
  withFixture(['package.json', 'example/package.json'], (fixture) => {
    const manifestPath = path.join(fixture, 'example/package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.dependencies['react-native-safe-area-context'] = '5.7.0';
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const result = runContractMutation(
      fixture,
      'example workspace 提供 Design 的完整 RN 0.86.2 runtime graph'
    );
    const output = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 1, output);
    assert.match(output, /5\.7\.0/u);
  });
});

test('mutation gate 拒绝 Android namespace 的 identity 漂移', () => {
  const files = [
    'package.json',
    'example/package.json',
    'example/app.json',
    'example/index.js',
    'example/android/app/build.gradle',
    'example/android/build.gradle',
    'example/android/settings.gradle',
    'example/android/gradle.properties',
    'example/android/app/src/main/java/unif/reactnativedesign/example/MainActivity.kt',
    'example/android/app/src/main/java/unif/reactnativedesign/example/MainApplication.kt',
  ];
  withFixture(files, (fixture) => {
    const gradlePath = path.join(fixture, 'example/android/app/build.gradle');
    writeFileSync(
      gradlePath,
      readFileSync(gradlePath, 'utf8').replace(
        'namespace "unif.reactnativedesign.example"',
        'namespace "mutated.invalid"'
      )
    );

    const result = runContractMutation(
      fixture,
      'app registry 与 Android identity 原子同步并保留 New Architecture'
    );
    const output = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 1, output);
    assert.match(output, /mutated\.invalid/u);
  });
});

test('exhaustive verifier 将 sceneIds、Router、Home 与真实 scene consumption 连成闭环', () => {
  const mutations = [
    {
      label: 'sceneIds 缺少 media',
      file: 'example/src/catalog/componentCatalog.ts',
      code: 'SCENE_ID_SET',
      mutate: (source) =>
        source.replace(
          "  'collections',\n  'media',\n  'business',\n] as const;",
          "  'collections',\n  'business',\n] as const;"
        ),
    },
    {
      label: 'Router 把 media 指向错误 scene',
      file: 'example/src/app/ExampleRouter.tsx',
      code: 'ROUTE_REGISTRY',
      mutate: (source) =>
        source.replace(
          "if (route === 'media') return <MediaScene />;",
          "if (route === 'media') return <BusinessScene />;"
        ),
    },
    {
      label: 'Home 重复 business 并漏 media',
      file: 'example/src/screens/HomeScreen.tsx',
      code: 'HOME_SCENE_SET',
      mutate: (source) =>
        source.replace(
          "    id: 'media',\n    title: '媒体展示',",
          "    id: 'business',\n    title: '媒体展示',"
        ),
    },
    {
      label: 'Actions 保留 import 但不再渲染 StatusDot',
      file: 'example/src/showcases/actions/ActionsScene.tsx',
      code: 'SCENE_COMPONENT_CONSUMPTION',
      mutate: removeRoutedStatusDotSpecimens,
    },
    {
      label: 'Feedback 保留 import 但不再调用 confirm',
      file: 'example/src/showcases/feedback/FeedbackScene.tsx',
      code: 'SCENE_RUNTIME_API_CONSUMPTION',
      mutate: (source) => source.replaceAll('confirm(', 'Promise.resolve('),
    },
    {
      label: 'Foundation 保留 import 但不再调用 childTestID',
      file: 'example/src/showcases/foundation/IconCatalog.tsx',
      code: 'SCENE_RUNTIME_API_CONSUMPTION',
      mutate: (source) =>
        source.replace(
          "testID={childTestID('foundation-icons', name)}",
          'testID={`foundation-icons-${name}`}'
        ),
    },
    {
      label: 'Business 保留 import 但不再调用 useSvgId',
      file: 'example/src/showcases/business/BusinessScene.tsx',
      code: 'SCENE_RUNTIME_API_CONSUMPTION',
      mutate: (source) =>
        source
          .replace(
            "const washGradientId = useSvgId('business-wash');",
            "const washGradientId = 'business-wash';"
          )
          .replace(
            "const haloGradientId = useSvgId('business-halo');",
            "const haloGradientId = 'business-halo';"
          ),
    },
    {
      label: '真实 scene 标题偏离 canonical title',
      file: 'example/src/showcases/actions/ActionsScene.tsx',
      code: 'SCENE_TITLE_CONTRACT',
      mutate: (source) =>
        source.replace('title="操作与状态"', 'title="错误标题"'),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(
        () => showcaseVerifier.verifyExampleShowcase(fixture),
        `${mutation.label} clean fixture 必须先完整通过`
      );
      mutateFixtureFile(
        fixture,
        mutation.file,
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }
});

test('静态 public-binding gate 明确不把 dead helper 当作运行时真值', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'runtime API dead helper mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/showcases/business/BusinessScene.tsx',
      (source) =>
        `${source
          .replace(
            "const washGradientId = useSvgId('business-wash');",
            "const washGradientId = 'business-wash';"
          )
          .replace(
            "const haloGradientId = useSvgId('business-halo');",
            "const haloGradientId = 'business-halo';"
          )}\nfunction deadUseSvgIdWitness(): void {\n  useSvgId('dead-wash');\n  useSvgId('dead-halo');\n}\n`,
      '删除真实 useSvgId calls 并追加未调用的 dead helper'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'dead helper 仍满足静态 binding shape；运行时真值由 Jest proof gate 负责'
    );
  });
});

test('完整验收链拒绝只创建但未挂载的 Button loading JSX', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'ActionsScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

    mutateFixtureFile(
      fixture,
      'example/src/showcases/actions/ActionsScene.tsx',
      (source) =>
        removeButtonLoadingSpecimen(source).replace(
          '  return (\n    <ShowcaseScaffold',
          [
            '  const unusedLoadingSpecimen = (',
            '    <Button',
            '      label="加载按钮"',
            '      loading',
            '      testID="actions-button-loading"',
            '      onPress={() => {}}',
            '    />',
            '  );',
            '  void unusedLoadingSpecimen;',
            '',
            '  return (',
            '    <ShowcaseScaffold',
          ].join('\n')
        ),
      '删除真实 loading Button 并仅创建 unused JSX'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 route/public-binding gate 可以保留，但不得声称 unused JSX 已被挂载'
    );

    const mutated = runExampleAcceptanceTest(fixture, 'ActionsScene.test.tsx');
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /actions-button-loading|加载按钮/u
    );
  });
});

test('完整验收链拒绝 Scene if(false) 中的两次 useSvgId', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

    mutateFixtureFile(
      fixture,
      'example/src/showcases/business/BusinessScene.tsx',
      (source) =>
        source
          .replace(
            "  const washGradientId = useSvgId('business-wash');",
            "  const washGradientId = 'business-wash';"
          )
          .replace(
            "  const haloGradientId = useSvgId('business-halo');",
            "  const haloGradientId = 'business-halo';"
          )
          .replace(
            '  const draft = state.scenes.business;',
            [
              '  const draft = state.scenes.business;',
              '  if (false) {',
              "    useSvgId('dead-wash');",
              "    useSvgId('dead-halo');",
              '  }',
            ].join('\n')
          ),
      '删除真实 useSvgId calls 并放入 Scene if(false)'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 binding gate 不负责解释 JavaScript control flow'
    );

    const mutated = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /useSvgId|runtime proof/u
    );
  });
});

test('完整验收链拒绝 module if(false) 中的 createLogger', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'FoundationScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

    mutateFixtureFile(
      fixture,
      'example/src/showcases/foundation/FoundationScene.tsx',
      (source) =>
        source.replace(
          "const log = createLogger('FoundationScene');",
          [
            'const log = { info(_message: string): void {} };',
            'if (false) {',
            "  createLogger('FoundationScene');",
            '}',
          ].join('\n')
        ),
      '删除真实 module-init createLogger 并放入 module if(false)'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 binding gate 不负责解释 module control flow'
    );

    const mutated = runExampleAcceptanceTest(
      fixture,
      'FoundationScene.test.tsx'
    );
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /createLogger|runtime proof/u
    );
  });
});

test('runtime proof lifecycle 拒绝 if(false) 包裹 prove 与 completion', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'runtime proof lifecycle mutation 的 clean fixture 必须先完整通过'
    );

    mutateFixtureFile(
      fixture,
      'example/src/showcases/business/BusinessScene.tsx',
      (source) =>
        source
          .replace(
            "  const washGradientId = useSvgId('business-wash');",
            "  const washGradientId = 'business-wash';"
          )
          .replace(
            "  const haloGradientId = useSvgId('business-halo');",
            "  const haloGradientId = 'business-halo';"
          )
          .replace(
            '  const draft = state.scenes.business;',
            [
              '  const draft = state.scenes.business;',
              '  if (false) {',
              "    useSvgId('dead-wash');",
              "    useSvgId('dead-halo');",
              '  }',
            ].join('\n')
          ),
      '删除真实 useSvgId calls 并用 Scene dead branch 保留静态 binding'
    );
    mutateFixtureFile(
      fixture,
      'example/src/__tests__/BusinessScene.test.tsx',
      (source) =>
        source
          .replace(
            "  runtimeCoverage.prove('useSvgId', () => {",
            "  if (false) {\n    runtimeCoverage.prove('useSvgId', () => {"
          )
          .replace(
            '  runtimeCoverage.expectComplete();',
            '    runtimeCoverage.expectComplete();\n  }'
          ),
      '把 runtime prove 与 completion 一起包进 if(false)'
    );

    assertVerifierCode(
      fixture,
      'RUNTIME_API_TEST_PROOF',
      'factory/prove/completion 必须是 owned test callback block 的直接语句'
    );
  });
});

test('整个 governed proof registration 不得位于 SourceFile 顶层 if(false)', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'entire-registration mutation 的 clean fixture 必须先完整通过'
    );

    mutateFixtureFile(
      fixture,
      'example/src/showcases/business/BusinessScene.tsx',
      (source) =>
        source
          .replace(
            "  const washGradientId = useSvgId('business-wash');",
            "  const washGradientId = 'business-wash';"
          )
          .replace(
            "  const haloGradientId = useSvgId('business-halo');",
            "  const haloGradientId = 'business-halo';"
          )
          .replace(
            '  const draft = state.scenes.business;',
            [
              '  const draft = state.scenes.business;',
              '  if (false) {',
              "    useSvgId('dead-wash');",
              "    useSvgId('dead-halo');",
              '  }',
            ].join('\n')
          ),
      '删除真实 useSvgId calls 并用 Scene dead branch 保留静态 binding'
    );
    mutateFixtureFile(
      fixture,
      'example/src/__tests__/BusinessScene.test.tsx',
      (source) =>
        source
          .replace(
            "test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {",
            "if (false) {\n  test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {"
          )
          .replace(
            "  runtimeCoverage.expectComplete();\n});\n\ntest('GradientWash、RadialHalo",
            "  runtimeCoverage.expectComplete();\n  });\n}\n\ntest('GradientWash、RadialHalo"
          ),
      '把整个 Business runtime proof registration 包进顶层 if(false)'
    );

    const verificationError = captureVerifierError(fixture);
    const mutated = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.ok(
      verificationError instanceof
        showcaseVerifier.ExampleShowcaseVerificationError,
      `static=${verificationError ? String(verificationError) : 'PASS'} Jest status=${mutated.status}\n${mutated.stdout}\n${mutated.stderr}`
    );
    assert.equal(
      verificationError.code,
      'RUNTIME_API_TEST_PROOF',
      String(verificationError)
    );
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
  });
});

test('governed proof registration 必须是 SourceFile 直接 ExpressionStatement', () => {
  const mutations = [
    {
      label: 'nested block registration',
      mutate: (source) =>
        source
          .replace(
            "test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {",
            "{\n  test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {"
          )
          .replace(
            "  runtimeCoverage.expectComplete();\n});\n\ntest('GradientWash、RadialHalo",
            "  runtimeCoverage.expectComplete();\n  });\n}\n\ntest('GradientWash、RadialHalo"
          ),
    },
    {
      label: 'conditional registration',
      mutate: (source) =>
        source.replace(
          "test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {",
          "true && test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {"
        ),
    },
    {
      label: 'dead function registration',
      mutate: (source) =>
        source
          .replace(
            "test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {",
            "function registerDeadBusinessProof(): void {\n  test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {"
          )
          .replace(
            "  runtimeCoverage.expectComplete();\n});\n\ntest('GradientWash、RadialHalo",
            "  runtimeCoverage.expectComplete();\n  });\n}\n\ntest('GradientWash、RadialHalo"
          ),
    },
    {
      label: 'test.each proof owner',
      mutate: (source) =>
        source.replace(
          "test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {",
          "test.each([[1]])('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {"
        ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(
        () => showcaseVerifier.verifyExampleShowcase(fixture),
        `${mutation.label} clean fixture 必须先完整通过`
      );
      mutateFixtureFile(
        fixture,
        'example/src/__tests__/BusinessScene.test.tsx',
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, 'RUNTIME_API_TEST_PROOF', mutation.label);
    });
  }
});

test('focused sibling test 不能跳过 runtime proof test', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'focused-test mutation 的 clean fixture 必须先完整通过'
    );

    mutateFixtureFile(
      fixture,
      'example/src/showcases/business/BusinessScene.tsx',
      (source) =>
        source
          .replace(
            "  const washGradientId = useSvgId('business-wash');",
            "  const washGradientId = 'business-wash';"
          )
          .replace(
            "  const haloGradientId = useSvgId('business-halo');",
            "  const haloGradientId = 'business-halo';"
          )
          .replace(
            '  const draft = state.scenes.business;',
            [
              '  const draft = state.scenes.business;',
              '  if (false) {',
              "    useSvgId('dead-wash');",
              "    useSvgId('dead-halo');",
              '  }',
            ].join('\n')
          ),
      '删除真实 useSvgId calls 并用 Scene dead branch 保留静态 binding'
    );
    mutateFixtureFile(
      fixture,
      'example/src/__tests__/BusinessScene.test.tsx',
      (source) =>
        source.replace(
          "test('GradientWash、RadialHalo 与 ScreenBackdrop",
          "test.only('GradientWash、RadialHalo 与 ScreenBackdrop"
        ),
      '把不含 runtime proof 的 sibling test 改成 test.only'
    );

    const mutated = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /forbidOnly|focused|test\.only|exclusive/u
    );
    assertVerifierCode(
      fixture,
      'RUNTIME_API_TEST_PROOF',
      'production verifier 必须拒绝 governed example tests 的 focused registration'
    );
  });
});

test('--forbidOnly 入口拒绝没有 sibling skip 的单一 focused test', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const singleFocusedTest = path.join(
      fixture,
      'example/src/__tests__/SingleFocused.test.ts'
    );
    writeFileSync(
      singleFocusedTest,
      [
        "test.only('single focused test', () => {",
        '  expect(1).toBe(1);',
        '});',
        '',
      ].join('\n')
    );

    const mutated = runExampleAcceptanceTest(fixture, 'SingleFocused.test.ts');
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /forbidOnly|focused|test\.only/u
    );
  });
});

test('--forbidOnly 入口拒绝没有 sibling skip 的 single fit.each', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

    const singleFocusedTest = path.join(
      fixture,
      'example/src/__tests__/SingleFocusedEach.test.ts'
    );
    writeFileSync(
      singleFocusedTest,
      [
        "fit.each([[1]])('single focused each %s', (value) => {",
        '  expect(value).toBe(1);',
        '});',
        '',
      ].join('\n')
    );

    const mutated = runExampleAcceptanceTest(
      fixture,
      'SingleFocusedEach.test.ts'
    );
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /RUNTIME_API_TEST_PROOF|forbidOnly|focused|fit/u
    );
  });
});

test('wrapper 拒绝 env scan root 与 inline config/runTestsByPath execution root 错配', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

    const singleFocusedTest = path.join(
      fixture,
      'example/src/__tests__/SingleFocusedMismatch.test.ts'
    );
    writeFileSync(
      singleFocusedTest,
      [
        "test.only('single focused mismatch', () => {",
        '  expect(1).toBe(1);',
        '});',
        '',
      ].join('\n')
    );

    const mutated = runExampleAcceptanceTest(
      fixture,
      'SingleFocusedMismatch.test.ts',
      { showcaseRoot: repositoryRoot }
    );
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(`${mutated.stdout}\n${mutated.stderr}`, /JEST_ROOT_MISMATCH/u);
  });
});

test('focused wrapper 从 config file、CLI rootDir 与无显式 config 的 cwd 解析同一 Jest root', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const { fixtureExampleRoot, fixtureRoot } =
      prepareFixtureExampleRuntime(fixture);
    const testPath = path.join(
      fixtureExampleRoot,
      'src/__tests__/BusinessScene.test.tsx'
    );

    const configFromDirectory = createFixtureJestConfig(fixture, {
      reporters: ['default'],
    });
    delete configFromDirectory.rootDir;
    const directoryConfigPath = path.join(
      fixtureExampleRoot,
      'jest.wrapper-directory.config.cjs'
    );
    writeFileSync(
      directoryConfigPath,
      `module.exports = ${JSON.stringify(configFromDirectory)};\n`
    );
    const directoryResult = runExampleFocusedJestWrapper(fixture, [
      '--config',
      directoryConfigPath,
      '--runInBand',
      '--runTestsByPath',
      testPath,
    ]);
    assert.equal(
      directoryResult.status,
      0,
      `${directoryResult.stdout}\n${directoryResult.stderr}`
    );

    const configWithRelativeRoot = createFixtureJestConfig(fixture, {
      reporters: ['default'],
      rootDir: './example',
    });
    const relativeConfigPath = path.join(
      fixtureRoot,
      'jest.wrapper-relative.config.cjs'
    );
    writeFileSync(
      relativeConfigPath,
      `module.exports = ${JSON.stringify(configWithRelativeRoot)};\n`
    );
    const relativeResult = runExampleFocusedJestWrapper(fixture, [
      '--config',
      relativeConfigPath,
      '--runInBand',
      '--runTestsByPath',
      testPath,
    ]);
    assert.equal(
      relativeResult.status,
      0,
      `${relativeResult.stdout}\n${relativeResult.stderr}`
    );

    const cliOverrideResult = runExampleFocusedJestWrapper(fixture, [
      '--config',
      JSON.stringify(
        createFixtureJestConfig(fixture, {
          reporters: ['default'],
          rootDir: path.join(repositoryRoot, 'example'),
        })
      ),
      '--rootDir',
      fixtureExampleRoot,
      '--runInBand',
      '--runTestsByPath',
      testPath,
    ]);
    assert.equal(
      cliOverrideResult.status,
      0,
      `${cliOverrideResult.stdout}\n${cliOverrideResult.stderr}`
    );

    const cwdConfig = createFixtureJestConfig(fixture, {
      reporters: ['default'],
    });
    delete cwdConfig.rootDir;
    writeFileSync(
      path.join(fixtureExampleRoot, 'jest.config.js'),
      `module.exports = ${JSON.stringify(cwdConfig)};\n`
    );
    const cwdResult = runExampleFocusedJestWrapper(
      fixture,
      ['--runInBand', '--runTestsByPath', testPath],
      { cwd: fixtureExampleRoot, showcaseRoot: undefined }
    );
    assert.equal(
      cwdResult.status,
      0,
      `${cwdResult.stdout}\n${cwdResult.stderr}`
    );
  });
});

test('focused wrapper 拒绝 --runTestsByPath 逃逸 actual Jest root', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);
    const { fixtureExampleRoot, fixtureRoot } =
      prepareFixtureExampleRuntime(fixture);
    const outsideTestDirectory = path.join(fixtureRoot, 'outside');
    mkdirSync(outsideTestDirectory, { recursive: true });
    const outsideTestPath = path.join(outsideTestDirectory, 'Outside.test.js');
    writeFileSync(
      outsideTestPath,
      "test('outside root', () => { expect(1).toBe(1); });\n"
    );

    const mutated = runExampleFocusedJestWrapper(fixture, [
      '--config',
      JSON.stringify(createFixtureJestConfig(fixture)),
      '--runInBand',
      '--runTestsByPath',
      outsideTestPath,
    ]);
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /JEST_TEST_PATH_OUTSIDE_ROOT/u
    );
  });
});

test('focused wrapper 拒绝 config.roots 将 Jest discovery 边界移出 actual root', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'BusinessScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);
    const { fixtureRoot } = prepareFixtureExampleRuntime(fixture);
    const outsideTestDirectory = path.join(fixtureRoot, 'outside-discovery');
    mkdirSync(outsideTestDirectory, { recursive: true });
    writeFileSync(
      path.join(outsideTestDirectory, 'SingleOutsideRoot.test.js'),
      "test.only('single outside discovery root', () => { expect(1).toBe(1); });\n"
    );

    const mutated = runExampleFocusedJestWrapper(fixture, [
      '--config',
      JSON.stringify(
        createFixtureJestConfig(fixture, { roots: [outsideTestDirectory] })
      ),
      '--runInBand',
    ]);
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /JEST_DISCOVERY_ROOT_MISMATCH/u
    );
  });
});

test('production Jest gate 拒绝所有 selection、config、reporter 与非执行参数', () => {
  const clean = runExampleJestWrapper(root, ['--runInBand', '--no-cache'], {
    cwd: exampleRoot,
    showcaseRoot: undefined,
  });
  assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

  const navigationTest = path.join(
    exampleRoot,
    'src/__tests__/exampleNavigation.test.ts'
  );
  const navigationSource = path.join(
    exampleRoot,
    'src/navigation/exampleNavigation.ts'
  );
  const unsafeArguments = [
    ['--runTestsByPath', navigationTest],
    ['exampleNavigation'],
    ['--testNamePattern=navigate'],
    ['--testPathPattern=exampleNavigation'],
    ['--testMatch=**/exampleNavigation.test.ts'],
    ['--testPathIgnorePatterns=App.test.tsx'],
    ['--findRelatedTests', navigationSource],
    ['--onlyChanged'],
    ['--lastCommit'],
    ['--changedSince=HEAD~1'],
    ['--selectProjects=example'],
    ['--shard=1/2'],
    ['--filter=./filter-tests.js'],
    ['--config', path.join(exampleRoot, 'jest.config.js')],
    ['--rootDir', exampleRoot],
    ['--roots', exampleRoot],
    ['--projects', exampleRoot],
    ['--reporters=default'],
    ['--listTests'],
    ['--showConfig'],
    ['--watch'],
    ['--watchAll'],
  ];

  for (const args of unsafeArguments) {
    const result = runExampleJestWrapper(root, args, {
      cwd: exampleRoot,
      showcaseRoot: undefined,
    });
    assert.equal(
      result.status,
      1,
      `${args.join(' ')}\n${result.stdout}\n${result.stderr}`
    );
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /JEST_PRODUCTION_ARGUMENT/u,
      args.join(' ')
    );
  }
});

test('production Jest gate 从 resolved config 拒绝 owner discovery 与 reporter 漂移', () => {
  const mutations = [
    {
      label: 'testMatch 只选择普通 navigation suite',
      code: 'JEST_CONFIG_SELECTION',
      overrides: {
        testMatch: ['**/exampleNavigation.test.ts'],
      },
    },
    {
      label: 'testPathIgnorePatterns 排除 App owner suite',
      code: 'JEST_CONFIG_SELECTION',
      overrides: {
        testPathIgnorePatterns: ['/node_modules/', '/App\\.test\\.tsx$'],
      },
    },
    {
      label: 'resolved reporters 移除 production attestation',
      code: 'JEST_REPORTER_CONTRACT',
      overrides: {
        reporters: ['default'],
      },
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
      const fixtureExampleRoot = writeFixtureProductionJestConfig(fixture);
      const clean = runExampleJestWrapper(fixture, ['--runInBand'], {
        cwd: fixtureExampleRoot,
      });
      assert.equal(
        clean.status,
        0,
        `${mutation.label} clean\n${clean.stdout}\n${clean.stderr}`
      );

      writeFixtureProductionJestConfig(fixture, mutation.overrides);
      const mutated = runExampleJestWrapper(fixture, ['--runInBand'], {
        cwd: fixtureExampleRoot,
      });
      assert.equal(
        mutated.status,
        1,
        `${mutation.label}\n${mutated.stdout}\n${mutated.stderr}`
      );
      assert.match(
        `${mutated.stdout}\n${mutated.stderr}`,
        new RegExp(mutation.code, 'u'),
        mutation.label
      );
    });
  }
});

test('production Jest actual execution contract survives phase-dependent config', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const fixtureExampleRoot =
      writePhaseDependentFixtureProductionJestConfig(fixture);
    assert.doesNotThrow(() => showcaseVerifier.verifyExampleShowcase(fixture));

    const result = runExampleJestWrapper(fixture, ['--runInBand'], {
      cwd: fixtureExampleRoot,
    });
    const output = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 1, output);
    assert.match(output, /JEST_EXECUTION_SET_COMPLETED missing=/u);
    assert.match(output, /JEST_GOVERNED_SUITES_COMPLETED missing=/u);
  });
});

test('production Jest actual execution binds discovered paths with runTestsByPath', () => {
  withFixture(
    [...new Set([...runtimeAcceptanceFiles, ...listFiles('src')])],
    (fixture) => {
      const fixtureExampleRoot =
        writeArgvSensitiveFixtureProductionJestConfig(fixture);
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );

      const result = runExampleJestWrapper(fixture, ['--runInBand'], {
        cwd: fixtureExampleRoot,
      });
      const output = `${result.stdout}\n${result.stderr}`;
      assert.equal(result.status, 0, output);
      assert.match(output, /JEST_EXECUTION_SET_COMPLETED count=15/u);
      assert.match(output, /JEST_GOVERNED_SUITES_COMPLETED count=9/u);
      assert.doesNotMatch(output, /Test Suites:\s+1 passed, 1 total/u);
    }
  );
});

test('production Jest gate 精确拒绝 shared owner contract 替换真实 App suite', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const fixtureExampleRoot = writeFixtureProductionJestConfig(fixture);
    const clean = runExampleJestWrapper(fixture, ['--runInBand'], {
      cwd: fixtureExampleRoot,
    });
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

    mutateFixtureFile(
      fixture,
      'example/jest.showcaseGate.js',
      (source) =>
        source.replace(
          "  'src/__tests__/App.test.tsx',",
          "  'src/__tests__/exampleNavigation.test.ts',"
        ),
      'shared owner contract 用普通 suite 替换 App owner'
    );
    const mutated = runExampleJestWrapper(fixture, ['--runInBand'], {
      cwd: fixtureExampleRoot,
    });
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /JEST_GOVERNED_SUITE_CONTRACT/u
    );
  });
});

test('actual Jest reporter 接受 clean exact expected set 并输出双 completion marker', () => {
  withActualJestReporterFixture(({ runReporter }) => {
    const clean = runReporter();
    const output = `${clean.stdout}\n${clean.stderr}`;
    assert.equal(clean.status, 0, output);
    assert.match(output, /JEST_EXECUTION_SET_COMPLETED count=10/u);
    assert.match(output, /JEST_GOVERNED_SUITES_COMPLETED count=9/u);
    assert.doesNotMatch(
      output,
      /JEST_(?:EXECUTION_SET_COMPLETED|ATTESTATION_CONFIG).*?(?:missing|unexpected|非法)/u
    );
  });
});

test('actual Jest reporter 在缺少 non-owner expected file 时返回 non-zero', () => {
  withActualJestReporterFixture(
    ({ nonOwnerTestPath, requiredTestPaths, runReporter }) => {
      const mutated = runReporter({ selectedTestPaths: requiredTestPaths });
      const output = `${mutated.stdout}\n${mutated.stderr}`;
      assert.equal(mutated.status, 1, output);
      assert.match(
        output,
        new RegExp(
          `JEST_EXECUTION_SET_COMPLETED.*missing=.*${path.basename(nonOwnerTestPath)}`,
          'u'
        )
      );
    }
  );
});

test('actual Jest reporter 在完成 unexpected file 时返回 non-zero', () => {
  withActualJestReporterFixture(
    ({ nonOwnerTestPath, requiredTestPaths, runReporter }) => {
      const mutated = runReporter({
        attestedExpectedTestPaths: requiredTestPaths,
      });
      const output = `${mutated.stdout}\n${mutated.stderr}`;
      assert.equal(mutated.status, 1, output);
      assert.match(
        output,
        new RegExp(
          `JEST_EXECUTION_SET_COMPLETED.*unexpected=.*${path.basename(nonOwnerTestPath)}`,
          'u'
        )
      );
    }
  );
});

test('actual Jest reporter 在缺少任一 required owner suite 时保留 owner failure marker', () => {
  withActualJestReporterFixture(
    ({ expectedTestPaths, requiredTestPaths, runReporter }) => {
      const missingOwnerPath = requiredTestPaths.at(-1);
      const mutated = runReporter({
        selectedTestPaths: expectedTestPaths.filter(
          (testPath) => testPath !== missingOwnerPath
        ),
      });
      const output = `${mutated.stdout}\n${mutated.stderr}`;
      assert.equal(mutated.status, 1, output);
      assert.match(
        output,
        /JEST_GOVERNED_SUITES_COMPLETED.*BusinessScene\.test\.js/u
      );
    }
  );
});

test('actual Jest reporter 在 skipped 与 owner missing 并存时仍输出两个 set marker', () => {
  withActualJestReporterFixture(
    ({ expectedTestPaths, requiredTestPaths, runReporter }) => {
      const skippedOwnerPath = requiredTestPaths[0];
      const missingOwnerPath = requiredTestPaths.at(-1);
      writeFileSync(
        skippedOwnerPath,
        "test.skip('skipped owner', () => { expect(1).toBe(1); });\n"
      );
      const mutated = runReporter({
        selectedTestPaths: expectedTestPaths.filter(
          (testPath) => testPath !== missingOwnerPath
        ),
      });
      const output = `${mutated.stdout}\n${mutated.stderr}`;
      assert.equal(mutated.status, 1, output);
      assert.match(output, /forbidOnly.*skipped=1/u);
      assert.match(
        output,
        /JEST_EXECUTION_SET_COMPLETED.*missing=.*BusinessScene\.test\.js/u
      );
      assert.match(
        output,
        /JEST_GOVERNED_SUITES_COMPLETED.*missing=.*BusinessScene\.test\.js/u
      );
    }
  );
});

test('actual Jest reporter 拒绝 malformed、duplicate、outside 与缺 owner membership 的 expected set', () => {
  withActualJestReporterFixture(
    ({
      expectedTestPaths,
      fixture,
      outsideExpectedTestPath,
      requiredTestPaths,
      runReporter,
    }) => {
      const invalidAttestations = [
        {
          label: 'missing expectedTestPaths',
          value: { rootDir: fixture, requiredTestPaths },
        },
        {
          label: 'relative expected path',
          value: {
            rootDir: fixture,
            requiredTestPaths,
            expectedTestPaths: [
              path.relative(fixture, expectedTestPaths[0]),
              ...expectedTestPaths.slice(1),
            ],
          },
        },
        {
          label: 'duplicate expected path',
          value: {
            rootDir: fixture,
            requiredTestPaths,
            expectedTestPaths: [...expectedTestPaths, expectedTestPaths[0]],
          },
        },
        {
          label: 'outside expected path',
          value: {
            rootDir: fixture,
            requiredTestPaths,
            expectedTestPaths: [...expectedTestPaths, outsideExpectedTestPath],
          },
        },
        {
          label: 'unresolvable attested root',
          value: {
            rootDir: path.join(fixture, 'missing-root'),
            requiredTestPaths,
            expectedTestPaths,
          },
        },
        {
          label: 'required owner missing from expected set',
          value: {
            rootDir: fixture,
            requiredTestPaths,
            expectedTestPaths: expectedTestPaths.slice(1),
          },
        },
      ];

      for (const invalid of invalidAttestations) {
        const mutated = runReporter({ attestation: invalid.value });
        const output = `${invalid.label}\n${mutated.stdout}\n${mutated.stderr}`;
        assert.equal(mutated.status, 1, output);
        assert.match(output, /JEST_ATTESTATION_CONFIG/u, invalid.label);
      }
    }
  );
});

test('runtime proof test callback 不能提前 return 跳过 lifecycle', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'early-return mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/__tests__/BusinessScene.test.tsx',
      (source) =>
        source.replace(
          "test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {",
          [
            "test('scene 直接生成并使用两个唯一合法 SVG id，装饰 wrapper 隐藏完整 a11y 子树', () => {",
            '  return;',
          ].join('\n')
        ),
      '在 owned runtime proof test callback 顶部提前 return'
    );
    assertVerifierCode(
      fixture,
      'RUNTIME_API_TEST_PROOF',
      'owned proof test callback 中任何 return 都可能跳过 lifecycle'
    );
  });
});

test('proof lifecycle 要求 factory 直接声明且 completion 位于全部 prove 之后', () => {
  const mutations = [
    {
      label: 'factory declaration 包进 if block',
      mutate: (source) =>
        source
          .replace(
            "  const runtimeCoverage = createShowcaseRuntimeCoverage('business');",
            [
              '  if (true) {',
              "    const runtimeCoverage = createShowcaseRuntimeCoverage('business');",
            ].join('\n')
          )
          .replace(
            '  runtimeCoverage.expectComplete();',
            '    runtimeCoverage.expectComplete();\n  }'
          ),
    },
    {
      label: 'completion 移到 prove 之前',
      mutate: (source) =>
        source
          .replace('  runtimeCoverage.expectComplete();\n', '')
          .replace(
            "  runtimeCoverage.prove('useSvgId', () => {",
            [
              '  runtimeCoverage.expectComplete();',
              "  runtimeCoverage.prove('useSvgId', () => {",
            ].join('\n')
          ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(
        () => showcaseVerifier.verifyExampleShowcase(fixture),
        `${mutation.label} clean fixture 必须先完整通过`
      );
      mutateFixtureFile(
        fixture,
        'example/src/__tests__/BusinessScene.test.tsx',
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, 'RUNTIME_API_TEST_PROOF', mutation.label);
    });
  }
});

test('governed example tests 全局拒绝 focused、skipped 与 todo registrations', () => {
  const mutations = [
    ['test.only', (source) => source.replace('test(', 'test.only(')],
    ['it.only', (source) => source.replace('test(', 'it.only(')],
    ['fit', (source) => source.replace('test(', 'fit(')],
    [
      'test.concurrent.only',
      (source) => source.replace('test(', 'test.concurrent.only('),
    ],
    [
      'test.each.only',
      (source) => source.replace('test(', 'test.each([1]).only('),
    ],
    [
      'describe.only',
      (source) => `describe.only('focused', () => {});\n${source}`,
    ],
    ['fdescribe', (source) => `fdescribe('focused', () => {});\n${source}`],
    [
      'fit.each',
      (source) => `fit.each([[1]])('focused each', () => {});\n${source}`,
    ],
    [
      'fdescribe.each',
      (source) =>
        `fdescribe.each([[1]])('focused describe each', () => {});\n${source}`,
    ],
    [
      'fit.concurrent.each',
      (source) =>
        `fit.concurrent.each([[1]])('focused concurrent each', () => {});\n${source}`,
    ],
    ['test.skip', (source) => source.replace('test(', 'test.skip(')],
    ['it.skip', (source) => source.replace('test(', 'it.skip(')],
    ['xit', (source) => source.replace('test(', 'xit(')],
    ['xtest', (source) => source.replace('test(', 'xtest(')],
    [
      'xit.each',
      (source) => `xit.each([[1]])('skipped each', () => {});\n${source}`,
    ],
    [
      'xtest.each',
      (source) => `xtest.each([[1]])('skipped each', () => {});\n${source}`,
    ],
    [
      'xtest.concurrent.each',
      (source) =>
        `xtest.concurrent.each([[1]])('skipped concurrent each', () => {});\n${source}`,
    ],
    [
      'describe.skip',
      (source) => `describe.skip('skipped', () => {});\n${source}`,
    ],
    ['test.todo', (source) => `test.todo('todo registration');\n${source}`],
    [
      'describe.each.only',
      (source) =>
        `describe.each([1]).only('focused each', () => {});\n${source}`,
    ],
  ];

  for (const [label, mutate] of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(
        () => showcaseVerifier.verifyExampleShowcase(fixture),
        `${label} clean fixture 必须先完整通过`
      );
      mutateFixtureFile(
        fixture,
        'example/src/__tests__/BusinessScene.test.tsx',
        mutate,
        label
      );
      assertVerifierCode(fixture, 'RUNTIME_API_TEST_PROOF', label);
    });
  }
});

test('完整验收链拒绝 useTheme 硬编码结果与 dead call 冒充', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'FoundationScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

    mutateFixtureFile(
      fixture,
      'example/src/showcases/foundation/FoundationScene.tsx',
      (source) =>
        source
          .replace(
            '  const theme = useTheme();',
            "  const theme = { scheme: 'light' as const };"
          )
          .replace(
            '  const draft = state.scenes.foundation;',
            [
              '  const draft = state.scenes.foundation;',
              '  if (false) {',
              '    useTheme();',
              '  }',
            ].join('\n')
          ),
      '用硬编码 light theme 替代真实 useTheme 并保留 dead call'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 binding gate 不解释 useTheme dead branch'
    );

    const mutated = runExampleAcceptanceTest(
      fixture,
      'FoundationScene.test.tsx'
    );
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /useTheme|runtime proof/u
    );
  });
});

test('完整验收链拒绝 BRAND_ORANGE 默认值硬编码与 dead binding 冒充', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'FoundationScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);

    mutateFixtureFile(
      fixture,
      'example/src/showcases/foundation/FoundationScene.tsx',
      (source) =>
        source
          .replace('；品牌 {BRAND_ORANGE}', "；品牌 {['#', 'EB6E00'].join('')}")
          .replace(
            '  const draft = state.scenes.foundation;',
            [
              '  const draft = state.scenes.foundation;',
              '  if (false) {',
              '    void BRAND_ORANGE;',
              '  }',
            ].join('\n')
          ),
      '用默认品牌色表达式替代 BRAND_ORANGE 并保留 dead binding'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 binding gate 不解释 BRAND_ORANGE dead branch'
    );

    const mutated = runExampleAcceptanceTest(
      fixture,
      'FoundationScene.test.tsx'
    );
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /BRAND_ORANGE|品牌|runtime proof/u
    );
  });
});

test('完整验收链拒绝 ICONS 完整性硬编码 false 与 dead binding 冒充', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'FoundationScene.test.tsx');
    assert.equal(clean.status, 0, `${clean.stdout}\n${clean.stderr}`);
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'ICONS causal mutation 的 clean fixture 必须先完整通过'
    );

    mutateFixtureFile(
      fixture,
      'example/src/showcases/foundation/FoundationScene.tsx',
      (source) =>
        source
          .replace(
            [
              '  const iconDataComplete = ICON_NAMES.every(',
              '    (name) => ICONS[name] !== undefined',
              '  );',
            ].join('\n'),
            '  const iconDataComplete = false;'
          )
          .replace(
            '  const draft = state.scenes.foundation;',
            [
              '  const draft = state.scenes.foundation;',
              '  if (false) {',
              '    void ICONS;',
              '  }',
            ].join('\n')
          ),
      '硬编码 iconDataComplete=false 并用 dead void ICONS 保留静态 binding'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 binding gate 不解释 ICONS dead branch'
    );

    const mutated = runExampleAcceptanceTest(
      fixture,
      'FoundationScene.test.tsx'
    );
    assert.equal(mutated.status, 1, `${mutated.stdout}\n${mutated.stderr}`);
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /ICONS|warning|图标访问|runtime proof/u
    );
  });
});

test('scene consumption 仅接受 Router 可达文件，拒绝 dead-file 冒充 StatusDot', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'dead-file mutation 的 clean fixture 必须先完整通过'
    );

    mutateFixtureFile(
      fixture,
      'example/src/showcases/actions/ActionsScene.tsx',
      removeRoutedStatusDotSpecimens,
      '从 Router 可达 ActionsScene 移除 StatusDot'
    );

    const deadCoveragePath = path.join(
      fixture,
      'example/src/showcases/actions/DeadCoverage.tsx'
    );
    writeFileSync(
      deadCoveragePath,
      [
        "import { StatusDot } from '@unif/react-native-design';",
        '',
        'export function DeadCoverage() {',
        '  return <StatusDot status="done" accessibilityLabel="dead coverage" />;',
        '}',
        '',
      ].join('\n')
    );

    assertVerifierCode(
      fixture,
      'SCENE_COMPONENT_CONSUMPTION',
      'Router 不可达 dead file 不得补齐 StatusDot consumption'
    );
  });
});

test('root runtime 只计数真实 public-root binding，拒绝本地 ConfirmHost 冒充', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'root binding mutation 的 clean fixture 必须先完整通过'
    );

    mutateFixtureFile(
      fixture,
      'example/src/app/AppProviders.tsx',
      (source) =>
        source
          .replace(
            '  ConfirmHost,',
            '  ConfirmHost as UnusedPublicConfirmHost,'
          )
          .replace(
            'function DesignRuntime({ children }: { children: ReactNode }) {',
            [
              'function ConfirmHost(): null {',
              '  return null;',
              '}',
              '',
              'function DesignRuntime({ children }: { children: ReactNode }) {',
            ].join('\n')
          ),
      '用本地 ConfirmHost 取代 public-root binding'
    );

    assertVerifierCode(
      fixture,
      'ROOT_RUNTIME_UNIQUENESS',
      '本地 ConfirmHost lookalike 不得满足 root runtime contract'
    );
  });
});

test('Button catalog 删除 required loading state 时 typed gate 失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Button catalog state mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/catalog/componentCatalog.ts',
      removeButtonLoadingCatalogState,
      '从 Button catalog 删除 loading state'
    );
    assertVerifierCode(
      fixture,
      'COMPONENT_STATE_CATALOG_SET',
      'Button catalog 必须精确保留 required loading state'
    );
  });
});

test('Button loading 是否真实挂载不由静态 witness gate 冒充判断', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Button loading witness mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/showcases/actions/ActionsScene.tsx',
      removeButtonLoadingSpecimen,
      '从 routed ActionsScene 删除 loading Button specimen'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 verifier 只锚定 catalog/state/proof shape，挂载事实由 Jest 运行时证明'
    );
  });
});

test('Button loading dead component 只属于静态 binding shape', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Button dead component mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/showcases/actions/ActionsScene.tsx',
      (source) =>
        `${removeButtonLoadingSpecimen(source)}\nfunction DeadButtonLoadingWitness() {\n  return (\n    <Button\n      label="加载按钮"\n      loading\n      testID="actions-button-loading"\n      onPress={() => {}}\n    />\n  );\n}\n`,
      '删除真实 loading Button 并追加未渲染的 dead component'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 binding gate 可以接受 dead JSX，但 Jest proof 必须查询真实挂载节点'
    );
  });
});

test('Button loading 同时从 catalog 与 mutable state contract 删除仍失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'independent required state mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/catalog/componentCatalog.ts',
      removeButtonLoadingCatalogState,
      '从 Button catalog 删除 loading state'
    );
    mutateFixtureFile(
      fixture,
      'example/src/catalog/showcaseStateContract.ts',
      (source) => removeStateContractEntry(source, 'button.loading'),
      '从 mutable showcase state contract 删除 button.loading'
    );
    assertVerifierCode(
      fixture,
      'COMPONENT_STATE_REQUIRED_SET',
      '独立 verifier anchor 必须拒绝 catalog/contract 同步删除 button.loading'
    );
  });
});

test('Button loading 的 Jest prove 调用删除时 typed gate 失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Jest state proof mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/__tests__/ActionsScene.test.tsx',
      (source) =>
        replaceProofCall(source, 'stateCoverage', 'button.loading', ''),
      '删除 button.loading Jest prove 调用'
    );
    assertVerifierCode(
      fixture,
      'SCENE_STATE_TEST_CONSUMPTION',
      'production verifier 必须独立拒绝漏掉 button.loading Jest proof'
    );
  });
});

test('Button loading 的 Jest prove 移入 dead helper 时 typed gate 失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Jest dead helper mutation 的 clean fixture 必须先完整通过'
    );

    mutateFixtureFile(
      fixture,
      'example/src/__tests__/ActionsScene.test.tsx',
      (source) =>
        replaceProofCall(
          source,
          'stateCoverage',
          'button.loading',
          [
            '  function deadCoverage(): void {',
            "    stateCoverage.prove('button.loading', () => {",
            '      expect(loadingSpecimen.props.loading).toBe(true);',
            '    });',
            '  }',
          ].join('\n')
        ),
      '把 button.loading prove 移入未调用的 nested helper'
    );

    assertVerifierCode(
      fixture,
      'SCENE_STATE_TEST_CONSUMPTION',
      'production verifier 不得把 dead helper 当作直接 Jest proof'
    );
  });
});

test('Button loading 的空 proof callback 被 typed gate 拒绝', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(() => showcaseVerifier.verifyExampleShowcase(fixture));
    mutateFixtureFile(
      fixture,
      'example/src/__tests__/ActionsScene.test.tsx',
      (source) =>
        replaceProofCall(
          source,
          'stateCoverage',
          'button.loading',
          "  stateCoverage.prove('button.loading', () => {});"
        ),
      '清空 button.loading inline proof callback'
    );
    assertVerifierCode(
      fixture,
      'SCENE_STATE_TEST_CONSUMPTION',
      'proof callback 必须含直接 Jest assertion'
    );
  });
});

test('Button loading 退回 legacy consume 时 typed gate 失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(() => showcaseVerifier.verifyExampleShowcase(fixture));
    mutateFixtureFile(
      fixture,
      'example/src/__tests__/ActionsScene.test.tsx',
      (source) =>
        replaceProofCall(
          source,
          'stateCoverage',
          'button.loading',
          "  stateCoverage.consume('button.loading');"
        ),
      '把 button.loading proof 退回 consume'
    );
    assertVerifierCode(
      fixture,
      'SCENE_STATE_TEST_CONSUMPTION',
      'production verifier 必须显式拒绝 legacy consume'
    );
  });
});

test('runtime API proof gate 拒绝 missing、空 callback 与 legacy consume', () => {
  const mutations = [
    {
      label: '删除 useSvgId runtime proof',
      file: 'example/src/__tests__/BusinessScene.test.tsx',
      mutate: (source) =>
        replaceProofCall(source, 'runtimeCoverage', 'useSvgId', ''),
    },
    {
      label: 'toast runtime proof 使用空 callback',
      file: 'example/src/__tests__/FeedbackScene.test.tsx',
      mutate: (source) =>
        replaceProofCall(
          source,
          'runtimeCoverage',
          'toast',
          "  runtimeCoverage.prove('toast', () => {});"
        ),
    },
    {
      label: 'createLogger runtime proof 退回 consume',
      file: 'example/src/__tests__/FoundationScene.test.tsx',
      mutate: (source) =>
        replaceProofCall(
          source,
          'runtimeCoverage',
          'createLogger',
          "  runtimeCoverage.consume('createLogger');"
        ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(
        () => showcaseVerifier.verifyExampleShowcase(fixture),
        `${mutation.label} clean fixture 必须先完整通过`
      );
      mutateFixtureFile(
        fixture,
        mutation.file,
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, 'RUNTIME_API_TEST_PROOF', mutation.label);
    });
  }
});

test('Chip selected 交互真值不由静态 AST gate 判断', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'ActionsScene.test.tsx');
    assert.equal(
      clean.status,
      0,
      `Chip interaction mutation 的 clean owner suite 必须先完整通过\n${clean.stdout}\n${clean.stderr}`
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Chip interaction mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/showcases/actions/ActionsScene.tsx',
      removeSelectableChipSpecimen,
      '从 routed ActionsScene 删除 selectable Chip'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '交互后态由 scene Jest proof 负责'
    );
    const mutated = runExampleAcceptanceTest(fixture, 'ActionsScene.test.tsx');
    assert.notEqual(
      mutated.status,
      0,
      '删除 selectable Chip 后 owner suite 必须失败'
    );
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /SHOWCASE_CHIP_SELECTED_PROOF/,
      'mutation 必须由 Chip selected 专属运行时证明拒绝'
    );
  });
});

test('Chip selected dead component 不改变静态 gate 与 runtime proof 的职责边界', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'ActionsScene.test.tsx');
    assert.equal(
      clean.status,
      0,
      `Chip dead component mutation 的 clean owner suite 必须先完整通过\n${clean.stdout}\n${clean.stderr}`
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Chip dead component mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/showcases/actions/ActionsScene.tsx',
      (source) =>
        `${removeSelectableChipSpecimen(source)}\nfunction DeadChipWitness() {\n  return (\n    <Chip\n      label="可选择标签"\n      selected={false}\n      testID="actions-chip-selectable"\n      onPress={() => {}}\n    />\n  );\n}\n`,
      '删除真实 selectable Chip 并追加未渲染的 dead component'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 verifier 不手写 React render/JavaScript CFG'
    );
    const mutated = runExampleAcceptanceTest(fixture, 'ActionsScene.test.tsx');
    assert.notEqual(
      mutated.status,
      0,
      'dead Chip witness 不得替代 routed owner proof'
    );
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /SHOWCASE_CHIP_SELECTED_PROOF/,
      'dead-code mutation 必须由 Chip selected 专属运行时证明拒绝'
    );
  });
});

test('Toast error 分支执行事实交给 runtime proof', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'FeedbackScene.test.tsx');
    assert.equal(
      clean.status,
      0,
      `Toast runtime-api mutation 的 clean owner suite 必须先完整通过\n${clean.stdout}\n${clean.stderr}`
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Toast runtime-api mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/showcases/feedback/FeedbackScene.tsx',
      (source) =>
        source.replace('toast.error(input);', 'toast.success(input);'),
      '将 toast.error runtime call 偷换为 toast.success'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      '静态 binding gate 不解释 switch 分支；toast.error spy proof 会拒绝 mutation'
    );
    const mutated = runExampleAcceptanceTest(fixture, 'FeedbackScene.test.tsx');
    assert.notEqual(
      mutated.status,
      0,
      'toast.error 被替换后 owner suite 必须失败'
    );
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /SHOWCASE_TOAST_ERROR_PROOF/,
      'mutation 必须由 Toast error 专属运行时证明拒绝'
    );
  });
});

test('Toast dead helper 不由静态 verifier 猜测是否执行', () => {
  withFixture([...new Set(runtimeAcceptanceFiles)], (fixture) => {
    const clean = runExampleAcceptanceTest(fixture, 'FeedbackScene.test.tsx');
    assert.equal(
      clean.status,
      0,
      `Toast dead helper mutation 的 clean owner suite 必须先完整通过\n${clean.stdout}\n${clean.stderr}`
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Toast dead helper mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/showcases/feedback/FeedbackScene.tsx',
      (source) =>
        `${source.replace(
          'toast.error(input);',
          'toast.success(input);'
        )}\nfunction deadToastWitness(): void {\n  toast.error({\n    message: 'dead witness',\n    position: 'bottom',\n    duration: 1,\n  });\n}\n`,
      '偷换真实 toast.error 并追加未调用的 dead helper'
    );
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'runtime Jest 的 toast.error spy 是执行真值'
    );
    const mutated = runExampleAcceptanceTest(fixture, 'FeedbackScene.test.tsx');
    assert.notEqual(
      mutated.status,
      0,
      'dead toast.error helper 不得替代 routed owner proof'
    );
    assert.match(
      `${mutated.stdout}\n${mutated.stderr}`,
      /SHOWCASE_TOAST_ERROR_PROOF/,
      'dead-code mutation 必须由 Toast error 专属运行时证明拒绝'
    );
  });
});

test('exhaustive verifier 拒绝重复根 runtime 与 Home heavy eager import', () => {
  const mutations = [
    {
      label: '重复 GestureHandlerRootView',
      code: 'ROOT_RUNTIME_UNIQUENESS',
      mutate: (source) =>
        source.replace(
          '    </GestureHandlerRootView>',
          '      <GestureHandlerRootView style={styles.root} />\n    </GestureHandlerRootView>'
        ),
    },
    {
      label: '重复 ThemeProvider',
      code: 'ROOT_RUNTIME_UNIQUENESS',
      mutate: (source) =>
        source.replace(
          '      <ToastHost />',
          '      <ToastHost />\n      <ThemeProvider />'
        ),
    },
    {
      label: '重复 ConfirmHost',
      code: 'ROOT_RUNTIME_UNIQUENESS',
      mutate: (source) =>
        source.replace(
          '      <ConfirmHost />',
          '      <ConfirmHost />\n      <ConfirmHost />'
        ),
    },
    {
      label: '重复 ToastHost',
      code: 'ROOT_RUNTIME_UNIQUENESS',
      mutate: (source) =>
        source.replace(
          '      <ToastHost />',
          '      <ToastHost />\n      <ToastHost />'
        ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        'example/src/app/AppProviders.tsx',
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }

  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(() => showcaseVerifier.verifyExampleShowcase(fixture));
    mutateFixtureFile(
      fixture,
      'example/src/screens/HomeScreen.tsx',
      (source) =>
        `import { Carousel } from '@unif/react-native-design';\n${source}`,
      'Home eager import Carousel'
    );
    assertVerifierCode(
      fixture,
      'HOME_HEAVY_IMPORT',
      'Home eager import Carousel'
    );
  });
});

test('root runtime verifier 拒绝把 ConfirmHost 或 ToastHost 放进条件分支', () => {
  for (const host of ['ConfirmHost', 'ToastHost']) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        'example/src/app/AppProviders.tsx',
        (source) => {
          const conditional = `{runtimeHostsMounted ? <${host} /> : null}`;
          if (source.includes(conditional)) {
            return source.replace(conditional, `{false ? <${host} /> : null}`);
          }
          return source.replace(
            `      <${host} />`,
            `      {true ? <${host} /> : null}`
          );
        },
        `${host} conditional root runtime`
      );
      assertVerifierCode(
        fixture,
        'ROOT_RUNTIME_PERSISTENCE',
        `${host} 必须无条件常驻`
      );
    });
  }
});

test('exhaustive verifier 拒绝 deep import、旧包、硬编码颜色、console 与 RN Pressable', () => {
  const mutations = [
    {
      label: 'Design deep import',
      code: 'SOURCE_DEEP_IMPORT',
      mutate: (source) =>
        source.replace(
          "from '@unif/react-native-design';",
          "from '@unif/react-native-design/dist/components';"
        ),
    },
    {
      label: '测试源码 Design deep import',
      file: 'example/src/__tests__/MediaScene.test.tsx',
      code: 'SOURCE_DEEP_IMPORT',
      mutate: (source) =>
        source.replace(
          "from '@unif/react-native-design';",
          "from '@unif/react-native-design/dist/components';"
        ),
    },
    {
      label: '旧包名 import',
      code: 'SOURCE_LEGACY_PACKAGE',
      mutate: (source) => `import 'react-native-designdd';\n${source}`,
    },
    {
      label: 'hex 颜色',
      code: 'SOURCE_HARDCODED_COLOR',
      mutate: (source) =>
        source.replace('color={colors.success}', 'color="#ff0000"'),
    },
    {
      label: 'rgba 颜色',
      code: 'SOURCE_HARDCODED_COLOR',
      mutate: (source) =>
        source.replace('color={colors.success}', 'color="rgba(0, 0, 0, 0.5)"'),
    },
    {
      label: 'console 调用',
      code: 'SOURCE_CONSOLE',
      mutate: (source) => `console.log('mutation');\n${source}`,
    },
    {
      label: 'RN Pressable import',
      code: 'SOURCE_RN_PRESSABLE',
      mutate: (source) =>
        source.replace(
          "import { StyleSheet, View } from 'react-native';",
          "import { Pressable, StyleSheet, View } from 'react-native';"
        ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        mutation.file ?? 'example/src/showcases/actions/ActionsScene.tsx',
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }
});

test('exhaustive verifier 为 runtime、peer、toolchain、plugin 与 native drift 返回稳定 code', () => {
  const mutations = [
    {
      label: 'runtime dependency drift',
      file: 'example/package.json',
      code: 'RUNTIME_DEPENDENCIES',
      mutate(source) {
        const manifest = JSON.parse(source);
        manifest.dependencies['react-native-safe-area-context'] = '5.7.0';
        return `${JSON.stringify(manifest, null, 2)}\n`;
      },
    },
    {
      label: 'root peer drift',
      file: 'package.json',
      code: 'ROOT_PEER_DEPENDENCIES',
      mutate(source) {
        const manifest = JSON.parse(source);
        manifest.peerDependencies['react-native'] = '>=0.85.0 <0.87.0';
        return `${JSON.stringify(manifest, null, 2)}\n`;
      },
    },
    {
      label: 'toolchain drift',
      file: 'example/package.json',
      code: 'TOOLCHAIN_VERSION',
      mutate(source) {
        const manifest = JSON.parse(source);
        manifest.devDependencies['@react-native/metro-config'] = '0.85.3';
        return `${JSON.stringify(manifest, null, 2)}\n`;
      },
    },
    {
      label: 'Worklets plugin 不再最后',
      file: 'example/babel.config.js',
      code: 'BABEL_PLUGIN_ORDER',
      mutate: (source) =>
        source.replace(
          "plugins: ['react-native-worklets/plugin'],",
          "plugins: ['react-native-worklets/plugin', 'mutation/after'],"
        ),
    },
    {
      label: 'native identity drift',
      file: 'example/android/app/build.gradle',
      code: 'NATIVE_IDENTITY',
      mutate: (source) =>
        source.replace(
          'namespace "unif.reactnativedesign.example"',
          'namespace "mutated.invalid"'
        ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        mutation.file,
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }
});

test('根 README 与 example README 提供同一组 8 scene 和可复制命令', () => {
  const rootReadme = read('README.md');
  const exampleReadme = read('example/README.md');
  const expectedTitles = {
    foundation: '基础能力与图标',
    actions: '操作与状态',
    feedback: '反馈与浮层',
    forms: '表单与输入',
    navigation: '导航组件',
    collections: '容器与集合',
    media: '媒体展示',
    business: '业务复合组件',
  };
  const sceneRows = (source) =>
    Object.fromEntries(
      [
        ...source.matchAll(
          /^\|[ \t]*`([^`]+)`[ \t]*\|[ \t]*([^|\n]+?)[ \t]*\|/gmu
        ),
      ]
        .map((match) => [match[1], match[2].trim()])
        .filter(([id]) => Object.hasOwn(expectedTitles, id))
    );

  assert.deepEqual(sceneRows(rootReadme), expectedTitles);
  assert.deepEqual(sceneRows(exampleReadme), expectedTitles);
  assert.doesNotMatch(
    rootReadme,
    /RN `?0\.85\.3|旧 0\.85|不能作为 RN `?0\.86/u
  );
  assert.match(rootReadme, /持久.*example\//u);
  assert.match(rootReadme, /临时.*runtime harness/u);

  for (const command of [
    'yarn install --immutable',
    'yarn example start',
    'yarn example android',
    'yarn example ios',
    'yarn verify:example-showcase',
    'yarn example typecheck',
    'yarn example lint',
    'yarn example test --maxWorkers=2',
  ]) {
    assert.match(rootReadme, new RegExp(command.replaceAll(' ', '\\s+'), 'u'));
    assert.match(
      exampleReadme,
      new RegExp(command.replaceAll(' ', '\\s+'), 'u')
    );
  }
});

test('example README 按运行顺序记录 Pods、主题与未冒充 PASS 的人工矩阵', () => {
  const readme = read('example/README.md');
  const orderedHeadings = [
    '## 1. 安装',
    '## 2. 安装 iOS Pods',
    '## 3. 启动 Metro',
    '## 4. Simulator 与真机',
    '## 5. 八个场景',
    '## 6. 主题、字号与减少动态效果',
    '## 7. 自动化',
    '## 8. 人工验收矩阵',
    '## 9. 复制边界',
  ];
  let previous = -1;
  for (const heading of orderedHeadings) {
    const index = readme.indexOf(heading);
    assert.ok(index > previous, `${heading} 顺序错误或缺失`);
    previous = index;
  }

  for (const required of [
    'cd example && bundle install',
    'cd example && bundle exec pod install --project-directory=ios',
    'system',
    'light',
    'dark',
    '1 / 1.25 / 1.5 / 2',
    'reduced motion',
    'Android emulator',
    'Android 真机',
    'iOS Simulator',
    'iOS 真机',
    'VoiceOver',
    'TalkBack',
    'portrait',
    'landscape',
    'remote image success/failure',
    'Toast/Confirm',
    'Carousel action/autoplay',
    'Android hardware back',
    'Blur soft/strong/fallback',
    '@unif/react-native-design',
  ]) {
    assert.ok(readme.includes(required), `example README 缺少 ${required}`);
  }
  assert.doesNotMatch(readme, /^\|[^\n]*\|\s*PASS\s*\|/gmu);
  assert.ok(
    [...readme.matchAll(/^\|[^\n]+\|\s*(待人工执行|BLOCKED[^|]*)\s*\|$/gmu)]
      .length >= 12,
    '人工矩阵必须把未执行项明确标为待人工执行或 BLOCKED'
  );
});

test('AGENTS 与 CONTRIBUTING 使用 RN 0.86.2 showcase 的真实 workspace 和 gates', () => {
  const agents = read('AGENTS.md');
  const contributing = read('CONTRIBUTING.md');
  for (const source of [agents, contributing]) {
    assert.match(source, /@unif\/react-native-design-example/u);
    assert.match(source, /ReactNativeDesignExample/u);
    assert.match(source, /RN `?0\.86\.2/u);
    assert.match(source, /yarn install --immutable/u);
    assert.match(source, /yarn verify:example-showcase/u);
    assert.doesNotMatch(
      source,
      /react-native-designdd-example|DesignddExample|RN `?0\.85\.3/u
    );
  }
  assert.match(contributing, /yarn example typecheck/u);
  assert.match(contributing, /yarn example lint/u);
  assert.match(contributing, /yarn example test --maxWorkers=2/u);
  assert.match(
    contributing,
    /bundle exec pod install --project-directory=ios/u
  );
});

test('repo-specific workflow 使用强并集 gate 且共享 CI digest 不漂移', () => {
  const sharedCi = read('.github/workflows/ci.yml');
  assert.equal(
    createHash('sha256').update(sharedCi).digest('hex'),
    'd2ac60869b254ee49490126e5a31a803a31be5e52f9c4de4343ef9de1b99552b'
  );

  const workflow = read('.github/workflows/example-showcase.yml');
  assert.match(
    workflow,
    /^on:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n  merge_group:/mu
  );
  assert.doesNotMatch(workflow, /^\s+paths(?:-ignore)?:/mu);
  assert.match(workflow, /^permissions:\n  contents: read$/mu);
  assert.match(workflow, /cancel-in-progress: true/u);
  assert.match(
    workflow,
    /actions\/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd/u
  );
  assert.match(workflow, /uses: \.\/\.github\/actions\/setup/u);
  for (const command of [
    'yarn install --immutable',
    'yarn check:config',
    'yarn check:runtime-peers',
    'yarn check:icons',
    'yarn verify:example-showcase',
    'yarn example typecheck',
    'yarn example lint',
    'yarn example test --maxWorkers=2',
    'yarn lint',
    'yarn typecheck',
    'yarn test --maxWorkers=2',
    'yarn prepare',
  ]) {
    assert.ok(workflow.includes(`run: ${command}`), `workflow 缺少 ${command}`);
  }
  assert.doesNotMatch(
    workflow,
    /yarn example (?:build:android|build:ios|android|ios)|pod install/u
  );
});

test('Turbo 只定义 package-qualified example tasks 并隔离双端 native inputs', () => {
  const turbo = readJson('turbo.json');
  const expectedTasks = [
    '@unif/react-native-design-example#build:android',
    '@unif/react-native-design-example#build:ios',
    '@unif/react-native-design-example#test',
  ];
  assert.deepEqual(Object.keys(turbo.tasks).sort(), expectedTasks.sort());

  for (const [taskName, task] of Object.entries(turbo.tasks)) {
    assert.ok(task.inputs.length > 0, `${taskName} 缺少 inputs`);
    assert.ok(
      task.inputs.every(
        (input) =>
          input.startsWith('$TURBO_ROOT$/') ||
          input.startsWith('!$TURBO_ROOT$/')
      ),
      `${taskName} inputs 必须全部以 $TURBO_ROOT$ 为根`
    );
    assert.ok(
      task.inputs.includes('$TURBO_ROOT$/example/src/**'),
      `${taskName} 必须纳入深层 example source`
    );
  }

  const android =
    turbo.tasks['@unif/react-native-design-example#build:android'].inputs;
  const ios = turbo.tasks['@unif/react-native-design-example#build:ios'].inputs;
  const testInputs =
    turbo.tasks['@unif/react-native-design-example#test'].inputs;
  for (const directInput of [
    '$TURBO_ROOT$/scripts/run-example-jest.mjs',
    '$TURBO_ROOT$/scripts/verify-example-showcase.mjs',
    '$TURBO_ROOT$/example/jest.forbidOnlyReporter.js',
    '$TURBO_ROOT$/example/jest.showcaseGate.js',
  ]) {
    assert.ok(
      testInputs.includes(directInput),
      `example test task 缺少直接执行 input ${directInput}`
    );
  }
  assert.ok(android.includes('$TURBO_ROOT$/example/android/**'));
  assert.ok(android.includes('!$TURBO_ROOT$/example/android/local.properties'));
  assert.ok(android.includes('!$TURBO_ROOT$/example/android/**/build/**'));
  assert.ok(!android.some((input) => input.includes('/example/ios')));
  assert.ok(ios.includes('$TURBO_ROOT$/example/Gemfile'));
  assert.ok(ios.includes('$TURBO_ROOT$/example/Gemfile.lock'));
  assert.ok(ios.includes('$TURBO_ROOT$/example/ios/**'));
  assert.ok(ios.includes('!$TURBO_ROOT$/example/ios/Pods/**'));
  assert.ok(ios.includes('!$TURBO_ROOT$/example/ios/**/build/**'));
  assert.ok(ios.includes('!$TURBO_ROOT$/example/ios/**/DerivedData/**'));
  assert.ok(ios.includes('!$TURBO_ROOT$/example/ios/.xcode.env.local'));
  assert.ok(!ios.some((input) => input.includes('/example/android')));
});

test('README mutation gate 拒绝缺少安装、Pods、Metro、build、scene、theme 与 a11y', () => {
  const mutations = [
    {
      label: '缺 immutable install',
      code: 'README_COMMANDS',
      mutate: (source) =>
        source.replace('yarn install --immutable', 'yarn install'),
    },
    {
      label: '缺 Bundler Pods 命令',
      code: 'README_COMMANDS',
      mutate: (source) =>
        source.replace(
          'cd example && bundle exec pod install --project-directory=ios',
          'cd example && pod install'
        ),
    },
    {
      label: '缺 Metro 命令',
      code: 'README_COMMANDS',
      mutate: (source) =>
        source.replace('yarn example start', 'yarn example dev'),
    },
    {
      label: '缺 Android build 命令',
      code: 'README_COMMANDS',
      mutate: (source) =>
        source.replace('yarn example build:android', 'yarn example build'),
    },
    {
      label: '缺 media scene',
      code: 'README_SCENE_SET',
      mutate: (source) =>
        source.replace(
          /^\|[ \t]*`media`[ \t]*\|[ \t]*媒体展示[ \t]*\|/mu,
          '| `missing-media` | 媒体展示 |'
        ),
    },
    {
      label: '缺 system theme',
      code: 'README_MANUAL_MATRIX',
      mutate: (source) =>
        source.replace('`system`、`light`、`dark`', '`light`、`dark`'),
    },
    {
      label: '缺 VoiceOver',
      code: 'README_MANUAL_MATRIX',
      mutate: (source) => source.replaceAll('VoiceOver', '屏幕阅读器'),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        'example/README.md',
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }
});

test('README mutation gate 拒绝媒体 fixture 与 runtime peer 事实漂移', () => {
  const mutations = [
    {
      label: 'example README 缺 decode-failure fixture',
      file: 'example/README.md',
      code: 'README_MEDIA_FIXTURES',
      mutate: (source) =>
        source.replaceAll(
          'https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png',
          'https://example.invalid/missing.png'
        ),
    },
    {
      label: 'root README 误称 yarnrc 存在 logFilters',
      file: 'README.md',
      code: 'README_PEER_FACTS',
      mutate: (source) =>
        source.replace(
          '本仓不使用全局 `logFilters`',
          '本仓 `.yarnrc.yml` 使用全局 `logFilters`'
        ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        mutation.file,
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }
});

test('Media fixture deployment mutation gate 拒绝部署配置与资产漂移', () => {
  assert.match(
    read('.gitattributes'),
    /^website\/static\/example-fixtures\/media-decode-failure-v1\.png -text$/mu
  );
  const mutations = [
    {
      label: 'Docusaurus origin 漂移',
      file: 'website/docusaurus.config.ts',
      mutate: (source) =>
        source.replace(
          "  url: 'https://unif-design.github.io',",
          "  url: 'https://preview.invalid',"
        ),
    },
    {
      label: 'Docusaurus baseUrl 漂移',
      file: 'website/docusaurus.config.ts',
      mutate: (source) =>
        source.replace(
          "  baseUrl: '/react-native-design/',",
          "  baseUrl: '/design-preview/',"
        ),
    },
    {
      label: 'Docusaurus active config 漂移但注释保留旧 token',
      file: 'website/docusaurus.config.ts',
      mutate: (source) =>
        source.replace(
          "  url: 'https://unif-design.github.io',\n  baseUrl: '/react-native-design/',",
          "  // stale:   url: 'https://unif-design.github.io',\n  // stale:   baseUrl: '/react-native-design/',\n  url: 'https://preview.invalid',\n  baseUrl: '/design-preview/',"
        ),
    },
    {
      label: 'Docusaurus spread 在 direct deployment properties 后覆盖',
      file: 'website/docusaurus.config.ts',
      mutate: (source) =>
        source
          .replace(
            'const config: Config = {',
            "const deploymentOverride: Partial<Config> = {\n  url: 'https://preview.invalid',\n  baseUrl: '/design-preview/',\n};\n\nconst config: Config = {"
          )
          .replace(
            "  baseUrl: '/react-native-design/',",
            "  baseUrl: '/react-native-design/',\n  ...deploymentOverride,"
          ),
    },
    {
      label: 'success fixture 仅保留 PNG signature',
      file: 'website/static/img/logo.png',
      mutate: () => Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
    },
    {
      label: 'failure fixture marker 漂移',
      file: 'website/static/example-fixtures/media-decode-failure-v1.png',
      mutate: (source) =>
        source.replace(
          'UNIF_MEDIA_DECODE_FAILURE_FIXTURE_V1',
          'UNIF_MEDIA_DECODE_FAILURE_FIXTURE_V2'
        ),
    },
    {
      label: 'failure fixture 丢失 binary checkout contract',
      file: '.gitattributes',
      mutate: (source) =>
        source.replace(
          'website/static/example-fixtures/media-decode-failure-v1.png -text\n',
          ''
        ),
    },
    {
      label: 'failure fixture URI 漂移',
      file: 'example/src/state/showcaseState.ts',
      mutate: (source) =>
        source.replace(
          'https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png',
          'https://example.invalid/media-decode-failure-v1.png'
        ),
    },
    {
      label: 'failure fixture active URI 漂移但注释保留旧 URI',
      file: 'example/src/state/showcaseState.ts',
      mutate: (source) =>
        source.replace(
          "export const MEDIA_DECODE_FAILURE_URI =\n  'https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png';",
          "// stale: 'https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png'\nexport const MEDIA_DECODE_FAILURE_URI =\n  'https://example.invalid/media-decode-failure-v1.png';"
        ),
    },
    {
      label: 'media state factory 不再使用 success fixture const',
      file: 'example/src/state/showcaseState.ts',
      mutate: (source) =>
        source.replace(
          '    remoteUri: DEFAULT_MEDIA_REMOTE_URI,',
          "    remoteUri: 'https://images.example.com/unif-avatar.png',"
        ),
    },
    {
      label: 'Media success specimens 不再使用 draft remoteUri',
      file: 'example/src/showcases/media/MediaScene.tsx',
      mutate: (source) =>
        source
          .replace(
            'source={{ uri: draft.remoteUri }}',
            'source={{ uri: DEFAULT_MEDIA_REMOTE_URI }}'
          )
          .replace(
            'uri={draft.remoteUri}\n              size="sm"',
            'uri={DEFAULT_MEDIA_REMOTE_URI}\n              size="sm"'
          ),
    },
    {
      label: 'Media scene 不再使用 failure fixture',
      file: 'example/src/showcases/media/MediaScene.tsx',
      mutate: (source) =>
        source.replaceAll(
          'MEDIA_DECODE_FAILURE_URI',
          'DEFAULT_MEDIA_REMOTE_URI'
        ),
    },
    {
      label: 'Media scene 只保留 stale failure import',
      file: 'example/src/showcases/media/MediaScene.tsx',
      mutate: (source) =>
        source
          .replace(
            'source={{ uri: MEDIA_DECODE_FAILURE_URI }}',
            'source={{ uri: DEFAULT_MEDIA_REMOTE_URI }}'
          )
          .replace(
            'uri={MEDIA_DECODE_FAILURE_URI}',
            'uri={DEFAULT_MEDIA_REMOTE_URI}'
          ),
    },
    {
      label: 'Media failure testIDs 挂到 local fake components',
      file: 'example/src/showcases/media/MediaScene.tsx',
      mutate: (source) =>
        source
          .replace('  Avatar,', '  Avatar as DesignAvatar,')
          .replace('  Thumbnail,', '  Thumbnail as DesignThumbnail,')
          .replaceAll('<Avatar', '<DesignAvatar')
          .replaceAll('<Thumbnail', '<DesignThumbnail')
          .replace(
            'const LOCAL_IMAGE:',
            'const Avatar = (_props: unknown): null => null;\nconst Thumbnail = (_props: unknown): null => null;\n\nconst LOCAL_IMAGE:'
          )
          .replace(
            '<DesignAvatar\n              label="失效头像"',
            '<Avatar\n              label="失效头像"'
          )
          .replace(
            '<DesignThumbnail\n              uri={MEDIA_DECODE_FAILURE_URI}',
            '<Thumbnail\n              uri={MEDIA_DECODE_FAILURE_URI}'
          ),
    },
    {
      label: 'Media failure Thumbnail 被后置 JSX spread 覆盖',
      file: 'example/src/showcases/media/MediaScene.tsx',
      mutate: (source) =>
        source
          .replace(
            'const LOCAL_IMAGE:',
            'const thumbnailOverride = { uri: DEFAULT_MEDIA_REMOTE_URI };\n\nconst LOCAL_IMAGE:'
          )
          .replace(
            '              uri={MEDIA_DECODE_FAILURE_URI}\n              size="sm"',
            '              uri={MEDIA_DECODE_FAILURE_URI}\n              {...thumbnailOverride}\n              size="sm"'
          ),
    },
    {
      label: 'Media failure Avatar source 被后置 object spread 覆盖',
      file: 'example/src/showcases/media/MediaScene.tsx',
      mutate: (source) =>
        source
          .replace(
            'const LOCAL_IMAGE:',
            'const avatarOverride = { uri: DEFAULT_MEDIA_REMOTE_URI };\n\nconst LOCAL_IMAGE:'
          )
          .replace(
            'source={{ uri: MEDIA_DECODE_FAILURE_URI }}',
            'source={{ uri: MEDIA_DECODE_FAILURE_URI, ...avatarOverride }}'
          ),
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        mutation.file,
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, 'MEDIA_FIXTURE_DEPLOYMENT', mutation.label);
    });
  }
});

test('workflow 与 shared CI mutation gate 返回稳定 typed code', () => {
  const mutations = [
    {
      label: 'workflow 漏 example lint',
      file: '.github/workflows/example-showcase.yml',
      code: 'WORKFLOW_GATES',
      mutate: (source) =>
        source.replace('        run: yarn example lint\n', ''),
    },
    {
      label: 'workflow 加入 paths filter',
      file: '.github/workflows/example-showcase.yml',
      code: 'WORKFLOW_TRIGGER',
      mutate: (source) =>
        source.replace(
          '  pull_request:\n    branches:',
          "  pull_request:\n    paths:\n      - 'example/**'\n    branches:"
        ),
    },
    {
      label: 'shared CI byte drift',
      file: '.github/workflows/ci.yml',
      code: 'SHARED_CI_DIGEST',
      mutate: (source) => `${source}# mutation\n`,
    },
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(
        fixture,
        mutation.file,
        mutation.mutate,
        mutation.label
      );
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }
});

test('Turbo mutation gate 拒绝 task、深层 source 与平台隔离漂移', () => {
  const mutations = [
    {
      label: '退回全局 task 名',
      code: 'TURBO_TASKS',
      mutate: (source) =>
        source.replace('"@unif/react-native-design-example#test"', '"test"'),
    },
    {
      label: 'test task 漏深层 example source',
      code: 'TURBO_INPUTS',
      mutate: (source) =>
        source.replace(
          '        "$TURBO_ROOT$/example/src/**",',
          '        "$TURBO_ROOT$/example/src/*.tsx",'
        ),
    },
    {
      label: 'Android task 纳入 iOS tree',
      code: 'TURBO_PLATFORM_ISOLATION',
      mutate: (source) =>
        source.replace(
          '        "$TURBO_ROOT$/example/android/**",',
          '        "$TURBO_ROOT$/example/android/**",\n        "$TURBO_ROOT$/example/ios/**",'
        ),
    },
    ...[
      '$TURBO_ROOT$/scripts/run-example-jest.mjs',
      '$TURBO_ROOT$/scripts/verify-example-showcase.mjs',
      '$TURBO_ROOT$/example/jest.forbidOnlyReporter.js',
      '$TURBO_ROOT$/example/jest.showcaseGate.js',
    ].map((input) => ({
      label: `test task 删除直接执行 input ${input}`,
      code: 'TURBO_INPUTS',
      mutate: (source) => {
        const turbo = JSON.parse(source);
        const task = turbo.tasks['@unif/react-native-design-example#test'];
        task.inputs = task.inputs.filter((candidate) => candidate !== input);
        return `${JSON.stringify(turbo, null, 2)}\n`;
      },
    })),
  ];

  for (const mutation of mutations) {
    withFixture([...new Set(sourceContractFiles)], (fixture) => {
      assert.doesNotThrow(() =>
        showcaseVerifier.verifyExampleShowcase(fixture)
      );
      mutateFixtureFile(fixture, 'turbo.json', mutation.mutate, mutation.label);
      assertVerifierCode(fixture, mutation.code, mutation.label);
    });
  }
});

test('Turbo dry-run 只解析真实 example task 且纳入深层 showcase source', () => {
  const commands = [
    {
      args: ['turbo', 'run', 'test', '--dry=json'],
      taskId: '@unif/react-native-design-example#test',
    },
    {
      args: [
        'turbo',
        'run',
        'build:android',
        '--filter=@unif/react-native-design-example',
        '--dry=json',
      ],
      taskId: '@unif/react-native-design-example#build:android',
    },
    {
      args: [
        'turbo',
        'run',
        'build:ios',
        '--filter=@unif/react-native-design-example',
        '--dry=json',
      ],
      taskId: '@unif/react-native-design-example#build:ios',
    },
  ];

  for (const command of commands) {
    const result = spawnSync(
      process.execPath,
      [path.join(root, '.yarn/releases/yarn-4.11.0.cjs'), ...command.args],
      { cwd: root, encoding: 'utf8' }
    );
    const output = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 0, output);
    const dry = JSON.parse(result.stdout);
    assert.deepEqual(
      dry.tasks.map((task) => task.taskId),
      [command.taskId]
    );
    assert.ok(
      Object.keys(dry.tasks[0].inputs).some((input) =>
        input.includes('src/showcases/business/BusinessScene.tsx')
      ),
      `${command.taskId} dry inputs 缺少深层 showcase source`
    );
    if (command.taskId === '@unif/react-native-design-example#test') {
      for (const directInput of [
        '../scripts/run-example-jest.mjs',
        '../scripts/verify-example-showcase.mjs',
        'jest.forbidOnlyReporter.js',
        'jest.showcaseGate.js',
      ]) {
        assert.ok(
          Object.keys(dry.tasks[0].inputs).some(
            (input) => input === directInput
          ),
          `${command.taskId} dry inputs 缺少 ${directInput}`
        );
      }
    }
    assert.ok(
      dry.tasks.every(
        (task) =>
          !task.taskId.includes('@unif/react-native-design-website') &&
          !task.taskId.includes('<NONEXISTENT>')
      ),
      `${command.taskId} 不得产生 Website phantom task`
    );
  }
});
