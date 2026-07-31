#!/usr/bin/env node
'use strict';

/**
 * 生成一次性的 RN 0.86.2 原生验证宿主(RuntimeApiHarness)。
 *
 * 为什么不用 `example/`:它是启用新架构的 RN 0.85.3 现有版本 shell,拿它验证 0.86 的
 * 原生行为等于自欺。本脚本改为从**锁文件里钉死的官方 CLI + template** 现场生成一个
 * 干净 app,装上当前源码打出的 tarball,再由人工在真机 / 模拟器上跑验收矩阵。
 *
 * 纪律:
 * - 目标目录由脚本用 `fs.mkdtempSync` 自持,**不接受调用方传目录** —— 否则一个手滑的
 *   参数就可能让后面的清理逻辑删掉真实工程。
 * - 全程 `execFileSync` + 参数数组,不做任何 shell 插值。
 * - 只在生成失败时递归删除**自己那一个** temp 路径,绝不碰别的地方。
 * - 任何版本 / 校验和 / 结构不符都在写文件前 fail-fast,不产出半成品。
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const semver = require('semver');

const REPO_ROOT = path.resolve(__dirname, '..');
const APP_NAME = 'RuntimeApiHarness';
const TEMP_PREFIX = 'unif-runtime-api-';

/** 全部钉死的版本基线 —— 任一漂移都必须让脚本失败,而不是静默生成别的版本。 */
const EXPECTED = {
  cli: '20.1.0',
  template: '0.86.2',
  react: '19.2.3',
  reactNative: '0.86.2',
};

const TOOLCHAIN_PACKAGES = ['@babel/core', '@react-native/metro-config'];
const NATIVE_TEMPLATE_FILES = [
  'ios/Podfile',
  'android/settings.gradle',
  'android/build.gradle',
  'android/app/build.gradle',
];

// ---------------------------------------------------------------------------
// 纯逻辑(单测覆盖):版本、路径、锁文件与 manifest
// ---------------------------------------------------------------------------

function assertExactVersion(name, actual, expected) {
  if (actual !== expected) {
    throw new Error(
      `${name} 版本漂移:期望 ${expected},实际 ${actual}。harness 必须与锁定基线逐字一致。`
    );
  }
}

function assertTemplateManifest(manifest) {
  const deps = manifest.dependencies ?? {};
  const devDeps = manifest.devDependencies ?? {};
  assertExactVersion('react(template)', deps.react, EXPECTED.react);
  assertExactVersion(
    'react-native(template)',
    deps['react-native'],
    EXPECTED.reactNative
  );
  assertExactVersion(
    '@react-native-community/cli(template)',
    devDeps['@react-native-community/cli'],
    EXPECTED.cli
  );
}

/** 在 yarn.lock 中定位 `<name>@npm:<version>` 条目块,返回其 checksum(无则 null)。 */
function findLockChecksum(lockText, name, version) {
  const lines = lockText.split(/\r?\n/u);
  const resolution = `resolution: "${name}@npm:${version}"`;
  let inBlock = false;
  for (const line of lines) {
    // 顶格非空行 = 新条目块的开始;跨块查找会把别人的 checksum 认成自己的。
    if (line.length > 0 && !/^\s/u.test(line)) inBlock = false;
    if (line.includes(resolution)) inBlock = true;
    if (!inBlock) continue;
    const match = line.match(/^\s+checksum:\s*(\S+)\s*$/u);
    if (match) return match[1];
  }
  return null;
}

function assertLockChecksums(lockText, packages) {
  for (const { name, version } of packages) {
    const checksum = findLockChecksum(lockText, name, version);
    if (!checksum) {
      throw new Error(
        `${name}@${version} 在 yarn.lock 中没有非空 checksum —— 拒绝用来源不可验证的脚手架生成 harness。`
      );
    }
  }
}

function parseYamlScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"')) return JSON.parse(trimmed);
  return trimmed;
}

/**
 * 用根 manifest 的原始 direct range 精确匹配 yarn.lock descriptor,再读取其 locator。
 * 不能只按包名或 installed tree 反推,否则同仓多版本时会静默选错 provider。
 */
