import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { GradientWashProps } from './types';

/**
 * 垂直线性渐变 wash —— 全宽矩形 + 顶到底的 SVG LinearGradient。
 *
 * 两种用法:
 * - 简单单色:`<GradientWash height color fromOpacity toOpacity />`,内部生成 2 stop
 * - 多 stop:`<GradientWash height stops={[...]} />`
 *
 * `pointerEvents="none"` 透传,装饰层不捕事件。
 *
 * gradientId 不传时用 `useId()` 自动唯一;React 19 useId 返回含冒号 `:r0:`,
 * 不是合法 SVG id 字符,sanitize 后再用。
 */
/** 解析 rgba(r,g,b,a) 字符串拆出 alpha,返回 { color: rgb(...), opacity }。
 *  非 rgba 输入(hex / rgb / named)原样返回 + opacity=1。
 *
 *  Why:react-native-svg `<Stop stopColor>` 接 rgba 时 alpha 可能被忽略
 *  (stopColor 只解析 RGB,需要 stopOpacity 分离),拆分后跨平台一致。 */
function parseRgba(color: string): { color: string; opacity: number } {
  const m = color.match(/^rgba\(([^)]+)\)$/);
  if (!m) return { color, opacity: 1 };
  const parts = m[1].split(',').map((s) => s.trim());
  if (parts.length !== 4) return { color, opacity: 1 };
  const alpha = parseFloat(parts[3]);
  if (Number.isNaN(alpha)) return { color, opacity: 1 };
  return { color: `rgb(${parts.slice(0, 3).join(',')})`, opacity: alpha };
}

export function GradientWash(props: GradientWashProps): React.JSX.Element {
  const { height, style, gradientId } = props;
  const autoId = useId();
  const id = gradientId ?? `gw-${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const stops = props.stops ?? [
    { offset: 0, color: props.color, opacity: props.fromOpacity ?? 0.1 },
    { offset: 1, color: props.color, opacity: props.toOpacity ?? 0 },
  ];
  return (
    <View pointerEvents="none" style={[{ height }, style]}>
      <Svg width="100%" height={height}>
        <Defs>
          {/* gradientUnits="userSpaceOnUse":y1/y2 走像素坐标,
              否则默认 BBox(0–1)模式下 y2={height} 被解读为 height 倍容器高,
              渐变退化为均匀色 + 容器底硬切。 */}
          <SvgLinearGradient
            id={id}
            x1={0}
            y1={0}
            x2={0}
            y2={height}
            gradientUnits="userSpaceOnUse"
          >
            {stops.map((s, i) => {
              const parsed = parseRgba(s.color);
              const opacity = s.opacity ?? parsed.opacity;
              return (
                <Stop
                  key={`${s.offset}-${i}`}
                  offset={s.offset}
                  stopColor={parsed.color}
                  stopOpacity={opacity}
                />
              );
            })}
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height={height} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
