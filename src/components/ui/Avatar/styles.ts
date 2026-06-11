import { StyleSheet } from 'react-native';
import { avatar, fw, type ColorTokens } from '../../../theme';
import type { AvatarSize, AvatarVariant } from './types';

/** Avatar 静态 base —— 圆形容器(borderRadius / 尺寸由 sizingFor 派生)。 */
export const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontWeight: fw.semi,
    lineHeight: undefined,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

/** Avatar 尺寸推导:5 档 size → { box, fs }。box 走 avatar.<size> token。
 *  新增 size 在 types.ts 加 union + 这里加 case + tokens.ts 补 avatar.<key>。 */
export function sizingFor(size: AvatarSize): { box: number; fs: number } {
  switch (size) {
    case 'xs':
      return { box: avatar.xs, fs: 10 };
    case 'sm':
      return { box: avatar.sm, fs: 12 };
    case 'md':
      return { box: avatar.md, fs: 13 };
    case 'lg':
      return { box: avatar.lg, fs: 15 };
    case 'xl':
      return { box: avatar.xl, fs: 20 };
  }
}

/** Avatar 配色推导:4 种 variant → { bg, fg }。签名与 Tag/Button 的 paletteFor 一致。 */
export function paletteFor(
  variant: AvatarVariant,
  c: ColorTokens
): { bg: string; fg: string } {
  switch (variant) {
    case 'brand':
      return { bg: c.primary, fg: c.onPrimary };
    case 'info':
      return { bg: c.info, fg: c.onInfo };
    case 'soft':
      return { bg: c.primaryContainer, fg: c.primary };
    case 'neutral':
      return { bg: c.surfaceContainerHighest, fg: c.foreground };
  }
}
