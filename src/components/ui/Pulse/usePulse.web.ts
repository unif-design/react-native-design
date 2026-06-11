import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../../theme';
import type { PulseOptions } from './types';

/**
 * Web 端 usePulse —— RN-Web 上 reanimated 4 + worklets 0.9.x 的 useAnimatedStyle
 * 链路会抛 `Object.keys(undefined)` TypeError(animation frame 每帧打印),pulse 卡死
 * 在初始值。
 *
 * native 端走 usePulse.ts(reanimated worklet) 不动。
 *
 * [M-19] 实现方案 —— CSS transition 降级(零 rAF JS 帧):
 *   rnw 0.21 的 animationKeyframes 字段类型侧尚未稳定暴露;
 *   且 <style> 注入在 Spinner.web.tsx 已有安全注释(不拼外部输入)——为保持
 *   一致性,Pulse 侧不再注入第二处 <style> 标签,故采用 CSS transition 降级:
 *
 *   - 返回 { opacity, transition } 作为 RN style(RN-Web 把 transition 透传 DOM)
 *   - setInterval 每隔 `duration` ms 在 from/to 两档切换 opacity ——
 *     setState 频率从原来的 ~60fps 降到 1 次/duration ms(参 ToastHost.web.tsx)
 *   - CSS transition 负责两档之间的视觉补间,JS 侧零插值
 *   - reduce-motion:静止于 `to`(完全显示),骨架/圆点静态呈现
 */
export function usePulse({
  from = 0.6,
  to = 1,
  duration = 700,
  delay = 0,
}: PulseOptions = {}) {
  const reduced = usePrefersReducedMotion();
  const [opacity, setOpacity] = useState(from);

  useEffect(() => {
    // reduce-motion:不脉冲,直接停在完全显示(to),骨架/圆点静态呈现。
    if (reduced) {
      setOpacity(to);
      return;
    }

    // CSS transition 模式:setInterval 只负责在 from/to 两档翻转(1 次/duration ms),
    // 浏览器 CSS transition 负责补间 —— 与原方案 rAF 每帧 setState 相比
    // setState 频率从 ~60fps 降到 1/(duration/1000) fps,无 JS 插值开销。
    let timer: ReturnType<typeof setInterval> | null = null;
    let current = from;

    const start = () => {
      timer = setInterval(() => {
        current = current === from ? to : from;
        setOpacity(current);
      }, duration);
    };

    if (delay > 0) {
      const delayTimer = setTimeout(start, delay);
      return () => {
        clearTimeout(delayTimer);
        if (timer != null) clearInterval(timer);
      };
    }
    start();
    return () => {
      if (timer != null) clearInterval(timer);
    };
  }, [from, to, duration, delay, reduced]);

  if (reduced) {
    return { opacity: to } as any;
  }

  // RN-Web 把 transition 字段透传到 DOM style,实现 CSS 级平滑过渡。
  // RN style typedef 无 transition 字段,cast any 绕过 TS strict
  // (实际只在 web bundle 命中,DOM div 原样接受该字段)。

  return { opacity, transition: `opacity ${duration}ms ease-in-out` } as any;
}
