import { StyleSheet } from 'react-native';
import { fontMono, radius, space, type as typography } from '../../../theme';
import type { ColorTokens } from '../../../theme';
import { IMAGE_COUNTER_HEIGHT } from './constants';

export const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: { alignItems: 'center', gap: space[2] },
    media: {
      backgroundColor: 'black',
      overflow: 'hidden',
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
      position: 'absolute',
      bottom: 0,
      alignSelf: 'center',
      height: IMAGE_COUNTER_HEIGHT,
      justifyContent: 'center',
      paddingHorizontal: space[3],
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.outline,
      backgroundColor: colors.surface,
    },
    counterText: {
      color: colors.foreground,
      fontSize: typography.sm,
      fontFamily: fontMono,
    },
    deleteButton: { borderRadius: radius.pill },
  });
