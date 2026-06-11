/**
 * Web 端 BlurLayer —— CSS `backdrop-filter` 代替 native BlurView。
 *
 * `@sbaiahmed1/react-native-blur` 不支持 web(库内部 codegenNativeComponent
 * 在浏览器会炸 "is not a function",见上游 issue #79)。docusaurus-rnw plugin
 * 配 `extensions: ['.web.tsx', ...]` 优先,webpack 选这份;Metro 不识别该后缀,
 * iOS / Android 走原 `BlurLayer.tsx`。
 */
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { blur as blurTokens, useColors, useTheme } from '../../../theme';
import type { BlurLayerProps } from './types';

export function BlurLayer({
  intensity,
  tint,
  style,
  testID,
}: BlurLayerProps): React.JSX.Element {
  const c = useColors();
  const { scheme } = useTheme();
  const blurAmount = blurTokens[intensity];
  const defaultTint =
    intensity === 'strong' ? c.sheetBackdrop : c.glassTintLight;
  // RN style typedef 不识别 web-only 属性,cast 绕过 TS;RN-Web 浏览器侧原样输出。
  // [L-15] saturate(180%):苹果 HIG 玻璃效果的标准值,增强模糊后的颜色鲜艳度,
  //   与 macOS / iOS 系统 vibrancy 视觉一致;降低会让玻璃面板显得灰暗脱色。
  // [L-15] opacity:0.96(暗色):暗色 scheme 下 backdrop-filter 在 Chromium 中
  //   opacity=1 时存在渲染 artifact(模糊层与底层内容边界锯齿),降到 0.96 消除;
  //   亮色 scheme 不受影响故保持 1。native 端 BlurLayer.tsx 用双层 View 实现,
  //   语义等价(tint 层覆盖 BlurView),无需此 opacity 补丁。
  const webBlurStyle = {
    backdropFilter: `blur(${blurAmount}px) saturate(180%)`,
    WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%)`,
    backgroundColor: tint ?? defaultTint,
    opacity: scheme === 'dark' ? 0.96 : 1,
  } as unknown as StyleProp<ViewStyle>;

  return (
    <View
      style={[StyleSheet.absoluteFill, webBlurStyle, style]}
      pointerEvents="none"
      testID={testID}
    />
  );
}
