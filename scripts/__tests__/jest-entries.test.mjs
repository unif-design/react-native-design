import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
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

test('resolver 组合了 RN 与 worklets 两个上游', () => {
  const source = readFileSync(
    path.join(repositoryRoot, 'jest-resolver.js'),
    'utf8'
  );
  assert.ok(source.includes('@react-native/jest-preset/jest/resolver'));
  assert.ok(source.includes('react-native-worklets'));
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
