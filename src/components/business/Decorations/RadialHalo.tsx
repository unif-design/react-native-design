import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  Ellipse,
  RadialGradient as SvgRadialGradient,
  Stop,
} from 'react-native-svg';
import type { RadialHaloProps } from './types';

const DEFAULT_MAX_OPACITY = 0.16;

const buildStops = (maxOpacity: number) => [
  { offset: 0, opacity: maxOpacity },
  { offset: 0.65, opacity: 0 },
  { offset: 1, opacity: 0 },
];

/**
 * 中央径向柔光圆 / 椭圆 —— 单色等距圆形 radial gradient,3 stop 默认"中心亮、65% 处归零"。
 *
 * 渲染是 **等距圆形 gradient + Ellipse clip**,不是椭圆形随容器拉伸 ——
 * 对齐 CSS `radial-gradient(circle, ...)` 默认 ending-shape `farthest-corner`:
 * r = sqrt(cx² + cy²),65% 归零落在容器内。BBox 默认会让渐变随 rx/ry 拉伸,
 * 椭圆边缘内容会因 x 维度过早归零而透明,所以走 userSpaceOnUse + 像素 r。
 */
export function RadialHalo({
  size,
  height,
  color,
  maxOpacity = DEFAULT_MAX_OPACITY,
  stops,
  style,
  gradientId,
}: RadialHaloProps): React.JSX.Element {
  const w = size;
  const h = height ?? size;
  const autoId = useId();
  const id = gradientId ?? `rh-${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const resolvedStops = stops ?? buildStops(maxOpacity);
  const cx = w / 2;
  const cy = h / 2;
  // farthest-corner:r = 中心到最远角的距离
  const r = Math.sqrt(cx * cx + cy * cy);
  return (
    <View pointerEvents="none" style={[{ width: w, height: h }, style]}>
      <Svg width={w} height={h}>
        <Defs>
          {/* userSpaceOnUse + r=farthest-corner 实现等距圆形渐变,
              容器 Ellipse 边缘做 clip。 */}
          <SvgRadialGradient
            id={id}
            cx={cx}
            cy={cy}
            r={r}
            fx={cx}
            fy={cy}
            gradientUnits="userSpaceOnUse"
          >
            {resolvedStops.map((s, i) => (
              <Stop
                key={`${s.offset}-${i}`}
                offset={s.offset}
                stopColor={color}
                stopOpacity={s.opacity}
              />
            ))}
          </SvgRadialGradient>
        </Defs>
        <Ellipse cx={cx} cy={cy} rx={cx} ry={cy} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