function findLockEntry(lockText, name, directRange) {
  const descriptor = `${name}@npm:${directRange}`;
  const lines = lockText.split(/\r?\n/u);
  for (let start = 0; start < lines.length; start += 1) {
    const line = lines[start];
    if (!line || /^\s/u.test(line) || !line.endsWith(':')) continue;
    const header = parseYamlScalar(line.slice(0, -1));
    if (!header.split(', ').includes(descriptor)) continue;

    const entry = { descriptor };
    for (let index = start + 1; index < lines.length; index += 1) {
      const entryLine = lines[index];
      if (entryLine && !/^\s/u.test(entryLine)) break;
      const match = entryLine?.match(
        /^\s{2}(version|resolution|checksum):\s*(.*)$/u
      );
      if (match) entry[match[1]] = parseYamlScalar(match[2]);
    }
    return entry;
  }
  return null;
}

function directRangeFor(rootManifest, name) {
  const dependencyRange = rootManifest.dependencies?.[name];
  const devDependencyRange = rootManifest.devDependencies?.[name];
  if (
    dependencyRange !== undefined &&
    devDependencyRange !== undefined &&
    dependencyRange !== devDependencyRange
  ) {
    throw new Error(
      `${name} 在 dependencies / devDependencies 有冲突的 direct range。`
    );
  }
  const directRange = dependencyRange ?? devDependencyRange;
  if (typeof directRange !== 'string' || directRange.length === 0) {
    throw new Error(`${name} 缺少根 direct range,不能确定 lock descriptor。`);
  }
  return directRange;
}

function resolveLockedDependency(
  rootManifest,
  lockText,
  installedVersions,
  name,
  peerRange
) {
  const directRange = directRangeFor(rootManifest, name);
  const entry = findLockEntry(lockText, name, directRange);
  if (!entry) {
    throw new Error(
      `${name} 的 direct descriptor ${name}@npm:${directRange} 不在 yarn.lock。`
    );
  }
  if (!entry.checksum) {
    throw new Error(`${name} 的 lock locator 缺少 checksum。`);
  }
  if (!semver.valid(entry.version)) {
    throw new Error(
      `${name} 的 lock version "${entry.version}" 不是精确版本。`
    );
  }
  const expectedLocator = `${name}@npm:${entry.version}`;
  if (entry.resolution !== expectedLocator) {
    throw new Error(
      `${name} 的 lock locator 漂移:期望 ${expectedLocator},实际 ${entry.resolution}。`
    );
  }
  if (!semver.satisfies(entry.version, directRange)) {
    throw new Error(
      `${name}@${entry.version} 不满足根 direct range ${directRange}。`
    );
  }
  if (peerRange && !semver.satisfies(entry.version, peerRange)) {
    throw new Error(
      `${name}@${entry.version} 不满足根 peer range ${peerRange}。`
    );
  }
  const installedVersion = installedVersions[name];
  if (!installedVersion) {
    throw new Error(`${name} 缺少 installed provider。`);
  }
  if (installedVersion !== entry.version) {
    throw new Error(
      `${name} installed version ${installedVersion} 与 lock locator ${entry.version} 漂移。`
    );
  }
  return entry.version;
}

function assertNoDestinationArgument(argv) {
  if (argv.length > 0) {
    throw new Error(
      `create:runtime-harness 不接受目标目录参数(收到 ${argv.join(' ')})。目录由脚本在系统临时目录自持创建。`
    );
  }
}

/** 拒绝任何落在 legacy `example/` 里的路径 —— 该目录既不是来源也不是产物。 */
function assertOutsideExample(targetPath) {
  const normalized = path.normalize(targetPath).split(path.sep);
  if (normalized.includes('example')) {
    throw new Error(
      `harness 路径不得位于 example/ 之内(收到 ${targetPath})。legacy example shell 既不读也不写。`
    );
  }
}

function buildScaffoldArgs(templatePath, targetDirectory) {
  assertOutsideExample(targetDirectory);
  return [
    'init',
    APP_NAME,
    '--version',
    EXPECTED.reactNative,
    '--template',
    templatePath,
    '--pm',
    'yarn',
    '--directory',
    path.join(targetDirectory, APP_NAME),
    '--skip-install',
    '--skip-git-init',
  ];
}

const EXACT_VERSION = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u;

/**
 * 枚举根 peerDependencies 的每个非 optional key,解析出精确 provider 版本,
 * 连同本地 tarball 一起写进 harness manifest。缺任何一个 provider 都点名报错。
 */
