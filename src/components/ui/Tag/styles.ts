import { StyleSheet } from 'react-native';
import { fw, radius, type ColorTokens } from '../../../theme';
import type { TagSize, TagVariant } from './types';

/** Tag 静态 base —— alignSelf 防 flex 父容器拉伸,radius 走 token。 */
export const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  text: {
    fontWeight: fw.medium,
  },
});

/** Tag 尺寸推导:md(22h / 8px / 12fs)/ lg(26h / 10px / 13fs)。
 *  新增 size 在 types.ts 加 union + 这里加 case。 */
export function sizingFor(size: TagSize): {
  h: number;
  px: number;
  fs: number;
} {
  switch (size) {
    case 'md':
      return { h: 22, px: 8, fs: 12 };
    case 'lg':
      return { h: 26, px: 10, fs: 13 };
  }
}

/** Tag 颜色推导:variant → { bg, fg, border } 三色,全走 ColorTokens。
 *  签名 `(target, context)` 与 chat/Tool 的 tintFor / variantFor / labelFor 一致。 */
export function paletteFor(variant: TagVariant, c: ColorTokens) {
  switch (variant) {
    case 'brand':
      return { bg: c.primaryContainer, fg: c.primary, border: undefined };
    case 'success':
      return { bg: c.successContainer, fg: c.success, border: undefined };
    case 'error':
      return { bg: c.errorContainer, fg: c.error, border: undefined };
    case 'info':
      return { bg: c.infoContainer, fg: c.info, border: undefined };
    case 'outline':
      return {
        bg: 'transparent' as const,
        fg: c.foregroundMuted,
        border: c.outline,
      };
    default:
      return {
        bg: c.surfaceContainerHigh,
        fg: c.foregroundMuted,
        border: undefined,
      };
  }
}
