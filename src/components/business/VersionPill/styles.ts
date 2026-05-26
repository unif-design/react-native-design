import { StyleSheet } from 'react-native';
import {
  fontMono,
  r,
  radius,
  space,
  type,
  type ColorTokens,
} from '../../../theme';

/** VersionPill 样式工厂 —— hairline 描边 + surface 底胶囊。
 *  字号走 type.microPlus(11.5),与 SplashScreen / profileCard / carousel 共用。 */
export const makeVersionPillStyles = (c: ColorTokens) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space[2],
      paddingHorizontal: r(11),
      paddingVertical: r(5),
      borderRadius: radius.pill,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.outline,
    },
    dot: {
      width: r(5),
      height: r(5),
      borderRadius: radius.pill,
    },
    version: {
      fontSize: type.microPlus,
      color: c.foregroundMuted,
      fontVariant: ['tabular-nums'],
    },
    sep: {
      opacity: 0.5,
      color: c.foregroundMuted,
      fontSize: type.microPlus,
    },
    build: {
      fontSize: type.micro,
      color: c.foregroundMuted,
      fontFamily: fontMono,
    },
  });
