'use strict';

/**
 * `@unif/react-native-design/jest-preset` —— RN 官方 preset + 本库需要的
 * resolver / transform 放行清单 / setup 接线。消费者:
 *
 *   module.exports = { preset: '@unif/react-native-design/jest-preset' };
 *
 * 需要再放行别的包时,spread 本 preset 的 transformIgnorePatterns[0] 后自行追加。
 * 前提:消费者装有 @react-native/jest-preset(RN 应用测试的既有 devDependency)。
 *
 * 注意 package.json#exports 里那条看着重复的 `"./jest-preset/jest-preset"` 别名:
 * jest 解析 `preset` 时只豁免以 `.` 开头(部分版本另豁免绝对路径)的说明符,其余
 * 一律拼上 `/jest-preset`(jest-config normalize.js 的 `PRESET_NAME`)。所以上面那行
 * 文档化用法实际要解析的是 `@unif/react-native-design/jest-preset/jest-preset`。
 * 删掉别名,消费者会直接吃到
 * `Validation Error: Module ... should have "jest-preset.js" or "jest-preset.json" file at the root.`
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
