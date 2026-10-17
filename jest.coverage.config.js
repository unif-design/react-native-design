'use strict';

const path = require('node:path');
const exampleConfig = require('./example/jest.config');

// 在仓根执行两层测试，Babel 才能为 example 目录外的真实库源码插桩。
module.exports = {
  ...exampleConfig,
  rootDir: __dirname,
  testEnvironment: 'node',
  watchman: false,
  testMatch: [
    '<rootDir>/__tests__/**/*.test.[jt]s?(x)',
    '<rootDir>/example/src/__tests__/**/*.test.[jt]s?(x)',
  ],
  moduleNameMapper: Object.fromEntries(
    Object.entries(exampleConfig.moduleNameMapper).map(([pattern, target]) => [
      pattern,
      target.replace('<rootDir>', path.join(__dirname, 'example')),
    ])
  ),
  setupFilesAfterEnv: [path.join(__dirname, 'example/jest.setup.ts')],
  reporters: ['default'],
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    'example/src/**/*.{js,ts,tsx}',
    '!example/src/__tests__/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json', 'json-summary', 'text-summary', 'lcov'],
  coverageThreshold: {
    './src/': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './example/src/': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
