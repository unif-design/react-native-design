import { StyleSheet } from 'react-native';
import type { ColorTokens } from '../../../theme';
import { fixed, r, radius, space, type as t } from '../../../theme';

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
      // [M-7] Segmented item 高原为 control.sm≈28pt < 44pt;
      // hitSlop 不越父 seg 容器边界 → 改用 minHeight 直接对齐 fixed.hitTarget(44pt)
      minHeight: fixed.hitTarget,
      paddingHorizontal: space[7],
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.sm,
    },
    segLabel: {
      fontSize: t.xs,
    },
  });
