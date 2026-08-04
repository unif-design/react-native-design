'use strict';

const path = require('node:path');
const { realpathSync } = require('node:fs');

const ATTESTATION_ENV = 'EXAMPLE_SHOWCASE_JEST_ATTESTATION';
const REQUIRED_OWNER_TEST_FILES = Object.freeze([
  'src/__tests__/App.test.tsx',
  'src/__tests__/FoundationScene.test.tsx',
  'src/__tests__/ActionsScene.test.tsx',
  'src/__tests__/FeedbackScene.test.tsx',
  'src/__tests__/FormsScene.test.tsx',
  'src/__tests__/NavigationScene.test.tsx',
  'src/__tests__/CollectionsScene.test.tsx',
  'src/__tests__/MediaScene.test.tsx',
  'src/__tests__/BusinessScene.test.tsx',
]);

function configError(message) {
  return new Error(`JEST_ATTESTATION_CONFIG: ${message}`);
}

function canonicalPath(value, label) {
  try {
    return realpathSync(value);
  } catch (error) {
    throw configError(`${label} 无法解析真实路径：${String(error)}`);
  }
}

function assertWithinRoot(rootDir, testPath, label) {
  const relative = path.relative(rootDir, testPath);
  if (
    relative === '..' ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw configError(`${label} 必须位于 canonical reporter rootDir`);
  }
}

function canonicalizePaths(testPaths, rootDir, label) {
  const canonicalPaths = testPaths.map((testPath) => {
    const canonicalTestPath = canonicalPath(testPath, label);
    assertWithinRoot(rootDir, canonicalTestPath, label);
    return canonicalTestPath;
  });
  if (new Set(canonicalPaths).size !== canonicalPaths.length) {
    throw configError(`${label} canonical paths 必须唯一`);
  }
  return canonicalPaths;
}

function samePathSet(left, right) {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((testPath) => rightSet.has(testPath));
}

function deriveForcedAuthority(globalConfig) {
  if (
    !globalConfig ||
    typeof globalConfig !== 'object' ||
    globalConfig.runTestsByPath !== true ||
    globalConfig.testFailureExitCode !== 1 ||
    !Array.isArray(globalConfig.nonFlagArgs) ||
    globalConfig.nonFlagArgs.length === 0 ||
    globalConfig.nonFlagArgs.some(
      (testPath) => typeof testPath !== 'string' || !path.isAbsolute(testPath)
    ) ||
    new Set(globalConfig.nonFlagArgs).size !== globalConfig.nonFlagArgs.length
  ) {
    throw configError(
      'Jest globalConfig 必须保留 runTestsByPath=true、testFailureExitCode=1 与唯一 absolute positional test paths'
    );
  }

  const rootDir = canonicalPath(__dirname, 'canonical reporter rootDir');
  const expectedTestPaths = canonicalizePaths(
    globalConfig.nonFlagArgs,
    rootDir,
    'forced positional test path'
  );
  const requiredTestPaths = canonicalizePaths(
    REQUIRED_OWNER_TEST_FILES.map((relativePath) =>
      path.join(rootDir, relativePath)
    ),
    rootDir,
    'canonical governed owner suite'
  );
  return {
    expectedTestPaths,
    expectedTestPathSet: new Set(expectedTestPaths),
    requiredTestPaths,
    rootDir,
  };
}

