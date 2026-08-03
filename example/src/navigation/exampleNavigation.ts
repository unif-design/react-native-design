import type { SceneId } from '../catalog/componentCatalog';

export type RouteId = 'home' | SceneId;
export type NavigationState = readonly ['home'] | readonly ['home', SceneId];

export function navigate(
  state: NavigationState,
  scene: SceneId
): NavigationState {
  if (state[1] === scene) return state;
  return ['home', scene];
}

export function back(state: NavigationState): NavigationState {
  return shouldConsumeHardwareBack(state) ? ['home'] : state;
}

export function shouldConsumeHardwareBack(state: NavigationState): boolean {
  return state.length === 2;
}
