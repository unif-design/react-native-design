// design 的接线由包自己提供(见仓根 jest-preset.js / jest-setup.js);example 吃
// 自己的狗粮,走与消费者相同的 preset 字符串解析路径(经 package.json#exports),
// 每次改接线都被本仓 15 个 suite 回归覆盖。
module.exports = {
  preset: '@unif/react-native-design/jest-preset',
  testMatch: ['**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    // example 测的是当前源码,不是已发布产物
    '^@unif/react-native-design$': '<rootDir>/../src/index.tsx',
    // 以下都是 workspace 双拷贝钉住条目:root 与 example 各有一份物理拷贝,
    // bare specifier 统一钉到 example 这份**真实**拷贝,preset 里 jest-setup 的
    // jest.mock 注册 key 与所有 importer 才会对齐(jest.mock 的 key 解析同样
    // 经过本 mapper)。独立消费者只有一份 node_modules,不需要这些。
    '^react$': '<rootDir>/node_modules/react',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-native-gesture-handler$':
      '<rootDir>/node_modules/react-native-gesture-handler/src/index.ts',
    // 子路径也得钉:RNGH 的 jestSetup 用**相对**说明符注册桩
    // (`jest.mock('./src/RNGestureHandlerModule', …)`),打到哪份拷贝由
    // jestSetup.js 自己的解析位置决定。preset 的 jest-setup 在仓根,不钉的话
    // 它桩的是 root 那份,而上面 bare specifier 指的是 example 这份 —— 结果
    // example 拷贝的 native module 没被桩,整棵 RN 渲染树在
    // TurboModuleRegistry.getEnforcing('RNGestureHandlerModule') 处炸。
    '^react-native-gesture-handler/(.*)$':
      '<rootDir>/node_modules/react-native-gesture-handler/$1',
    '^react-native-reanimated$':
      '<rootDir>/node_modules/react-native-reanimated',
    '^react-native-worklets$': '<rootDir>/node_modules/react-native-worklets',
    '^react-native-safe-area-context$':
      '<rootDir>/node_modules/react-native-safe-area-context',
  },
  // preset 的 setupFilesAfterEnv(jest-setup.js)由 jest 前置拼接,这里只列 example 自己的
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  reporters: ['default', '<rootDir>/jest.forbidOnlyReporter.js'],
  // transformIgnorePatterns 不写 —— 继承 preset(内容与原先 example 自己那份逐字相同)
};
