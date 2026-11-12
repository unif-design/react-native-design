import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
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
import { GlassLayer } from '../GlassLayer';
import {
  makeStyles,
  LABELED_THUMB_ON_X,
  THUMB_OFF_X,
  THUMB_ON_X,
} from './styles';
import type { SwitchProps } from './types';

const log = createLogger('Switch');

/**
 * 布尔切换。32×20 轨道 + 16×16 系统材质把手,200ms 缓动。
 *
 * 不用 RN 原生 Switch(iOS 上无法精确还原 Unif 尺寸)。
 * reanimated 4 worklet 全程 UI 线程驱动。
 */
export function Switch({
  value,
  onChange,
  disabled,
  accessibilityLabel,
  stateLabels,
  testID,
}: SwitchProps): React.JSX.Element {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = usePrefersReducedMotion();
  const progress = useSharedValue(value ? 1 : 0);
  const accessibleName = normalizeNonBlankText(accessibilityLabel);
  const hasBlankLabel = accessibleName === undefined;
  const isDisabled = disabled === true || hasBlankLabel;
  const label = normalizeNonBlankText(
    value ? stateLabels?.on : stateLabels?.off
  );
  const hasLabels = label !== undefined;

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
    ...(hasLabels ? { left: `${progress.value * 100}%` as const } : {}),
    transform: [
      {
        translateX: interpolate(
          progress.value,
          [0, 1],
          [THUMB_OFF_X, hasLabels ? LABELED_THUMB_ON_X : THUMB_ON_X]
        ),
      },
    ],
  }));

  return (
    <Pressable
      accessible={!hasBlankLabel}
      onPress={isDisabled ? undefined : () => onChange(!value)}
      disabled={isDisabled}
      style={[styles.pressable, hasLabels && styles.labeledPressable]}
      accessibilityRole={hasBlankLabel ? undefined : 'switch'}
      role={hasBlankLabel ? undefined : 'switch'}
      aria-checked={hasBlankLabel ? undefined : value}
      aria-disabled={hasBlankLabel ? undefined : isDisabled}
      tabIndex={isDisabled ? -1 : 0}
      accessibilityState={
        hasBlankLabel ? undefined : { checked: value, disabled: isDisabled }
      }
      accessibilityLabel={accessibleName}
      accessibilityValue={hasLabels ? { text: label } : undefined}
      testID={testID}
    >
      <View
        {...A11Y_HIDDEN_PROPS}
        style={[styles.visualFrame, hasLabels && styles.labeledFrame]}
        testID={childTestID(testID, 'visual')}
      >
        <Animated.View
          style={[
            styles.track,
            hasLabels && styles.labeledTrack,
            trackStyle,
            isDisabled && styles.trackDisabled,
          ]}
          testID={childTestID(testID, 'track')}
        >
          {hasLabels ? (
            <Text
              numberOfLines={1}
              style={[
                styles.stateLabel,
                value ? styles.labelOn : styles.labelOff,
              ]}
            >
              {label}
            </Text>
          ) : null}
        </Animated.View>
        <Animated.View
          style={[styles.thumb, hasLabels && styles.labeledThumb, thumbStyle]}
          testID={childTestID(testID, 'thumb')}
        >
          <GlassLayer
            style={styles.thumbMaterial}
            testID={childTestID(testID, 'thumb-glass')}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}
