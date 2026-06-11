import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

// tsconfig 不带 DOM lib(库本体是 RN),用 globalThis 兜底访问浏览器 matchMedia,
// 类型用 any 通过 strict(本文件只在 web bundle 命中,window 一定有)。
const win: any = globalThis as any;

/**
 * web:监听系统「减弱动态效果」开关,返回当前是否开启;开关变化时自动更新。
 * native 端走 reanimated 的 `ReduceMotion.System`,对应 `.ts` 版恒返回 false。
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof win.matchMedia === 'function' ? win.matchMedia(QUERY).matches : false
  );

  useEffect(() => {
    if (typeof win.matchMedia !== 'function') return;
    const mq = win.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