function validateMutableAttestation(authority) {
  const raw = process.env[ATTESTATION_ENV];
  if (!raw) {
    throw configError(
      'production reporter 缺少 wrapper attestation cross-check'
    );
  }
  let value;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw configError(`wrapper attestation JSON 非法：${String(error)}`);
  }
  if (
    !value ||
    typeof value !== 'object' ||
    typeof value.rootDir !== 'string' ||
    !path.isAbsolute(value.rootDir) ||
    !Array.isArray(value.requiredTestPaths) ||
    value.requiredTestPaths.length !== REQUIRED_OWNER_TEST_FILES.length ||
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
    throw configError('wrapper attestation cross-check 形状非法');
  }

  const rootDir = canonicalPath(value.rootDir, 'attested rootDir');
  const requiredTestPaths = canonicalizePaths(
    value.requiredTestPaths,
    rootDir,
    'attested governed owner suite'
  );
  const expectedTestPaths = canonicalizePaths(
    value.expectedTestPaths,
    rootDir,
    'attested expected test path'
  );
  if (
    rootDir !== authority.rootDir ||
    !samePathSet(expectedTestPaths, authority.expectedTestPaths) ||
    !samePathSet(requiredTestPaths, authority.requiredTestPaths)
  ) {
    throw configError(
      'mutable wrapper attestation 与 forced globalConfig authority 不一致'
    );
  }
}

class ForbidOnlyReporter {
  constructor(globalConfig) {
    this.completedTestPaths = new Set();
    this.failures = [];
    try {
      this.authority = deriveForcedAuthority(globalConfig);
    } catch (error) {
      this.recordFailure(
        error instanceof Error ? error.message : String(error)
      );
      return;
    }
    try {
      validateMutableAttestation(this.authority);
    } catch (error) {
      this.recordFailure(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  recordFailure(message, writeDiagnostic = true) {
    if (!this.failures.includes(message)) {
      this.failures.push(message);
      if (writeDiagnostic) {
        process.stderr.write(`[showcaseAttestation] ${message}\n`);
      }
    }
    this.error = new Error(this.failures.join('\n'));
    process.exitCode = 1;
  }

  onTestResult(test) {
    if (test && typeof test.path === 'string') {
      try {
        this.completedTestPaths.add(realpathSync(test.path));
      } catch (error) {
        this.recordFailure(
          `JEST_ATTESTATION_CONFIG: completed test path 无法解析真实路径：${String(error)}`
        );
      }
    }
  }

  onRunComplete(_contexts, results) {
    const skipped = results.numPendingTests ?? 0;
    const todo = results.numTodoTests ?? 0;
    if (skipped > 0 || todo > 0) {
      const message = `[forbidOnly] example Jest 禁止 focused/skipped/todo tests：skipped=${skipped} todo=${todo}`;
      process.stderr.write(`${message}\n`);
      this.recordFailure(message, false);
    }
    if (!this.authority) return;

    const missingExpected = this.authority.expectedTestPaths.filter(
      (testPath) => !this.completedTestPaths.has(testPath)
    );
    const unexpectedCompleted = [...this.completedTestPaths].filter(
      (testPath) => !this.authority.expectedTestPathSet.has(testPath)
    );
    if (missingExpected.length > 0 || unexpectedCompleted.length > 0) {
      const message = `[showcaseExecution] JEST_EXECUTION_SET_COMPLETED missing=${missingExpected.join(',') || 'none'} unexpected=${unexpectedCompleted.join(',') || 'none'}`;
      process.stderr.write(`${message}\n`);
      this.recordFailure(message, false);
    } else {
      process.stderr.write(
        `[showcaseExecution] JEST_EXECUTION_SET_COMPLETED count=${this.authority.expectedTestPaths.length}\n`
      );
    }

    const missingOwners = this.authority.requiredTestPaths.filter(
      (testPath) => !this.completedTestPaths.has(testPath)
    );
    if (missingOwners.length > 0) {
      const message = `[showcaseOwners] JEST_GOVERNED_SUITES_COMPLETED missing=${missingOwners.join(',')}`;
      process.stderr.write(`${message}\n`);
      this.recordFailure(message, false);
    } else {
      process.stderr.write(
        `[showcaseOwners] JEST_GOVERNED_SUITES_COMPLETED count=${this.authority.requiredTestPaths.length}\n`
      );
    }
  }

  getLastError() {
    return this.error;
  }
}

module.exports = ForbidOnlyReporter;
