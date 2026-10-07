import React from 'react';
import { ScrollView, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { SheetProps } from './types';

export function Sheet({
  children,
  header,
  footer,
  contentMode = 'fixed',
  contentContainerStyle,
  footerStyle,
  style,
  testID,
}: SheetProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.root, style]} testID={testID}>
      {header ?? (
        <View style={styles.grabberContainer}>
          <View style={styles.grabber} />
        </View>
      )}
      {contentMode === 'scroll' ? (
        <ScrollView
          style={styles.contentRegion}
          contentContainerStyle={[styles.content, contentContainerStyle]}
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
        <View style={[styles.footer, footerStyle]}>{footer}</View>
      ) : null}
    </View>
  );
}
