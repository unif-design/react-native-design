import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
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

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDir, '../..');

test('正式 verifier 不受环境变量过滤并拒绝损坏的 manifest', () => {
  const fixture = mkdtempSync(
    path.join(os.tmpdir(), 'react-native-design-verifier-')
  );
  try {
    mkdirSync(path.join(fixture, 'example'), { recursive: true });
    copyFileSync(
      path.join(repositoryRoot, 'package.json'),
      path.join(fixture, 'package.json')
    );
    const manifestPath = path.join(fixture, 'example/package.json');
    copyFileSync(
      path.join(repositoryRoot, 'example/package.json'),
      manifestPath
    );
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.dependencies['react-native-safe-area-context'] = '5.7.0';
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const env = {
      ...process.env,
      EXAMPLE_SHOWCASE_TEST_NAME_PATTERN: '绝不会匹配任何 contract',
    };
    delete env.NODE_TEST_CONTEXT;
    const result = spawnSync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts/verify-example-showcase.mjs'),
        fixture,
      ],
      {
        cwd: repositoryRoot,
        encoding: 'utf8',
        env,
      }
    );
    const output = `${result.stdout}\n${result.stderr}`;

    assert.equal(result.status, 1, output);
    assert.match(output, /5\.7\.0/u);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
