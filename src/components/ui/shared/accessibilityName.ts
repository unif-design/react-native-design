/** 未类型化边界只接受 trim 后非空的 string 作为业务可访问名称。 */
export function normalizeNonBlankText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}
