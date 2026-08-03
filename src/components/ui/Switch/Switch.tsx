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
import { createLogger } from '../../../utils/logger';
import { childTestID } from '../../../utils/testID';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { makeStyles, THUMB_OFF_X, THUMB_ON_X } from './styles';
import type { SwitchProps } from './types';

const log = createLogger('Switch');

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
  const accessibleName = normalizeNonBlankText(accessibilityLabel);
  const hasBlankLabel = accessibleName === undefined;
  const isDisabled = disabled === true || hasBlankLabel;

  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(progress);
      progress.value = value ? 1 : 0;
    } else {
      progress.value = withTiming(value ? 1 : 0, { duration: motion.base });
    }
    return () => cancelAnimation(progress);
  }, [progress, reducedMotion, value]);
  useEffect(() => {
    if (hasBlankLabel) {
      log.warn('Switch accessibilityLabel 不能为空白，当前 action 已禁用。');
    }
  }, [hasBlankLabel]);

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
      accessible={!hasBlankLabel}
      onPress={isDisabled ? undefined : () => onChange(!value)}
      disabled={isDisabled}
      style={[styles.pressable, isDisabled && styles.pressableDisabled]}
      accessibilityRole={hasBlankLabel ? undefined : 'switch'}
      accessibilityState={
        hasBlankLabel ? undefined : { checked: value, disabled: isDisabled }
      }
      accessibilityLabel={accessibleName}
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
