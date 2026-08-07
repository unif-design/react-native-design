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
 *
 * 下面那段 try/catch 就是为了不让「漏装 @react-native/jest-preset」也塌进同一句报错:
 * jest-config 捕获 preset 模块抛出的 MODULE_NOT_FOUND 后,只判 error.message 里有没有
 * preset 路径,而 Node 的 Require stack 恰好带着本文件路径 —— 裸 require 的真因
 * (`Cannot find module '@react-native/jest-preset'`)会被换成上面那句畸形 Validation
 * Error。改抛一个不带 MODULE_NOT_FOUND code 的错误,jest-config 就走
 * `An unknown error occurred in <path>: <message>` 分支,下面这句话原样透出。
 * 于是两个成因彻底分开:漏装有专属报错,Validation Error 只剩别名缺失一个成因。
 */

let reactNativePreset;
try {
  reactNativePreset = require('@react-native/jest-preset');
} catch (error) {
  // 只认「@react-native/jest-preset 自己没装」这一种 MODULE_NOT_FOUND:它装了但内部
  // 依赖断裂时抛的也是这个 code,那时报「需要自行安装」是误诊,会把人引向装了又装。
  // Node 的 MODULE_NOT_FOUND 正文首行是 `Cannot find module '<说明符>'`,带引号的模块名
  // 就是判据 —— 后面的 Require stack 只有裸路径,不会误命中。
  if (
    error &&
    error.code === 'MODULE_NOT_FOUND' &&
    String(error.message).includes("'@react-native/jest-preset'")
  ) {
    throw new Error(
      '@unif/react-native-design/jest-preset 需要宿主工程自行安装 @react-native/jest-preset' +
        '(它不是本包的依赖):yarn add -D @react-native/jest-preset'
    );
  }
  throw error;
}

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
