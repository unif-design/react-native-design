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
const { execFileSync } = require('node:child_process');

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

/** RN 0.86.2 template 必须留在生成物里的原生标记,缺失说明脚手架没按预期落盘。 */
const NATIVE_MARKERS = {
  'ios/Podfile': ['react_native_post_install', 'use_react_native!'],
  'android/settings.gradle': ['com.facebook.react.settings'],
  'android/build.gradle': ['com.facebook.react'],
};

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
  return { dependencies };
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

function resolveInstalledVersion(name) {
  try {
    return readJson(require.resolve(`${name}/package.json`)).version;
  } catch {
    return null;
  }
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
  for (const [file, markers] of Object.entries(NATIVE_MARKERS)) {
    const full = path.join(appDir, file);
    if (!fs.existsSync(full)) {
      throw new Error(`脚手架产物缺少原生文件 ${file} —— 拒绝继续。`);
    }
    const text = fs.readFileSync(full, 'utf8');
    for (const marker of markers) {
      if (!text.includes(marker)) {
        throw new Error(
          `${file} 缺少 RN ${EXPECTED.reactNative} template 标记 "${marker}" —— 生成物与锁定 template 不符。`
        );
      }
    }
  }
  return generated;
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

  const cliDir = packageDir('@react-native-community/cli');
  const templateDir = packageDir('@react-native-community/template');
  assertExactVersion(
    '@react-native-community/cli',
    readJson(path.join(cliDir, 'package.json')).version,
    EXPECTED.cli
  );
  assertExactVersion(
    '@react-native-community/template',
    readJson(path.join(templateDir, 'package.json')).version,
    EXPECTED.template
  );
  assertTemplateManifest(
    readJson(path.join(templateDir, 'template/package.json'))
  );
  assertLockChecksums(
    fs.readFileSync(path.join(REPO_ROOT, 'yarn.lock'), 'utf8'),
    [
      { name: '@react-native-community/cli', version: EXPECTED.cli },
      { name: '@react-native-community/template', version: EXPECTED.template },
    ]
  );

  const rootManifest = readJson(path.join(REPO_ROOT, 'package.json'));
  const resolvedVersions = {};
  for (const peer of Object.keys(rootManifest.peerDependencies ?? {})) {
    const version = resolveInstalledVersion(peer);
    if (version) resolvedVersions[peer] = version;
  }

  const parent = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_PREFIX));
  assertOutsideExample(parent);
  const appDir = path.join(parent, APP_NAME);
  let generated = false;
  try {
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
    generated = true;

    const generatedManifest = assertGeneratedApp(appDir);
    const harness = buildHarnessManifest(
      rootManifest,
      resolvedVersions,
      tarball
    );
    fs.writeFileSync(
      path.join(appDir, 'package.json'),
      `${JSON.stringify(
        {
          ...generatedManifest,
          dependencies: {
            ...generatedManifest.dependencies,
            ...harness.dependencies,
          },
        },
        null,
        2
      )}\n`
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

    console.log('[harness] 安装依赖…');
    run(
      process.execPath,
      [path.join(appDir, 'yarn-4.11.0.cjs'), 'install'],
      appDir
    );

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
  } catch (error) {
    // 只删自己刚建的那一个 temp 路径;生成失败才删,成功的产物要留给人工验收。
    if (!generated && parent.includes(TEMP_PREFIX)) {
      fs.rmSync(parent, { recursive: true, force: true });
    }
    throw error;
  }
}

module.exports = {
  EXPECTED,
  assertExactVersion,
  assertLockChecksums,
  assertNoDestinationArgument,
  assertOutsideExample,
  assertTemplateManifest,
  buildHarnessManifest,
  buildScaffoldArgs,
  findLockChecksum,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[create-runtime-api-harness] ${error.message}`);
    process.exitCode = 1;
  }
}
