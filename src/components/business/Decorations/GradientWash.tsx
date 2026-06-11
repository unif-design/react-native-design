import React from 'react';
import { View } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { useSvgId } from '../useSvgId';
import type { GradientWashProps } from './types';

/** 解析 rgba(r,g,b,a) 或 #RRGGBBAA 字符串拆出 alpha,返回 { color: rgb/hex, opacity }。
 *  非支持格式(rgb / hex / named / hsl 等)原样返回 + opacity=1。
 *
 *  支持格式:
 *  - 逗号式 rgba(r,g,b,a)       → 拆出 alpha
 *  - 8 位 hex #RRGGBBAA          → 末两位转 alpha
 *  - 其它(rgb / hex6 / named)   → 原样 + opacity=1
 *
 *  Why:react-native-svg `<Stop stopColor>` 接 rgba 时 alpha 可能被忽略
 *  (stopColor 只解析 RGB,需要 stopOpacity 分离),拆分后跨平台一致。 */
export function parseRgba(color: string): { color: string; opacity: number } {
  // 逗号式 rgba(r,g,b,a)
  const mRgba = color.match(/^rgba\(([^)]+)\)$/);
  if (mRgba?.[1]) {
    const parts = mRgba[1].split(',').map((s) => s.trim());
    if (parts.length === 4) {
      const alphaStr = parts[3];
      if (alphaStr !== undefined) {
        const alpha = parseFloat(alphaStr);
        if (!Number.isNaN(alpha)) {
          return {
            color: `rgb(${parts.slice(0, 3).join(',')})`,
            opacity: alpha,
          };
        }
      }
    }
  }
  // 8 位 hex #RRGGBBAA
  const mHex8 = color.match(
    /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
  );
  if (mHex8?.[1] && mHex8[2] && mHex8[3] && mHex8[4]) {
    const alpha = parseInt(mHex8[4], 16) / 255;
    return { color: `#${mHex8[1]}${mHex8[2]}${mHex8[3]}`, opacity: alpha };
  }
  return { color, opacity: 1 };
}

/**
 * 垂直线性渐变 wash —— 全宽矩形 + 顶到底的 SVG LinearGradient。
 *
 * 两种用法:
 * - 简单单色:`<GradientWash height color fromOpacity toOpacity />`,内部生成 2 stop
 * - 多 stop:`<GradientWash height stops={[...]} />`
 *
 * `pointerEvents="none"` 透传,装饰层不捕事件。
 *
 * gradientId 不传时由 useSvgId 自动生成唯一合法 id(消毒 React 19 useId 的冒号)。
 */
export function GradientWash(props: GradientWashProps): React.JSX.Element {
  const { height, style, gradientId } = props;
  const id = useSvgId('gw', gradientId);
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
              // s.opacity 显式传入时优先;未传(undefined)时使用 parseRgba 解出的值。
              // 注:这里是替换而非相乘 —— stops 里的 opacity 字段语义是"最终不透明度",
              // 若需要与解析色 alpha 相乘请在构建 stops 时预先合并。
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
