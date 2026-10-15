// Only the animation runtime is replaced: tests supply frames, never a fake upload clock.
interface Timing {
  target: number;
  callback?: (finished: boolean) => void;
}
interface Shared {
  value: unknown;
  current: unknown;
  animation?: Timing;
}
const values = new Set<Shared>();
const reactions = new Set<() => void>();
const rnQueue: Array<() => void> = [];
let reducedMotion = false;

export const progressDriver = {
  reset() {
    values.clear();
    reactions.clear();
    rnQueue.length = 0;
    reducedMotion = false;
  },
  setReducedMotion(value: boolean) {
    reducedMotion = value;
  },
  frame(value: number) {
    for (const shared of values) {
      if (shared.animation) shared.current = value;
    }
    reactions.forEach((react) => react());
  },
  finish() {
    for (const shared of values) {
      const animation = shared.animation;
      if (!animation) continue;
      shared.current = animation.target;
      shared.animation = undefined;
      reactions.forEach((react) => react());
      animation.callback?.(true);
    }
  },
  flushRN() {
    while (rnQueue.length) rnQueue.shift()!();
  },
  get activeCount() {
    return [...values].filter((shared) => shared.animation).length;
  },
};

export function reanimatedWithProgressDriver(): unknown {
  const React = jest.requireActual<typeof import('react')>('react');
  const official = jest.requireActual<Record<string, unknown>>(
    'react-native-reanimated/mock'
  );
  return {
    ...official,
    __esModule: true,
    useReducedMotion: () => reducedMotion,
    useSharedValue(initial: unknown) {
      const ref = React.useRef<Shared | undefined>(undefined);
      if (!ref.current) {
        const shared: Shared = {
          current: initial,
          get value() {
            return this.current;
          },
          set value(next: unknown) {
            if (typeof next === 'object' && next && 'target' in next) {
              this.animation = next as Timing;
            } else {
              this.current = next;
              this.animation = undefined;
            }
          },
        };
        ref.current = shared;
        values.add(shared);
      }
      return ref.current;
    },
    withTiming(
      target: number,
      _config: unknown,
      callback?: Timing['callback']
    ) {
      return { target, callback };
    },
    cancelAnimation(shared: Shared) {
      shared.animation?.callback?.(false);
      shared.animation = undefined;
    },
    useAnimatedProps(updater: () => Record<string, unknown>) {
      return new Proxy({}, { get: (_target, key: string) => updater()[key] });
    },
    useAnimatedReaction<T>(
      prepare: () => T,
      react: (value: T, previous: T | null) => void
    ) {
      React.useEffect(() => {
        let previous: T | null = null;
        const reaction = () => {
          const next = prepare();
          react(next, previous);
          previous = next;
        };
        reactions.add(reaction);
        return () => {
          reactions.delete(reaction);
        };
      }, [prepare, react]);
    },
  };
}

export function scheduleProgressOnUI(
  worklet: (...args: unknown[]) => void,
  ...args: unknown[]
) {
  worklet(...args);
  reactions.forEach((react) => react());
}

export function scheduleProgressOnRN(
  callback: (...args: unknown[]) => void,
  ...args: unknown[]
) {
  rnQueue.push(() => callback(...args));
}
