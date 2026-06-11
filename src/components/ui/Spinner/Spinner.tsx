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
import { createLogger } from '../../../utils/logger';
import type { SpinnerProps } from './types';

const log = createLogger('Spinner');

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
