import { StyleSheet } from 'react-native';
import { fw, r, radius, space, type, type ColorTokens } from '../../../theme';

export const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    root: {
      gap: space[4],
      padding: space[5],
      borderWidth: 1,
      borderColor: colors.outline,
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
    },
    title: { color: colors.foreground, fontSize: type.h3, fontWeight: fw.semi },
    compactRoot: {
      borderWidth: 0,
      borderRadius: r(14),
      padding: space[6],
      gap: space[5],
    },
    compactTitle: { fontSize: type.sm },
    message: { color: colors.foregroundMuted, fontSize: type.sm },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
    compactActions: {
      justifyContent: 'flex-end',
      gap: space[4],
    },
  });
