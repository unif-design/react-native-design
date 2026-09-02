import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const require = createRequire(import.meta.url);
const manifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
);

test('两个 jest 入口都进了 exports 与 files', () => {
  assert.equal(manifest.exports['./jest-setup'], './jest-setup.js');
  assert.equal(manifest.exports['./jest-preset'], './jest-preset.js');
  // jest 会给非相对的 preset 说明符无条件追加 `/jest-preset`,少了这条别名,
  // 文档化的 `preset: '@unif/react-native-design/jest-preset'` 直接 Validation Error。
  assert.equal(
    manifest.exports['./jest-preset/jest-preset'],
    './jest-preset.js'
  );
  assert.ok(manifest.files.includes('jest-setup.js'));
  assert.ok(manifest.files.includes('jest-preset.js'));
});

test('preset 可 require 且形状正确', () => {
  const preset = require(path.join(repositoryRoot, 'jest-preset.js'));
  // resolver 必须是本包的组合文件 —— 直接写 worklets 的 resolver 会把
  // RN preset 自带的 resolver(剥 react-native exports,深路径 mock 依赖它)顶掉。
  assert.ok(preset.resolver.endsWith('jest-resolver.js'));
  assert.ok(
    preset.setupFilesAfterEnv.some((entry) => entry.endsWith('jest-setup.js'))
  );
  assert.equal(preset.transformIgnorePatterns.length, 1);
  // 注意断言的是 pattern 里**字面出现**的片段:gesture-handler / reanimated 等
  // 在正则里位于 `react-native-(gesture-handler|…)` 交替组内,完整包名不会
  // 字面出现,不要断言完整包名。
  for (const fragment of [
    '@unif/react-native-design',
    '@sbaiahmed1/react-native-blur',
    'gesture-handler',
    'reanimated',
    'worklets',
    'safe-area-context',
    'svg',
    'reanimated-carousel',
  ]) {
    assert.ok(
      preset.transformIgnorePatterns[0].includes(fragment),
      `transformIgnorePatterns 少了 ${fragment}`
    );
  }
});

// 在临时目录里放一份 jest-preset.js 的副本 + 自建 node_modules,再从那份副本 require:
// Node 从文件自身位置向上找 node_modules,所以本仓装着的 @react-native/jest-preset 不会
// 参与解析 —— 不用改环境变量、不用子进程,也就没有 flaky 面。
function withPresetSandbox(populate, run) {
  const sandbox = mkdtempSync(
    path.join(os.tmpdir(), 'react-native-design-jest-preset-')
  );
  try {
    copyFileSync(
      path.join(repositoryRoot, 'jest-preset.js'),
      path.join(sandbox, 'jest-preset.js')
    );
    mkdirSync(path.join(sandbox, 'node_modules'), { recursive: true });
    populate(sandbox);
    const requireFromSandbox = createRequire(
      path.join(sandbox, 'noop-require-base.js')
    );
    return run(() => requireFromSandbox(path.join(sandbox, 'jest-preset.js')));
  } finally {
    rmSync(sandbox, { recursive: true, force: true });
  }
}

test('漏装 @react-native/jest-preset 时抛可执行的自有报错', () => {
  withPresetSandbox(
    () => {},
    (requirePreset) => {
      assert.throws(requirePreset, (error) => {
        assert.ok(
          error.message.includes('需要宿主工程自行安装'),
          `实际报错:${error.message}`
        );
        // 必须不带 MODULE_NOT_FOUND —— 带着就会被 jest-config 归进
        // 「preset 模块畸形」的 Validation Error,自有报错原文永远露不出来。
        assert.notEqual(error.code, 'MODULE_NOT_FOUND');
        return true;
      });
    }
  );
});

test('@react-native/jest-preset 内部依赖断裂时原样 rethrow,不误诊成漏装', () => {
  withPresetSandbox(
    (sandbox) => {
      const fake = path.join(sandbox, 'node_modules/@react-native/jest-preset');
      mkdirSync(fake, { recursive: true });
      writeFileSync(
        path.join(fake, 'package.json'),
        JSON.stringify({
          name: '@react-native/jest-preset',
          version: '0.0.0-fixture',
          main: 'index.js',
        })
      );
      // 装是装了,只是它自己的某个依赖不在 —— 同样是 MODULE_NOT_FOUND。
      writeFileSync(
        path.join(fake, 'index.js'),
        "require('broken-internal-dep-fixture');\n"
      );
    },
    (requirePreset) => {
      assert.throws(requirePreset, (error) => {
        assert.equal(error.code, 'MODULE_NOT_FOUND');
        assert.ok(error.message.includes('broken-internal-dep-fixture'));
        assert.ok(
          !error.message.includes('需要宿主工程自行安装'),
          '装了但内部依赖断裂不得被报成漏装'
        );
        return true;
      });
    }
  );
});

test('resolver 组合 RN / worklets，并让 Reanimated 4.6 Jest 避开 native 初始化器', () => {
  const source = readFileSync(
    path.join(repositoryRoot, 'jest-resolver.js'),
    'utf8'
  );
  assert.ok(source.includes('@react-native/jest-preset/jest/resolver'));
  assert.ok(source.includes('react-native-worklets'));
  assert.ok(source.includes('react-native-reanimated'));
  assert.ok(source.includes("request === './initializers'"));
});

test('setup 是 CJS 且只接线 design 自己的 peer', () => {
  const source = readFileSync(
    path.join(repositoryRoot, 'jest-setup.js'),
    'utf8'
  );
  assert.ok(!/^\s*import\s/mu.test(source), 'setup 必须是 CJS');
  assert.ok(!source.includes('../src'), 'setup 不得依赖库运行时代码');
  for (const peer of [
    'react-native-gesture-handler/jestSetup',
    'react-native-worklets',
    'react-native-safe-area-context/jest/mock',
    'react-native-reanimated',
  ]) {
    assert.ok(source.includes(peer), `setup 少了 ${peer}`);
  }
  for (const foreign of [
    'react-native-keyboard-controller',
    'react-native-device-info',
    '@react-native-community/netinfo',
  ]) {
    assert.ok(!source.includes(foreign), `setup 不该碰 ${foreign}`);
  }
});
