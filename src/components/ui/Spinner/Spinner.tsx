import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { r, useColors } from '../../../theme';
import { sanitizeSpinnerProps } from './shared';
import type { SpinnerProps } from './types';

export function Spinner({
  size = r(18),
  color,
  thickness = r(2),
  style,
  testID,
}: SpinnerProps) {
  const c = useColors();
  const angle = useSharedValue(0);
  const stroke = color ?? c.primary;
  const { safeSize, safeThickness } = sanitizeSpinnerProps(size, thickness);

  useEffect(() => {
    // 加载指示属 essential motion(W3C):系统「减弱动态效果」下仍应旋转,否则会冻结成
    // 与空闲/完成不可区分的静止圆环(形似卡死)。显式 ReduceMotion.Never 覆盖 reanimated
    // 默认的 System —— 后者在 reduce-motion 下让 withTiming 跳端值、withRepeat 一轮即停。
    angle.value = withRepeat(
      withTiming(360, {
        duration: 900,
        easing: Easing.linear,
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
      undefined,
      ReduceMotion.Never
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
