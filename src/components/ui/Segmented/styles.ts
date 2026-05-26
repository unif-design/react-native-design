import { StyleSheet } from 'react-native';
import type { ColorTokens } from '@/theme';
import { control, r, radius, space, type as t } from '@/theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    seg: {
      flexDirection: 'row',
      backgroundColor: c.surfaceContainerHigh,
      borderRadius: radius.md,
      padding: r(2),
      alignSelf: 'flex-start',
    },
    segItem: {
      height: control.sm,
      paddingHorizontal: space[7],
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    segLabel: {
      fontSize: t.xs,
    },
  });
