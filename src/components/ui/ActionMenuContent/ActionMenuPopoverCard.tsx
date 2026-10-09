import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { r, useColors, useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { ActionMenuPopoverCardProps } from './types';

export function ActionMenuPopoverCard({
  children,
  pointer,
  style,
  contentStyle,
  testID,
}: ActionMenuPopoverCardProps) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const [width, setWidth] = useState(0);
  const half = r(13);
  const offset =
    pointer && Number.isFinite(pointer.offset)
      ? Math.max(r(32), Math.min(pointer.offset, width - r(32)))
      : width / 2;
  return (
    <View
      testID={testID}
      style={[styles.popoverRoot, style]}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <View
        testID={`${testID}-card`}
        style={[styles.popoverCard, contentStyle]}
      >
        {children}
      </View>
      {pointer && width > 0 ? (
        <Svg
          testID={`${testID}-pointer-${pointer.edge}`}
          pointerEvents="none"
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          width={r(26)}
          height={r(14)}
          viewBox="0 0 26 14"
          style={[
            styles.pointer,
            { left: offset - half },
            pointer.edge === 'top'
              ? { top: -r(13) }
              : { bottom: -r(13), transform: [{ rotate: '180deg' }] },
          ]}
        >
          <Path
            d="M0 14 L10 3 Q13 0 16 3 L26 14"
            fill={colors.surface}
            stroke={colors.outline}
            strokeWidth={0.5}
          />
        </Svg>
      ) : null}
    </View>
  );
}
