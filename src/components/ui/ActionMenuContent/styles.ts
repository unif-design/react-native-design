import { StyleSheet } from 'react-native';
import {
  fixed,
  fw,
  r,
  radius,
  space,
  type as typography,
} from '../../../theme';
import type { ColorTokens, ShadowTokens } from '../../../theme';
export const makeStyles = (c: ColorTokens, shadows: ShadowTokens) =>
  StyleSheet.create({
    popoverRoot: {
      width: r(200),
      maxWidth: '100%',
      borderRadius: r(20),
      borderWidth: 0.5,
      borderColor: c.outline,
      backgroundColor: c.surface,
      ...shadows.card,
    },
    popoverCard: {
      borderRadius: r(20),
      overflow: 'hidden',
      paddingVertical: space[2],
    },
    popoverRow: {
      minHeight: fixed.hitTarget,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[5],
      paddingVertical: space[3],
      paddingHorizontal: space[6],
    },
    popoverRowPressed: { backgroundColor: c.surfaceContainer },
    popoverRowDisabled: { opacity: 0.4 },
    popoverIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceContainer,
    },
    popoverLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: typography.body,
      color: c.foreground,
    },
    popoverDanger: { color: c.error },
    popoverConfirmationActions: { paddingTop: space[2] },
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
