import { StyleSheet } from 'react-native';
import { fontMono, radius, space, type as typography } from '../../../theme';
import type { ColorTokens } from '../../../theme';

export const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: { alignItems: 'center', gap: space[2] },
    media: {
      backgroundColor: 'black',
      borderRadius: radius.xl,
      overflow: 'hidden',
    },
    border: {
      ...StyleSheet.absoluteFill,
      borderColor: colors.outline,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.xl,
    },
    image: { backgroundColor: 'black' },
    placeholder: {
      width: '100%',
      height: '100%',
      backgroundColor: 'black',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: space[3],
    },
    placeholderText: {
      color: 'white',
      fontSize: typography.sm,
      textAlign: 'center',
    },
    counter: {
      alignSelf: 'center',
      paddingVertical: space[1],
      paddingHorizontal: space[3],
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.glassPillBorder,
      backgroundColor: colors.glassHighlight,
    },
    counterText: {
      color: colors.foreground,
      fontSize: typography.sm,
      fontFamily: fontMono,
    },
    deleteButton: { borderRadius: radius.pill },
  });
