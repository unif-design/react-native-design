import { View } from 'react-native';
import { useColors } from '../../../theme';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import { styles } from './styles';
import type { LinearProgressProps } from './types';

export function LinearProgress({
  value,
  thickness = 2,
  color,
  trackColor,
  accessibilityLabel = '进度',
  style,
  testID,
}: LinearProgressProps): React.JSX.Element {
  const colors = useColors();
  const safeValue = Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : 0;
  const safeThickness =
    Number.isFinite(thickness) && thickness > 0 ? thickness : 2;
  const percentage = Math.round(safeValue * 100);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
      aria-valuetext={`${percentage}%`}
      accessibilityValue={{
        min: 0,
        max: 100,
        now: percentage,
        text: `${percentage}%`,
      }}
      pointerEvents="none"
      testID={testID}
      style={[
        styles.track,
        {
          height: safeThickness,
          backgroundColor: trackColor ?? colors.surfaceContainer,
        },
        style,
      ]}
    >
      <View
        {...A11Y_HIDDEN_PROPS}
        style={[
          styles.fill,
          {
            width: `${safeValue * 100}%`,
            backgroundColor: color ?? colors.primary,
          },
        ]}
      />
    </View>
  );
}
