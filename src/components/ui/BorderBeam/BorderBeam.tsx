import React, { useEffect, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { radius, useColors, usePrefersReducedMotion } from '../../../theme';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeBorderBeam } from './normalizeBorderBeam';
import {
  borderBeamGeometry,
  borderBeamTrail,
  EMPTY_BORDER_BEAM_LAYOUT,
} from './shared';
import { styles } from './styles';
import type { BorderBeamProps } from './types';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * 沿内容边缘循环移动的装饰性流光描边。
 *
 * 组件不承载加载、错误或焦点语义；业务状态仍由调用方自己的可访问元素表达。
 * 系统开启「减弱动态效果」时隐藏流光，只保留原内容。
 */
export function BorderBeam({
  children,
  active = true,
  color,
  duration,
  lineWidth,
  size,
  borderRadius = radius.md,
  style,
  testID,
}: BorderBeamProps): React.JSX.Element {
  const colors = useColors();
  const reducedMotion = usePrefersReducedMotion();
  const [layout, setLayout] = useState(EMPTY_BORDER_BEAM_LAYOUT);
  const normalized = normalizeBorderBeam({
    duration,
    lineWidth,
    size,
    borderRadius,
  });
  const geometry = borderBeamGeometry({ layout, ...normalized });
  const trail = borderBeamTrail(geometry.beamLength);
  const dashOffset = useSharedValue(0);
  const showVisual = active && !reducedMotion && geometry.perimeter > 0;

  useEffect(() => {
    cancelAnimation(dashOffset);
    dashOffset.value = 0;
    if (!showVisual) return;
    dashOffset.value = withRepeat(
      withTiming(-geometry.perimeter, {
        duration: normalized.duration,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.System,
      }),
      -1,
      false,
      undefined,
      ReduceMotion.System
    );
    return () => cancelAnimation(dashOffset);
  }, [dashOffset, geometry.perimeter, normalized.duration, showVisual]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));
  const handleLayout = (event: LayoutChangeEvent): void => {
    const width = Math.max(0, event.nativeEvent.layout.width);
    const height = Math.max(0, event.nativeEvent.layout.height);
    setLayout((current) =>
      current.width === width && current.height === height
        ? current
        : { width, height }
    );
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        { borderRadius: normalized.borderRadius },
        style,
      ]}
      testID={testID}
    >
      {children}
      {showVisual ? (
        <View pointerEvents="none" style={styles.visual} {...A11Y_HIDDEN_PROPS}>
          <Svg width={layout.width} height={layout.height}>
            {trail.map((layer) => (
              <AnimatedRect
                key={`${layer.length}-${layer.opacity}`}
                animatedProps={animatedProps}
                x={normalized.lineWidth / 2}
                y={normalized.lineWidth / 2}
                width={geometry.rectWidth}
                height={geometry.rectHeight}
                rx={geometry.radius}
                ry={geometry.radius}
                fill="none"
                stroke={color ?? colors.primary}
                strokeOpacity={layer.opacity}
                strokeWidth={normalized.lineWidth}
                strokeLinecap="round"
                strokeDasharray={[
                  layer.length,
                  Math.max(0, geometry.perimeter - layer.length),
                ]}
              />
            ))}
          </Svg>
        </View>
      ) : null}
    </View>
  );
}
