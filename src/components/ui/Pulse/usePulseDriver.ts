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
import { usePrefersReducedMotion } from '../../../theme';
import { shouldAnimatePulse } from './normalizePulseOptions';
import type { NormalizedPulseOptions } from './normalizePulseOptions';

/**
 * native Pulse driver —— reanimated 4 worklet,整个动画在 UI 线程跑、不占 JS 桥。
 *
 * **只接受归一化产物**:duration / delay / from / to 都已验证过,这里不再读原始 props,
 * 也不再解释默认值。平台差异只到这一层为止。
 */
export function usePulseDriver(options: NormalizedPulseOptions) {
  const reduced = usePrefersReducedMotion();
  const animate = shouldAnimatePulse(options, reduced);
  const { from, to, duration, delay } = options;
  const op = useSharedValue(animate ? from : to);

  useEffect(() => {
    if (!animate) {
      // 静态 / 减弱动效:停在完全显示的一端(to),骨架与圆点静态呈现。
      cancelAnimation(op);
      op.value = to;
      return;
    }
    // from 变化时把 baseline 拉到新值,再启动循环;否则首帧会闪一下旧 baseline。
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
  }, [op, animate, from, to, duration, delay]);

  return useAnimatedStyle(() => ({ opacity: op.value }));
}
