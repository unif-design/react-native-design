# 发布受支持的 Jest 接线入口(设计)

> 日期:2026-08-05 · 状态:待维护者审核 · 执行计划见 `docs/plans/2026-08-05-jest-setup-entry.md`

## 1. 背景

`@unif/react-native-design` 不打包 9 个 runtime peer,消费者在 Jest 里渲染任何 design 组件之前,必须先把这些 peer 的 native 侧换成各自的官方 mock。这份接线**完全由 design 的 peer 集决定**,但今天由每个消费仓自己推导。

调研结论(2026-08-05,逐仓读源码):**5 个仓库各写了一套互不相同的接线,其中 3 个各自独立踩到并修补了同一个缺口。**

| 仓库 | 现状 | 是否独立踩到 `useReducedMotion` |
|---|---|---|
| `unif/portal` | `jest.setup.ts` 全套:RNGH `jestSetup` + `Pressable` 壳 + `GestureDetector` 壳 + `ReanimatedSwipeable` 壳 + worklets resolver + worklets mock + reanimated mock + `useReducedMotion` 补丁 + `useSharedValue` 引用稳定化 + safe-area mock | ✅ 注释写明「design 0.21 起 `usePrefersReducedMotion()` 读 Reanimated 的 `useReducedMotion()`,而官方 mock 不导出它」 |
| `design/react-native-umeng` | `example/jest.setup.ts`:RNGH `Pressable` 壳 + `worklets/src/mock` + reanimated mock + `useReducedMotion` 补丁 | ✅ 注释与 portal 几乎逐字相同 |
| `design/react-native-camera` | `jest.setup.ts`:整份手写 reanimated mock(含 `useRef` 持久化 SharedValue)+ RNGH + carousel 壳 + worklets 空 virtual mock + safe-area | 手写整份绕开 |
| `design/react-native-hms-scan` | `jest.setup.ts`:把 `@unif/react-native-design` 整个渲染成轻量桩 | 用「不渲染真组件」绕开 |
| `design/react-native-design`(本仓 `example/`) | `jest.config.js` 映射 reanimated → `mock.js`,再由 `helpers/nativeMocks.ts#installReducedMotionMock` 与 `FeedbackScene.test.tsx` 各补一次 | ✅ 两处补丁 |

注:本仓 `example/` 行描述的是 2026-08-05 调研时点状态,该两处补丁已随本计划 Task 3/4 清除。

`front/retail-pecportal` 用 `preset: 'react-native'`,目前不涉及 design 接线。

### 1.1 根因

`react-native-reanimated/mock.js` 是上游**刻意残缺**的便利 mock:`src/mock.ts` 里有 19 处 `// XXX: ADD ME IF NEEDED` 占位。其中两处正好卡住 design:

- `useReducedMotion`(第 83 行)—— `usePrefersReducedMotion` 直接调用,`Switch` / `Carousel` / `Spinner` / `Skeleton` / `Reveal` / `Pulse` 一律在 render 阶段 `TypeError: useReducedMotion is not a function`。
- `useComposedEventHandler` —— RNGH 3 的包根 `Pressable` 内部要用,任何 design 交互组件 render 即崩。

用 `moduleNameMapper` 把 `^react-native-reanimated$` 指到这个残缺 mock,等于用不完整的替身顶掉整个动画层 —— 缺一个符号就得在测试里补一次。**Reanimated 官方的 jest 方案不是这条 mapper,是真实模块 + `setUpTests()`。**

另有两个只在消费仓被发现、本仓文档从未记录的事实:

- `react-native-worklets` 提供官方 resolver `react-native-worklets/jest/resolver`,过滤 `.native.*` extension,修 "Native part not initialized" 与启动慢。
- 官方 reanimated mock 的 `useSharedValue` 每次 render 返回新 `Proxy`,引用不稳定;把 shared value 放进 effect 依赖数组的组件(本库 `ToastHost` 即是)会每次 render 重跑 effect,在 fake timers 下堆内存耗尽。portal 与 camera **各自独立**用 `useRef` 兜住了这个问题。

