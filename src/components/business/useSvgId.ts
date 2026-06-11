import { useId } from 'react';

/**
 * SVG 渐变 id 生成 hook —— 消毒 React 19 useId 中的冒号字符。
 *
 * Why:React 19 的 useId() 返回含冒号(`:r0:`)的字符串,不是合法的 SVG id 字符
 * (XML NCName 规则),直接用在 `<LinearGradient id>` / `<RadialGradient id>`
 * 会导致 SVG 引用失败。sanitize 后拼上 prefix 保证唯一且合法。
 *
 * @param prefix  短前缀,区分同屏多 gradient(如 "gw" / "rh" / "av")。
 * @param override 可选:外部传入的 gradientId;有值时直接返回,跳过 useId 分配。
 */
export function useSvgId(prefix: string, override?: string): string {
  const autoId = useId();
  if (override !== undefined) return override;
  return `${prefix}-${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
}
