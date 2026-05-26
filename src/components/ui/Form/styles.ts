import { StyleSheet } from 'react-native';
import {
  fw,
  r,
  radius,
  space,
  type as t,
  type ColorTokens,
} from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    form: {
      gap: space[7],
    },
    group: {
      gap: space[3],
    },
    groupLabel: {
      fontSize: t.xs,
      fontWeight: fw.semi,
      color: c.foregroundSubtle,
      textTransform: 'uppercase',
      letterSpacing: 1,
      paddingHorizontal: space[1],
    },
    groupBody: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    divider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.outline,
    },
    row: {
      paddingHorizontal: space[7],
      paddingVertical: space[5],
      minHeight: r(48),
      justifyContent: 'center',
    },
    rowMain: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[5],
    },
    rowLabel: {
      fontSize: t.sm,
      fontWeight: fw.medium,
      color: c.foreground,
    },
    required: {
      color: c.error,
    },
    rowControl: {
      flex: 1,
      alignItems: 'flex-end',
    },
    errorText: {
      fontSize: t.micro,
      color: c.error,
      marginTop: space[1],
    },
  });
