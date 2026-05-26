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

/**
 * 接收 (colors, shadow) => StyleSheet 工厂,返回当前主题对应的 themed StyleSheet。
 *
 * 缓存依赖 [colors, shadow, maker]。`maker` 必须定义在模块顶层(不要写在组件内联),
 * 否则引用每次变,缓存失效。ThemeProvider 通过 useMemo([scheme]) 保证主题不变时
 * colors / shadow 引用稳定。
 */
export function useThemedStyles<S extends NamedStyles<S>>(
  maker: StylesMaker<S>
): S {
  const { colors, shadow } = useTheme();
  return useMemo(() => maker(colors, shadow), [colors, shadow, maker]);
}
