import { StyleSheet } from 'react-native';
import { space } from '../../../theme';
import type { ColorTokens } from '../../../theme';

/** @gorhom 接管动画 / handle / scrim,这里只控 root flex + sheet bg + 顶部圆角 24
 *  + scrim/blur backdrop 背景色(走 c.scrim token,亮 rgba(0,0,0,0.5) / 暗 0.7)。 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    root: { flex: 1 },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: space['9'],
      borderTopRightRadius: space['9'],
    },
    /** Scrim backdrop:c.scrim token,亮暗自动切换(亮 0.5 / 暗 0.7 alpha)。
     *  与 @gorhom 默认 backgroundColor:'black' + opacity 0.5 等价但走 token。 */
    scrimBackdrop: { backgroundColor: c.scrim },
    /** Blur backdrop:bg 透明,由 BlurLayer child 接管视觉。 */
    backdropTransparent: { backgroundColor: 'transparent' },
  });