function buildHarnessManifest(rootManifest, resolvedVersions, tarballPath) {
  const peers = rootManifest.peerDependencies ?? {};
  const meta = rootManifest.peerDependenciesMeta ?? {};
  const dependencies = {
    '@unif/react-native-design': `file:${tarballPath}`,
  };
  for (const peer of Object.keys(peers)) {
    if (meta[peer]?.optional) continue;
    const version = resolvedVersions[peer];
    if (!version) {
      throw new Error(
        `缺少 peer provider ${peer} 的精确版本 —— harness 必须完整提供根 peerDependencies 的每一项。`
      );
    }
    if (!EXACT_VERSION.test(version)) {
      throw new Error(
        `peer provider ${peer} 的版本 "${version}" 不是精确版本 —— harness 只接受锁定的具体版本。`
      );
    }
    dependencies[peer] = version;
  }
  const devDependencies = {};
  for (const name of TOOLCHAIN_PACKAGES) {
    const version = resolvedVersions[name];
    if (!version || !EXACT_VERSION.test(version)) {
      throw new Error(
        `Worklets toolchain ${name} 缺少 lock-derived 精确版本。`
      );
    }
    devDependencies[name] = version;
  }
  return { dependencies, devDependencies };
}

// ---------------------------------------------------------------------------
// 生成流程(带副作用,只在 main() 中执行)
// ---------------------------------------------------------------------------

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'inherit' });
}

