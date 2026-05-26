import { Text, View } from 'react-native';
import { useColors } from '../../../theme';
import { paletteFor, sizingFor, styles } from './styles';
import type { TagProps } from './types';

export function Tag({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  numberOfLines = 1,
  testID,
}: TagProps) {
  const c = useColors();
  const palette = paletteFor(variant, c);
  const sizing = sizingFor(size);

  const dynamicStyle = {
    height: sizing.h,
    paddingHorizontal: sizing.px,
    backgroundColor: palette.bg,
    borderColor: palette.border ?? 'transparent',
    borderWidth: palette.border ? 1 : 0,
  };
  const dynamicTextStyle = { color: palette.fg, fontSize: sizing.fs };

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
