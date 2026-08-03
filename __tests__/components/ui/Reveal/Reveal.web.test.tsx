import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from '@jest/globals';
import type { ReactElement } from 'react';

type Effect = () => void | (() => void);
type FrameCallback = (timestamp: number) => void;
type WebRevealElementProps = {
  style: readonly [unknown, Record<string, unknown>];
  testID?: string;
  children?: unknown;
};
type RuntimeWithFrames = {
  requestAnimationFrame?: (callback: FrameCallback) => number;
  cancelAnimationFrame?: (id: number) => void;
};

const runtime = globalThis as unknown as RuntimeWithFrames;
const originalRequestAnimationFrame = runtime.requestAnimationFrame;
const originalCancelAnimationFrame = runtime.cancelAnimationFrame;

function restoreFrameApi() {
  if (originalRequestAnimationFrame === undefined) {
    delete runtime.requestAnimationFrame;
  } else {
    runtime.requestAnimationFrame = originalRequestAnimationFrame;
  }
  if (originalCancelAnimationFrame === undefined) {
    delete runtime.cancelAnimationFrame;
  } else {
    runtime.cancelAnimationFrame = originalCancelAnimationFrame;
  }
}

function createFrameHarness() {
  let nextId = 1;
  const callbacks = new Map<number, FrameCallback>();
  const requestedIds: number[] = [];
  const cancelledIds: number[] = [];
  runtime.requestAnimationFrame = (callback) => {
    const id = nextId++;
    requestedIds.push(id);
    callbacks.set(id, callback);
    return id;
  };
  runtime.cancelAnimationFrame = (id) => {
    cancelledIds.push(id);
  };
  return {
    requestedIds,
    cancelledIds,
    run(id: number) {
      callbacks.get(id)?.(0);
    },
  };
}

function loadWebReveal(reduced: boolean) {
  const effects: Effect[] = [];
  const stateUpdates: unknown[] = [];
  const actualReact = jest.requireActual<typeof import('react')>('react');

  jest.doMock('react', () => ({
    ...actualReact,
    useEffect: (effect: Effect) => {
      effects.push(effect);
    },
    useRef: <T,>(initial: T) => ({ current: initial }),
    useState: <T,>(initial: T | (() => T)) => [
      typeof initial === 'function' ? (initial as () => T)() : initial,
      (value: unknown) => {
        stateUpdates.push(value);
      },
    ],
  }));
  jest.doMock('react-native', () => ({
    StyleSheet: {
      flatten(style: unknown): unknown {
        if (!Array.isArray(style)) return style;
        return style.reduce<Record<string, unknown>>((merged, item) => {
          const flattened = Array.isArray(item)
            ? (this.flatten(item) as Record<string, unknown>)
            : (item as Record<string, unknown> | null | false);
          return flattened ? { ...merged, ...flattened } : merged;
        }, {});
      },
    },
    View: 'View',
  }));
  jest.doMock('../../../../src/theme', () => ({
    motion: { base: 200 },
    usePrefersReducedMotion: () => reduced,
  }));

  const Reveal = require('../../../../src/components/ui/Reveal/Reveal.web')
    .Reveal as typeof import('../../../../src/components/ui/Reveal/Reveal.web').Reveal;

  return { Reveal, effects, stateUpdates };
}

beforeEach(() => {
  jest.resetModules();
  restoreFrameApi();
});

afterEach(() => {
  restoreFrameApi();
  jest.dontMock('react');
  jest.dontMock('react-native');
  jest.dontMock('../../../../src/theme');
  jest.resetModules();
});

describe('Reveal Web', () => {
  test('reduced motion 首次 render 就显示 caller opacity，只有一个 RN View 且不注册 RAF', () => {
    const frames = createFrameHarness();
    const { Reveal, effects } = loadWebReveal(true);
    const callerStyle = [{ flex: 1 }, { opacity: 0.35 }] as const;
    const element = Reveal({
      children: 'content',
      style: callerStyle,
      duration: 320,
      testID: 'web-reveal',
    }) as ReactElement<WebRevealElementProps>;

    expect(element.type).toBe('View');
    expect(element.props.children).toBe('content');
    expect(element.props.style[0]).toBe(callerStyle);
    expect(element.props.style[1]).toEqual({ opacity: 0.35 });
    expect(element.props.testID).toBe('web-reveal');

    const cleanup = effects[0]?.();
    expect(frames.requestedIds).toEqual([]);
    cleanup?.();
    expect(frames.cancelledIds).toEqual([]);
  });

  test('非 reduced motion 从 0 开始，经双 RAF 后才请求显示并在 cleanup 取消两帧', () => {
    const frames = createFrameHarness();
    const { Reveal, effects, stateUpdates } = loadWebReveal(false);
    const callerStyle = { opacity: 0.35 };
    const element = Reveal({
      children: 'content',
      style: callerStyle,
      duration: 320,
    }) as ReactElement<WebRevealElementProps>;

    expect(element.props.style).toEqual([
      callerStyle,
      {
        opacity: 0,
        transitionProperty: 'opacity',
        transitionDuration: '320ms',
        transitionTimingFunction: 'ease-out',
      },
    ]);

    const cleanup = effects[0]?.();
    expect(frames.requestedIds).toEqual([1]);
    frames.run(1);
    expect(frames.requestedIds).toEqual([1, 2]);
    expect(stateUpdates).toEqual([false]);
    frames.run(2);
    expect(stateUpdates).toEqual([false, true]);
    cleanup?.();
    expect(frames.cancelledIds).toEqual([1, 2]);
  });

  test('RAF 不可用时首 render fail-safe 显示且不输出 transition', () => {
    delete runtime.requestAnimationFrame;
    delete runtime.cancelAnimationFrame;
    const { Reveal, effects } = loadWebReveal(false);
    const callerStyle = { opacity: 0.35 };
    const element = Reveal({
      children: 'content',
      style: callerStyle,
      duration: 320,
    }) as ReactElement<WebRevealElementProps>;

    expect(element.props.style).toEqual([
      callerStyle,
      {
        opacity: 0.35,
      },
    ]);
    expect(effects[0]).toBeDefined();
    expect(effects[0]?.()).not.toThrow();
  });
});
