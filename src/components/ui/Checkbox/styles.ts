import { StyleSheet } from 'react-native';
import { fw, r, radius, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[4],
    },
    box: {
      width: r(20),
      height: r(20),
      borderRadius: radius.xs,
      borderWidth: r(1.5),
      borderColor: c.outline,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: t.sm,
      color: c.foreground,
      fontWeight: fw.regular,
    },
  });
