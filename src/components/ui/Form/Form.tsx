import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/theme';
import { makeStyles } from './styles';
import type { FormProps } from './types';

/**
 * 表单根容器 —— 纵向堆叠多个 FormGroup。
 */
export function Form({ children, testID }: FormProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.form} testID={testID}>
      {children}
    </View>
  );
}
