'use strict';

/**
 * 组合两个上游 resolver —— 二者缺一都会静默坏掉一类场景:
 *
 * - RN 官方 resolver(`@react-native/jest-preset/jest/resolver.js`,该包无
 *   exports 字段,子路径 require 合法):临时剥掉 react-native 的 package
 *   exports,jest 才能解析 / mock 其深路径(如消费仓在 mock 的
 *   `react-native/Libraries/Utilities/Dimensions`)。
 * - worklets 官方 resolver(`react-native-worklets/jest/resolver`)的语义:
 *   对 worklets 相关请求过滤 .native.* extension,让 jest 走 web 实现,
 *   不触发 native init。
 * - Reanimated 4.6 的 native initializer 会注册 CSS event handler；Jest 使用
 *   JSReanimated，没有该 native-only 方法。只对它的 `./initializers` 请求过滤
 *   .native.*，其余 Reanimated Jest utilities 仍按官方 native 测试实现解析。
 *
 * jest 的 config `resolver` 是标量,直接写 worklets 的会把 RN 的顶掉,
 * 所以把 worklets 的 extension 过滤内联在这里,再委托给 RN 的 resolver。
 */

const reactNativeResolver = require('@react-native/jest-preset/jest/resolver.js');

module.exports = (request, options) => {
  const isReanimatedInitializer =
    options.basedir.includes('react-native-reanimated') &&
    request === './initializers';

  if (
    options.basedir.includes('react-native-worklets') ||
    request.includes('react-native-worklets') ||
    isReanimatedInitializer
  ) {
    options = {
      ...options,
      extensions: options.extensions?.filter((ext) => !ext.includes('native')),
    };
  }
  return reactNativeResolver(request, options);
};
