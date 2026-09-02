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
 * - Reanimated 4.6 的 native initializer / mapper / mutable 分别会注册
 *   native-only CSS handler、调用原生调度函数、创建原生 shareable。Jest 使用
 *   JSReanimated + Worklets mock，这些路径都不可用。只让这些模块走通用实现，
 *   避免把其余 Jest utilities 切到依赖 react-native-web 内部路径的 web 实现。
 *
 * jest 的 config `resolver` 是标量,直接写 worklets 的会把 RN 的顶掉,
 * 所以把 worklets 的 extension 过滤内联在这里,再委托给 RN 的 resolver。
 */

const reactNativeResolver = require('@react-native/jest-preset/jest/resolver.js');

module.exports = (request, options) => {
  const isReanimatedJestIncompatibleModule =
    options.basedir.includes('react-native-reanimated') &&
    (request === './initializers' ||
      request.endsWith('/mappers') ||
      request.endsWith('/mutables'));

  if (
    options.basedir.includes('react-native-worklets') ||
    request.includes('react-native-worklets') ||
    isReanimatedJestIncompatibleModule
  ) {
    options = {
      ...options,
      extensions: options.extensions?.filter((ext) => !ext.includes('native')),
    };
  }
  return reactNativeResolver(request, options);
};
