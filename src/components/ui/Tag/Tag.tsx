import { Text, View } from 'react-native';
import { scaleFontMetric, useColors, useFontScale } from '../../../theme';
import { useNativeFallbackLight } from '../../../theme/nativeFallbackStyles';
import { paletteFor, sizingFor, styles } from './styles';
import type { TagProps } from './types';

export function Tag({
  label,
  variant = 'neutral',
  size = 'md',
  fallbackPalette,
  style,
  numberOfLines = 1,
  testID,
}: TagProps) {
  const c = useColors();
  const fontScale = useFontScale();
  const palette = paletteFor(variant, c);
  const fallback = useNativeFallbackLight() ? fallbackPalette : undefined;
  const sizing = sizingFor(size);

  const dynamicStyle = {
    height: sizing.h,
    paddingHorizontal: sizing.px,
    backgroundColor: fallback?.backgroundColor ?? palette.bg,
    borderColor: fallback?.borderColor ?? palette.border ?? 'transparent',
    borderWidth: palette.border ? 1 : 0,
  };
  const dynamicTextStyle = {
    color: fallback?.color ?? palette.fg,
    fontSize: scaleFontMetric(sizing.fs, fontScale),
  };

  return (
    <View style={[styles.base, dynamicStyle, style]} testID={testID}>
      <Text
        style={[styles.text, dynamicTextStyle]}
        numberOfLines={numberOfLines}
      >
        {label}
      </Text>
    </View>
  );
}
