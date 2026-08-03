import { describe, expect, test } from '@jest/globals';
import { StyleSheet } from 'react-native';
import {
  normalizeInputHeight,
  normalizeSearchLayout,
  normalizeSlotIconSize,
  normalizeTextareaHeights,
  normalizeTextFieldSlot,
  sanitizeTextFieldWrapperProps,
  sanitizeTextFieldContainerStyle,
} from '../../../../src/components/ui/TextField/normalize';

describe('normalizeInputHeight — 单行高度不得低于 44pt 命中框', () => {
  test('低于 44 回退并记诊断', () => {
    expect(normalizeInputHeight(36)).toEqual({
      value: 44,
      diagnostics: ['height'],
    });
  });

  test('恰好 44 合法', () => {
    expect(normalizeInputHeight(44)).toEqual({ value: 44, diagnostics: [] });
  });

  test('更高的值原样保留', () => {
    expect(normalizeInputHeight(60)).toEqual({ value: 60, diagnostics: [] });
  });

  test.each([
    ['undefined', undefined],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
    ['负值', -10],
    ['字符串', '44'],
    ['null', null],
  ])('%s 回退到 44', (_name, input) => {
    expect(normalizeInputHeight(input)).toEqual({
      value: 44,
      diagnostics: ['height'],
    });
  });
});

describe('normalizeTextareaHeights — min 默认 96,max 必须不小于 min', () => {
  test('max 小于 min 时丢弃 max 并记诊断', () => {
    expect(normalizeTextareaHeights(120, 100)).toEqual({
      minHeight: 120,
      maxHeight: undefined,
      diagnostics: ['maxHeight'],
    });
  });

  test('缺省时 min 为 96、max 为 undefined,不算诊断', () => {
    expect(normalizeTextareaHeights(undefined, undefined)).toEqual({
      minHeight: 96,
      maxHeight: undefined,
      diagnostics: [],
    });
  });

  test('合法 max 保留', () => {
    expect(normalizeTextareaHeights(120, 200)).toEqual({
      minHeight: 120,
      maxHeight: 200,
      diagnostics: [],
    });
  });

  test('max 等于 min 合法', () => {
    expect(normalizeTextareaHeights(120, 120).maxHeight).toBe(120);
  });

  test('min 低于 44 回退 96 并记诊断,max 随新 min 重新判定', () => {
    expect(normalizeTextareaHeights(20, 60)).toEqual({
      minHeight: 96,
      maxHeight: undefined,
      diagnostics: ['minHeight', 'maxHeight'],
    });
  });

  test.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['字符串', '120'],
  ])('非法 min(%s)回退 96', (_name, input) => {
    expect(normalizeTextareaHeights(input, undefined).minHeight).toBe(96);
  });

  test('非法 max 丢弃并记诊断', () => {
    expect(normalizeTextareaHeights(120, Number.POSITIVE_INFINITY)).toEqual({
      minHeight: 120,
      maxHeight: undefined,
      diagnostics: ['maxHeight'],
    });
  });
});

describe('normalizeSlotIconSize — 只接受 [1, 32]', () => {
  test('超上界回退 18', () => {
    expect(normalizeSlotIconSize(33)).toEqual({
      value: 18,
      diagnostics: ['slot.size'],
    });
  });

  test('边界 1 与 32 合法', () => {
    expect(normalizeSlotIconSize(1).diagnostics).toEqual([]);
    expect(normalizeSlotIconSize(32).diagnostics).toEqual([]);
  });

  test.each([
    ['0', 0],
    ['负值', -1],
    ['NaN', Number.NaN],
    ['undefined', undefined],
  ])('%s 回退 18', (_name, input) => {
    expect(normalizeSlotIconSize(input)).toEqual({
      value: 18,
      diagnostics: ['slot.size'],
    });
  });
});

