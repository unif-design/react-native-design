/**
 * `childTestID` —— 把"父 testID + 子 id → 子 testID"的拼接逻辑收口。
 *
 * 本仓已接入的 list-like 组件(Tabs / Segmented / TabBar / Grid)原来各自重复:
 *
 * ```ts
 * const itemTestID = item.testID ?? (testID ? `${testID}-${item.id}` : undefined);
 * ```
 *
 * 抽 helper:
 * - `override` 命中(truthy)→ 用 caller 显式指定
 * - 父 `parent` 缺失 → undefined(testID 不强制)
 * - 都没问题 → `{parent}-{id}` 拼接
 *
 * 注意:与旧式 `??` 不同,**空串 override 视为未提供、回落拼接**。
 * 这是刻意设计:空 testID 没有语义价值,用例已钉死此边界
 * (`__tests__/utils/testID.test.ts:31-33`),勿改回 `??` 判定。
 */
export function childTestID(
  parent: string | undefined,
  id: string | number,
  override?: string
): string | undefined {
  if (override) return override;
  return parent ? `${parent}-${id}` : undefined;
}
