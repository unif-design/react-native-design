import type { NavBarAction } from './types';

/**
 * Type guard：action 必须同时有 icon、可调用 handler 和非空可访问名称。
 */
export function isNavBarAction(v: unknown): v is NavBarAction {
  if (typeof v !== 'object' || v === null) return false;
  const slot = v as Record<string, unknown>;
  return (
    typeof slot.icon === 'string' &&
    typeof slot.onPress === 'function' &&
    typeof slot.accessibilityLabel === 'string' &&
    slot.accessibilityLabel.trim().length > 0
  );
}
