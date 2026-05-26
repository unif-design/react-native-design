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
  // RN style typedef 不识别 web-only 属性,cast 绕过 TS;RN-Web 浏览器侧原样输出
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
