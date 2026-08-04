import type { PublicComponentId } from '../../catalog/componentCatalog';
import {
  showcaseStateContract,
  type ShowcaseStateId,
} from '../../catalog/showcaseStateContract';

type ComponentStateId<Component extends PublicComponentId> = Extract<
  (typeof showcaseStateContract)[number],
  { component: Component }
>['id'];

type StateProofArgs<Component extends PublicComponentId> = [
  ...stateIds: ComponentStateId<Component>[],
  proof: () => void,
];

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

export function createShowcaseStateCoverage<
  Component extends PublicComponentId,
>(component: Component) {
  const required: readonly ShowcaseStateId[] = showcaseStateContract
    .filter((entry) => entry.component === component)
    .map((entry) => entry.id);
  const requiredIds = new Set<string>(required);
  const consumed = new Set<string>();

  return {
    prove(...args: StateProofArgs<Component>): void {
      // variadic tuple 在实现边界按 unknown 解析，并逐项做运行时收窄；公开签名仍
      // 保留 component → state ID 的编译期约束。
      const rawArgs: readonly unknown[] = args;
      const proof = rawArgs.at(-1);
      const stateIds = rawArgs.slice(0, -1);
      if (
        stateIds.length === 0 ||
        !stateIds.every(
          (stateId): stateId is string => typeof stateId === 'string'
        ) ||
        typeof proof !== 'function'
      ) {
        throw new Error(`${component} state proof 需要 ID 与同步 callback`);
      }

      const pending = new Set<string>();
      for (const stateId of stateIds) {
        if (!requiredIds.has(stateId)) {
          throw new Error(`${stateId} 不在 ${component} state contract 中`);
        }
        if (consumed.has(stateId) || pending.has(stateId)) {
          throw new Error(
            `${stateId} 在 ${component} state contract 中被重复证明`
          );
        }
        pending.add(stateId);
      }

      const assertionsBefore = expect.getState().assertionCalls;
      const result: unknown = proof();
      if (isThenable(result)) {
        throw new Error(`${component} state proof 只接受同步 callback`);
      }
      if (expect.getState().assertionCalls <= assertionsBefore) {
        throw new Error(
          `${component} state proof callback 必须至少产生一个 Jest assertion`
        );
      }
      for (const stateId of pending) {
        consumed.add(stateId);
      }
    },
    expectComplete(): void {
      expect([...consumed].sort()).toEqual([...required].sort());
    },
  };
}
