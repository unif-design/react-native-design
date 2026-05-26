import { StyleSheet, type ViewStyle } from 'react-native';
import { fw, r, type ColorTokens } from '@/theme';

/**
 * 头像样式工厂 —— **非标 maker 签名**:`(size, ringColor, shadowStyle, c)` 4 参,
 * 而非项目通用 `(c: ColorTokens, s: ShadowTokens) => StyleSheet` 2 参。
 *
 * **为何破例**:`size` / `ringColor` 是 **props 派生**(每次调用值不同,如 ring 宽度
 * = `size * 0.0625`、label 字号 = `size * 0.40`、inner 直径 = `size - ringWidth*2`),
 * 标准 `useThemedStyles(maker)` 按 `[colors, shadow]` memo 假设 maker 是模块顶层
 * 常量,无法承接 props 变化。改走调用点自带 `useMemo([size, ringColor, c,
 * shadow.brandAvatar])` 精确缓存,signature 因此带上 size/ringColor/shadow 三个
 * 运行期入参,c 仍传入用于 label 文字色。
 *
 * **不用 borderWidth + borderColor 实现 ring**:RN new arch (Fabric) 在
 * iOS 上对 `borderColor: rgba alpha + borderRadius: width/2`(完全圆)的组合
 * anti-aliasing 失败,60% 白 ring 在暗 hero 上渲染为接近透明,视觉缺失。
 *
 * 改用 outer (shell) + inner (avatarCore) 双层:
 * - shell:size×size 圆,backgroundColor = ringColor(承担 ring 视觉)+ shadow
 * - avatarCore:inner×inner 圆,在 shell 内 flex center,内部放 SVG 渐变 + label
 */
export const makeAvatarStyles = (
  size: number,
  ringColor: string,
  shadowStyle: ViewStyle,
  c: ColorTokens
) => {
  const dim = r(size);
  const half = dim / 2;
  const ringWidth = Math.max(2, r(Math.round(size * 0.0625)));
  const inner = dim - ringWidth * 2;
  const innerHalf = inner / 2;
  const styles = StyleSheet.create({
    shell: {
      width: dim,
      height: dim,
      borderRadius: half,
      backgroundColor: ringColor,
      ...shadowStyle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarCore: {
      width: inner,
      height: inner,
      borderRadius: innerHalf,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: r(Math.round(size * 0.4)),
      fontWeight: fw.bold,
      color: c.onPrimary,
      letterSpacing: -0.5,
      textAlign: 'center',
    },
  });
  return { ringWidth, dim, inner, styles };
};
