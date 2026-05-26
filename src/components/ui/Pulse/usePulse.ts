import { useEffect } from 'react';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { PulseOptions } from './types';

/**
 * 在两个 opacity 值之间无限循环，返回可直接拼到 Animated.View 上的 style。
 * 走 reanimated 4 的 worklet，整个动画在 UI 线程跑、不占 JS 桥。
 */
export function usePulse({
  from = 0.6,
  to = 1,
  duration = 700,
  delay = 0,
}: PulseOptions = {}) {
  const op = useSharedValue(from);

  useEffect(() => {
    // from 变化时把 baseline 拉到新值，再启动循环；否则首帧会闪一下旧 baseline。
    op.value = from;
    const cycle = withRepeat(
      withSequence(
        withTiming(to, { duration }),
        withTiming(from, { duration })
      ),
      -1,
      false
    );
    op.value = delay > 0 ? withDelay(delay, cycle) : cycle;
    return () => cancelAnimation(op);
  }, [op, from, to, duration, delay]);

  return useAnimatedStyle(() => ({ opacity: op.value }));
}
