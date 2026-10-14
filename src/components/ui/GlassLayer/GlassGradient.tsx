import { useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { glassGradientOpacity } from './constants';
import type { GlassGradientProps } from './types';

/** 旧系统的主题玻璃近似；不宣称具有原生折射或背景模糊。 */
export function GlassGradient({ colors, effect, testID }: GlassGradientProps) {
  const id = `glass-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const opacity = glassGradientOpacity[effect];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" testID={testID}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
      >
        <Defs>
          <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop
              offset="0"
              stopColor={colors.surface}
              stopOpacity={opacity[0]}
            />
            <Stop
              offset="1"
              stopColor={colors.surfaceContainerHigh}
              stopOpacity={opacity[1]}
            />
          </LinearGradient>
        </Defs>
        <Rect width={1} height={1} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
