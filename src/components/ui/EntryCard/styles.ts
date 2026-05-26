import { StyleSheet } from 'react-native';
import { fw, icon, r, radius, space, type ColorTokens } from '@/theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[4],
      backgroundColor: c.surface,
      borderRadius: radius['2xl'],
      paddingVertical: space[5],
      paddingHorizontal: space[6],
    },
    iconTile: {
      width: icon.lg,
      height: icon.lg,
      // 9pt 介于 radius.md(8) / radius.lg(10) 之间,匹配 30×30 tile 的视觉圆度
      borderRadius: r(9),
      backgroundColor: c.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: space.px,
    },
    title: {
      // 13.5pt —— 介于 type.xs(13) / type.sm(14) 之间的设计稿专定字号
      fontSize: r(13) + 0.5,
      fontWeight: fw.medium,
      letterSpacing: -0.2,
      color: c.foreground,
    },
    sub: {
      fontSize: r(11),
      color: c.foregroundMuted,
    },
    pressed: {
      opacity: 0.7,
    },
  });
