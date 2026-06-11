import React from 'react';
import { Text, View } from 'react-native';
import { useThemedStyles } from '../../../theme';
import { makeStyles } from './styles';
import type { FormRowProps } from './types';

/**
 * 带 label 的单行表单项。布局：左 label · 右控件。最小高度 48。
 */
export function FormRow({
  label,
  children,
  required,
  error,
  testID,
}: FormRowProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.rowMain}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
        <View style={styles.rowControl}>{children}</View>
      </View>
      {/* [L-31] accessibilityLiveRegion="polite" —— error 出现时 SR 自动播报,
          不干扰当前朗读(polite 排队等当前发言结束)。 */}
      {error ? (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
