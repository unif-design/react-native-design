import React, { useEffect } from 'react';
import { Pressable } from 'react-native-gesture-handler';

import Animated, {
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion, useColors, useThemedStyles } from '../../../theme';
import { makeStyles, THUMB_OFF_X, THUMB_ON_X } from './styles';
import type { SwitchProps } from './types';

/**
 * 布尔切换。32×20 轨道 + 16×16 白色把手,200ms 缓动。
 *
 * 不用 RN 原生 Switch(iOS 上无法精确还原 Unif 尺寸)。
 * reanimated 4 worklet 全程 UI 线程驱动。
 */
export function Switch({
  value,
  onChange,
  disabled,
  accessibilityLabel,
  testID,
}: SwitchProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: motion.base });
    return () => cancelAnimation(progress);
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [c.surfaceContainerHighest, c.primary]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [THUMB_OFF_X, THUMB_ON_X]
        ),
      },
    ],
  }));

  return (
    <Pressable
      onPress={() => !disabled && onChange(!value)}
      disabled={disabled}
      hitSlop={6}
      style={disabled ? styles.pressableDisabled : styles.pressableEnabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}
