/**
 * `childTestID` —— 把"父 testID + 子 id → 子 testID"的拼接逻辑收口。
 *
 * 业务侧 7 处 list-like 组件(Tabs / Segmented / TabBar / Grid / Task /
 * Sources / ChainOfThought)重复同一三元:
 *
 * ```ts
 * const itemTestID = item.testID ?? (testID ? `${testID}-${item.id}` : undefined);
 * ```
 *
 * 抽 helper:
 * - `override` 命中 → 用 caller 显式指定
 * - 父 `parent` 缺失 → undefined(testID 不强制)
 * - 都没问题 → `{parent}-{id}` 拼接
 */
export function childTestID(
  parent: string | undefined,
  id: string | number,
  override?: string
): string | undefined {
  if (override) return override;
  return parent ? `${parent}-${id}` : undefined;
}
