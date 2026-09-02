// reanimated 的 useReducedMotion() 是模块加载时的快照,没法在运行时改。
// 要模拟「系统已开启减弱动效」只能用 jest.mock 工厂 —— 直接给模块对象赋值
// 不生效(babel 编译的 ESM namespace 是 getter,不可写)。
let reducedMotion = false;

export function setReducedMotion(value: boolean): void {
  reducedMotion = value;
}

export function reanimatedWithReducedMotion(): unknown {
  const ReactModule = jest.requireActual<typeof import('react')>('react');
  const officialMock = jest.requireActual<Record<string, unknown>>(
    'react-native-reanimated/mock'
  );
  const createSharedValue = officialMock.useSharedValue as (
    initialValue: unknown
  ) => unknown;

  function useStableSharedValue(initialValue: unknown): unknown {
    const sharedValueRef = ReactModule.useRef<unknown>(undefined);
    if (sharedValueRef.current === undefined) {
      sharedValueRef.current = createSharedValue(initialValue);
    }
    return sharedValueRef.current;
  }

  // spread 会丢掉 babel 用 defineProperty 写的**不可枚举** __esModule:true,
  // default import(Animated)会拿到整个 namespace 而不是 default 导出,
  // Animated.View 变 undefined —— Task 3 已实证这正是 FeedbackScene 旧本地
  // mock 21 条红的根因。必须显式补回。
  return {
    ...officialMock,
    __esModule: true,
    useReducedMotion: () => reducedMotion,
    useSharedValue: useStableSharedValue,
  };
}
