import { StyleSheet } from 'react-native';
import { fw, r, space, type as t } from '../../../theme';
import type { ColorTokens } from '../../../theme';

/** Confirm 对话框 styles —— 原生 Modal(transparent + slide)底部弹出卡片:
 *  backdrop 铺满、点击取消(**不挂半透黑** —— 见 ConfirmHost 的 scrim 注释);
 *  scrim 半透黑独立一层;sheet 贴底圆角顶。不依赖 @gorhom。 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    // 半透黑遮罩层(纯视觉,不接触控):绝对定位四边贴合 backdrop,`top` 由 ConfirmHost 内联
    // 覆写成 -屏高(向上外扩一屏,盖住 Modal slide 位移期露出的顶部)。
    scrim: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.scrim,
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
