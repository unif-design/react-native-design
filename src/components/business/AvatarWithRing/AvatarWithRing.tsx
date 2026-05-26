import React, { useId, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { avatarGradient, useTheme } from '@/theme';
import { makeAvatarStyles } from './styles';
import type { AvatarWithRingProps } from './types';

/**
 * 圆形头像 + 白色 ring + 品牌橙渐变底 + 品牌色 shadow。
 *
 * 用 outer shell (bg=ringColor 圆) + inner avatarCore (圆形 overflow:hidden,
 * 内含 SVG 渐变 + label) 双层模拟 ring,避免 RN Fabric `borderColor + alpha
 * + borderRadius: 50%` 的 anti-aliasing 渲染缺失(详见 styles.ts)。
 */
export function AvatarWithRing({
  label,
  size = 64,
  ringColor,
  style,
}: AvatarWithRingProps): React.JSX.Element {
  const { colors: c, shadow } = useTheme();
  const autoId = useId();
  const id = `av-${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { inner, styles } = useMemo(
    () =>
      makeAvatarStyles(size, ringColor ?? c.avatarRing, shadow.brandAvatar, c),
    [size, ringColor, c, shadow.brandAvatar]
  );
  return (
    <View style={[styles.shell, style]}>
      <View style={styles.avatarCore}>
        <Svg width={inner} height={inner} style={StyleSheet.absoluteFill}>
          <Defs>
            {/* userSpaceOnUse + 像素坐标 + Rect 数值:
                避免 BBox 0-1 模式在 RN-svg 小尺寸 + alpha 下渲染为单色。 */}
            <SvgLinearGradient
              id={id}
              x1={0}
              y1={0}
              x2={inner}
              y2={inner}
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset={0} stopColor={avatarGradient[0]} />
              <Stop offset={1} stopColor={avatarGradient[1]} />
            </SvgLinearGradient>
          </Defs>
          <Rect width={inner} height={inner} fill={`url(#${id})`} />
        </Svg>
        <Text style={[styles.label, { lineHeight: inner }]}>{label}</Text>
      </View>
    </View>
  );
}
