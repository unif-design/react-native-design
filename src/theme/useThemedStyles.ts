import { useMemo } from 'react';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import type { ColorTokens } from './colors';
import type { ShadowTokens } from './shadow';
import { useTheme } from './useTheme';

/** RN 0.85 strict-api 不再导出 `StyleSheet.NamedStyles`,这里本地保留同名约束:
 *  `{ [k]: ViewStyle | TextStyle | ImageStyle }` —— 给 maker 返回值兜底。 */
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export type StylesMaker<S extends NamedStyles<S>> = (
  c: ColorTokens,
  s: ShadowTokens
) => S;

/** 应用级字号缩放只作用于文字三属性 —— 与 RN allowFontScaling 的原生缩放
 *  范围一致(只缩文字,不缩 padding / 高度等布局尺寸)。无字号系属性的
 *  style 返回原引用。strict-api 下 TextStyle 只读,用条件展开构造新对象。 */
function scaleTextStyle(style: TextStyle, factor: number): TextStyle {
  const { fontSize, lineHeight, letterSpacing } = style;
  if (
    typeof fontSize !== 'number' &&
    typeof lineHeight !== 'number' &&
    typeof letterSpacing !== 'number'
  ) {
    return style;
  }
  return {
    ...style,
    ...(typeof fontSize === 'number' ? { fontSize: fontSize * factor } : null),
    ...(typeof lineHeight === 'number'
      ? { lineHeight: lineHeight * factor }
      : null),
    ...(typeof letterSpacing === 'number'
      ? { letterSpacing: letterSpacing * factor }
      : null),
  };
}

/** maker 产物按 fontScale 缩放字号系属性。factor = 1 时恒等返回**原引用**——
 *  未接入 fontScale 的消费方(web 文档站等)行为与引用完全不变。
 *  导出仅供单测,不进 barrel。 */
export function scaleNamedStyles<S extends NamedStyles<S>>(
  styles: S,
  factor: number
): S {
  if (factor === 1) return styles;
  const out: Record<string, ViewStyle | TextStyle | ImageStyle> = {};
  for (const [key, style] of Object.entries(
    styles as Record<string, ViewStyle | TextStyle | ImageStyle>
  )) {
    // ViewStyle / ImageStyle 无字号三属性,按 TextStyle 探测后恒等返回原引用。
    out[key] =
      style && typeof style === 'object'
        ? scaleTextStyle(style as TextStyle, factor)
        : style;
  }
  return out as S;
}

/**
 * 接收 (colors, shadow) => StyleSheet 工厂,返回当前主题对应的 themed StyleSheet,
 * 并按 ThemeProvider 的 fontScale 缩放字号系属性(fontSize / lineHeight /
 * letterSpacing;fontScale = 1 时恒等)。
 *
 * 缓存依赖 [colors, shadow, fontScale, maker]。`maker` 必须定义在模块顶层
 * (不要写在组件内联),否则引用每次变,缓存失效。ThemeProvider 通过
 * useMemo([scheme, fontScale]) 保证主题不变时 colors / shadow 引用稳定。
 */
export function useThemedStyles<S extends NamedStyles<S>>(
  maker: StylesMaker<S>
): S {
  const { colors, shadow, fontScale } = useTheme();
  return useMemo(
    () => scaleNamedStyles(maker(colors, shadow), fontScale),
    [colors, shadow, fontScale, maker]
  );
}
