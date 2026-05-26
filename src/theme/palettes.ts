/** Theme palettes —— 不属于 role-based ColorTokens 的"设计调色板序列"。
 *
 *  ColorTokens(`c.primary / c.foreground / ...`)给单一 role 命名,
 *  亮暗各一个 hex。某些设计需要"渐变序列"或"亮暗两套相关色组",硬塞 4 个
 *  role 进 ColorTokens 语义模糊,改放这里。
 *
 *  用法:
 *  ```ts
 *  import { useTheme, warmOrangePalette } from '@/theme';
 *  const { scheme } = useTheme();
 *  const stops = scheme === 'dark' ? warmOrangePalette.dark : warmOrangePalette.light;
 *  ```
 *
 *  新增 palette 在这里加一项 + theme/index.ts 同步 export。
 */

/** 全屏沉浸暖橙 4 stop 渐变 —— ScreenBackdrop preset="warmOrange"。
 *  - light:4 stop 暖橙序列(QR / 名片 / Splash 屏沉浸亮色背景)
 *  - dark:深暖橙到黑(暗 theme 切换后仍保留橙色"温度感",底部收到 background) */
export const warmOrangePalette = {
  light: ['#FFE3C8', '#FFEED7', '#FFE6CA', '#FBD9B6'] as const,
  dark: ['#1F1208', '#170D05', '#110903', '#0A0A0A'] as const,
} as const;
