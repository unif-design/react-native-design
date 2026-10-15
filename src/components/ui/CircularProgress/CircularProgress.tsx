import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import {
  r,
  type,
  useColors,
  useFontScale,
  scaleFontMetric,
} from '../../../theme';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeCircularProgress } from './normalizeCircularProgress';
import { useCircularProgressAnimation } from './useCircularProgressAnimation';
import type { CircularProgressProps } from './types';

import { styles } from './styles';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularProgress({
  value,
  animated = false,
  onAnimationComplete,
  size = r(32),
  thickness = r(2),
  color,
  trackColor,
  showLabel = false,
  formatLabel,
  labelColor,
  accessibilityLabel = '进度',
  style,
  testID,
}: CircularProgressProps): React.JSX.Element {
  const colors = useColors();
  const fontScale = useFontScale();
  const normalized = normalizeCircularProgress({ value, size, thickness });
  const {
    circumference,
    safeValue,
    percentage,
    radius,
    safeSize,
    safeThickness,
  } = normalized;
  const center = safeSize / 2;
  const { progress, percentage: visualPercentage } =
    useCircularProgressAnimation(
      safeValue,
      animated,
      showLabel,
      onAnimationComplete
    );
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: percentage,
        text: `${percentage}%`,
      }}
      style={[
        showLabel
          ? [styles.contentSize, { minHeight: safeSize, minWidth: safeSize }]
          : { height: safeSize, width: safeSize },
        style,
        styles.center,
      ]}
      testID={testID}
    >
      <View
        style={[{ minHeight: safeSize, minWidth: safeSize }, styles.center]}
        {...A11Y_HIDDEN_PROPS}
      >
        <Svg height={safeSize} width={safeSize} style={styles.ring}>
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            stroke={trackColor ?? colors.outline}
            strokeWidth={safeThickness}
          />
          <AnimatedCircle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            rotation={-90}
            originX={center}
            originY={center}
            stroke={color ?? colors.primary}
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            strokeWidth={safeThickness}
          />
        </Svg>
        {showLabel ? (
          <Text
            style={[
              {
                color: labelColor ?? colors.foreground,
                fontSize: scaleFontMetric(type.nano, fontScale),
              },
              styles.label,
            ]}
          >
            {formatLabel
              ? formatLabel(visualPercentage)
              : `${visualPercentage}%`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
