import React from 'react';
import Animated from 'react-native-reanimated';
import { usePulse } from '../Pulse';
import { r, useColors } from '../../../theme';
import type { SkeletonProps } from './types';

/**
 * 页面级加载占位骨架。3 个形状由 `shape` 切换。
 *
 * ```tsx
 * <Skeleton shape="line" width="60%" />        // 文本占位
 * <Skeleton shape="rect" width="100%" height={120} />  // 图片 / 卡片占位
 * <Skeleton shape="circle" size={40} />        // 头像占位
 * ```
 *
 * `usePulse({ from: 0.5 })` 每实例独立脉冲 —— native 端走 Reanimated 4 worklet,
 * web 端走 CSS transition + setInterval(零 rAF JS 帧),opacity 在 0.5~1 循环。
 * 区别于沿 X 横扫高光的流式 shimmer。 */
export function Skeleton({
  shape = 'rect',
  width,
  height,
  size = r(40),
  radius,
  style,
  testID,
}: SkeletonProps): React.JSX.Element {
  const c = useColors();
  const animatedStyle = usePulse({ from: 0.5 });

  // 按形状推默认尺寸 + 圆角;caller 显式传 width / height / radius 时 override
  const dim = (() => {
    if (shape === 'circle') {
      return { width: size, height: size, borderRadius: radius ?? size / 2 };
    }
    if (shape === 'line') {
      return {
        width: width ?? '100%',
        height: height ?? r(11),
        borderRadius: radius ?? r(3),
      };
    }
    return {
      width: width ?? '100%',
      height: height ?? r(80),
      borderRadius: radius ?? r(8),
    };
  })();

  return (
    <Animated.View
      style={[
        { ...dim, backgroundColor: c.surfaceContainerHigh },
        animatedStyle,
        style,
      ]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
