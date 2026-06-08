import { StyleSheet } from 'react-native';
import { fw, r, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';

/** Confirm 对话框 styles —— 原生 Modal(transparent + slide)底部弹出卡片:
 *  backdrop 半透黑铺满、点击取消;sheet 贴底圆角顶。不依赖 @gorhom。 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.scrim,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: r(20),
      borderTopRightRadius: r(20),
      paddingTop: space['7'],
    },
    body: {
      paddingHorizontal: space['9'],
      gap: space['5'],
    },
    title: {
      fontSize: t.heroSm,
      fontWeight: fw.semi,
      color: c.foreground,
      letterSpacing: -0.2,
    },
    message: {
      fontSize: t.body,
      color: c.foregroundMuted,
      lineHeight: t.body * 1.45,
    },
    actions: {
      flexDirection: 'row',
      gap: space['4'],
      paddingHorizontal: space['9'],
      paddingTop: space['7'],
    },
  });
