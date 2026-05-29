import React from 'react';
import { Pressable } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { motion, r, useColors, useThemedStyles } from '../../../theme';
import { INSET, makeStyles, THUMB, TRACK_W } from './styles';
import type { SwitchProps } from './types';

// ─── 动画派生常量(组件私有,非 style)─────────────────────────────────────
// 把手 translateX 的 off / on 端点:左右各留 INSET 间距,
// off = INSET(2),on = trackW - INSET - thumbW(32-2-16=14)。
const THUMB_OFF_X = r(INSET);
const THUMB_ON_X = r(TRACK_W - INSET - THUMB);

/**
 * Web 端 Switch —— RN-Web 上 reanimated 4 + worklets 0.9.x 的 useAnimatedStyle
 * 链路会抛 `Object.keys(undefined)` TypeError(切换时打印,thumb 卡住),走 CSS
 * transition 实现 backgroundColor + translateX,native 端仍走 Switch.tsx
 * 的 reanimated 实现。
 *
 * 实现:track / thumb 仍是 RN View(尺寸 / 圆角走 RN style),把 web-only
 * backgroundColor transition 通过 `style` 行内 CSS prop 注入(RN-Web 把
 * style 数组合并到 element 的 inline style,我们补 `transition` 字段)。
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

  // 给 RN style 数组追加 web-only 字段:transition + 切换值
  const trackWebStyle = {
    ...styles.track,
    backgroundColor: value ? c.primary : c.surfaceContainerHighest,
    // RN style 不识 transition 但 RN-Web 会把它当 inline style 透传给 DOM
    transitionProperty: 'background-color',
    transitionDuration: `${motion.base}ms`,
    transitionTimingFunction: 'ease-out',
  } as unknown as object;
  const thumbWebStyle = {
    ...styles.thumb,
    transform: [{ translateX: value ? THUMB_ON_X : THUMB_OFF_X }],
    transitionProperty: 'transform',
    transitionDuration: `${motion.base}ms`,
    transitionTimingFunction: 'ease-out',
  } as unknown as object;

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
      <View style={trackWebStyle}>
        <View style={thumbWebStyle} />
      </View>
    </Pressable>
  );
}
