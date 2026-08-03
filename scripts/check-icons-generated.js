#!/usr/bin/env node
/**
 * 在两个独立临时目录运行真实图标生成器，并逐字节比较两份结果与仓库生成物。
 * 该检查绝不把生成结果写回工作区。
 */
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD_SCRIPT = path.join(__dirname, 'build-icons.js');
const COMMITTED_DATA = path.join(ROOT, 'src/icons/data.ts');
const temporaryDirectories = [];

const sha256 = (bytes) =>
  crypto.createHash('sha256').update(bytes).digest('hex');

const createOwnedDirectory = (label) => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), `react-native-design-icons-${label}-`)
  );
  temporaryDirectories.push(directory);
  return directory;
};

const runBuild = (directory) => {
  const output = path.join(directory, 'data.ts');
  const result = spawnSync(process.execPath, [BUILD_SCRIPT], {
    cwd: ROOT,
    env: {
      ...process.env,
      BUILD_ICONS_OUT: output,
      BUILD_ICONS_SVG_DIR: path.join(ROOT, 'src/icons/svg'),
    },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(
      `临时图标生成失败（exit ${String(result.status)}）: ${directory}`
    );
  }
  return fs.readFileSync(output);
};

let failed = false;
try {
  const first = runBuild(createOwnedDirectory('a'));
  const second = runBuild(createOwnedDirectory('b'));
  const committed = fs.readFileSync(COMMITTED_DATA);

  if (!first.equals(second) || !first.equals(committed)) {
    console.error('check:icons 失败：临时生成物与仓库生成物不一致。');
    console.error(`temp A    ${sha256(first)}`);
    console.error(`temp B    ${sha256(second)}`);
    console.error(`committed ${sha256(committed)}`);
    failed = true;
  } else {
    console.log(`check:icons: icon data reproducible (${sha256(committed)})`);
  }
} catch (error) {
  console.error(error);
  failed = true;
} finally {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

if (failed) process.exitCode = 1;
