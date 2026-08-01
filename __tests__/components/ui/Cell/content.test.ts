import { describe, expect, test } from '@jest/globals';
import React from 'react';
import {
  buildCellAccessibilityLabel,
  stringifyCellText,
} from '../../../../src/components/ui/Cell/content';

const fakeElement = React.createElement('span');

describe('Cell content', () => {
  test('bigint/number 均转换为 Text 安全字符串', () => {
    expect(stringifyCellText(0)).toBe('0');
    expect(stringifyCellText(12n)).toBe('12');
  });

  test('默认 action label 按 title/desc/extra 顺序组合', () => {
    expect(
      buildCellAccessibilityLabel({
        title: '订单',
        desc: '待支付',
        extra: { kind: 'text', value: 0 },
      })
    ).toBe('订单，待支付，0');
  });

  test('display 只有非空 accessibilityText 才进入组合名称', () => {
    expect(
      buildCellAccessibilityLabel({
        title: '设备',
        extra: {
          kind: 'display',
          node: fakeElement,
          accessibilityText: '在线',
        },
      })
    ).toBe('设备，在线');
    expect(
      buildCellAccessibilityLabel({
        title: '设备',
        extra: {
          kind: 'display',
          node: fakeElement,
          accessibilityText: '   ',
        },
      })
    ).toBe('设备');
  });
});
