#!/usr/bin/env node
'use strict';

// 发布面 gate:两个 Jest 入口必须同时出现在 exports 与 files,且 preset 可 require、
// 形状正确。漏任一项都会让消费者拿到一个 "Cannot find module" 的包。

const path = require('node:path');
const fs = require('node:fs');

const repositoryRoot = path.join(__dirname, '..');
const manifest = JSON.parse(
  fs.readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8')
);

const failures = [];
const entries = [
  ['./jest-setup', 'jest-setup.js'],
  ['./jest-preset', 'jest-preset.js'],
  // jest 解析 preset 说明符时会追加 /jest-preset,这条别名没了,消费者的
  // preset: '@unif/react-native-design/jest-preset' 直接 Validation Error。
  ['./jest-preset/jest-preset', 'jest-preset.js'],
];

for (const [subpath, file] of entries) {
  if (manifest.exports[subpath] !== `./${file}`) {
    failures.push(`exports["${subpath}"] 应为 "./${file}"`);
  }
  if (!manifest.files.includes(file)) {
    failures.push(`files 缺 "${file}"`);
  }
  if (!fs.existsSync(path.join(repositoryRoot, file))) {
    failures.push(`${file} 不存在`);
  }
}

if (!manifest.files.includes('jest-resolver.js')) {
  failures.push('files 缺 "jest-resolver.js"');
}
if (!fs.existsSync(path.join(repositoryRoot, 'jest-resolver.js'))) {
  failures.push('jest-resolver.js 不存在');
}

if (failures.length === 0) {
  const preset = require(path.join(repositoryRoot, 'jest-preset.js'));
  if (
    typeof preset.resolver !== 'string' ||
    !preset.resolver.endsWith('jest-resolver.js')
  ) {
    failures.push('jest-preset 的 resolver 必须指向本包 jest-resolver.js');
  }
  if (
    !Array.isArray(preset.setupFilesAfterEnv) ||
    !preset.setupFilesAfterEnv.some((entry) => entry.endsWith('jest-setup.js'))
  ) {
    failures.push('jest-preset 的 setupFilesAfterEnv 没指向 jest-setup.js');
  }
  if (
    !Array.isArray(preset.transformIgnorePatterns) ||
    !preset.transformIgnorePatterns[0].includes('@unif/react-native-design')
  ) {
    failures.push('jest-preset 的 transformIgnorePatterns 没放行本库');
  }
}

if (failures.length > 0) {
  process.stderr.write(
    `[check-jest-entries] ${failures.join('\n[check-jest-entries] ')}\n`
  );
  process.exit(1);
}

process.stdout.write('[check-jest-entries] jest 入口发布面 OK\n');
