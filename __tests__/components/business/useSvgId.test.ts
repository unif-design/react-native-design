import { describe, expect, test } from '@jest/globals';
import {
  buildSvgId,
  sanitizeSvgIdPart,
} from '../../../src/components/business/useSvgId';

describe('sanitizeSvgIdPart', () => {
  test.each([
    ['a:b c', 'a-b-c'],
    ['..a__b--', 'a__b'],
    ['___', '___'],
    [':::', ''],
  ])('sanitize %p -> %p', (input, expected) => {
    expect(sanitizeSvgIdPart(input)).toBe(expected);
  });
});

describe('buildSvgId', () => {
  test('消毒 prefix 与 React ID，并为数字开头补合法前缀', () => {
    expect(buildSvgId('9 grad', undefined, ':r0:')).toBe('svg-id-9-grad-r0');
  });

  test('消毒后为空的 override 回退自动 ID', () => {
    expect(buildSvgId('grad', ':::', ':r1:')).toBe('grad-r1');
  });

  test('所有输入消毒后为空时回退 svg-id', () => {
    expect(buildSvgId(':::', undefined, ':::')).toBe('svg-id');
  });

  test('消毒并优先使用非空 override', () => {
    expect(buildSvgId('grad', 'custom:id', ':r2:')).toBe('custom-id');
  });
});
