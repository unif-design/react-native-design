import 'react-native-gesture-handler/jestSetup';

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);

jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native-gesture-handler');
  const { Pressable, View } = require('react-native');

  return {
    ...actual,
    Pressable,
    GestureHandlerRootView: View,
  };
});

require('react-native-reanimated').setUpTests();
