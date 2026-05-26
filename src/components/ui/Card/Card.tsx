import React from 'react';
import { View } from 'react-native';
import { radius, space, useShadow, useThemedStyles } from '@/theme';
import { makeStyles, variantToStyle } from './styles';
import type { CardProps } from './types';

export function Card({
  children,
  variant = 'default',
  padding,
  borderRadius,
  borderColor,
  borderWidth,
  bare,
  style,
  testID,
}: CardProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const shadow = useShadow();

  return (
    <View
      testID={testID}
      style={[
        styles.base,
        { borderRadius: borderRadius ?? radius.xl },
        !bare && { padding: padding ?? space[6] },
        variantToStyle(variant, shadow, styles),
        borderColor != null && {
          borderColor,
          borderWidth: borderWidth ?? 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
