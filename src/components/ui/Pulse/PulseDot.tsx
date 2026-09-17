import React from 'react';
import Animated from 'react-native-reanimated';
import { r, useColors } from '../../../theme';
import { createLogger } from '../../../utils/logger';
import { usePulseAnimation } from '../shared/pulse/usePulseAnimation';
import { PULSE_DOT_DEFAULTS } from './constants';
import type { PulseDotProps } from './types';

const log = createLogger('PulseDot');

export function PulseDot({
  size = r(6),
  color,
  style,
  testID,
  ...opts
}: PulseDotProps = {}): React.JSX.Element {
  const c = useColors();
  const fill = color ?? c.primary;
  const animatedStyle = usePulseAnimation(opts, PULSE_DOT_DEFAULTS, log);
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
