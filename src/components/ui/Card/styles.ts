import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ColorTokens, ShadowTokens } from '../../../theme';
import type { CardVariant } from './types';

export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    // 外层:底色 + 阴影(iOS 阴影需不透明背景才投影)。overflow hidden 不放这层 ——
    // 否则 iOS 会把 View 自己的卡片阴影一起裁掉([H-4])。
    base: {
      backgroundColor: c.surface,
    },
    // 内层:overflow hidden 按圆角裁剪内容(如贴边媒体),不影响外层阴影。
    clip: {
      overflow: 'hidden',
    },
    flat: {},
  });

/**
 * variant → 装饰样式映射(§8 返 style 值的 helper,合并入 styles.ts):
 * - `default`:`s.card` 标准卡片阴影
 * - `flat`:走 `styles.flat`(目前空,deprecated 等价 plain;保留以容纳未来差量)
 * - `plain`:`undefined`(纯白底,装饰为零)
 */
export function variantToStyle(
  v: CardVariant,
  s: ShadowTokens,
  styles: ReturnType<typeof makeStyles>
): StyleProp<ViewStyle> {
  switch (v) {
    case 'default':
      return s.card;
    case 'flat':
      return styles.flat;
    case 'plain':
      return undefined;
  }
}
