import { StyleSheet } from 'react-native';
import { r, radius } from '@/theme';
import type { ColorTokens } from '@/theme';

/** 轨道宽 32 / 高 20、把手 16×16、轨道内边距 2 —— Unif 自有 Switch 物理尺寸。
 *  导出常量给 Switch.tsx interpolate translateX 复用(走 r() 保证多设备一致缩放)。 */
export const TRACK_W = 32;
export const TRACK_H = 20;
export const THUMB = 16;
export const INSET = 2;

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    pressableEnabled: {
      opacity: 1,
    },
    pressableDisabled: {
      opacity: 0.5,
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
      borderRadius: radius.md,
      backgroundColor: c.onPrimary,
    },
  });
