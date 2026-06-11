import { StyleSheet } from 'react-native';
import { r, radius } from '../../../theme';
import type { ColorTokens } from '../../../theme';

/** 轨道宽 32 / 高 20、把手 16×16、轨道内边距 2 —— Unif 自有 Switch 物理尺寸。
 *  导出常量给 Switch.tsx interpolate translateX 复用(走 r() 保证多设备一致缩放)。 */
export const TRACK_W = 32;
export const TRACK_H = 20;
export const THUMB = 16;
export const INSET = 2;

/** [M-25] 把手 translateX 端点 —— 与 styles 同源导出,Switch.tsx / Switch.web.tsx 两端 import。
 *  off = INSET(2),on = TRACK_W - INSET - THUMB(32-2-16=14)。走 r() 保证多设备缩放一致。 */
export const THUMB_OFF_X = r(INSET);
export const THUMB_ON_X = r(TRACK_W - INSET - THUMB);

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    pressableEnabled: {
      opacity: 1,
      // [L-37] alignSelf:'flex-start' 防止父容器拉伸把手区域(与 Chip [M-8] 同口径)
      alignSelf: 'flex-start' as const,
    },
    pressableDisabled: {
      opacity: 0.5,
      alignSelf: 'flex-start' as const,
    },
    track: {
      width: r(TRACK_W),
      height: r(TRACK_H),
      borderRadius: radius.lg,
      justifyContent: 'center',
    },
    thumb: {
      width: r(THUMB),
      height: r(THUMB),
      // [L-79] radius.pill —— sentinel 999 确保把手始终是真圆
      borderRadius: radius.pill,
      backgroundColor: c.onPrimary,
    },
  });
