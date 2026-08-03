import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import {
  createInvalidFontScaleDiagnostic,
  createMissingThemeProviderDiagnostic,
} from '../../src/theme/themeDiagnostics';

type Effect = () => void | (() => void);

const originalDevDescriptor = Object.getOwnPropertyDescriptor(
  globalThis,
  '__DEV__'
);

const setDev = (value: boolean) => {
  Object.defineProperty(globalThis, '__DEV__', {
    configurable: true,
    value,
    writable: true,
  });
};

const installReactHookMocks = (contextValue?: unknown) => {
  const effects: Effect[] = [];
  const useEffect = jest.fn((effect: Effect) => {
    effects.push(effect);
  });
  const useMemo = jest.fn((factory: () => unknown) => factory());
  const useContext = jest.fn(() => contextValue);

  jest.doMock('react', () => {
    const actualReact = jest.requireActual<typeof import('react')>('react');
    return {
      ...actualReact,
      useContext,
      useEffect,
      useMemo,
    };
  });

  return { effects };
};

const installLoggerMock = () => {
  const warnByScope: Record<string, ReturnType<typeof jest.fn>> = {};
  const createLogger = jest.fn((scope: string) => {
    const warn = jest.fn();
    warnByScope[scope] = warn;
    return {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn,
    };
  });

  jest.doMock('../../src/utils/logger', () => ({ createLogger }));

  return { createLogger, warnByScope };
};

const runEffects = (effects: Effect[]) => {
  for (const effect of effects) effect();
};

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.dontMock('../../src/utils/logger');
  jest.resetModules();
  if (originalDevDescriptor) {
    Object.defineProperty(globalThis, '__DEV__', originalDevDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, '__DEV__');
  }
});

describe('themeDiagnostics', () => {
  test.each([
    ['production', false, Object.create(null), 1],
    ['合法值', true, 2, 2],
  ])('%s 不格式化 fontScale，也不写诊断', (_, isDev, value, normalized) => {
    const warn = jest.fn();
    const formatValue = jest.fn(() => {
      throw new Error('不应格式化');
    });
    const report = createInvalidFontScaleDiagnostic(warn, formatValue);

    expect(() => report(value, normalized, isDev)).not.toThrow();
    expect(formatValue).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  test('不可字符串化的 dev runtime 值安全告警，并按同一格式跨 remount 去重', () => {
    const warn = jest.fn();
    const report = createInvalidFontScaleDiagnostic(warn);
    const nullPrototype = Object.create(null);
    const throwingProxy = new Proxy(Object.create(null), {
      get() {
        throw new Error('禁止读取');
      },
    });

    expect(() => report(nullPrototype, 1, true)).not.toThrow();
    expect(() => report(throwingProxy, 1, true)).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'fontScale=<无法序列化> 无效，已回退为 1'
    );
  });

  test('缺 Provider 只在 predicate 为 true 时跨 remount 告警一次', () => {
    const warn = jest.fn();
    const report = createMissingThemeProviderDiagnostic(warn);

    report(false);
    report(true);
    report(true);

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '缺少 ThemeProvider，已使用稳定 light fallback'
    );
  });
});

describe('Theme diagnostics effect boundary', () => {
  test('ThemeProvider 在 production effect 中跳过不可字符串化值', () => {
    setDev(false);
    const { effects } = installReactHookMocks();
    const { createLogger, warnByScope } = installLoggerMock();
    jest.doMock('react-native', () => ({
      useColorScheme: () => 'light',
    }));
    const { ThemeProvider } =
      require('../../src/theme/ThemeProvider') as typeof import('../../src/theme/ThemeProvider');
    const invalidFontScale = Object.create(null) as number;

    expect(() =>
      ThemeProvider({ children: null, fontScale: invalidFontScale })
    ).not.toThrow();
    expect(warnByScope.ThemeProvider).not.toHaveBeenCalled();
    expect(() => runEffects(effects)).not.toThrow();
    expect(warnByScope.ThemeProvider).not.toHaveBeenCalled();
    expect(createLogger).toHaveBeenCalledWith('ThemeProvider');
  });

  test('ThemeProvider 只在 dev effect 安全诊断，并按格式跨 remount 去重', () => {
    setDev(true);
    const { effects } = installReactHookMocks();
    const { createLogger, warnByScope } = installLoggerMock();
    jest.doMock('react-native', () => ({
      useColorScheme: () => 'light',
    }));
    const { ThemeProvider } =
      require('../../src/theme/ThemeProvider') as typeof import('../../src/theme/ThemeProvider');
    const firstInvalid = Object.create(null) as number;
    const secondInvalid = new Proxy(Object.create(null), {
      get() {
        throw new Error('禁止读取');
      },
    }) as number;

    ThemeProvider({ children: null, fontScale: firstInvalid });
    ThemeProvider({ children: null, fontScale: secondInvalid });

    expect(warnByScope.ThemeProvider).not.toHaveBeenCalled();
    expect(() => runEffects(effects)).not.toThrow();
    expect(warnByScope.ThemeProvider).toHaveBeenCalledTimes(1);
    expect(warnByScope.ThemeProvider).toHaveBeenCalledWith(
      'fontScale=<无法序列化> 无效，已回退为 1'
    );
    expect(createLogger).toHaveBeenCalledWith('ThemeProvider');
  });

  test('useTheme 缺 Provider 时先返回稳定 fallback，再在 effect 跨 remount 诊断一次', () => {
    setDev(true);
    const { effects } = installReactHookMocks(undefined);
    const { createLogger, warnByScope } = installLoggerMock();
    const { useTheme } =
      require('../../src/theme/useTheme') as typeof import('../../src/theme/useTheme');

    const first = useTheme();
    const second = useTheme();

    expect(second).toBe(first);
    expect(warnByScope.useTheme).not.toHaveBeenCalled();
    runEffects(effects);
    expect(warnByScope.useTheme).toHaveBeenCalledTimes(1);
    expect(warnByScope.useTheme).toHaveBeenCalledWith(
      '缺少 ThemeProvider，已使用稳定 light fallback'
    );
    expect(createLogger).toHaveBeenCalledWith('useTheme');
  });
});
