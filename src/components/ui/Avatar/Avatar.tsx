import React from 'react';
import { Text, View } from 'react-native';
import { scaleFontMetric, useColors, useFontScale } from '../../../theme';
import { resolveImageSource } from '../../../utils/imageSource';
import { ImageAttempt } from '../shared/ImageAttempt';
import {
  paletteFor,
  resolveAvatarBorderRadius,
  sizingFor,
  styles,
} from './styles';
import type { AvatarProps } from './types';

/**
 * 头像 —— 2 种形态 × 5 档尺寸 × 4 种配色 × 可选图片 source。
 *
 * 合法 source 由 keyed ImageAttempt 独立持有失败状态；非法 source 或加载失败
 * 时渲染 label + variant 背景色。
 */
export function Avatar({
  label,
  size = 'md',
  shape = 'circle',
  variant = 'neutral',
  source,
  style,
  testID,
}: AvatarProps): React.JSX.Element {
  const c = useColors();
  const fontScale = useFontScale();
  const dims = sizingFor(size);
  const palette = paletteFor(variant, c);
  const labelFontSize = scaleFontMetric(dims.fs, fontScale);
  const resolvedSource = resolveImageSource(source);
  const fallback = (
    <Text
      style={[styles.label, { fontSize: labelFontSize, color: palette.fg }]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );

  return (
    <View
      style={[
        styles.base,
        {
          width: dims.box,
          height: dims.box,
          borderRadius: resolveAvatarBorderRadius(size, shape),
          backgroundColor: palette.bg,
        },
        style,
      ]}
      accessible={!!label}
      accessibilityLabel={label}
      testID={testID}
    >
      {resolvedSource === undefined ? (
        fallback
      ) : (
        <ImageAttempt
          key={resolvedSource.key}
          source={resolvedSource.source}
          fallback={fallback}
          style={styles.image}
          resizeMode="cover"
        />
      )}
    </View>
  );
}
