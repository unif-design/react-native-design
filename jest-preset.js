'use strict';

/**
 * `@unif/react-native-design/jest-preset` —— RN 官方 preset + 本库需要的
 * resolver / transform 放行清单 / setup 接线。消费者:
 *
 *   module.exports = { preset: '@unif/react-native-design/jest-preset' };
 *
 * 需要再放行别的包时,spread 本 preset 的 transformIgnorePatterns[0] 后自行追加。
 * 前提:消费者装有 @react-native/jest-preset(RN 应用测试的既有 devDependency)。
 */

const reactNativePreset = require('@react-native/jest-preset');

module.exports = {
  ...reactNativePreset,
  // 组合 resolver:worklets 的 .native.* 过滤 + RN 官方的 exports 剥离,见该文件注释。
  resolver: require.resolve('./jest-resolver.js'),
  setupFilesAfterEnv: [
    ...(reactNativePreset.setupFilesAfterEnv ?? []),
    require.resolve('./jest-setup.js'),
  ],
  // 本库与这些 peer 都发 ESM / TS 源码,RN preset 默认只放行
  // react-native / @react-native / @react-native-community 三个前缀。
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@unif/react-native-design|@sbaiahmed1/react-native-blur|react-native-(gesture-handler|reanimated|worklets|safe-area-context|svg|reanimated-carousel))/)',
  ],
};
