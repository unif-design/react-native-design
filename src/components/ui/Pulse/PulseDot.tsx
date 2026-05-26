import React from 'react';
import Animated from 'react-native-reanimated';
import { useColors } from '../../../theme';
import { usePulse } from './usePulse';
import type { PulseDotProps } from './types';

export function PulseDot({
  size = 6,
  color,
  from = 0.5,
  to = 1,
  duration = 700,
  delay = 0,
  testID,
}: PulseDotProps = {}): React.JSX.Element {
  const c = useColors();
  const fill = color ?? c.primary;
  const animatedStyle = usePulse({ from, to, duration, delay });
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
      ]}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
