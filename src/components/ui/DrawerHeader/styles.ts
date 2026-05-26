import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';
import { fw, icon, rf, space, type as t } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    header: {
      backgroundColor: c.primary,
      paddingHorizontal: space[9],
      paddingTop: space[10],
      paddingBottom: space[9],
      gap: space[3],
    },
    avatar: {
      width: icon['2xl'],
      height: icon['2xl'],
      borderRadius: icon['2xl'] / 2,
      backgroundColor: c.primaryPressed,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarImageMode: {
      overflow: 'hidden',
    },
    avatarImage: {
      width: icon['2xl'],
      height: icon['2xl'],
    },
    avatarText: {
      color: c.onPrimary,
      fontWeight: fw.bold,
      fontSize: rf(24),
    },
    name: {
      color: c.onPrimary,
      fontSize: t.h2,
      fontWeight: fw.semi,
      marginTop: space[3],
    },
    subtitle: {
      color: c.onPrimaryMuted,
      fontSize: t.xxs,
    },
  });
