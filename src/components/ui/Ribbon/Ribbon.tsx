import React from 'react';
import { Text, View } from 'react-native';
import {
  r,
  scaleFontMetric,
  space,
  type as t,
  useColors,
  useFontScale,
  useThemedStyles,
} from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { A11Y_HIDDEN_PROPS, A11Y_TEXT_ONLY_STYLE } from '../shared/a11y';
import { normalizeNonBlankText } from '../shared/accessibilityName';
import { resolveRibbonLayout } from './layout';
import { makeStyles, paletteFor } from './styles';
import type { RibbonProps } from './types';

export function Ribbon({
  label,
  tone = 'brand',
  children,
  accessibilityLabel,
  style,
  testID,
}: RibbonProps): React.JSX.Element {
  const c = useColors();
  const fontScale = useFontScale();
  const styles = useThemedStyles(makeStyles);
  const layout = resolveRibbonLayout({
    top: space['3'],
    barHeight: r(20),
    foldSize: r(3),
  });
  const palette = paletteFor(tone, c);
  const accessibleName = normalizeNonBlankText(accessibilityLabel);

  return (
    <View style={[styles.root, style]} testID={testID}>
      {children}
      <View
        pointerEvents="none"
        style={layout.overlay}
        testID={childTestID(testID, 'overlay')}
      >
        <View
          {...A11Y_HIDDEN_PROPS}
          style={styles.visual}
          testID={childTestID(testID, 'visual')}
        >
          <View
            style={[styles.bar, layout.bar, { backgroundColor: palette.bg }]}
            testID={childTestID(testID, 'bar')}
          >
            <Text
              style={[
                styles.text,
                {
                  color: palette.fg,
                  fontSize: scaleFontMetric(t.micro, fontScale),
                },
              ]}
            >
              {label}
            </Text>
          </View>
          <View
            style={[
              styles.fold,
              layout.fold,
              {
                borderTopColor: palette.fold,
                borderLeftColor: palette.fold,
              },
            ]}
            testID={childTestID(testID, 'fold')}
          />
        </View>
        {accessibleName === undefined ? null : (
          <Text
            accessible
            accessibilityLabel={accessibleName}
            style={A11Y_TEXT_ONLY_STYLE}
            testID={childTestID(testID, 'accessibility-label')}
          >
            {accessibleName}
          </Text>
        )}
      </View>
    </View>
  );
}
