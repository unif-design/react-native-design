import { StyleSheet } from 'react-native';
import { fw, type ColorTokens } from '../../../theme';
import type { AvatarVariant } from './types';

/** Avatar 静态 base —— 容器圆角 / 尺寸由 resolver 派生。 */
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
