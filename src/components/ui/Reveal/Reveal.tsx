import React from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { motion } from '../../../theme';
import type { RevealProps } from './types';

/**
 * 内容入/出场淡入淡出容器。native 走 reanimated 的 FadeIn/FadeOut layout 动画。
 *
 * web 走 Reveal.web.tsx —— reanimated 的 layout 动画在 react-native-web 运行时会崩
 * （layoutReanimation/web 的 _updatePropsJS 里 Object.keys 抛 TypeError），那边用
 * React state + CSS transition 复刻入场淡入。
 */
export function Reveal({
  children,
  style,
  duration = motion.base,
  testID,
}: RevealProps): React.JSX.Element {
  return (
    <Animated.View
      entering={FadeIn.duration(duration)}
      exiting={FadeOut.duration(duration)}
      style={style}
      testID={testID}
    >
      {children}
    </Animated.View>
  );
}
