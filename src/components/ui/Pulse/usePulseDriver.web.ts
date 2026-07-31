import { useEffect, useState } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { usePrefersReducedMotion } from '../../../theme';
import { shouldAnimatePulse } from './normalizePulseOptions';
import type { NormalizedPulseOptions } from './normalizePulseOptions';

/**
 * Web Pulse driver —— RN-Web 上 reanimated 的 `useAnimatedStyle` 链路会在
 * `_updatePropsJS` 里对 undefined 取 `Object.keys` 而抛 TypeError,pulse 卡死在初始值。
 * 故 web 走 **CSS transition 降级**(零 rAF JS 帧):
 *
 * - `setInterval` 每隔 `duration` ms 只在 from / to 两档翻转 opacity
 *   —— setState 频率从 ~60fps 降到 1 次/duration ms(参 ToastHost.web.tsx)
 * - 补间交给浏览器 CSS transition,JS 侧零插值
 *
 * **只接受归一化产物**:duration 已被验证在 `[1, 2^31)`,不会出现 `setInterval(0)`
 * 那种「每帧触发」的退化。web 端**不跑 worklet** —— 别在文档里宣称它跑。
 */
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

  // RN-Web 把 transition 字段透传到 DOM style,实现 CSS 级平滑过渡。
  // RN 的 style typedef 没有 transition 字段,故用交叉类型补一个窄声明 ——
  // 比整块 `as any` 精确:仍然保留 opacity 的类型检查。
  return {
    opacity,
    ...(animate
      ? { transition: `opacity ${duration}ms ease-in-out` }
      : undefined),
  } as (ViewStyle | TextStyle | ImageStyle) & { transition?: string };
}
