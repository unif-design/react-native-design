import { Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { r, type, useColors } from '../../../theme';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { normalizeCircularProgress } from './normalizeCircularProgress';
import type { CircularProgressProps } from './types';

const OUTER_CENTER_STYLE = {
  alignItems: 'center',
  justifyContent: 'center',
} as const satisfies ViewStyle;

const VISUAL_CONTAINER_STYLE = {
  position: 'relative',
} as const satisfies ViewStyle;

const LABEL_CENTER_STYLE = {
  fontWeight: '600',
  left: 0,
  position: 'absolute',
  textAlign: 'center',
  top: 0,
} as const satisfies TextStyle;

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
      style={[{ height: safeSize, width: safeSize }, style, OUTER_CENTER_STYLE]}
      testID={testID}
    >
      <View
        style={[{ height: safeSize, width: safeSize }, VISUAL_CONTAINER_STYLE]}
        {...A11Y_HIDDEN_PROPS}
      >
        <Svg height={safeSize} width={safeSize}>
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
                fontSize: type.nano,
                height: safeSize,
                lineHeight: safeSize,
                width: safeSize,
              },
              LABEL_CENTER_STYLE,
            ]}
          >
            {`${percentage}%`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
