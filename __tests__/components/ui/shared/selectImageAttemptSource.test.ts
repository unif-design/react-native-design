import { describe, expect, test } from '@jest/globals';
import { resolveImageSource } from '../../../../src/utils/imageSource';
import {
  selectNativeImageAttemptSource,
  selectWebImageAttemptSource,
} from '../../../../src/components/ui/shared/selectImageAttemptSource.shared';

describe('selectImageAttemptSource', () => {
  test.each([
    ['URI object', { uri: 'https://x/a.png' }],
    ['asset id', 7],
  ])('%s 在 native / Web 都原样保留', (_label, source) => {
    const resolved = resolveImageSource(source);
    expect(resolved).toBeDefined();
    expect(selectNativeImageAttemptSource(resolved)).toBe(resolved?.source);
    expect(selectWebImageAttemptSource(resolved)).toBe(resolved?.source);
  });

  test('native 保留非空 URI 数组，Web 明确选择首个 candidate', () => {
    const source = [{ uri: 'https://x/a.png' }, { uri: 'https://x/b.png' }];

    const resolved = resolveImageSource(source);
    expect(resolved).toBeDefined();
    expect(selectNativeImageAttemptSource(resolved)).toBe(resolved?.source);
    expect(selectWebImageAttemptSource(resolved)).toBe(
      Array.isArray(resolved?.source) ? resolved.source[0] : undefined
    );
  });

  test.each([
    ['empty array', []],
    ['blank uri', { uri: '  ' }],
    ['invalid asset', 0],
    ['unknown value', 'https://x/a.png'],
  ])('%s 在 native / Web 都回退', (_label, source) => {
    const resolved = resolveImageSource(source);
    expect(resolved).toBeUndefined();
    expect(selectNativeImageAttemptSource(resolved)).toBeUndefined();
    expect(selectWebImageAttemptSource(resolved)).toBeUndefined();
  });
});
