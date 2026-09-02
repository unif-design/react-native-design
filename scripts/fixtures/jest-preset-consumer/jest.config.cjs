'use strict';

const path = require('node:path');

const repositoryRoot = path.resolve(__dirname, '../../..');

module.exports = {
  preset: path.join(repositoryRoot, 'jest-preset.js'),
  rootDir: repositoryRoot,
  testMatch: [
    '<rootDir>/scripts/fixtures/jest-preset-consumer/make-mutable.consumer.js',
  ],
  // RN 0.86 的 preset 仍内置 Jest 29 environment；真实消费仓与本仓一样
  // 用自己的 Jest 30 environment 覆盖它，避免把版本错配混进 setup 行为测试。
  testEnvironment: require.resolve('jest-environment-node', {
    paths: [repositoryRoot],
  }),
};
