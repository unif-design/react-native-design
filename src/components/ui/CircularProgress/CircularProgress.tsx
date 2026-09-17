import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  r,
  type,
  useColors,
  useFontScale,
  scaleFontMetric,
} from '../../../theme';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeCircularProgress } from './normalizeCircularProgress';
import type { CircularProgressProps } from './types';

import { styles } from './styles';

export function CircularProgress({
  value,
  size = r(32),
  thickness = r(2),
  color,
  trackColor,
  showLabel = false,
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
    dashOffset,
    percentage,
    radius,
    safeSize,
    safeThickness,
  } = normalized;
  const center = safeSize / 2;

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
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius}
            rotation={-90}
            originX={center}
            originY={center}
            stroke={color ?? colors.primary}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
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
            {`${percentage}%`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
