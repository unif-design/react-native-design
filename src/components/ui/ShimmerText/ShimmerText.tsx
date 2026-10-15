import { StyleSheet, Text } from 'react-native';
import { useColors, usePrefersReducedMotion } from '../../../theme';
import { ShimmerTextRun } from './ShimmerTextRun';
import type { ShimmerTextProps } from './types';

export function ShimmerText({
  children,
  active = true,
  style,
  ...props
}: ShimmerTextProps) {
  const colors = useColors();
  const reducedMotion = usePrefersReducedMotion();
  const color = StyleSheet.flatten(style)?.color ?? colors.foreground;
  return (
    <Text {...props} style={[{ color }, style]}>
      {active && !reducedMotion && children && typeof color === 'string' ? (
        <ShimmerTextRun
          key={`${color}:${children}`}
          text={children}
          color={color}
        />
      ) : (
        children
      )}
    </Text>
  );
}
