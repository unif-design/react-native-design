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
  const overlayHeader = headerMode === 'overlay' && contentMode === 'scroll';
  const contentStyle = StyleSheet.flatten([
    styles.content,
    contentContainerStyle,
  ]);

  return (
    <View style={[styles.root, style]} testID={testID}>
      {header != null ? (
        <View
          style={overlayHeader && styles.overlayHeader}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
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
          contentContainerStyle={[
            styles.content,
            contentContainerStyle,
            header != null &&
              overlayHeader && {
                paddingTop:
                  headerHeight +
                  (typeof contentStyle?.paddingTop === 'number'
                    ? contentStyle.paddingTop
                    : 0),
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
