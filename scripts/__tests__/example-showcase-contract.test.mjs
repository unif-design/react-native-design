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
  readdirSync,
  rmSync,
  statSync,
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
  'turbo.json',
  '.github/workflows/ci.yml',
  '.github/workflows/example-showcase.yml',
  'example/package.json',
  'example/README.md',
  'example/babel.config.js',
  'example/metro.config.js',
  'example/jest.config.js',
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
  assert.equal(examplePackage.scripts.test, 'jest');
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

test('Button loading 真实 routed specimen 删除时 typed witness gate 失败', () => {
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
    assertVerifierCode(
      fixture,
      'COMPONENT_STATE_WITNESS',
      'button.loading 必须由 routed scene 的真实 specimen 见证'
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

test('Button loading 的 Jest consume 调用删除时 typed gate 失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Jest state consume mutation 的 clean fixture 必须先完整通过'
    );
    mutateFixtureFile(
      fixture,
      'example/src/__tests__/ActionsScene.test.tsx',
      (source) =>
        source.replace("  stateCoverage.consume('button.loading');\n", ''),
      '删除 button.loading Jest consume 调用'
    );
    assertVerifierCode(
      fixture,
      'SCENE_STATE_TEST_CONSUMPTION',
      'production verifier 必须独立拒绝漏掉 button.loading Jest consume'
    );
  });
});

test('Button loading 的 Jest consume 移入 dead helper 时 typed gate 失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
    assert.doesNotThrow(
      () => showcaseVerifier.verifyExampleShowcase(fixture),
      'Jest dead helper mutation 的 clean fixture 必须先完整通过'
    );

    mutateFixtureFile(
      fixture,
      'example/src/__tests__/ActionsScene.test.tsx',
      (source) =>
        source.replace(
          "  stateCoverage.consume('button.loading');",
          [
            '  function deadCoverage(): void {',
            "    stateCoverage.consume('button.loading');",
            '  }',
          ].join('\n')
        ),
      '把 button.loading consume 移入未调用的 nested helper'
    );

    assertVerifierCode(
      fixture,
      'SCENE_STATE_TEST_CONSUMPTION',
      'production verifier 不得把 dead helper 当作已执行 Jest consume'
    );
  });
});

test('Chip selected 删除真实 routed interaction specimen 时 typed gate 失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
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
    assertVerifierCode(
      fixture,
      'COMPONENT_STATE_WITNESS',
      'chip.selected 必须由真实可执行 interaction 见证'
    );
  });
});

test('Toast kinds 的 error runtime-api 分支被偷换时 typed gate 失败', () => {
  withFixture([...new Set(sourceContractFiles)], (fixture) => {
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
    assertVerifierCode(
      fixture,
      'COMPONENT_STATE_WITNESS',
      'ToastHost.kinds 必须保留 error public runtime-api call'
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
          '      {runtimeHostsMounted ? <ToastHost /> : null}',
          '      {runtimeHostsMounted ? <ToastHost /> : null}\n      <ThemeProvider />'
        ),
    },
    {
      label: '重复 ConfirmHost',
      code: 'ROOT_RUNTIME_UNIQUENESS',
      mutate: (source) =>
        source.replace(
          '      {runtimeHostsMounted ? <ConfirmHost /> : null}',
          '      {runtimeHostsMounted ? <ConfirmHost /> : null}\n      <ConfirmHost />'
        ),
    },
    {
      label: '重复 ToastHost',
      code: 'ROOT_RUNTIME_UNIQUENESS',
      mutate: (source) =>
        source.replace(
          '      {runtimeHostsMounted ? <ToastHost /> : null}',
          '      {runtimeHostsMounted ? <ToastHost /> : null}\n      <ToastHost />'
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
          '        "$TURBO_ROOT$/example/src/**"\n      ],',
          '        "$TURBO_ROOT$/example/src/*.tsx"\n      ],'
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
