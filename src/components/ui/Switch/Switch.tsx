import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import Animated, {
  cancelAnimation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  motion,
  useColors,
  usePrefersReducedMotion,
  useThemedStyles,
} from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
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
  const reducedMotion = usePrefersReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);
  const isDisabled = disabled === true;

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(progress);
      progress.value = value ? 1 : 0;
    } else {
      progress.value = withTiming(value ? 1 : 0, { duration: motion.base });
    }
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion, value]);

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
      onPress={isDisabled ? undefined : () => onChange(!value)}
      disabled={isDisabled}
      style={[styles.pressable, isDisabled && styles.pressableDisabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: isDisabled }}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      <View
        {...A11Y_HIDDEN_PROPS}
        style={styles.visualFrame}
        testID={childTestID(testID, 'visual')}
      >
        <Animated.View
          style={[styles.track, trackStyle]}
          testID={childTestID(testID, 'track')}
        >
          <Animated.View
            style={[styles.thumb, thumbStyle]}
            testID={childTestID(testID, 'thumb')}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}
