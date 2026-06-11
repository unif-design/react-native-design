import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from '@sbaiahmed1/react-native-blur';
import { blur as blurTokens, useColors, useTheme } from '../../../theme';
import type { BlurLayerProps } from './types';

/** Blur backdrop 双层 —— BlurView + tint。
 *
 *  blurType 跟 scheme 自动切(亮 'light' / 暗 'dark',避免暗色奶白雾)。
 *
 *  - `'soft'` 玻璃数据条 / 小区域
 *  - `'strong'` 焦点引导 backdrop(sheet 类浮层) */
export function BlurLayer({
  intensity,
  tint,
  style,
  testID,
}: BlurLayerProps): React.JSX.Element {
  const c = useColors();
  const { scheme } = useTheme();
  const blurType = scheme === 'dark' ? 'dark' : 'light';
  const defaultTint =
    intensity === 'strong' ? c.sheetBackdrop : c.glassTintLight;

  return (
    <View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
      testID={testID}
    >
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={blurType}
        blurAmount={blurTokens[intensity]}
        // iOS「降低透明度」开启时 BlurView 用纯色替换模糊;库默认 #FFFFFF 在暗色 scheme
        // 下整面刺眼白底。传随 scheme 的 surface 色,与下方 tint 层视觉一致([M-6])。
        reducedTransparencyFallbackColor={c.surface}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tint ?? defaultTint },
        ]}
      />
    </View>
  );
}