function runYarn(args, cwd) {
  const yarn = path.join(REPO_ROOT, '.yarn/releases/yarn-4.11.0.cjs');
  run(process.execPath, [yarn, ...args], cwd);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function packageDir(name) {
  return path.dirname(require.resolve(`${name}/package.json`));
}

function resolveInstalledVersions(names, baseDirectory = REPO_ROOT) {
  const versions = {};
  for (const name of names) {
    try {
      const manifestPath = require.resolve(`${name}/package.json`, {
        paths: [baseDirectory],
      });
      versions[name] = readJson(manifestPath).version;
    } catch {
      // 缺失值由 resolveLockedDependency 统一按具体包名 fail-fast。
    }
  }
  return versions;
}

function resolveHarnessVersions(rootManifest, lockText, installedVersions) {
  const peers = rootManifest.peerDependencies ?? {};
  const meta = rootManifest.peerDependenciesMeta ?? {};
  const versions = {};
  for (const name of Object.keys(peers)) {
    if (meta[name]?.optional) continue;
    versions[name] = resolveLockedDependency(
      rootManifest,
      lockText,
      installedVersions,
      name,
      peers[name]
    );
  }
  for (const name of TOOLCHAIN_PACKAGES) {
    versions[name] = resolveLockedDependency(
      rootManifest,
      lockText,
      installedVersions,
      name
    );
  }
  return versions;
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function applyTemplateAppName(text) {
  return text
    .replaceAll('HelloWorld', APP_NAME)
    .replaceAll('helloworld', APP_NAME.toLowerCase());
}

function buildNativeTemplateSnapshot(templateFiles) {
  const snapshot = {};
  for (const file of NATIVE_TEMPLATE_FILES) {
    const text = templateFiles[file];
    if (typeof text !== 'string') {
      throw new Error(`installed template 缺少原生文件 ${file}。`);
    }
    snapshot[file] = sha256(applyTemplateAppName(text));
  }
  return snapshot;
}

function assertNativeTemplateSnapshot(snapshot, generatedFiles) {
  for (const file of NATIVE_TEMPLATE_FILES) {
    const generated = generatedFiles[file];
    if (typeof generated !== 'string') {
      throw new Error(`脚手架产物缺少原生文件 ${file}。`);
    }
    if (sha256(generated) !== snapshot[file]) {
      throw new Error(
        `${file} 与 installed RN ${EXPECTED.template} template 内容漂移。`
      );
    }
  }
}

function captureNativeTemplateSnapshot(templateDir) {
  const files = {};
  for (const file of NATIVE_TEMPLATE_FILES) {
    files[file] = fs.readFileSync(
      path.join(templateDir, 'template', file),
      'utf8'
    );
  }
  return buildNativeTemplateSnapshot(files);
}

function assertGeneratedNativeSnapshot(appDir, snapshot) {
  const files = {};
  for (const file of NATIVE_TEMPLATE_FILES) {
    files[file] = fs.readFileSync(path.join(appDir, file), 'utf8');
  }
  assertNativeTemplateSnapshot(snapshot, files);
}

function assertGeneratedApp(appDir) {
  for (const entry of [
    'package.json',
    'android',
    'ios',
    'babel.config.js',
    'metro.config.js',
  ]) {
    if (!fs.existsSync(path.join(appDir, entry))) {
      throw new Error(`脚手架产物缺少 ${entry} —— 拒绝继续。`);
    }
  }
  const generated = readJson(path.join(appDir, 'package.json'));
  assertExactVersion(
    '@react-native-community/cli(生成物)',
    generated.devDependencies?.['@react-native-community/cli'],
    EXPECTED.cli
  );
  return generated;
}

function installHarnessDependencies(appDir, yarnPath, seam = {}) {
  const execute = seam.execute ?? run;
  const exists = seam.exists ?? fs.existsSync;
  const nodePath = seam.nodePath ?? process.execPath;
  execute(nodePath, [yarnPath, 'install'], appDir);
  const lockPath = path.join(appDir, 'yarn.lock');
  if (!exists(lockPath)) {
    throw new Error(`首次 install 未生成临时 yarn.lock:${lockPath}`);
  }
  execute(nodePath, [yarnPath, 'install', '--immutable'], appDir);
}

function assertHarnessInstall(appDir, expectedVersions) {
  const manifest = readJson(path.join(appDir, 'package.json'));
  const lockText = fs.readFileSync(path.join(appDir, 'yarn.lock'), 'utf8');
  const names = Object.keys(expectedVersions);
  const installedVersions = resolveInstalledVersions(names, appDir);
  for (const name of names) {
    const lockedVersion = resolveLockedDependency(
      manifest,
      lockText,
      installedVersions,
      name
    );
    assertExactVersion(
      `${name}(harness install)`,
      lockedVersion,
      expectedVersions[name]
    );
  }
}

function assertOwnedTempParent(parent, tempRoot) {
  const resolvedParent = path.resolve(parent);
  const resolvedTempRoot = path.resolve(tempRoot);
  if (
    path.dirname(resolvedParent) !== resolvedTempRoot ||
    !path.basename(resolvedParent).startsWith(TEMP_PREFIX) ||
    path.basename(resolvedParent) === TEMP_PREFIX
  ) {
    throw new Error(`拒绝清理非 owned temp 路径:${parent}`);
  }
}

function runWithOwnedTempCleanup(parent, operation, seam = {}) {
  assertOwnedTempParent(parent, seam.tempRoot ?? os.tmpdir());
  try {
    assertOutsideExample(parent);
    return operation();
  } catch (error) {
    const remove = seam.remove ?? fs.rmSync;
    remove(parent, { recursive: true, force: true });
    throw error;
  }
}

function writeBabelConfig(appDir) {
  // worklets 插件必须排在 plugins 数组最后 —— 否则 worklet 转换看不到最终 AST。
  fs.writeFileSync(
    path.join(appDir, 'babel.config.js'),
    `module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['react-native-worklets/plugin'],
};
`
  );
}

function writeMetroConfig(appDir) {
  fs.writeFileSync(
    path.join(appDir, 'metro.config.js'),
    `const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = mergeConfig(getDefaultConfig(__dirname), {});
`
  );
}

function writeEntry(appDir) {
  // RNGH 要求 root import 排在最前,且用 GestureHandlerRootView 包住整棵树 ——
  // 验证屏自己已经挂了 RootView,这里只补 side-effect import。
  fs.writeFileSync(
    path.join(appDir, 'index.js'),
    `import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import { RuntimeApiScreen } from './RuntimeApiScreen';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => RuntimeApiScreen);
`
  );
}

function main() {
  assertNoDestinationArgument(process.argv.slice(2));

  const rootManifest = readJson(path.join(REPO_ROOT, 'package.json'));
  const lockText = fs.readFileSync(path.join(REPO_ROOT, 'yarn.lock'), 'utf8');
  const cliDir = packageDir('@react-native-community/cli');
  const templateDir = packageDir('@react-native-community/template');
  const bootstrapNames = [
    '@react-native-community/cli',
    '@react-native-community/template',
    ...Object.keys(rootManifest.peerDependencies ?? {}),
    ...TOOLCHAIN_PACKAGES,
  ];
  const installedVersions = resolveInstalledVersions(bootstrapNames);
  const cliVersion = resolveLockedDependency(
    rootManifest,
    lockText,
    installedVersions,
    '@react-native-community/cli'
  );
  const templateVersion = resolveLockedDependency(
    rootManifest,
    lockText,
    installedVersions,
    '@react-native-community/template'
  );
  assertExactVersion('@react-native-community/cli', cliVersion, EXPECTED.cli);
  assertExactVersion(
    '@react-native-community/template',
    templateVersion,
    EXPECTED.template
  );
  assertTemplateManifest(
    readJson(path.join(templateDir, 'template/package.json'))
  );
  const nativeTemplateSnapshot = captureNativeTemplateSnapshot(templateDir);
  const resolvedVersions = resolveHarnessVersions(
    rootManifest,
    lockText,
    installedVersions
  );

  const parent = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
  const appDir = path.join(parent, APP_NAME);
  runWithOwnedTempCleanup(parent, () => {
    console.log(`[harness] 打包当前源码…`);
    runYarn(['prepare'], REPO_ROOT);
    const tarball = path.join(parent, 'unif-react-native-design.tgz');
    runYarn(['pack', '--out', tarball], REPO_ROOT);

    console.log(
      `[harness] 用锁定的官方 template 生成 RN ${EXPECTED.reactNative} app…`
    );
    const cliBin = path.join(cliDir, 'build/bin.js');
    run(
      process.execPath,
      [cliBin, ...buildScaffoldArgs(templateDir, parent)],
      parent
    );

    const generatedManifest = assertGeneratedApp(appDir);
    assertGeneratedNativeSnapshot(appDir, nativeTemplateSnapshot);
    const harness = buildHarnessManifest(
      rootManifest,
      resolvedVersions,
      tarball
    );
    const finalManifest = {
      ...generatedManifest,
      dependencies: {
        ...generatedManifest.dependencies,
        ...harness.dependencies,
      },
      devDependencies: {
        ...generatedManifest.devDependencies,
        ...harness.devDependencies,
      },
    };
    fs.writeFileSync(
      path.join(appDir, 'package.json'),
      `${JSON.stringify(finalManifest, null, 2)}\n`
    );

    fs.copyFileSync(
      path.join(REPO_ROOT, '.yarn/releases/yarn-4.11.0.cjs'),
      path.join(appDir, 'yarn-4.11.0.cjs')
    );
    fs.writeFileSync(
      path.join(appDir, '.yarnrc.yml'),
      'nodeLinker: node-modules\nyarnPath: yarn-4.11.0.cjs\n'
    );
    writeBabelConfig(appDir);
    writeMetroConfig(appDir);
    fs.copyFileSync(
      path.join(REPO_ROOT, 'manual-tests/runtime-api/RuntimeApiScreen.tsx'),
      path.join(appDir, 'RuntimeApiScreen.tsx')
    );
    writeEntry(appDir);

    console.log('[harness] 生成临时 lockfile 并执行 immutable 复验…');
    installHarnessDependencies(appDir, path.join(appDir, 'yarn-4.11.0.cjs'));
    assertHarnessInstall(appDir, resolvedVersions);

    // 先装 Gemfile 里锁定的 CocoaPods —— 直接 `bundle exec pod install` 会用宿主机
    // 恰好装着的那个 pod(或者压根没有),生成物就不再由 template 的 Gemfile 决定了。
    console.log('[harness] bundle install…');
    run('bundle', ['install'], appDir);

    console.log('[harness] pod install…');
    run('bundle', ['exec', 'pod', 'install'], path.join(appDir, 'ios'));

    console.log('');
    console.log(`[harness] 生成完成:${appDir}`);
    console.log('[harness] 解析到的 provider 版本:');
    for (const [name, version] of Object.entries(resolvedVersions)) {
      console.log(`  ${name}@${version}`);
    }
    console.log('');
    console.log('后续在该目录中执行:');
    console.log('  yarn android');
    console.log('  yarn ios');
  });
}

module.exports = {
  EXPECTED,
  assertExactVersion,
  assertLockChecksums,
  assertNoDestinationArgument,
  assertNativeTemplateSnapshot,
  assertOutsideExample,
  assertTemplateManifest,
  buildHarnessManifest,
  buildNativeTemplateSnapshot,
  buildScaffoldArgs,
  findLockChecksum,
  installHarnessDependencies,
  resolveLockedDependency,
  runWithOwnedTempCleanup,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[create-runtime-api-harness] ${error.message}`);
    process.exitCode = 1;
  }
}
