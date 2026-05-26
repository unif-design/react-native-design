import React, { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import type { SpinnerProps } from './types';

const log = createLogger('Spinner');

export function Spinner({
  size = 18,
  color,
  thickness = 2,
  style,
  testID,
}: SpinnerProps) {
  const c = useColors();
  const angle = useSharedValue(0);
  const stroke = color ?? c.primary;
  if (!Number.isFinite(size) || (size as number) < 8) {
    log.warn(`size 应为 ≥8 的有限数，传入 ${size}，已钳到 8`);
  }
  if (Number.isFinite(thickness) && (thickness as number) <= 0) {
    log.warn(`thickness 应为正数，传入 ${thickness}，已 fallback 为 2`);
  }
  const safeSize = Number.isFinite(size) && size > 8 ? size : 8;
  const safeThickness =
    Number.isFinite(thickness) && thickness > 0 ? thickness : 2;

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(angle);
  }, [angle]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${angle.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: safeSize,
          height: safeSize,
          borderRadius: safeSize / 2,
          borderWidth: safeThickness,
          borderColor: c.outline,
          borderTopColor: stroke,
        },
        animatedStyle,
        style,
      ]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
