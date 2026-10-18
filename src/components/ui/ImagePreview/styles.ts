import { StyleSheet } from 'react-native';
import {
  fontMono,
  mediaPalette,
  radius,
  space,
  type as typography,
} from '../../../theme';
import type { ColorTokens } from '../../../theme';
import { IMAGE_COUNTER_HEIGHT } from './constants';

export const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: { alignItems: 'center', gap: space[2] },
    media: {
      backgroundColor: mediaPalette.background,
      overflow: 'hidden',
    },
    image: { backgroundColor: mediaPalette.background },
    placeholder: {
      width: '100%',
      height: '100%',
      backgroundColor: mediaPalette.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: space[3],
    },
    placeholderText: {
      color: mediaPalette.foreground,
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
      backgroundColor: 'transparent',
      overflow: 'hidden',
    },
    counterMaterial: { borderRadius: radius.pill },
    counterText: {
      color: colors.foreground,
      fontSize: typography.sm,
      fontFamily: fontMono,
    },
    deleteButton: { borderRadius: radius.pill },
  });