describe('normalizeTextFieldSlot — 未类型化 action 不能绕过 handler/name', () => {
  test('有效 action 原样保留', () => {
    const action = {
      kind: 'action',
      icon: 'close',
      onPress: () => {},
      accessibilityLabel: '清除',
    } as const;
    expect(normalizeTextFieldSlot(action)).toEqual({
      slot: action,
      diagnostics: [],
    });
  });

  test.each([
    [
      '缺 handler',
      { kind: 'action', icon: 'close', accessibilityLabel: '清除' },
    ],
    [
      'handler 非函数',
      {
        kind: 'action',
        icon: 'close',
        onPress: 'clear',
        accessibilityLabel: '清除',
      },
    ],
    [
      '空白 label',
      {
        kind: 'action',
        icon: 'close',
        onPress: () => {},
        accessibilityLabel: '  ',
      },
    ],
  ])('%s 时移除 action 并给出诊断', (_name, slot) => {
    expect(normalizeTextFieldSlot(slot)).toEqual({
      slot: undefined,
      diagnostics: ['slot.action'],
    });
  });

  test('undefined 是唯一不产生诊断的空 slot', () => {
    expect(normalizeTextFieldSlot(undefined)).toEqual({
      slot: undefined,
      diagnostics: [],
    });
  });

  test.each([
    ['null', null, 'slot'],
    ['布尔值', false, 'slot'],
    ['字符串', 'search', 'slot'],
    ['未知 discriminant', { kind: 'node', value: 'x' }, 'slot.kind'],
    ['对象 text', { kind: 'text', value: { text: 'x' } }, 'slot.text'],
    ['无效 icon', { kind: 'icon', icon: 'not-generated' }, 'slot.icon'],
    [
      'icon size 非有限数',
      { kind: 'icon', icon: 'search', size: Number.POSITIVE_INFINITY },
      'slot.icon',
    ],
    [
      'icon color 非字符串',
      { kind: 'icon', icon: 'search', color: 42 },
      'slot.icon',
    ],
    [
      'action icon 无效',
      {
        kind: 'action',
        icon: 'not-generated',
        onPress: () => {},
        accessibilityLabel: '操作',
      },
      'slot.action',
    ],
    [
      'action disabled 非布尔值',
      {
        kind: 'action',
        icon: 'close',
        onPress: () => {},
        accessibilityLabel: '操作',
        disabled: 'false',
      },
      'slot.action',
    ],
  ])('%s 失败关闭并诊断', (_name, slot, diagnostic) => {
    expect(normalizeTextFieldSlot(slot)).toEqual({
      slot: undefined,
      diagnostics: [diagnostic],
    });
  });

  test('保留并规范化有效 icon/text/action 分支', () => {
    const onPress = () => {};
    expect(
      normalizeTextFieldSlot({
        kind: 'icon',
        icon: 'search',
        size: 33,
        color: 'tomato',
      })
    ).toEqual({
      slot: { kind: 'icon', icon: 'search', size: 33, color: 'tomato' },
      diagnostics: [],
    });
    expect(normalizeTextFieldSlot({ kind: 'text', value: 0 })).toEqual({
      slot: { kind: 'text', value: 0 },
      diagnostics: [],
    });
    expect(
      normalizeTextFieldSlot({
        kind: 'action',
        icon: 'close',
        onPress,
        accessibilityLabel: '  清除  ',
        disabled: false,
      })
    ).toEqual({
      slot: {
        kind: 'action',
        icon: 'close',
        onPress,
        accessibilityLabel: '清除',
        disabled: false,
      },
      diagnostics: [],
    });
  });
});

describe('normalizeSearchLayout — 44pt 交互层与 36pt 可视面分离', () => {
  test('非法尺寸回退为 44pt interactive / 36pt visible 和 4pt inset', () => {
    expect(normalizeSearchLayout(20, 100)).toEqual({
      interactiveHeight: 44,
      visibleHeight: 36,
      verticalInset: 4,
      diagnostics: ['interactiveHeight', 'visibleHeight'],
    });
  });

  test('合法默认尺寸保留独立的实际命中层', () => {
    expect(normalizeSearchLayout(44, 36)).toEqual({
      interactiveHeight: 44,
      visibleHeight: 36,
      verticalInset: 4,
      diagnostics: [],
    });
  });
});

describe('sanitizeTextFieldWrapperProps — 公开 wrapper 封死 internal layout keys', () => {
  test('剥离 multiline/searchLayout,保留其他 native props且不修改 caller 对象', () => {
    const caller = {
      placeholder: '姓名',
      multiline: true,
      searchLayout: { interactiveHeight: 20 },
    };
    expect(sanitizeTextFieldWrapperProps(caller)).toEqual({
      props: { placeholder: '姓名' },
      diagnostics: ['multiline', 'searchLayout'],
    });
    expect(caller).toEqual({
      placeholder: '姓名',
      multiline: true,
      searchLayout: { interactiveHeight: 20 },
    });
  });
});

describe('sanitizeTextFieldContainerStyle — 保留 frame 控制权', () => {
  test('剥掉全部六个保留字段并逐条记诊断', () => {
    const result = sanitizeTextFieldContainerStyle({
      margin: 8,
      height: 20,
      minHeight: 1,
      maxHeight: 2,
      minWidth: 3,
      maxWidth: 4,
      overflow: 'hidden',
    });
    expect(result.style).toEqual({ margin: 8 });
    expect([...result.diagnostics].sort()).toEqual([
      'height',
      'maxHeight',
      'maxWidth',
      'minHeight',
      'minWidth',
      'overflow',
    ]);
  });

  test('无保留字段时不记诊断', () => {
    expect(sanitizeTextFieldContainerStyle({ margin: 8 })).toEqual({
      style: { margin: 8 },
      diagnostics: [],
    });
  });

  test('undefined 返回空 style', () => {
    expect(sanitizeTextFieldContainerStyle(undefined)).toEqual({
      style: {},
      diagnostics: [],
    });
  });

  test('数组样式先 flatten 再剥离', () => {
    const result = sanitizeTextFieldContainerStyle([
      { margin: 8 },
      { height: 10, padding: 2 },
    ]);
    expect(result.style).toEqual({ margin: 8, padding: 2 });
    expect(result.diagnostics).toEqual(['height']);
  });

  test('不修改 caller 传入的对象', () => {
    const caller = { margin: 8, height: 20 };
    sanitizeTextFieldContainerStyle(caller);
    expect(caller).toEqual({ margin: 8, height: 20 });
  });

  test('不修改注册过的 StyleSheet 条目', () => {
    const sheet = StyleSheet.create({ box: { margin: 8, height: 20 } });
    const result = sanitizeTextFieldContainerStyle(sheet.box);
    expect(result.style).toEqual({ margin: 8 });
    expect(StyleSheet.flatten(sheet.box)).toEqual({ margin: 8, height: 20 });
  });
});
