import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';
import { fixed, fw, r, type as t } from '../../../theme';
import { badgeStyles } from '../shared/badgeStyles';

export const makeStyles = (c: ColorTokens) => {
  // TabBar 图标 22pt,角标上边缘偏移 r(-3):使圆心落在图标右上角
  const badge = badgeStyles(c, r(-3));
  return StyleSheet.create({
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
    badge: badge.badge,
    badgeText: badge.badgeText,
  });
};
