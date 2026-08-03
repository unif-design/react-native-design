import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { ReactElement } from 'react';

type ErrorProps = {
  onError: () => void;
};

type HookSlot = {
  callback: () => void;
  dependencies: readonly unknown[];
};

const sameDependencies = (
  first: readonly unknown[],
  second: readonly unknown[]
): boolean =>
  first.length === second.length &&
  first.every((value, index) => Object.is(value, second[index]));

const installHookHarness = () => {
  let activeInstance = 'attempt';
  const setters = new Map<string, ReturnType<typeof jest.fn>>();
  const callbackSlots = new Map<string, HookSlot>();

  const setterFor = (instance: string) => {
    const existing = setters.get(instance);
    if (existing) return existing;

    const setter = jest.fn();
    setters.set(instance, setter);
    return setter;
  };

  const useState = jest.fn(() => [false, setterFor(activeInstance)] as const);
  const useCallback = jest.fn(
    (callback: () => void, dependencies: readonly unknown[]) => {
      const previous = callbackSlots.get(activeInstance);
      if (previous && sameDependencies(previous.dependencies, dependencies)) {
        return previous.callback;
      }

      callbackSlots.set(activeInstance, { callback, dependencies });
      return callback;
    }
  );

  jest.doMock('react', () => {
    const actualReact = jest.requireActual<typeof import('react')>('react');
    return {
      ...actualReact,
      useCallback,
      useState,
    };
  });
  jest.doMock('react-native', () => ({ Image: 'Image' }));

  return {
    activate(instance: string) {
      activeInstance = instance;
    },
    setterFor,
  };
};

const errorHandler = (
  element: ReactElement<ErrorProps>
): ErrorProps['onError'] => element.props.onError;

beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.resetModules();
});

describe('ImageAttempt', () => {
  test('同一 attempt 的等价 render 保持 onError identity', () => {
    const hooks = installHookHarness();
    const { ImageAttempt } =
      require('../../../../src/components/ui/shared/ImageAttempt') as typeof import('../../../../src/components/ui/shared/ImageAttempt');

    hooks.activate('attempt');
    const first = ImageAttempt({
      fallback: null,
      source: { uri: 'https://x/a.png' },
    }) as ReactElement<ErrorProps>;
    const second = ImageAttempt({
      fallback: null,
      source: { uri: 'https://x/a.png' },
    }) as ReactElement<ErrorProps>;

    expect(errorHandler(second)).toBe(errorHandler(first));
  });

  test('旧 A1 handler 只能写入 A1，不能污染新 A2 attempt', () => {
    const hooks = installHookHarness();
    const { ImageAttempt } =
      require('../../../../src/components/ui/shared/ImageAttempt') as typeof import('../../../../src/components/ui/shared/ImageAttempt');

    hooks.activate('a1');
    const a1Handler = errorHandler(
      ImageAttempt({
        fallback: null,
        source: { uri: 'https://x/a.png' },
      }) as ReactElement<ErrorProps>
    );

    hooks.activate('a2');
    const a2Handler = errorHandler(
      ImageAttempt({
        fallback: null,
        source: { uri: 'https://x/a.png' },
      }) as ReactElement<ErrorProps>
    );

    a1Handler();
    expect(hooks.setterFor('a1')).toHaveBeenCalledWith(true);
    expect(hooks.setterFor('a2')).not.toHaveBeenCalled();

    a2Handler();
    expect(hooks.setterFor('a2')).toHaveBeenCalledWith(true);
  });
});