### 1.2 为什么文档不够

`website/docs/testing.md`(本次已加)与 `design` Skill 的「Jest 接入」把正确配方写下来了,消费者照抄就不踩。但接线随 peer range 变化(RNGH 3→4、reanimated 4.5→4.6、worklets 0.11→0.12),文档只能靠人再抄一遍;而踩错时的报错——`useComposedEventHandler is not a function`、`Unexpected token 'export'`、`loadUnpackersWithCode`——**没有一个字指向 design**。

`peerDependencies` 是由我们声明、由我们负责的约束;它对应的可执行接线也应当由我们提供。

## 2. 目标

1. `@unif/react-native-design` 发布两个受支持的 Jest 子路径入口,消费者不再自行推导接线。
2. 本仓 `example/` 改为消费这两个入口(吃自己的狗粮),使接线的每次变更都被本仓 15 个 suite 回归覆盖。
3. 现有 4 个消费仓(`portal`、`umeng`、`camera`、`hms-scan`)迁移到入口,删除各自重复的 design 相关接线。
4. `website` 文档与 `design` Skill 回改为「一行接入」,原逐条配方降级为「不使用入口时的手工等价物」。

## 3. 非目标

- **不改任何 runtime 代码。** `src/theme/usePrefersReducedMotion.ts` 保持现状(读 Reanimated 的系统信号)。本次是 mock 侧方案。
- **不导出 reduced-motion 测试缝。** `useReducedMotion()` 是模块加载时的快照,消费者若要模拟「已开启减弱动效」仍需自己 `jest.mock`。留待后续单独评估。
- **不接管消费者的其他 peer。** `react-native-keyboard-controller`、`device-info`、`netinfo`、`nitro-modules`、`ble-manager` 等不属于 design 的 peer 集,入口不碰。
- **不改 `.github/workflows/ci.yml`**(组织模板下发)。

## 4. 方案

### 4.1 两个入口

| 子路径 | 文件 | 职责 |
|---|---|---|
| `@unif/react-native-design/jest-setup` | `jest-setup.js`(仓根,手写 CJS) | 4 个 peer 的官方 mock 接线,进 `setupFilesAfterEnv` |
| `@unif/react-native-design/jest-preset` | `jest-preset.js`(仓根,手写 CJS) | RN preset + `transformIgnorePatterns` + 组合 resolver + 指向上面那个 setup |
| (不进 exports,随包分发) | `jest-resolver.js`(仓根,手写 CJS) | 组合 RN 官方 resolver 与 worklets 官方 resolver;preset 内部以 `require.resolve` 绝对路径引用 |

三个文件都是**手写 CJS,不过 bob**:jest 直接 `require` preset 文件,不经 transform,必须是 CJS;其余两个同理。三者不 import `src/`,与库运行时代码零耦合。

**`exports` 必须多一条 `"./jest-preset/jest-preset"` 别名**:jest 解析 `preset` 字段时,只对以 `.` 开头的说明符(部分版本另豁免绝对路径)原样使用,其余一律 `path.join(presetPath, 'jest-preset')` 拼上后缀 —— 见 `jest-config` 的 `normalize.js` `setupPreset()` 与其中的 `PRESET_NAME` 常量。也就是说消费者写的 `preset: '@unif/react-native-design/jest-preset'`,jest 实际去解析 `@unif/react-native-design/jest-preset/jest-preset`;`exports` 里没有这条,就直接报 `Validation Error: Module @unif/react-native-design/jest-preset should have "jest-preset.js" or "jest-preset.json" file at the root.`(已实测复现)。加一条指向同一个 `./jest-preset.js` 的别名,是让文档化说明符原样成立的最小改动 —— 比换成裸名 `preset: '@unif/react-native-design'`(靠追加命中 `./jest-preset`,可用但不直观)或让消费者写相对/绝对路径都干净。裸名形式因此顺带可用,但不进文档,避免两种写法并存。

