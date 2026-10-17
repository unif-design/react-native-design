import { expect, test } from '@jest/globals';
import { parseRgba } from '../../../src/components/business/Decorations/GradientWash';

test.each([
  ['rgba(1, 2, 3, 0.5)', { color: 'rgb(1,2,3)', opacity: 0.5 }],
  ['rgba(1,2,3,0)', { color: 'rgb(1,2,3)', opacity: 0 }],
  ['#12345600', { color: '#123456', opacity: 0 }],
  ['#abcdefFF', { color: '#abcdef', opacity: 1 }],
  ['rgba(1,2,3,invalid)', { color: 'rgba(1,2,3,invalid)', opacity: 1 }],
  ['rgba(1,2,3)', { color: 'rgba(1,2,3)', opacity: 1 }],
  ['rgb(1,2,3)', { color: 'rgb(1,2,3)', opacity: 1 }],
  ['#123456', { color: '#123456', opacity: 1 }],
  ['transparent', { color: 'transparent', opacity: 1 }],
] as const)('渐变颜色 %s 保留 RGB 与独立 alpha 契约', (input, expected) => {
  expect(parseRgba(input)).toEqual(expected);
});
