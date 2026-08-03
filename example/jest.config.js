module.exports = {
  preset: '@react-native/jest-preset',
  testMatch: ['**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    '^@unif/react-native-design$': '<rootDir>/../src/index.tsx',
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-native-gesture-handler$':
      '<rootDir>/node_modules/react-native-gesture-handler/src/index.ts',
    '^react-native-reanimated$':
      '<rootDir>/node_modules/react-native-reanimated/mock.js',
    '^react-native-worklets$':
      '<rootDir>/node_modules/react-native-worklets/src/mock.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@unif/react-native-design|@sbaiahmed1/react-native-blur|react-native-(gesture-handler|reanimated|worklets|safe-area-context|svg|reanimated-carousel))/)',
  ],
};
