import { describe, expect, test } from '@jest/globals';
import React from 'react';
import {
  buildCellAccessibilityLabel,
  resolveCellActionAccessibilityLabel,
  resolveCellTitleColor,
  resolveExtraSemanticText,
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

  test('actionable display 只有非空 accessibilityText 才进入组合名称', () => {
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

  test('空白显式名称回退到生成名称并 trim 各片段', () => {
    expect(
      resolveCellActionAccessibilityLabel({
        accessibilityLabel: '   ',
        title: ' 订单 ',
        desc: ' 待支付 ',
        extra: { kind: 'text', value: 0 },
      })
    ).toBe('订单，待支付，0');
  });

  test('显式和生成名称都为空时失败关闭', () => {
    expect(
      resolveCellActionAccessibilityLabel({
        accessibilityLabel: '\t',
        title: '   ',
        desc: '',
      })
    ).toBeUndefined();
  });
});

describe('resolveCellTitleColor — 语义态优先级', () => {
  const colors = { dangerColor: '#E5484D', selectedColor: '#FF6B00' };

  test('都没给时回落到默认(undefined)', () => {
    expect(resolveCellTitleColor({ ...colors })).toBeUndefined();
    expect(
      resolveCellTitleColor({ ...colors, danger: false, selected: false })
    ).toBeUndefined();
  });

  test('单独给时各取各的色', () => {
    expect(resolveCellTitleColor({ ...colors, danger: true })).toBe(
      colors.dangerColor
    );
    expect(resolveCellTitleColor({ ...colors, selected: true })).toBe(
      colors.selectedColor
    );
  });

  test('同时给时 danger 赢 —— 风险语义不该被选中高亮盖掉', () => {
    expect(
      resolveCellTitleColor({ ...colors, danger: true, selected: true })
    ).toBe(colors.dangerColor);
  });
});

describe('resolveExtraSemanticText — display 的语义文本要落成真实节点', () => {
  test('display + 非空 accessibilityText → 返回它', () => {
    expect(
      resolveExtraSemanticText({
        kind: 'display',
        node: fakeElement,
        accessibilityText: '已授权',
      })
    ).toBe('已授权');
  });

  test('两端空白被 trim', () => {
    expect(
      resolveExtraSemanticText({
        kind: 'display',
        node: fakeElement,
        accessibilityText: '  已拒绝  ',
      })
    ).toBe('已拒绝');
  });

  test.each([
    ['没给 accessibilityText', { kind: 'display', node: fakeElement }],
    [
      '空白 accessibilityText',
      { kind: 'display', node: fakeElement, accessibilityText: '   ' },
    ],
  ])('%s → 不渲染语义节点', (_name, extra) => {
    expect(resolveExtraSemanticText(extra as never)).toBeUndefined();
  });

  test.each([
    ['text 分支本身就是可读文本', { kind: 'text', value: '已授权' }],
    ['control 分支由控件自己负责名称', { kind: 'control', node: fakeElement }],
    ['无 extra', undefined],
  ])('%s → 不额外渲染', (_name, extra) => {
    expect(resolveExtraSemanticText(extra as never)).toBeUndefined();
  });
});
