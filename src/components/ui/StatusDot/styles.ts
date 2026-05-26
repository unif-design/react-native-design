import { StyleSheet } from 'react-native';
import { r, type ColorTokens } from '@/theme';
import type { StatusDotStatus, StatusDotTone } from './types';

/**
 * StatusDot 静态样式。
 * 尺寸 / 圆角 / 颜色都是动态值（按 size + status + tone 计算），inline 注入；
 * 这里只承载所有 status 共用的静态属性。
 */
export const styles = StyleSheet.create({
  dot: {
    borderWidth: r(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/** StatusDot 颜色推导:status × tone → { bg, border } 二色,全走 ColorTokens。
 *  签名 `(target, context, tokens)` 与 Tag/Tool 的 paletteFor 一致。
 *  `flat` = pending/active 底色透明；`soft` = pending 走 surface、active 走 primaryContainer。 */
export function paletteFor(
  status: StatusDotStatus,
  tone: StatusDotTone,
  c: ColorTokens
): { bg: string; border: string } {
  switch (status) {
    case 'done':
      return { bg: c.success, border: c.success };
    case 'active':
      return {
        bg: tone === 'soft' ? c.primaryContainer : 'transparent',
        border: c.primary,
      };
    case 'pending':
      return {
        bg: tone === 'soft' ? c.surface : 'transparent',
        border: c.outline,
      };
  }
}
