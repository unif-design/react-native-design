import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import {
  copyFileSync,
  existsSync,
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
  react: '19.2.3',
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
  assert.equal(
    examplePackage.devDependencies['react-test-renderer'],
    '19.2.3'
  );
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
    'node scripts/verify-example-showcase.mjs'
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

  assert.equal(
    babelConfig.presets[0],
    'module:@react-native/babel-preset'
  );
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
  assert.match(read('example/tsconfig.json'), /@react-native\/typescript-config/u);
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
    ...manifest.matchAll(
      /<uses-permission\s+android:name="([^"]+)"\s*\/>/gu
    ),
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
  assert.match(
    delegate,
    /withModuleName: "ReactNativeDesignExample"/u
  );
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
    assert.equal(
      ignored.status,
      1,
      `${relativePath} 不得被 .gitignore 排除`
    );
  }
});

test('catalog 与 public runtime barrels 保持 exhaustive contract', () => {
  assert.equal(typeof showcaseVerifier.verifyExampleShowcase, 'function');
  assert.doesNotThrow(() => showcaseVerifier.verifyExampleShowcase(root));
});

test('catalog mutation gate 拒绝缺项、重复 id 与错误 scene', () => {
  const mutations = [
    {
      name: '缺项',
      mutate(source) {
        return source.replace(
          "  {\n    id: 'Avatar',\n    scene: 'media',\n    states: ['brand/info/soft/neutral', 'xs/sm/md/lg/xl', '图片', '回退文字'],\n  },\n",
          ''
        );
      },
    },
    {
      name: '重复 id',
      mutate(source) {
        return source.replace("    id: 'BlurLayer',", "    id: 'Avatar',");
      },
    },
    {
      name: '错误 scene',
      mutate(source) {
        return source.replace(
          "    id: 'Icon',\n    scene: 'foundation',",
          "    id: 'Icon',\n    scene: 'actions',"
        );
      },
    },
  ];

  for (const mutation of mutations) {
    withFixture(catalogContractFiles, (fixture) => {
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
        /catalog|scene|component/iu,
        mutation.name
      );
    });
  }
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
    const gradlePath = path.join(
      fixture,
      'example/android/app/build.gradle'
    );
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
