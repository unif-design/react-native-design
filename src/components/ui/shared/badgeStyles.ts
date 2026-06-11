import { StyleSheet } from 'react-native';
import {
  fw,
  r,
  radius,
  space,
  type as t,
  type ColorTokens,
} from '../../../theme';

/**
 * 角标样式工厂 —— Grid/TabBar 等组件图标右上角小红点共用。
 * @param c   颜色 token
 * @param top 角标纵向偏移(不同场景基点不同:Grid 图标 r(-6) / TabBar 图标 r(-3))
 */
export const badgeStyles = (c: ColorTokens, top: number) =>
  StyleSheet.create({
    badge: {
      position: 'absolute',
      top,
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
