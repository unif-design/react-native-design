import { StyleSheet } from 'react-native';
import { fontMono, fw, radius, rf, space, type as t } from '../../../theme';
import type { ColorTokens, ShadowTokens } from '../../../theme';

/** 玻璃质感数据条 styles。
 *
 *  **双层结构**(必要):
 *  - `glassShell`:外层只承担 shadow + borderRadius(无 overflow:hidden);
 *    iOS Core Animation `masksToBounds=true` 会裁掉 outer shadow。
 *  - `glass`:内层承担 borderRadius + overflow:hidden + border 边线。
 *
 *  BlurView + tint 双层由 `<BlurLayer intensity="soft"/>` 接管。 */
export const makeGlassStatsStyles = (c: ColorTokens, s: ShadowTokens) => {
  /** count 数字 mono display 字号,无对应 type token,保留 rf(20) 走字号缩放(非 r)。 */
  const countSize = rf(20);
  return StyleSheet.create({
    glassShell: {
      borderRadius: radius['2xl'],
      ...s.glassBar,
    },
    glass: {
      borderRadius: radius['2xl'],
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.glassBorder,
    },
    /** 顶部 1px inset 白高光,borderTopWidth + borderRadius 让高光线只在 radius 内部弧形顶部生效。 */
    topHighlight: {
      ...StyleSheet.absoluteFill,
      borderRadius: radius['2xl'],
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.glassStatsHighlight,
    },
    inner: {
      flexDirection: 'row',
      paddingVertical: space['5'],
    },
    sep: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: c.glassSeparator,
      marginVertical: space['1'],
    },
    col: { flex: 1, alignItems: 'center' },
    countText: {
      fontSize: countSize,
      fontWeight: fw.bold,
      color: c.foreground,
      letterSpacing: -0.3,
      fontFamily: fontMono,
      lineHeight: countSize * 1.1,
    },
    labelText: {
      fontSize: t.micro,
      color: c.foregroundMuted,
      paddingTop: space['1'],
    },
  });
};
