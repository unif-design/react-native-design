import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const require = createRequire(import.meta.url);
const preset = require(path.join(repositoryRoot, 'jest-preset.js'));

// jest 的默认 moduleFileExtensions,Node 的 require.resolve 只认其中的
// js/mjs/cjs/json/node。差集不是学术问题:safe-area 的官方 mock 就是
// `jest/mock.tsx`(RNGH 的 jestSetup 与 worklets 的 mock 则是 .js)。
// 只用 Node 语义探测会把一条真实可用的接线判成红,所以按 jest 的扩展名
// 集合补探一轮 —— 探到的是同一个物理文件,不放宽任何东西。
const JEST_MODULE_FILE_EXTENSIONS = [
  'js',
  'mjs',
  'cjs',
  'jsx',
  'ts',
  'mts',
  'cts',
  'tsx',
  'json',
  'node',
];

/** jest-setup.js 里 require / jest.mock 到的 4 个 peer 入口,与该文件逐条对应。 */
const SETUP_PEER_SPECIFIERS = [
  'react-native-gesture-handler/jestSetup',
  'react-native-worklets/lib/module/mock',
  'react-native-safe-area-context/jest/mock',
  'react-native-reanimated',
];

function resolveWithJestExtensions(specifier) {
  for (const suffix of [
    '',
    ...JEST_MODULE_FILE_EXTENSIONS.map((extension) => `.${extension}`),
  ]) {
    try {
      return require.resolve(`${specifier}${suffix}`, {
        paths: [repositoryRoot],
      });
    } catch (error) {
      if (error.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
    }
  }
  return null;
}

test('preset 引用的三个文件都真实存在', () => {
  assert.ok(existsSync(preset.resolver), `resolver 不存在:${preset.resolver}`);
  for (const entry of preset.setupFilesAfterEnv) {
    assert.ok(existsSync(entry), `setup 不存在:${entry}`);
  }
});

test('setup 里 require 的 peer 入口都真实存在', () => {
  for (const specifier of SETUP_PEER_SPECIFIERS) {
    const resolved = resolveWithJestExtensions(specifier);
    assert.ok(resolved, `解析不到 ${specifier}`);
    assert.ok(existsSync(resolved), `解析到了不存在的文件:${resolved}`);
  }
});

test('需要编译才能 require 的 peer 入口都在 transform 放行面内', () => {
  // safe-area 的 mock 是 TS 源码:消费者能 require 它,完全依赖 preset 的
  // transformIgnorePatterns 把 safe-area-context 排除在「不转译」之外。
  // 哪天有人从那条正则里删掉这个包名,setup 会在真实消费者侧直接语法错误 ——
  // 这条断言就是那层隐性耦合的保护。
  const transformIgnore = new RegExp(preset.transformIgnorePatterns[0]);
  for (const specifier of SETUP_PEER_SPECIFIERS) {
    const resolved = resolveWithJestExtensions(specifier);
    // 先钉住解析成功:漏了这条,resolved === null 会被正则当成 "null" 字符串
    // 测出「没被挡」,一条解析不到的接线反而假绿。
    assert.ok(resolved, `解析不到 ${specifier}`);
    assert.ok(
      !transformIgnore.test(resolved),
      `${specifier} 被 transformIgnorePatterns 挡在转译外:${resolved}`
    );
  }
});
