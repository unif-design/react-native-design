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

function hasElementShape(value: React.ReactElement): boolean {
  const element = value as unknown as { type: unknown; props: unknown };
  return (
    Object.prototype.hasOwnProperty.call(value, 'type') &&
    Object.prototype.hasOwnProperty.call(value, 'props') &&
    element.type !== null &&
    element.type !== undefined &&
    typeof element.props === 'object' &&
    element.props !== null
  );
}

function isThenable(value: unknown): value is Promise<ReactNode> {
  if (
    (typeof value !== 'object' && typeof value !== 'function') ||
    value === null
  ) {
    return false;
  }
  try {
    return typeof (value as { then?: unknown }).then === 'function';
  } catch {
    return false;
  }
}

function isIterable(value: unknown): value is Iterable<ReactNode> {
  if (typeof value !== 'object' || value === null) return false;
  try {
    return (
      typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] ===
      'function'
    );
  } catch {
    return false;
  }
}

function isReactPortal(value: object): value is React.ReactPortal {
  const portal = value as {
    key?: unknown;
    containerInfo?: unknown;
  };
  const hasPortalShape =
    Object.prototype.hasOwnProperty.call(value, 'key') &&
    Object.prototype.hasOwnProperty.call(value, 'children') &&
    Object.prototype.hasOwnProperty.call(value, 'containerInfo') &&
    Object.prototype.hasOwnProperty.call(value, 'implementation') &&
    (portal.key === null || typeof portal.key === 'string') &&
    portal.containerInfo !== null &&
    portal.containerInfo !== undefined;
  if (!hasPortalShape) return false;
  try {
    // React 没有公开 portal guard；只调用公开 Children API，且该分支已排除 iterable/
    // thenable，避免消费 generator 或改变 Promise 语义。
    return React.Children.count(value as ReactNode) === 1;
  } catch {
    return false;
  }
}

function isRenderableReactNode(value: unknown): value is ReactNode {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return true;
  }
  if (React.isValidElement(value)) return hasElementShape(value);
  if (isThenable(value) || isIterable(value)) return true;
  return typeof value === 'object' && value !== null && isReactPortal(value);
}

/**
 * 未类型化边界的单一分类器。React 的公开 API 无法证明 object 不可伪造；这里拒绝
 * 结构不成立的 marker-only element 与普通 plain object，同时保留 React 19 声明的
 * bigint、Iterable、portal、Promise/thenable 等合法 ReactNode 原值。
 */
export function classifyNavBarSlot(value: unknown): NavBarSlotClassification {
  if (value === undefined || value === null || typeof value === 'boolean') {
    return { kind: 'empty' };
  }
  if (isNavBarAction(value)) return { kind: 'action', action: value };
  if (isRenderableReactNode(value)) return { kind: 'node', node: value };
  return { kind: 'invalid' };
}
