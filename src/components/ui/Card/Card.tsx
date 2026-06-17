import React from 'react';
import { View } from 'react-native';
import { radius, space, useShadow, useThemedStyles } from '../../../theme';
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
  fill,
  style,
  testID,
}: CardProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);
  const shadow = useShadow();
  const br = borderRadius ?? radius.xl;

  // 双层:外层持底色 + 阴影 + 圆角(无 overflow,阴影不被裁);内层持 overflow hidden
  // 按圆角裁内容 + padding + 可选边框。[H-4] iOS 上 overflow 与阴影同层会裁掉阴影。
  return (
    <View
      testID={testID}
      style={[
        styles.base,
        { borderRadius: br },
        variantToStyle(variant, shadow, styles),
        fill && styles.fill,
        style,
      ]}
    >
      <View
        style={[
          styles.clip,
          { borderRadius: br },
          fill && styles.fill,
          !bare && { padding: padding ?? space[6] },
          borderColor != null && {
            borderColor,
            borderWidth: borderWidth ?? 2,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}
