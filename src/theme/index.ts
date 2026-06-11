export {
  lightColors,
  darkColors,
  avatarGradient,
  BRAND_ORANGE,
} from './colors';
export type { ColorTokens } from './colors';

export { warmOrangePalette } from './palettes';

export { lightShadow, darkShadow } from './shadow';
export type { ShadowTokens } from './shadow';

export { ThemeProvider, ThemeContext } from './ThemeProvider';
export type { ColorScheme, ThemeContextValue } from './ThemeProvider';
// ThemeContext 为内部用途导出:若需子树强制主题,优先用 <ThemeProvider forceScheme> 嵌套。
// 直接自挂 Provider 须保证 value 引用稳定(每渲染新对象会打穿 useThemedStyles 缓存)。

export { useTheme, useColors, useShadow } from './useTheme';
export { useThemedStyles } from './useThemedStyles';
export type { StylesMaker } from './useThemedStyles';
export { usePrefersReducedMotion } from './usePrefersReducedMotion';

export {
  fontMono,
  type,
  fw,
  space,
  radius,
  avatar,
  icon,
  control,
  dim,
  fixed,
  motion,
  pressedOpacity,
} from './tokens';

export { blur } from './blur';
export type { BlurIntensity } from './blur';

export { r, rf } from './scale';
