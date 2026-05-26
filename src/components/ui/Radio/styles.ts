import { StyleSheet } from 'react-native';
import { fw, r, radius, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    group: {
      gap: space[1],
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[4],
      paddingVertical: space[2],
    },
    circle: {
      width: r(20),
      height: r(20),
      borderRadius: radius.lg,
      borderWidth: r(1.5),
      borderColor: c.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: {
      width: r(8),
      height: r(8),
      borderRadius: radius.xs,
      backgroundColor: c.primary,
    },
    label: {
      fontSize: t.sm,
      color: c.foreground,
      fontWeight: fw.regular,
    },
  });
