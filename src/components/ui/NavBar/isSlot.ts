import type { NavBarSlotConfig } from './types';

/**
 * Type guard：判断 left/right 是否为 NavBarSlotConfig 对象（含 icon 字段）。
 * 不是的话视为 ReactNode 自定义内容。
 */
export function isSlot(v: unknown): v is NavBarSlotConfig {
  return typeof v === 'object' && v !== null && 'icon' in v;
}
