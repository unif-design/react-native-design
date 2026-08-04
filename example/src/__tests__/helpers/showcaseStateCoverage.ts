import type { PublicComponentId } from '../../catalog/componentCatalog';
import {
  showcaseStateContract,
  type ShowcaseStateId,
} from '../../catalog/showcaseStateContract';

type ComponentStateId<Component extends PublicComponentId> = Extract<
  (typeof showcaseStateContract)[number],
  { component: Component }
>['id'];

export function createShowcaseStateCoverage<
  Component extends PublicComponentId,
>(component: Component) {
  const required: readonly ShowcaseStateId[] = showcaseStateContract
    .filter((entry) => entry.component === component)
    .map((entry) => entry.id);
  const consumed = new Set<ShowcaseStateId>();

  return {
    consume(...stateIds: readonly ComponentStateId<Component>[]): void {
      for (const stateId of stateIds) {
        if (!required.includes(stateId)) {
          throw new Error(`${stateId} 不在 ${component} state contract 中`);
        }
        if (consumed.has(stateId)) {
          throw new Error(
            `${stateId} 在 ${component} state contract 中被重复消费`
          );
        }
        consumed.add(stateId);
      }
    },
    expectComplete(): void {
      expect([...consumed].sort()).toEqual([...required].sort());
    },
  };
}
