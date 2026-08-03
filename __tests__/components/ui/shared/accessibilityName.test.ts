import { describe, expect, test } from '@jest/globals';
import { normalizeNonBlankText } from '../../../../src/components/ui/shared/accessibilityName';

describe('normalizeNonBlankText', () => {
  test.each([
    ['empty', ''],
    ['spaces', '   '],
    ['tab', '\t'],
    ['undefined', undefined],
    ['null', null],
    ['number', 1],
    ['object', { label: 'x' }],
  ])('%s 不是有效名称', (_name, value) => {
    expect(normalizeNonBlankText(value)).toBeUndefined();
  });

  test('返回 trim 后的非空文本', () => {
    expect(normalizeNonBlankText('  保存  ')).toBe('保存');
  });
});
