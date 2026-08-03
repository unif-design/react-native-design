import { describe, expect, test } from '@jest/globals';
import { StyleSheet } from 'react-native';
import { sanitizeThumbnailImageStyle } from '../../../../src/components/ui/Thumbnail/normalize';

describe('sanitizeThumbnailImageStyle', () => {
  test('剔除全部 reserved geometry，同时保留图片表面样式', () => {
    const input = {
      opacity: 0.5,
      tintColor: 'red',
      transform: [{ scale: 0.9 }],
      position: 'absolute',
      top: 1,
      right: 2,
      bottom: 3,
      left: 4,
      width: 999,
      height: 998,
      minWidth: 10,
      minHeight: 11,
      maxWidth: 1000,
      maxHeight: 1001,
    } as const;

    const result = sanitizeThumbnailImageStyle(input);

    expect(result.style).toEqual({
      opacity: 0.5,
      tintColor: 'red',
      transform: [{ scale: 0.9 }],
    });
    expect(result.diagnostics).toEqual([
      'position',
      'top',
      'right',
      'bottom',
      'left',
      'width',
      'height',
      'minWidth',
      'minHeight',
      'maxWidth',
      'maxHeight',
    ]);
  });

  test('按 StyleSheet.flatten 语义处理 registered style、nested array 与后项覆盖', () => {
    const registered = StyleSheet.create({
      image: {
        opacity: 0.25,
        width: 640,
      },
    }).image;
    const later = {
      opacity: 0.75,
      tintColor: 'blue',
      left: 12,
    } as const;
    const input = [registered, null, false, [later]] as const;

    const result = sanitizeThumbnailImageStyle(input as never);

    expect(result.style).toEqual({
      opacity: 0.75,
      tintColor: 'blue',
    });
    expect(result.diagnostics).toEqual(['left', 'width']);
  });

  test('不修改 caller object、nested array 或 registered style', () => {
    const registered = StyleSheet.create({
      image: {
        opacity: 0.4,
        height: 80,
      },
    }).image;
    const surface = Object.freeze({
      tintColor: 'green',
      top: 2,
    });
    const nested = Object.freeze([surface]);
    const input = Object.freeze([registered, nested]);

    const beforeRegistered = StyleSheet.flatten(registered);
    const result = sanitizeThumbnailImageStyle(input as never);

    expect(result.style).toEqual({
      opacity: 0.4,
      tintColor: 'green',
    });
    expect(result.diagnostics).toEqual(['top', 'height']);
    expect(input).toEqual([registered, [surface]]);
    expect(surface).toEqual({ tintColor: 'green', top: 2 });
    expect(StyleSheet.flatten(registered)).toEqual(beforeRegistered);
    expect(result.style).not.toBe(surface);
  });

  test.each([
    ['unknown registered id', 404_404],
    ['string', 'opacity: 0.5'],
    ['boolean', true],
    ['function', () => ({ opacity: 0.5 })],
    ['symbol', Symbol('style')],
    [
      'flatten throws',
      new Proxy([], {
        get(target, key, receiver) {
          if (key === 'length') throw new Error('length failed');
          return Reflect.get(target, key, receiver);
        },
      }),
    ],
    [
      'enumeration throws',
      new Proxy(
        { opacity: 0.5 },
        {
          ownKeys() {
            throw new Error('ownKeys failed');
          },
        }
      ),
    ],
    [
      'accessor throws',
      Object.defineProperty({}, 'opacity', {
        enumerable: true,
        get() {
          throw new Error('getter failed');
        },
      }),
    ],
  ])('%s runtime input 失败关闭且不抛错', (_label, input) => {
    expect(() => sanitizeThumbnailImageStyle(input as never)).not.toThrow();
    expect(sanitizeThumbnailImageStyle(input as never)).toEqual({
      style: {},
      diagnostics: ['style'],
    });
  });

  test.each([undefined, null, false, []])(
    '空 style %p 归一化为空且不产生诊断',
    (input) => {
      expect(sanitizeThumbnailImageStyle(input as never)).toEqual({
        style: {},
        diagnostics: [],
      });
    }
  );
});
