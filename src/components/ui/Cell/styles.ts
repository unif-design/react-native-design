import { StyleSheet } from 'react-native';
import {
  fw,
  r,
  radius,
  space,
  type as t,
  type ColorTokens,
} from '../../../theme';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    cell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[5],
      paddingHorizontal: space[6],
      paddingVertical: space[6],
      minHeight: r(56),
      backgroundColor: c.surface,
      borderRadius: radius.lg,
    },
    cellFlush: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      gap: space[4],
      paddingHorizontal: r(11),
      paddingVertical: r(11),
      minHeight: 0,
    },
    cellFlushWithDesc: {
      paddingVertical: r(9),
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: r(2),
    },
    title: {
      fontSize: t.body,
      fontWeight: fw.medium,
      color: c.foreground,
      lineHeight: t.body * 1.3,
    },
    titleFlush: {
      fontSize: r(13),
      fontWeight: fw.medium,
      letterSpacing: -0.1,
      lineHeight: r(13) * 1.3,
      color: c.foreground,
    },
    desc: {
      fontSize: t.xs,
      color: c.foregroundSubtle,
      lineHeight: t.xs * 1.4,
    },
    descFlush: {
      fontSize: r(11),
      color: c.foregroundMuted,
      opacity: 0.55,
      marginTop: r(1),
    },
    extra: {
      fontSize: t.xs,
      color: c.foregroundSubtle,
    },
    extraFlush: {
      fontSize: r(11),
      color: c.foregroundMuted,
      opacity: 0.55,
    },
    chevronFlush: {
      opacity: 0.35,
    },
    /** flush 行间分隔线 —— hairline + outline,铺满 cell 全宽 */
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.outline,
    },
    list: {
      gap: space[3],
    },
    listGrouped: {
      backgroundColor: c.background,
      padding: space[3],
      borderRadius: radius.xl,
    },
    listFlush: {
      backgroundColor: 'transparent',
    },
  });
