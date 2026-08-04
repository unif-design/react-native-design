'use strict';

const path = require('node:path');
const { realpathSync } = require('node:fs');

const ATTESTATION_ENV = 'EXAMPLE_SHOWCASE_JEST_ATTESTATION';

function parseAttestation() {
  const raw = process.env[ATTESTATION_ENV];
  if (!raw) {
    throw new Error(
      'JEST_ATTESTATION_CONFIG: production reporter 缺少 wrapper attestation'
    );
  }
  const value = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.rootDir !== 'string' ||
    !path.isAbsolute(value.rootDir) ||
    !Array.isArray(value.requiredTestPaths) ||
    value.requiredTestPaths.length !== 9 ||
    value.requiredTestPaths.some(
      (testPath) => typeof testPath !== 'string' || !path.isAbsolute(testPath)
    ) ||
    new Set(value.requiredTestPaths).size !== value.requiredTestPaths.length
  ) {
    throw new Error(
      'JEST_ATTESTATION_CONFIG: production reporter attestation 形状非法'
    );
  }
  const declaredRootDir = path.resolve(value.rootDir);
  const rootDir = realpathSync(declaredRootDir);
  const requiredTestPaths = value.requiredTestPaths.map((testPath) =>
    path.resolve(
      rootDir,
      path.relative(declaredRootDir, path.resolve(testPath))
    )
  );
  if (
    requiredTestPaths.some((testPath) => {
      const relative = path.relative(rootDir, testPath);
      return (
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      );
    })
  ) {
    throw new Error(
      'JEST_ATTESTATION_CONFIG: governed owner suite 必须位于 attested rootDir'
    );
  }
  return { requiredTestPaths };
}

class ForbidOnlyReporter {
  constructor() {
    this.completedTestPaths = new Set();
    try {
      this.attestation = parseAttestation();
    } catch (error) {
      this.error = error instanceof Error ? error : new Error(String(error));
    }
  }

  onTestResult(test) {
    if (test && typeof test.path === 'string') {
      this.completedTestPaths.add(realpathSync(test.path));
    }
  }

  onRunComplete(_contexts, results) {
    const skipped = results.numPendingTests ?? 0;
    const todo = results.numTodoTests ?? 0;
    if (skipped > 0 || todo > 0) {
      const message = `[forbidOnly] example Jest 禁止 focused/skipped/todo tests：skipped=${skipped} todo=${todo}`;
      process.stderr.write(`${message}\n`);
      this.error = new Error(message);
      return;
    }
    if (!this.attestation) return;

    const missing = this.attestation.requiredTestPaths.filter(
      (testPath) => !this.completedTestPaths.has(testPath)
    );
    if (missing.length > 0) {
      const message = `[showcaseOwners] JEST_GOVERNED_SUITES_COMPLETED missing=${missing.join(',')}`;
      process.stderr.write(`${message}\n`);
      this.error = new Error(message);
      return;
    }
    process.stderr.write(
      `[showcaseOwners] JEST_GOVERNED_SUITES_COMPLETED count=${this.attestation.requiredTestPaths.length}\n`
    );
  }

  getLastError() {
    return this.error;
  }
}

module.exports = ForbidOnlyReporter;
