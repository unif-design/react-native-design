import React, { type ReactNode } from 'react';
import { ICONS, type IconName } from '../../../icons';
import type { NavBarAction } from './types';

export type NavBarSlotClassification =
  | { kind: 'empty' }
  | { kind: 'action'; action: NavBarAction }
  | { kind: 'node'; node: ReactNode }
  | { kind: 'invalid' };

function isIconName(value: unknown): value is IconName {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(ICONS, value)
  );
}

/**
 * Type guard：action 的 icon 必须真实存在于生成的 registry，且有 handler 与非空名称。
 */
export function isNavBarAction(v: unknown): v is NavBarAction {
  if (typeof v !== 'object' || v === null) return false;
  const slot = v as Record<string, unknown>;
  return (
    isIconName(slot.icon) &&
    typeof slot.onPress === 'function' &&
    typeof slot.accessibilityLabel === 'string' &&
    slot.accessibilityLabel.trim().length > 0
  );
}

function isRenderableReactNode(value: unknown): value is ReactNode {
  if (typeof value === 'string' || typeof value === 'number') return true;
  if (Array.isArray(value)) return value.every(isRenderableReactNode);
  return React.isValidElement(value);
}

/**
 * 未类型化边界的单一分类器。仅接受 React 公开 `isValidElement` 能验证的 element、
 * 基础可渲染值及其数组；任意 plain object（包括伪造 `$$typeof`）都不进入 React 渲染。
 */
export function classifyNavBarSlot(value: unknown): NavBarSlotClassification {
  if (value === undefined || value === null || typeof value === 'boolean') {
    return { kind: 'empty' };
  }
  if (isNavBarAction(value)) return { kind: 'action', action: value };
  if (isRenderableReactNode(value)) return { kind: 'node', node: value };
  return { kind: 'invalid' };
}
