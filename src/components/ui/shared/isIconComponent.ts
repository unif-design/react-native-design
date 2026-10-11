import {
  createElement,
  type ComponentType,
  type MemoExoticComponent,
} from 'react';
import type { IconProps } from '@unif/react-native-icons';
import { isForwardRef, isMemo } from 'react-is';

export function isIconComponent(
  value: unknown
): value is ComponentType<IconProps> {
  const seen = new Set<object>();
  while (typeof value === 'object' && value !== null) {
    if (seen.has(value)) return false;
    seen.add(value);

    const element = createElement(value as ComponentType<IconProps>);
    if (isForwardRef(element)) return true;
    if (!isMemo(element)) return false;
    value = (value as MemoExoticComponent<ComponentType<IconProps>>).type;
  }
  return typeof value === 'function';
}
