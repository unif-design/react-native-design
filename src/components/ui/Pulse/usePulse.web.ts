import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../../theme';
import type { PulseOptions } from './types';

/**
 * Web 端 usePulse —— RN-Web 上 reanimated 4 + worklets 0.9.x 的 useAnimatedStyle
 * 链路会抛 `Object.keys(undefined)` TypeError(animation frame 每帧打印),pulse 卡死
 * 在初始值。这里用 React state + setInterval + CSS 等价于在两个 opacity 之间循环,
 * 返回 RN style({ opacity }),保持 native API 兼容。
 *
 * native 端走 usePulse.ts(reanimated worklet) 不动。
 *
 * 注意:实现走 React state 而非 CSS transition——因为 RN style 不支持 transition,
 *  而 setInterval 切换 opacity 加上一个外层 div 的 CSS transition 视觉上等价
 *  (transition 由 ToastHost.web.tsx 那个模式接管,这里直接用 React 切值)。
 */
export function usePulse({
  from = 0.6,
  to = 1,
  duration = 700,
  delay = 0,
}: PulseOptions = {}): { opacity: number } {
  const reduced = usePrefersReducedMotion();
  const [opacity, setOpacity] = useState(from);

  useEffect(() => {
    // reduce-motion:不脉冲,直接停在完全显示(to),骨架/圆点静态呈现([M-19] c)。
    if (reduced) {
      setOpacity(to);
      return;
    }
    let cancelled = false;
    let direction: 'up' | 'down' = 'up';
    let start = Date.now() + delay;
    let raf: number | null = null;

    const tick = () => {
      if (cancelled) return;
      const now = Date.now();
      if (now < start) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const elapsed = (now - start) % duration;
      const t = elapsed / duration; // 0→1
      const next =
        direction === 'up' ? from + (to - from) * t : to - (to - from) * t;
      setOpacity(next);
      if (elapsed + 16 >= duration) {
        direction = direction === 'up' ? 'down' : 'up';
        start = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (raf != null) cancelAnimationFrame(raf);
    };
  }, [from, to, duration, delay, reduced]);

  return { opacity: reduced ? to : opacity };
}