**为什么 resolver 必须组合而不是直接用 worklets 的**:`@react-native/jest-preset` 自带 `resolver`(其唯一职责是临时剥掉 `react-native` 的 package exports,jest 才能解析/mock 其深路径,如 portal 在 mock 的 `react-native/Libraries/Utilities/Dimensions`);jest 的 config `resolver` 是标量,写 worklets 的就把 RN 的顶掉。portal 今天就处于这个被顶掉的状态。组合文件把 worklets 的 `.native.*` extension 过滤内联,再委托给 RN 的 resolver,两边行为都保住。

**setup 必须挂 `setupFilesAfterEnv`,不能挂 `setupFiles`**:reanimated `setUpTests()` 内部 `expect.extend`(实测 `src/jestUtils/index.ts:314`);`setupFiles` 阶段测试框架未装好,它会沿 fallback 链把 matcher 注册到独立的 expect 实例上 —— 不崩,但 `toHaveAnimatedStyle` 在用例里静默不可用。这直接影响 portal 迁移(它现在用的是 `setupFiles`)。

### 4.2 `jest-setup.js` 内容(已在真 tarball 宿主验证)

```js
require('react-native-gesture-handler/jestSetup');

// jest 里没有 worklets 的 native 侧
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock')
);

// safe-area 官方 mock:零 inset + 透传 Provider
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

// RNGH 3 的包根 Pressable / GestureDetector 换成不依赖手势的壳,
// 消费者的用例因此不必每个都包一层 GestureHandlerRootView。
jest.mock('react-native-gesture-handler', () => ({
  ...jest.requireActual('react-native-gesture-handler'),
  Pressable: require('react-native').Pressable,
  GestureDetector: ({ children }) => children,
}));

// reanimated 走真实模块 + 官方 setUpTests —— 不映射它自带的残缺 mock
require('react-native-reanimated').setUpTests();
```

**关键取舍:reanimated 用真实模块。** 这样 `useReducedMotion` 与 `useSharedValue` 都是真的,§1.1 那两个补丁(以及 portal / camera 各自的 `useRef` 稳定化)全部不再需要 —— 少两处会随上游漂移的猴补丁。

**RNGH 两个壳保留。** jest 不触发真实手势,壳不损失可验证行为;而去掉它们会要求消费者每个用例都包 `GestureHandlerRootView`(否则 RNGH 3 抛 `GestureDetector must be used as a descendant of GestureHandlerRootView`),迁移成本高且 4 个仓已经都在这么做。

### 4.3 `jest-preset.js` 内容

```js
const reactNativePreset = require('@react-native/jest-preset');

module.exports = {
  ...reactNativePreset,
  resolver: require.resolve('./jest-resolver.js'),
  setupFilesAfterEnv: [
    ...(reactNativePreset.setupFilesAfterEnv ?? []),
    require.resolve('./jest-setup.js'),
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@unif/react-native-design|@sbaiahmed1/react-native-blur|react-native-(gesture-handler|reanimated|worklets|safe-area-context|svg|reanimated-carousel))/)',
  ],
};
```

`jest-resolver.js`:

```js
const reactNativeResolver = require('@react-native/jest-preset/jest/resolver.js');

module.exports = (request, options) => {
  // worklets 官方 resolver 的语义内联:对 worklets 相关请求过滤 .native.*
  // extension,jest 走 web 实现,不触发 native init。
  if (
    options.basedir.includes('react-native-worklets') ||
    request.includes('react-native-worklets')
  ) {
    options = {
      ...options,
      extensions: options.extensions?.filter((ext) => !ext.includes('native')),
    };
  }
  return reactNativeResolver(request, options);
};
```

(`@react-native/jest-preset` 无 exports 字段,子路径 require 合法;它是消费者测 RN 应用的既有 devDependency,本库文档的安装命令里也列了它,不新增本库依赖。)

`transformIgnorePatterns` 只能由 preset 代劳(resolver 层配置,进不了 setup 文件)。消费者若还要放行别的包,spread 本 preset 的这一项再追加。

