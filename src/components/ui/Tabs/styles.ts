import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';
import { fixed, icon, r, type as t } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    under: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.outline,
    },
    underTab: {
      flex: 1,
      height: fixed.hitTarget,
      alignItems: 'center',
      justifyContent: 'center',
    },
    underLabel: {
      fontSize: t.sm,
    },
    underBar: {
      position: 'absolute',
      bottom: 0,
      height: r(2),
      width: icon.xl,
      backgroundColor: c.primary,
      borderRadius: r(1),
    },
  });
