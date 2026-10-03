import { StyleSheet } from 'react-native';
import { fw, radius, space, type as typography } from '../../../theme';
import type { ColorTokens } from '../../../theme';
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    dialogRoot: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.scrim,
    },
    sheetRoot: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: c.scrim,
    },
    dialogCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: space[4],
      width: '80%',
      maxWidth: 400,
      gap: space[2],
    },
    sheetCard: {
      backgroundColor: c.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: space[5],
      paddingTop: space[5],
      gap: space[3],
    },
    title: {
      color: c.foreground,
      fontSize: typography.sm,
      fontWeight: fw.semi,
      textAlign: 'center',
      paddingVertical: space[3],
    },
    confirmation: {
      color: c.foregroundMuted,
      fontSize: typography.xs,
      textAlign: 'center',
    },
    sheetActions: { flexDirection: 'row', flexWrap: 'wrap', gap: space[3] },
    sheetAction: { flex: 1 },
  });
