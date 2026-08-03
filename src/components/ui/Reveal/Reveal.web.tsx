import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { motion, usePrefersReducedMotion } from '../../../theme';
import {
  createRevealWebAnimatedStyle,
  resolveRevealWebStyle,
  scheduleRevealAnimationFrames,
} from './webTransition';
import type { RevealAnimationFrameApi } from './webTransition';
import type { RevealProps } from './types';

type WebRuntime = typeof globalThis & {
  requestAnimationFrame?: (callback: () => void) => number;
  cancelAnimationFrame?: (id: number) => void;
};

const webRuntime = globalThis as WebRuntime;

function readAnimationFrameApi(): RevealAnimationFrameApi | undefined {
  try {
    const request = webRuntime.requestAnimationFrame;
    const cancel = webRuntime.cancelAnimationFrame;
    if (typeof request !== 'function' || typeof cancel !== 'function') {
      return undefined;
    }
    return {
      requestAnimationFrame: (callback) => request.call(webRuntime, callback),
      cancelAnimationFrame: (id) => cancel.call(webRuntime, id),
    };
  } catch {
    return undefined;
  }
}

/**
 * Web 端 Reveal —— RN-Web 上 reanimated 4 的 layout 动画（FadeIn/FadeOut）会在
 * _updatePropsJS 里 Object.keys 抛 TypeError（layoutReanimation/web，渲染即每帧崩）,
 * 改用 React state + CSS transition 复刻入场淡入。退场在 web 省略（消费者卸载即移除）;
 * native 走 Reveal.tsx 的 reanimated 实现。
 *
 * caller layout 与动画 opacity 都落到同一个 RN View。双 RAF 建立 opacity:0 起点；
 * reduced motion 或 RAF 不可用时首 render 就显示，且不输出 transition。
 */
export function Reveal({
  children,
  style,
  duration = motion.base,
  testID,
}: RevealProps): React.JSX.Element {
  const reduced = usePrefersReducedMotion();
  const frameApiRef = useRef<RevealAnimationFrameApi | undefined>(
    readAnimationFrameApi()
  );
  const frameApi = frameApiRef.current;
  const canAnimate = !reduced && frameApi !== undefined;
  const [visible, setVisible] = useState(() => !canAnimate);
  const generationRef = useRef(0);
  const previousCanAnimateRef = useRef(canAnimate);
  const animationJustEnabled =
    canAnimate && previousCanAnimateRef.current === false;

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;
    previousCanAnimateRef.current = canAnimate;

    if (!canAnimate) {
      setVisible(true);
      return () => {
        if (generationRef.current === generation) {
          generationRef.current += 1;
        }
      };
    }

    setVisible(false);
    const cancelFrames = scheduleRevealAnimationFrames({
      api: frameApi,
      isCurrent: () => generationRef.current === generation,
      onVisible: () => setVisible(true),
    });

    return () => {
      if (generationRef.current === generation) {
        generationRef.current += 1;
      }
      cancelFrames();
    };
  }, [canAnimate, frameApi]);

  const resolvedStyle = resolveRevealWebStyle(style);
  const animatedWebStyle = createRevealWebAnimatedStyle({
    targetOpacity: resolvedStyle.targetOpacity,
    visible: canAnimate ? !animationJustEnabled && visible : true,
    animate: canAnimate,
    duration,
  });

  return (
    <View style={[resolvedStyle.callerStyle, animatedWebStyle]} testID={testID}>
      {children}
    </View>
  );
}
