import React from 'react';
import Animated from 'react-native-reanimated';
import { r, useColors } from '../../../theme';
import { usePulse } from './usePulse';
import type { PulseDotProps } from './types';

export function PulseDot({
  size = r(6),
  color,
  from = 0.5,
  style,
  testID,
  ...opts
}: PulseDotProps = {}): React.JSX.Element {
  const c = useColors();
  const fill = color ?? c.primary;
  // [L-93] 只显式覆盖 from(默认 0.5 与 usePulse 的 0.6 不同),其余 opts 透传 usePulse。
  const animatedStyle = usePulse({ from, ...opts });
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
