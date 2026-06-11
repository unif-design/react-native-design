import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { motion, usePrefersReducedMotion } from '../../../theme';
import type { RevealProps } from './types';

/**
 * Web 端 Reveal —— RN-Web 上 reanimated 4 的 layout 动画（FadeIn/FadeOut）会在
 * _updatePropsJS 里 Object.keys 抛 TypeError（layoutReanimation/web，渲染即每帧崩）,
 * 改用 React state + CSS transition 复刻入场淡入。退场在 web 省略（消费者卸载即移除）;
 * native 走 Reveal.tsx 的 reanimated 实现。
 */
export function Reveal({
  children,
  style,
  duration = motion.base,
  testID,
}: RevealProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // reduce-motion:跳过淡入,内容即时呈现(与 native FadeIn 在 ReduceMotion.System 下一致)。
    if (reduced) {
      setVisible(true);
      return;
    }
    let cancelled = false;
    // 双 RAF 过一帧 commit/paint，确保 CSS transition 有 opacity:0 起点（仿 ToastHost.web）。
    rafRef.current = requestAnimationFrame(() => {
      if (cancelled) return;
      rafRef.current = requestAnimationFrame(() => {
        if (!cancelled) setVisible(true);
      });
    });
    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  const animatedWebStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transition: reduced ? undefined : `opacity ${duration}ms ease-out`,
  };

  return (
    <View style={style} testID={testID}>
      <div style={animatedWebStyle}>{children}</div>
    </View>
  );
}
