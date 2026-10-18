import { StyleSheet } from 'react-native';
import {
  tracking,
  fixed,
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
      justifyContent: 'center',
      paddingHorizontal: space[6],
      paddingVertical: space[6],
      minHeight: r(56),
      backgroundColor: 'transparent',
      borderRadius: radius.lg,
    },
    cellContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[5],
    },
    cellContentFlush: { gap: space[4] },
    cellFlush: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      paddingHorizontal: r(11),
      paddingVertical: r(11),
      // [M-7] flush 可按压行高约 39pt < iOS HIG 44pt;用 minHeight 撑到 fixed.hitTarget
      minHeight: fixed.hitTarget,
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
      fontSize: t.xs,
      fontWeight: fw.medium,
      letterSpacing: tracking.subtle,
      lineHeight: t.xs * 1.3,
      color: c.foreground,
    },
    desc: {
      fontSize: t.xs,
      color: c.foregroundSubtle,
      lineHeight: t.xs * 1.4,
    },
    descFlush: {
      fontSize: t.micro,
      color: c.foregroundMuted,
      opacity: 0.55,
      marginTop: r(1),
    },
    extra: {
      fontSize: t.xs,
      color: c.foregroundSubtle,
    },
    extraFlush: {
      fontSize: t.micro,
      color: c.foregroundMuted,
      opacity: 0.55,
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
      padding: space[3],
      borderRadius: radius.xl,
    },
    listFlush: {
      backgroundColor: 'transparent',
    },
  });
