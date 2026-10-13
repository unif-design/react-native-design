import { StyleSheet } from 'react-native';
import { fixed, fw, r, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    bar: {
      height: fixed.navbarH,
      paddingHorizontal: space[5],
      backgroundColor: 'transparent',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.outline,
      flexDirection: 'row',
      alignItems: 'center',
    },
    barBrand: {
      backgroundColor: c.primary,
      borderBottomWidth: 0,
    },
    barTransparent: {
      backgroundColor: 'transparent',
      borderBottomWidth: 0,
    },
    side: {
      minWidth: fixed.hitTarget,
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[3],
    },
    sideRight: {
      justifyContent: 'flex-end',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: t.h1,
      fontWeight: fw.semi,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: t.micro,
      marginTop: r(2),
    },
  });
