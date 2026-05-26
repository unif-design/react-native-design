import React from 'react';
import Animated from 'react-native-reanimated';
import { usePulse } from './usePulse';
import type { PulseProps } from './types';

export function Pulse({
  children,
  testID,
  ...opts
}: PulseProps & { children: React.ReactNode }): React.JSX.Element {
  const animatedStyle = usePulse(opts);
  return (
    <Animated.View style={animatedStyle} testID={testID}>
      {children}
    </Animated.View>
  );
}
