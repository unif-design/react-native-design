import { StyleSheet } from 'react-native';
import {
  fw,
  r,
  radius,
  space,
  type as t,
  type ColorTokens,
} from '../../../theme';
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
      return { h: r(22), px: space['3'], fs: t.xxs };
    case 'lg':
      return { h: r(26), px: space['4'], fs: t.xs };
  }
}

/** Tag 颜色推导:variant → { bg, fg, border } 三色,全走 ColorTokens。
 *  签名 `(variant, c)` 与 Button/Avatar 的 paletteFor 一致。
 *  新增 variant 在 types.ts 加 union + 这里加 case。 */
export function paletteFor(variant: TagVariant, c: ColorTokens) {
  switch (variant) {
    case 'neutral':
      return {
        bg: c.surfaceContainerHigh,
        fg: c.foregroundMuted,
        border: undefined,
      };
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
  }
}
