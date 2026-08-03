import 'react-native-gesture-handler/jestSetup';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);

jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler');
  const React = require('react');
  const { Pressable, View } = require('react-native');

  return {
    ...actual,
    Pressable,
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

require('react-native-reanimated').setUpTests();
