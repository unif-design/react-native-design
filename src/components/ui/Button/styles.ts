import { StyleSheet } from 'react-native';
import {
  control,
  fw,
  r,
  radius,
  space,
  type as t,
  type ColorTokens,
} from '../../../theme';
import type {
  ButtonPalette,
  ButtonSize,
  ButtonSizing,
  ButtonVariant,
} from './types';

/** Button 静态 base —— flex 居中容器(高度 / padding / 圆角由 sizingFor 派生)。
 *  label 字号 / 颜色由 caller 注入 dynamic style。 */
export const makeStyles = (_c: ColorTokens) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontWeight: fw.semi,
    },
  });

/** Button 尺寸推导:3 档 size → { h, px, fs, br, gap }。
 *  h 走 control.<size>,br 走 radius.<size>,gap / px 走 space[].
 *  新增 size 在 types.ts 加 union + 这里加 case。 */
export function sizingFor(size: ButtonSize): ButtonSizing {
  if (size === 'lg') {
    return {
      h: control.lg,
      px: r(18),
      fs: t.body,
      br: radius.lg,
      gap: space['2'],
    };
  }
  if (size === 'sm') {
    return {
      h: control.sm,
      px: space['4'],
      fs: t.xxs,
      br: radius.sm,
      gap: space['1'],
    };
  }
  return {
    h: control.md,
    px: space['6'],
    fs: t.sm,
    br: radius.md,
    gap: space['2'],
  };
}

/** Button 配色推导:7 种 variant → { bg, fg, border }。签名与 Tag/Avatar 的 paletteFor 一致。
 *  text / ghost / neutral 共用 'transparent' 底,差异在 fg。 */
export function paletteFor(
  variant: ButtonVariant,
  c: ColorTokens
): ButtonPalette {
  switch (variant) {
    case 'primary':
      return { bg: c.primary, fg: c.onPrimary, border: undefined };
    case 'secondary':
      return {
        bg: c.surfaceContainerHigh,
        fg: c.foreground,
        border: undefined,
      };
    case 'ghost':
      return { bg: 'transparent', fg: c.primary, border: undefined };
    case 'neutral':
      return { bg: 'transparent', fg: c.foreground, border: undefined };
    case 'outline':
      return { bg: c.surface, fg: c.foreground, border: c.outline };
    case 'danger':
      return { bg: c.error, fg: c.onError, border: undefined };
    case 'text':
      return { bg: 'transparent', fg: c.primary, border: undefined };
  }
}
