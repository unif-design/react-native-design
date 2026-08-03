import React, { type ReactNode } from 'react';
import { Text } from 'react-native';
import { ICONS, type IconName } from '../../../icons';
import type { NavBarAction } from './types';

export type NavBarSlotClassification =
  | { kind: 'empty' }
  | { kind: 'action'; action: NavBarAction }
  | { kind: 'node'; node: ReactNode }
  | { kind: 'invalid' };

type NormalizedNode = { kind: 'node'; node: ReactNode } | { kind: 'invalid' };

type IteratorFactoryResult =
  | { kind: 'none' }
  | { kind: 'factory'; factory: () => unknown }
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

function isThenable(value: unknown): value is ReactNode {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  try {
    return typeof (value as { then?: unknown }).then === 'function';
  } catch {
    return false;
  }
}

function getIteratorFactory(value: object): IteratorFactoryResult {
  try {
    const iterator = (value as { [Symbol.iterator]?: unknown })[
      Symbol.iterator
    ];
    if (iterator === undefined || iterator === null) return { kind: 'none' };
    if (typeof iterator !== 'function') return { kind: 'none' };
    return { kind: 'factory', factory: iterator as () => unknown };
  } catch {
    return { kind: 'invalid' };
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

function normalizeArray(
  value: unknown[],
  activeIterables: WeakSet<object>,
  path: string
): NormalizedNode {
  if (activeIterables.has(value)) return { kind: 'invalid' };
  activeIterables.add(value);
  try {
    const nodes: ReactNode[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const normalized = normalizeReactNode(
        value[index],
        activeIterables,
        `${path}.${index}`
      );
      if (normalized.kind === 'invalid') return normalized;
      nodes.push(normalized.node);
    }
    return { kind: 'node', node: nodes };
  } catch {
    return { kind: 'invalid' };
  } finally {
    activeIterables.delete(value);
  }
}

function normalizeIterable(
  value: object,
  factory: () => unknown,
  activeIterables: WeakSet<object>,
  path: string
): NormalizedNode {
  if (activeIterables.has(value)) return { kind: 'invalid' };
  activeIterables.add(value);
  let iterator: object | undefined;
  let completed = false;
  try {
    const candidate = factory.call(value);
    if (typeof candidate !== 'object' || candidate === null) {
      return { kind: 'invalid' };
    }
    iterator = candidate;
    const next = (iterator as { next?: unknown }).next;
    if (typeof next !== 'function') return { kind: 'invalid' };

    const nodes: ReactNode[] = [];
    let index = 0;
    for (;;) {
      const step = next.call(iterator);
      if (typeof step !== 'object' || step === null) {
        return { kind: 'invalid' };
      }
      const result = step as { done?: unknown; value?: unknown };
      // Iterator protocol 的 done 走 ToBoolean，而不是限制为 boolean primitive。
      if (result.done) {
        completed = true;
        return { kind: 'node', node: nodes };
      }

      const normalized = normalizeReactNode(
        result.value,
        activeIterables,
        `${path}.${index}`
      );
      if (normalized.kind === 'invalid') return normalized;
      nodes.push(normalized.node);
      index += 1;
    }
  } catch {
    return { kind: 'invalid' };
  } finally {
    if (!completed && iterator !== undefined) {
      try {
        const close = (iterator as { return?: unknown }).return;
        if (typeof close === 'function') close.call(iterator);
      } catch {
        // 分类已失败；关闭时的异常不能逃逸到 NavBar render。
      }
    }
    activeIterables.delete(value);
  }
}

function normalizeReactNode(
  value: unknown,
  activeIterables: WeakSet<object>,
  path: string
): NormalizedNode {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'bigint'
  ) {
    return {
      kind: 'node',
      node: React.createElement(Text, { key: path }, String(value)),
    };
  }
  if (value === undefined || value === null || typeof value === 'boolean') {
    return { kind: 'node', node: value };
  }
  if (React.isValidElement(value)) {
    return hasElementShape(value)
      ? { kind: 'node', node: value }
      : { kind: 'invalid' };
  }
  if (typeof value !== 'object' || value === null) {
    return { kind: 'invalid' };
  }
  if (Array.isArray(value)) {
    return normalizeArray(value, activeIterables, path);
  }

  const iterator = getIteratorFactory(value);
  if (iterator.kind === 'invalid') return iterator;
  if (iterator.kind === 'factory') {
    return normalizeIterable(value, iterator.factory, activeIterables, path);
  }
  if (isThenable(value)) return { kind: 'node', node: value };
  if (typeof value !== 'object') return { kind: 'invalid' };
  return isReactPortal(value)
    ? { kind: 'node', node: value }
    : { kind: 'invalid' };
}

/**
 * 未类型化边界的单一分类器。React 的公开 API 无法证明 object 不可伪造；这里拒绝
 * 结构不成立的 marker-only element 与普通 plain object，同时保留 React 19 声明的
 * bigint、Iterable、portal、Promise/thenable 等合法 ReactNode。Iterable 会递归验证并
 * 归一化为新数组，避免把已消费的一次性 iterator 交给 React reconciliation。
 */
export function classifyNavBarSlot(value: unknown): NavBarSlotClassification {
  if (value === undefined || value === null || typeof value === 'boolean') {
    return { kind: 'empty' };
  }
  if (isNavBarAction(value)) return { kind: 'action', action: value };
  return normalizeReactNode(value, new WeakSet<object>(), 'slot');
}
