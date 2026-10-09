import { StyleSheet } from 'react-native';
import { fw, radius, space, type, type ColorTokens } from '../../../theme';

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
      borderWidth: 0.5,
      borderRadius: radius['3xl'],
      padding: space[7],
      gap: space[5],
    },
    compactTitle: {
      fontSize: type.h2,
      fontWeight: fw.semi,
      textAlign: 'center',
      paddingVertical: space[1],
    },
    compactButton: { flex: 1, borderRadius: radius.pill },
    message: { color: colors.foregroundMuted, fontSize: type.sm },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
    compactActions: {
      gap: space[2],
    },
  });
