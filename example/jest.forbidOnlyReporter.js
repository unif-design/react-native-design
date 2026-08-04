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
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `JEST_ATTESTATION_CONFIG: production reporter attestation JSON 非法：${String(error)}`
    );
  }
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
    new Set(value.requiredTestPaths).size !== value.requiredTestPaths.length ||
    !Array.isArray(value.expectedTestPaths) ||
    value.expectedTestPaths.some(
      (testPath) => typeof testPath !== 'string' || !path.isAbsolute(testPath)
    ) ||
    new Set(value.expectedTestPaths).size !== value.expectedTestPaths.length
  ) {
    throw new Error(
      'JEST_ATTESTATION_CONFIG: production reporter attestation 形状非法'
    );
  }
  let rootDir;
  try {
    rootDir = realpathSync(value.rootDir);
  } catch (error) {
    throw new Error(
      `JEST_ATTESTATION_CONFIG: attested rootDir 无法解析真实路径：${String(error)}`
    );
  }
  const canonicalizeAttestedPaths = (testPaths, label) =>
    testPaths.map((testPath) => {
      let canonicalTestPath;
      try {
        canonicalTestPath = realpathSync(testPath);
      } catch (error) {
        throw new Error(
          `JEST_ATTESTATION_CONFIG: ${label} 无法解析真实路径：${String(error)}`
        );
      }
      const relative = path.relative(rootDir, canonicalTestPath);
      if (
        relative === '..' ||
        relative.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relative)
      ) {
        throw new Error(
          'JEST_ATTESTATION_CONFIG: attested test path 必须位于 attested rootDir'
        );
      }
      return canonicalTestPath;
    });
  const requiredTestPaths = canonicalizeAttestedPaths(
    value.requiredTestPaths,
    'governed owner suite'
  );
  const expectedTestPaths = canonicalizeAttestedPaths(
    value.expectedTestPaths,
    'expected test path'
  );
  if (
    new Set(requiredTestPaths).size !== requiredTestPaths.length ||
    new Set(expectedTestPaths).size !== expectedTestPaths.length
  ) {
    throw new Error(
      'JEST_ATTESTATION_CONFIG: canonical attested test paths 必须唯一'
    );
  }
  const expectedTestPathSet = new Set(expectedTestPaths);
  if (
    requiredTestPaths.some((testPath) => !expectedTestPathSet.has(testPath))
  ) {
    throw new Error(
      'JEST_ATTESTATION_CONFIG: every governed owner suite 必须属于 expected test set'
    );
  }
  return { expectedTestPaths, expectedTestPathSet, requiredTestPaths };
}

class ForbidOnlyReporter {
  constructor() {
    this.completedTestPaths = new Set();
    try {
      this.attestation = parseAttestation();
    } catch (error) {
      this.error = error instanceof Error ? error : new Error(String(error));
      process.stderr.write(`[showcaseAttestation] ${this.error.message}\n`);
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
    const failures = [];
    if (skipped > 0 || todo > 0) {
      const message = `[forbidOnly] example Jest 禁止 focused/skipped/todo tests：skipped=${skipped} todo=${todo}`;
      process.stderr.write(`${message}\n`);
      failures.push(message);
    }
    if (!this.attestation) {
      if (failures.length > 0 && !this.error) {
        this.error = new Error(failures.join('\n'));
      }
      return;
    }

    const missingExpected = this.attestation.expectedTestPaths.filter(
      (testPath) => !this.completedTestPaths.has(testPath)
    );
    const unexpectedCompleted = [...this.completedTestPaths].filter(
      (testPath) => !this.attestation.expectedTestPathSet.has(testPath)
    );
    if (missingExpected.length > 0 || unexpectedCompleted.length > 0) {
      const message = `[showcaseExecution] JEST_EXECUTION_SET_COMPLETED missing=${missingExpected.join(',') || 'none'} unexpected=${unexpectedCompleted.join(',') || 'none'}`;
      process.stderr.write(`${message}\n`);
      failures.push(message);
    } else {
      process.stderr.write(
        `[showcaseExecution] JEST_EXECUTION_SET_COMPLETED count=${this.attestation.expectedTestPaths.length}\n`
      );
    }

    const missingOwners = this.attestation.requiredTestPaths.filter(
      (testPath) => !this.completedTestPaths.has(testPath)
    );
    if (missingOwners.length > 0) {
      const message = `[showcaseOwners] JEST_GOVERNED_SUITES_COMPLETED missing=${missingOwners.join(',')}`;
      process.stderr.write(`${message}\n`);
      failures.push(message);
    } else {
      process.stderr.write(
        `[showcaseOwners] JEST_GOVERNED_SUITES_COMPLETED count=${this.attestation.requiredTestPaths.length}\n`
      );
    }
    if (failures.length > 0) {
      this.error = new Error(failures.join('\n'));
    }
  }

  getLastError() {
    return this.error;
  }
}

module.exports = ForbidOnlyReporter;
