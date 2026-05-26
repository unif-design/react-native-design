import { StyleSheet } from 'react-native';
import { fw, icon, space, type ColorTokens, type as t } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      paddingHorizontal: space[3],
      paddingVertical: space[7],
      gap: space[4],
    },
    illust: {
      width: icon['2xl'],
      height: icon['2xl'],
      borderRadius: icon['2xl'] / 2,
      backgroundColor: c.primaryContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: t.h3,
      fontWeight: fw.semi,
      color: c.foreground,
    },
    desc: {
      fontSize: t.xs,
      color: c.foregroundSubtle,
      textAlign: 'center',
    },
  });
