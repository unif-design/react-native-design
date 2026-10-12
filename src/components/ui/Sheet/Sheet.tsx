import { GlassLayer } from '../GlassLayer';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { SheetProps } from './types';

export function Sheet({
  children,
  header,
  headerMode = 'fixed',
  footer,
  footerSurface = 'glass',
  contentMode = 'fixed',
  contentContainerStyle,
  footerStyle,
  style,
  testID,
}: SheetProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const overlayHeader = headerMode === 'overlay' && contentMode === 'scroll';
  const contentStyle = StyleSheet.flatten([
    styles.content,
    contentContainerStyle,
  ]);
  const paddingTop = contentStyle?.paddingTop;
  const topSpacing =
    typeof paddingTop === 'number'
      ? paddingTop
      : typeof paddingTop === 'string' && paddingTop.endsWith('%')
        ? (Number(paddingTop.slice(0, -1)) * contentWidth) / 100
        : 0;

  return (
    <View style={[styles.root, style]} testID={testID}>
      {header != null ? (
        <View
          style={overlayHeader && styles.overlayHeader}
          pointerEvents={overlayHeader ? 'box-none' : undefined}
          onLayout={
            overlayHeader
              ? (event) => setHeaderHeight(event.nativeEvent.layout.height)
              : undefined
          }
        >
          {overlayHeader ? <GlassLayer effect="clear" /> : null}
          {header}
        </View>
      ) : (
        <View style={styles.grabberContainer}>
          <View style={styles.grabber} />
        </View>
      )}
      {contentMode === 'scroll' ? (
        <ScrollView
          style={styles.contentRegion}
          onLayout={
            overlayHeader
              ? (event) => setContentWidth(event.nativeEvent.layout.width)
              : undefined
          }
          contentContainerStyle={[
            styles.content,
            contentContainerStyle,
            header != null &&
              overlayHeader && {
                paddingTop:
                  headerHeight +
                  (Number.isFinite(topSpacing) ? Math.max(0, topSpacing) : 0),
              },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[styles.contentRegion, styles.content, contentContainerStyle]}
        >
          {children}
        </View>
      )}
      {footer ? (
        <View
          style={[
            styles.footer,
            footerSurface === 'glass' && styles.glassFooter,
            footerStyle,
          ]}
        >
          {footerSurface === 'glass' ? <GlassLayer /> : null}
          {footer}
        </View>
      ) : null}
    </View>
  );
}
