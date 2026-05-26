import { StyleSheet } from 'react-native';
import type { ColorTokens } from '@/theme';
import { fixed, fw, r, radius, space, type as t } from '@/theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    bar: {
      height: fixed.tabbarH,
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.outline,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: r(2),
    },
    label: {
      fontSize: t.nano,
      fontWeight: fw.medium,
      lineHeight: 12,
    },
    badge: {
      position: 'absolute',
      top: r(-3),
      right: r(-10),
      minWidth: r(16),
      height: r(16),
      borderRadius: radius.md,
      backgroundColor: c.error,
      paddingHorizontal: space[1],
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {
      color: c.onError,
      fontSize: t.nano,
      fontWeight: fw.bold,
      lineHeight: 12,
    },
  });
