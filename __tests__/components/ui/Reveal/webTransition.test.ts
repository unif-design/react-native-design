import { describe, expect, test } from '@jest/globals';
import { StyleSheet } from 'react-native';
import {
  createRevealWebAnimatedStyle,
  resolveRevealWebStyle,
  scheduleRevealAnimationFrames,
} from '../../../../src/components/ui/Reveal/webTransition';
import type { RevealAnimationFrameApi } from '../../../../src/components/ui/Reveal/webTransition';

type FrameCallback = () => void;
type ReactNativeWebPreprocess = (
  style: Record<string, unknown>
) => Record<string, unknown>;

const reactNativeWebPreprocess = (
  require('../../../../website/node_modules/react-native-web/dist/cjs/exports/StyleSheet/preprocess') as {
    default: ReactNativeWebPreprocess;
  }
).default;

function createFrameHarness() {
  let nextId = 1;
  const callbacks = new Map<number, FrameCallback>();
  const requestedIds: number[] = [];
  const cancelledIds: number[] = [];
  const api: RevealAnimationFrameApi = {
    requestAnimationFrame(callback) {
      const id = nextId++;
      requestedIds.push(id);
      callbacks.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) {
      cancelledIds.push(id);
    },
  };

  return {
    api,
    requestedIds,
    cancelledIds,
    run(id: number) {
      callbacks.get(id)?.();
    },
  };
}

describe('resolveRevealWebStyle', () => {
  test.each([0, 0.35, 1])('保留合法 caller opacity %p', (opacity) => {
    const style = { flex: 1, opacity };

    expect(resolveRevealWebStyle(style)).toEqual({
      callerStyle: style,
      targetOpacity: opacity,
    });
  });

  test.each([Number.NaN, Number.POSITIVE_INFINITY, -0.01, 1.01])(
    '非法 caller opacity %p 回退到 1，同时保留其他合法布局样式',
    (opacity) => {
      const style = { flex: 1, opacity };

      expect(resolveRevealWebStyle(style)).toEqual({
        callerStyle: style,
        targetOpacity: 1,
      });
    }
  );

  test('按 StyleSheet.flatten 语义读取 registered / nested style 的最终 opacity', () => {
    const registered = StyleSheet.create({
      reveal: { flex: 1, opacity: 0.2 },
    }).reveal;
    const style = [registered, null, [{ opacity: 0.65 }]] as const;

    expect(resolveRevealWebStyle(style)).toEqual({
      callerStyle: style,
      targetOpacity: 0.65,
    });
  });

  test('flatten 异常时不抛错，丢弃 hostile caller style 并回退 opacity 1', () => {
    const hostileStyle = new Proxy([], {
      get(target, key, receiver) {
        if (key === 'length') throw new Error('flatten failed');
        return Reflect.get(target, key, receiver);
      },
    });

    expect(() => resolveRevealWebStyle(hostileStyle)).not.toThrow();
    expect(resolveRevealWebStyle(hostileStyle)).toEqual({
      callerStyle: undefined,
      targetOpacity: 1,
    });
  });

  test('flatten 成功但 RNW 深层 transform preprocessing 会抛错时失败关闭', () => {
    const hostileStyle = {
      opacity: 0.35,
      transform: [null],
    } as unknown as Record<string, unknown>;

    expect(() => reactNativeWebPreprocess(hostileStyle)).toThrow();
    expect(resolveRevealWebStyle(hostileStyle)).toEqual({
      callerStyle: undefined,
      targetOpacity: 1,
    });
  });
});

describe('createRevealWebAnimatedStyle', () => {
  test('动画起点为 0，完成态精确恢复 caller target opacity', () => {
    expect(
      createRevealWebAnimatedStyle({
        targetOpacity: 0.35,
        visible: false,
        animate: true,
        duration: 320,
      })
    ).toEqual({
      opacity: 0,
      transitionProperty: 'opacity',
      transitionDuration: '320ms',
      transitionTimingFunction: 'ease-out',
    });
    expect(
      createRevealWebAnimatedStyle({
        targetOpacity: 0.35,
        visible: true,
        animate: true,
        duration: 320,
      }).opacity
    ).toBe(0.35);
  });

  test('reduced motion 或 RAF 不可用时不输出任何 transition 字段', () => {
    expect(
      createRevealWebAnimatedStyle({
        targetOpacity: 0.35,
        visible: true,
        animate: false,
        duration: 320,
      })
    ).toEqual({ opacity: 0.35 });
  });
});

describe('scheduleRevealAnimationFrames', () => {
  test('用两个独立 RAF 后显示，并在 cleanup 取消两个 id', () => {
    const frames = createFrameHarness();
    let visibleCount = 0;
    const cleanup = scheduleRevealAnimationFrames({
      api: frames.api,
      isCurrent: () => true,
      onVisible: () => {
        visibleCount += 1;
      },
    });

    expect(frames.requestedIds).toEqual([1]);
    frames.run(1);
    expect(frames.requestedIds).toEqual([1, 2]);
    expect(visibleCount).toBe(0);
    frames.run(2);
    expect(visibleCount).toBe(1);

    cleanup();
    expect(frames.cancelledIds).toEqual([1, 2]);
  });

  test('cleanup 后旧第一帧不能注册第二帧或显示', () => {
    const frames = createFrameHarness();
    let visibleCount = 0;
    const cleanup = scheduleRevealAnimationFrames({
      api: frames.api,
      isCurrent: () => true,
      onVisible: () => {
        visibleCount += 1;
      },
    });

    cleanup();
    frames.run(1);

    expect(frames.requestedIds).toEqual([1]);
    expect(frames.cancelledIds).toEqual([1]);
    expect(visibleCount).toBe(0);
  });

  test('generation 变化后旧第二帧不能显示新一轮 Reveal', () => {
    const frames = createFrameHarness();
    let generation = 1;
    let visibleCount = 0;
    const cleanup = scheduleRevealAnimationFrames({
      api: frames.api,
      isCurrent: () => generation === 1,
      onVisible: () => {
        visibleCount += 1;
      },
    });

    frames.run(1);
    generation = 2;
    frames.run(2);
    cleanup();

    expect(visibleCount).toBe(0);
    expect(frames.cancelledIds).toEqual([1, 2]);
  });

  test('RAF API 缺失或 request 抛错时同步显示且不抛错', () => {
    let missingVisibleCount = 0;
    expect(() =>
      scheduleRevealAnimationFrames({
        api: undefined,
        isCurrent: () => true,
        onVisible: () => {
          missingVisibleCount += 1;
        },
      })
    ).not.toThrow();
    expect(missingVisibleCount).toBe(1);

    let throwingVisibleCount = 0;
    expect(() =>
      scheduleRevealAnimationFrames({
        api: {
          requestAnimationFrame() {
            throw new Error('request failed');
          },
          cancelAnimationFrame() {},
        },
        isCurrent: () => true,
        onVisible: () => {
          throwingVisibleCount += 1;
        },
      })
    ).not.toThrow();
    expect(throwingVisibleCount).toBe(1);
  });

  test('cancelAnimationFrame 抛错时 cleanup 仍失败关闭', () => {
    const frames = createFrameHarness();
    const cleanup = scheduleRevealAnimationFrames({
      api: {
        requestAnimationFrame: frames.api.requestAnimationFrame,
        cancelAnimationFrame() {
          throw new Error('cancel failed');
        },
      },
      isCurrent: () => true,
      onVisible() {},
    });

    expect(cleanup).not.toThrow();
  });
});
