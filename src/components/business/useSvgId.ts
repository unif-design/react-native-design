import { useId } from 'react';

export function sanitizeSvgIdPart(value: string): string {
  return value
    .replace(/[^A-Za-z0-9_.-]+/gu, '-')
    .replace(/^[.-]+|[.-]+$/gu, '');
}

export function buildSvgId(
  prefix: string,
  override: string | undefined,
  reactId: string
): string {
  const cleanOverride =
    override === undefined ? '' : sanitizeSvgIdPart(override);
  const cleanPrefix = sanitizeSvgIdPart(prefix);
  const cleanReactId = sanitizeSvgIdPart(reactId);
  const automatic =
    [cleanPrefix, cleanReactId].filter(Boolean).join('-') ||
    ['svg-id', cleanReactId].filter(Boolean).join('-') ||
    'svg-id';
  const candidate = cleanOverride || automatic;
  return /^[A-Za-z_]/u.test(candidate) ? candidate : `svg-id-${candidate}`;
}

/**
 * SVG 渐变 id 生成 hook —— 消毒 prefix、override 与 React 19 useId。
 *
 * Why:React 19 的 useId() 会返回含冒号(`:r0:`)的字符串,caller 传入的 prefix
 * 与 override 也可能包含空白或标点；统一消毒并保证合法首字符后，SVG 引用才能
 * 跨平台稳定。
 *
 * @param prefix  短前缀,区分同屏多 gradient(如 "gw" / "rh" / "av")。
 * @param override 可选:外部传入的 gradientId;消毒后非空时优先使用。
 */
export function useSvgId(prefix: string, override?: string): string {
  const reactId = useId();
  return buildSvgId(prefix, override, reactId);
}
