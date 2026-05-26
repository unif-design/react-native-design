import { describe, expect, test } from '@jest/globals';
import { childTestID } from '../../src/utils/testID';

describe('childTestID', () => {
  test('parent + string id → 拼接 "{parent}-{id}"', () => {
    expect(childTestID('Button', 'icon')).toBe('Button-icon');
  });

  test('parent + numeric id → 数字 id 序列化拼接', () => {
    expect(childTestID('Tabs', 0)).toBe('Tabs-0');
    expect(childTestID('Tabs', 3)).toBe('Tabs-3');
  });

  test('parent=undefined → 返 undefined(testID 不强制)', () => {
    expect(childTestID(undefined, 'icon')).toBeUndefined();
    expect(childTestID(undefined, 0)).toBeUndefined();
  });

  test('parent="" 视为 falsy → 返 undefined', () => {
    expect(childTestID('', 'icon')).toBeUndefined();
  });

  test('override 命中 → 直接用 caller 显式指定', () => {
    expect(childTestID('Button', 'icon', 'my-id')).toBe('my-id');
  });

  test('override 优先级最高 —— 即使 parent=undefined 也用 override', () => {
    expect(childTestID(undefined, 'icon', 'my-id')).toBe('my-id');
  });

  test('override="" 视为 falsy,fallback 到拼接逻辑', () => {
    expect(childTestID('Button', 'icon', '')).toBe('Button-icon');
  });
});
