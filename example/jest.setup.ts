// design 自身的 peer 接线来自 `@unif/react-native-design/jest-setup`
// (由 jest.config.js 的 preset 带入)。本文件只放 example 特有的替身。

// App.test.tsx 要断言根装配里有且只有一个 GestureHandlerRootView,
// 给它一个可查询的 testID —— 这是测试缝,不是 design 接线的一部分。
jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler');
  const React = require('react');
  const { Pressable, View } = require('react-native');

  return {
    ...actual,
    Pressable,
    GestureDetector: ({ children }: { children: unknown }) => children,
    GestureHandlerRootView: function MockGestureHandlerRootView({
      children,
      ...props
    }: import('react').ComponentProps<typeof import('react-native').View>) {
      return React.createElement(
        View,
        { ...props, testID: 'capture-gesture-root' },
        children
      );
    },
  };
});
