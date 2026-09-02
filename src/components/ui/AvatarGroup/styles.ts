import { StyleSheet } from 'react-native';
import { fw, type ColorTokens } from '../../../theme';

export const makeStyles = (_colors: ColorTokens) =>
  StyleSheet.create({
    root: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    overflow: {
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    overflowText: {
      fontWeight: fw.semi,
      lineHeight: undefined,
    },
  });
