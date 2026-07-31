/**
 * Jest 自动 node_modules mock —— `__mocks__/` 与 `node_modules/` 同级时,Jest 对
 * node 模块**自动**启用本 mock,测试文件无需 `jest.mock()`。
 *
 * 为什么需要:根 jest 固定 `testEnvironment: 'node'`,而 `react-native-reanimated`
 * 只发 ESM(`lib/module/*.js`),且不在 RN preset 的 `transformIgnorePatterns` 白名单里
 * (该正则只放行 `react-native/`、`@react-native/`、`@react-native-community/`,
 * `react-native-reanimated/` 的 `-` 挡在 `/` 之前不匹配)——直接 require 会报
 * `Cannot use import statement outside a module`。
 *
 * 本仓 Jest 只测纯 Store / 归一化 / 脚本逻辑,**不做组件渲染**,所以这里只需要让
 * `src/theme` 与 `src/components/ui` 的 barrel 可以被 import,不需要真实动画语义。
 * 任何依赖真实 worklet 行为的验证走 `manual-tests/runtime-api/` 与原生 harness。
 *
 * 符号清单与 `src/` 实际 import 的集合一一对应,新增 import 时同步补齐。
 */
'use strict';

const identity = (value) => value;
const noop = () => {};

const Animated = {
  View: 'Animated.View',
  Text: 'Animated.Text',
  ScrollView: 'Animated.ScrollView',
  Image: 'Animated.Image',
};

module.exports = {
  __esModule: true,
  default: Animated,

  // hooks
  useSharedValue: (initial) => ({ value: initial }),
  useAnimatedStyle: (factory) => factory(),
  useReducedMotion: () => false,

  // 动画构造器:返回目标值,便于纯逻辑断言「最终停在哪」而不是模拟时间轴。
  withTiming: identity,
  withDelay: (_delay, animation) => animation,
  withRepeat: identity,
  withSequence: (...animations) => animations[animations.length - 1],
  cancelAnimation: noop,

  // layout 装饰器
  FadeIn: { duration: () => ({}) },
  FadeOut: { duration: () => ({}) },

  runOnJS: (fn) => fn,
};
