import { StyleSheet } from 'react-native';
import { fw, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';

/** Confirm 对话框 styles —— title/message 走 BottomSheetView 顶部段,
 *  actions 走 BottomSheetFooter 自动浮到 sheet 底部。 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    sheetBackground: {
      backgroundColor: c.surface,
    },
    sheet: {
      paddingHorizontal: space['9'],
      paddingTop: space['4'],
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
      paddingTop: space['5'],
      paddingBottom: space['7'],
    },
  });
