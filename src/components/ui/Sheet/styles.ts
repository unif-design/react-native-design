import { StyleSheet } from 'react-native';
import { space, type ColorTokens } from '../../../theme';

export const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    root: {
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.surface,
    },
    grabberContainer: {
      alignItems: 'center',
      paddingTop: space['3'],
      paddingBottom: space['2'],
    },
    grabber: {
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.foregroundMuted,
    },
    contentRegion: {
      flex: 1,
      minHeight: 0,
    },
    content: {
      paddingHorizontal: space['9'],
      paddingTop: space['4'],
      paddingBottom: space['9'],
      gap: space['5'],
    },
    footer: {
      backgroundColor: colors.surface,
      paddingHorizontal: space['9'],
      paddingTop: space['5'],
      paddingBottom: space['6'],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.outline,
    },
  });
