import { StyleSheet } from 'react-native';
import { fixed, fw, r, space, type as t } from '@/theme';
import type { ColorTokens } from '@/theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    bar: {
      height: fixed.navbarH,
      paddingHorizontal: space[5],
      backgroundColor: c.surface,
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
      // h3=15 是 chat/ui 通用正文标题字号,navbar 标题再大 0.5 / 字距 -0.2
      // 是品牌印刷级排版微调,无对应 token,保留 inline delta(同 Privacy h1+2)
      fontSize: t.h3 + 0.5,
      fontWeight: fw.semi,
      letterSpacing: -0.2,
    },
    subtitle: {
      fontSize: t.micro,
      marginTop: r(2),
    },
  });
