/** Theme palettes —— 不属于 role-based ColorTokens 的"设计调色板序列"。
 *
 *  ColorTokens(`c.primary / c.foreground / ...`)给单一 role 命名,
 *  亮暗各一个 hex。某些设计需要"渐变序列"或"亮暗两套相关色组",硬塞 4 个
 *  role 进 ColorTokens 语义模糊,改放这里。
 *
 *  用法:
 *  ```ts
 *  import { useTheme, warmOrangePalette } from './';
 *  const { scheme } = useTheme();
 *  const stops = warmOrangePalette.resolve(scheme);
 *  ```
 *
 *  新增 palette 在这里加一项 + theme/index.ts 同步 export。
 */

import type { ColorScheme } from './ThemeProvider';
import { usesNativeFallbackColors } from './nativeFallbackColors';

/** 全屏沉浸暖橙 4 stop 渐变 —— ScreenBackdrop preset="warmOrange"。
 *  - light:4 stop 暖橙序列(QR / 名片 / Splash 屏沉浸亮色背景)
 *  - dark:深暖橙到黑(暗 theme 切换后仍保留橙色"温度感",底部收到 background) */
export const warmOrangePalette = {
  light: ['#FFE3C8', '#FFEED7', '#FFE6CA', '#FBD9B6'] as const,
  dark: ['#1F1208', '#170D05', '#110903', '#0A0A0A'] as const,
  /** 页面与导出图片共用实际平台配色；静态 light/dark 保留参考值。 */
  resolve(scheme: ColorScheme): readonly string[] {
    if (scheme === 'dark') return warmOrangePalette.dark;
    return usesNativeFallbackColors()
      ? nativeFallbackWarmOrangePalette
      : warmOrangePalette.light;
  },
} as const;

/** 沿用 warmOrange 的四段位置，仅替换无原生玻璃时的浅色背景。 */
const nativeFallbackWarmOrangePalette = [
  '#F9F9FB',
  '#FFFFFF',
  '#F8F8FA',
  '#F6F6F9',
] as const;

/** 图片、视频和相机保持深色取景背景，不随页面主题反转。 */
export const mediaPalette = {
  background: '#000000',
  foreground: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.4)',
} as const;

/** 相机固定深色取景与录制状态；与页面明暗主题无关。 */
export const cameraPalette = {
  black: mediaPalette.background,
  recRed: '#ff3b30',
  recordingTint: 'rgba(255,59,48,0.18)',
  watermarkShadow: 'rgba(0,0,0,0.7)',
  previewCanvas: '#1C1C1E',
} as const;

/** 扫码取景上的固定前景，保持摄像头画面上的对比度。 */
export const scannerPalette = {
  cameraBg: '#0c0b0a',
  white: mediaPalette.foreground,
  hintText: 'rgba(255,255,255,0.86)',
  toolbarLabel: 'rgba(255,255,255,0.82)',
  windowBorder: 'rgba(255,255,255,0.55)',
  crosshair: 'rgba(255,255,255,0.9)',
  textShadow: 'rgba(0,0,0,0.55)',
} as const;

/** 第三方品牌标识原色，不随应用主题改变品牌。 */
export const brandPalette = {
  wechat: '#07C160',
  wechatForeground: mediaPalette.foreground,
  dingTalk: ['#2595E8', '#3A9CED', '#59ADF8', '#6BC2FC'],
} as const;

/** 扫光动画的明暗端点；正文颜色仍跟随当前主题或调用方颜色。 */
export const shimmerPalette = {
  highlight: '#ffffff',
  whiteContrast: '#999999',
} as const;
