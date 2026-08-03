import { describe, expect, test } from '@jest/globals';
import { gridItemAccessibilityLabel } from '../../../../src/components/ui/Grid/accessibility';

describe('gridItemAccessibilityLabel', () => {
  test('默认 label 保留 badge 0', () => {
    expect(gridItemAccessibilityLabel({ label: '消息', badge: 0 })).toBe(
      '消息，0'
    );
  });

  test('badge 缺省时只返回 label', () => {
    expect(gridItemAccessibilityLabel({ label: '设置' })).toBe('设置');
  });

  test('非空显式名称优先于默认名称', () => {
    expect(
      gridItemAccessibilityLabel({
        label: '消息',
        badge: '99+',
        accessibilityLabel: '未读消息',
      })
    ).toBe('未读消息');
  });

  test('空白显式名称回退到 label 与 badge', () => {
    expect(
      gridItemAccessibilityLabel({
        label: '消息',
        badge: 3,
        accessibilityLabel: '  ',
      })
    ).toBe('消息，3');
  });

  test('显式和可见名称都空白时不创建 unnamed merged node', () => {
    expect(
      gridItemAccessibilityLabel({
        label: '   ',
        accessibilityLabel: '\t',
      })
    ).toBeUndefined();
  });
});
