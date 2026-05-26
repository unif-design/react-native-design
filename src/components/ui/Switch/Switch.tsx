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
import { motion, r, useColors, useThemedStyles } from '@/theme';
import { INSET, makeStyles, THUMB, TRACK_W } from './styles';
import type { SwitchProps } from './types';

// ─── 动画派生常量(组件私有,非 style)─────────────────────────────────────
// 把手 translateX 的 off / on 端点:左右各留 INSET 间距,
// off = INSET(2),on = trackW - INSET - thumbW(32-2-16=14)。
// 走 r() 保证多设备缩放跟 track / thumb 物理尺寸一致(否则非设计基准设备会错位)。
const THUMB_OFF_X = r(INSET);
const THUMB_ON_X = r(TRACK_W - INSET - THUMB);

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
