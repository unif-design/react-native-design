import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../../../theme';
import { shouldAnimatePulse } from './normalizePulseOptions';
import type { NormalizedPulseOptions } from './types';

/** Web 由 CSS 补间，timer 只按归一化后的半周期切换透明度；每个实例独立释放。 */
export function usePulseDriver(options: NormalizedPulseOptions) {
  const reduced = usePrefersReducedMotion();
  const animate = shouldAnimatePulse(options, reduced);
  const { from, to, duration, delay } = options;
  const [opacity, setOpacity] = useState(animate ? from : to);

  useEffect(() => {
    if (!animate) {
      // 静态 / 减弱动效:停在完全显示的一端(to),与 native driver 语义一致。
      setOpacity(to);
      return;
    }

    setOpacity(from);
    let timer: ReturnType<typeof setInterval> | null = null;
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let current = from;

    const start = () => {
      timer = setInterval(() => {
        current = current === from ? to : from;
        setOpacity(current);
      }, duration);
    };

    if (delay > 0) {
      delayTimer = setTimeout(start, delay);
    } else {
      start();
    }

    // 两个 timer 都要清:delay 期间卸载时 interval 还没建立,反之亦然。
    return () => {
      if (delayTimer != null) clearTimeout(delayTimer);
      if (timer != null) clearInterval(timer);
    };
  }, [animate, from, to, duration, delay]);

  return {
    opacity,
    ...(animate
      ? { transition: `opacity ${duration}ms ease-in-out` }
      : undefined),
  };
}