### 4.4 消费者接入形态

```js
// 全新工程
module.exports = { preset: '@unif/react-native-design/jest-preset' };

// 已有自己 config
const designPreset = require('@unif/react-native-design/jest-preset');
module.exports = {
  preset: '@react-native/jest-preset',
  resolver: designPreset.resolver,
  setupFilesAfterEnv: ['@unif/react-native-design/jest-setup'],
  transformIgnorePatterns: [
    designPreset.transformIgnorePatterns[0].replace(
      'react-native-(gesture-handler',
      '@react-navigation|react-native-(gesture-handler'
    ),
  ],
};
```

## 5. 验收标准

1. 真 tarball 宿主(`yarn pack` → 干净工程 `npm install`)里,只写 `preset: '@unif/react-native-design/jest-preset'`,能渲染并断言:`Button` / `Cell` / `IconButton` / `Switch` / `Segmented` / `Carousel` / `Icon` / `Spinner` / `Skeleton` / `Reveal` / `ToastHost`(fake timers)。
2. 本仓 `example/` 改吃入口后,`yarn example test` 15 suites / 101 tests 全绿,且 `example/jest.setup.ts` 中 design 相关接线清零。
3. `example/src/__tests__/helpers/nativeMocks.ts` 的 reanimated 部分与 `FeedbackScene.test.tsx` 的 `jest.mock('react-native-reanimated', …)` 删除后测试仍绿(若某用例确实需要模拟 reduced motion,改用显式 `jest.mock` 并在 spec §3 非目标里记录)。
4. `package.json#exports` 包含两个入口,`#files` 包含三个文件;`yarn pack` 产物里能找到 `jest-setup.js` / `jest-preset.js` / `jest-resolver.js`。
5. 新增 gate 断言两个入口存在、可 `require`、preset 形状正确;`yarn verify:example-showcase` 绿。
6. `website/docs/testing.md`、`troubleshooting.md`、`design` Skill 的「Jest 接入」改为一行接入,手工配方降级为备选。

## 6. 风险

| 风险 | 缓解 |
|---|---|
| 真实 reanimated 比 mock 慢 | 以 `yarn example test --maxWorkers=2` 现基线 **58s** 为准,迁移后实测对比;超过 2× 则回到「mock + 我们自己补齐缺口」形态,补丁收在入口里而不是散在各仓 |
| 首跑 flake | 调研中出现过一次单测失败、复跑全绿(act 警告 + 冷缓存)。迁移任务里要求同一配置连跑 3 次判定 |
| preset 的 `transformIgnorePatterns` 与消费者自有包冲突 | 文档给出 §4.4 的 spread 写法;preset 把该项做成数组首元素,便于替换 |
| 消费仓 RN / jest 版本不一致 | 迁移逐仓做、逐仓验;入口只依赖既有 peer,不新增依赖 |
| 本仓是 workspace,root 与 example 各有一份 reanimated / worklets / safe-area 物理拷贝,`jest.mock` 的注册 key 与 importer 解析到的路径可能不一致(FeedbackScene / CollectionsScene 现有的 `../../../node_modules/...` 双路径 mock 就是这个问题的既有绕法) | example 的 `moduleNameMapper` 把这三个包的 bare specifier 统一钉到 example 那份**真实**拷贝;jest.mock 的 key 解析同样过 mapper(现有 FeedbackScene 的 override 能生效即为证),key 与 importer 从此对齐。独立消费者只有一份 node_modules,无此问题 |
| 我们的 preset 覆盖掉 RN preset 的 resolver | `jest-resolver.js` 组合两者(见 §4.3),深路径 mock 不回归 |

## 7. 硬性约束

- 不改 `src/` 任何文件。
- 不新增 `dependencies`;入口 `require` 的全部是既有 `peerDependencies`。
- `.github/workflows/ci.yml` 不动。
- 消费仓迁移是**独立 PR**,且必须在 design 发布带入口的版本之后。
