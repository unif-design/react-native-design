import React from 'react';
import Animated from 'react-native-reanimated';
import { r, useColors } from '../../../theme';
import { DOT_DEFAULTS, usePulseWithDefaults } from './usePulse';
import type { PulseDotProps } from './types';

export function PulseDot({
  size = r(6),
  color,
  style,
  testID,
  ...opts
}: PulseDotProps = {}): React.JSX.Element {
  const c = useColors();
  const fill = color ?? c.primary;
  // [L-93] 圆点的 from 默认 0.5(比 <Pulse> 的 0.6 更淡)。默认值交给共享的
  // DOT_DEFAULTS,不再在解构里写 `from = 0.5` —— 那样 from 会先被默认值填满,
  // 归一化层再也分不清「调用方没传」和「调用方传了 0.5」。
  const animatedStyle = usePulseWithDefaults(opts, DOT_DEFAULTS, 'PulseDot');
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fill,
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
