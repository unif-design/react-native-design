/* global jest */
// ↑ 根 eslint flat config 不给非测试目录注入 jest 全局,显式声明,否则 yarn lint 报 no-undef。
'use strict';

/**
 * `@unif/react-native-design/jest-setup` —— 把本库 9 个 runtime peer 里在 Jest 中
 * 需要接线的那 4 个接上各自的**官方**桩 / mock / setup。放进消费者的
 * `setupFilesAfterEnv`。
 *
 * 为什么由库提供:这份接线完全由本库的 peer 集决定,peer range 一变它就得变。
 * 让每个消费仓自己推导的结果是 5 个仓 5 种写法、3 个仓各自踩同一个坑
 * (见 docs/specs/2026-08-05-jest-setup-entry-design.md §1)。
 *
 * `transformIgnorePatterns` 是 resolver 层配置,进不了 setup 文件 —— 那部分在
 * `./jest-preset.js`。
 */

// RNGH 官方 jest 桩:让 TurboModuleRegistry.getEnforcing('RNGestureHandlerModule') 不炸。
require('react-native-gesture-handler/jestSetup');

// worklets 的 native 侧在 Jest 里不存在,直接 import 会在 `loadUnpackersWithCode` 处崩。
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock')
);

// safe-area 官方 mock:零 inset + 透传 Provider。不接的话 SafeAreaProvider 子树整棵不渲染。
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);

// RNGH 3 的包根 Pressable 与 GestureDetector 换成不依赖手势的壳。
// Jest 不触发真实手势,壳不损失可验证行为;保留它们,消费者的用例才不必
// 每一个都包一层 GestureHandlerRootView(否则 RNGH 3 会抛
// "GestureDetector must be used as a descendant of GestureHandlerRootView")。
// 其余导出走真实实现。
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  Pressable: require('react-native').Pressable,
  GestureDetector: ({ children }) => children,
}));

// Reanimated 4.6 的官方 mock 已覆盖本库使用的 hooks；真实 native 组件链会在
// React 19 test renderer 中尝试查 host instance / native style handle，不能用于 Jest。
// 上游 mock 的 useSharedValue 每次 render 都返回新 Proxy，会让把 shared value 放进
// effect 依赖数组的组件(本库 ToastHost)反复执行，所以只把这个 hook 稳定化。
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const reanimatedMock = require('react-native-reanimated/mock');

  function useStableSharedValue(initialValue) {
    const sharedValueRef = React.useRef();
    if (sharedValueRef.current === undefined) {
      sharedValueRef.current = reanimatedMock.useSharedValue(initialValue);
    }
    return sharedValueRef.current;
  }

  return {
    ...reanimatedMock,
    useSharedValue: useStableSharedValue,
  };
});

// 用 actual 只安装官方 matcher / timer；不要提前 require 已注册的模块 mock，
// 否则消费仓在单测内追加的 jest.mock('react-native-reanimated', ...) 无法覆盖它。
jest.requireActual('react-native-reanimated').setUpTests();
