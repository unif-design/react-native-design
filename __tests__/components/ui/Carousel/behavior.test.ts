import { describe, expect, test } from '@jest/globals';
import {
  normalizeCarouselAction,
  resolveCarouselItemAccessibility,
  effectiveCarouselAutoplay,
  shouldRenderCarouselPagination,
} from '../../../../src/components/ui/Carousel/behavior';

describe('Carousel behavior', () => {
  test('只有显式 autoplay 且未开启 reduced motion 时才启动', () => {
    expect(effectiveCarouselAutoplay(true, false)).toBe(true);
    expect(effectiveCarouselAutoplay(true, true)).toBe(false);
    expect(effectiveCarouselAutoplay(false, false)).toBe(false);
    expect(effectiveCarouselAutoplay(undefined, false)).toBe(false);
  });

  test('只有多页且调用方要求时才渲染 Pagination', () => {
    expect(shouldRenderCarouselPagination(true, 1)).toBe(false);
    expect(shouldRenderCarouselPagination(true, 2)).toBe(true);
    expect(shouldRenderCarouselPagination(false, 2)).toBe(false);
  });
});

describe('Carousel action runtime boundary', () => {
  const onPress = () => {};
  const getLabel = (item: { label: string }) => item.label;

  test.each([
    ['两个字段都缺省', undefined, undefined, []],
    ['只有 handler', onPress, undefined, ['action']],
    ['只有 getter', undefined, getLabel, ['action']],
    ['boolean handler', true, getLabel, ['action']],
    ['object getter', onPress, {}, ['action']],
  ])(
    '%s 时只允许两个函数形成 action',
    (_name, handler, getter, diagnostics) => {
      expect(normalizeCarouselAction(handler, getter)).toMatchObject({
        kind: diagnostics.length === 0 && handler ? 'action' : 'display',
        diagnostics,
      });
    }
  );

  test('两个函数原样进入 action 配置', () => {
    expect(normalizeCarouselAction(onPress, getLabel)).toEqual({
      kind: 'action',
      onPressItem: onPress,
      getAccessibilityLabel: getLabel,
      diagnostics: [],
    });
  });

  test.each([
    ['空字符串', () => '', 'blank'],
    ['空白字符串', () => '   ', 'blank'],
    ['非字符串', () => ({ label: 'x' }), 'invalid'],
    [
      '抛错 getter',
      () => {
        throw new Error('bad getter');
      },
      'threw',
    ],
  ])('%s item 名称失败关闭为 display', (_name, getter, diagnostic) => {
    expect(
      resolveCarouselItemAccessibility(getter, { id: 'one' }, 0, 2)
    ).toEqual({
      label: undefined,
      diagnostics: [diagnostic],
    });
  });

  test('有效 item 名称会 trim 并附加位置上下文', () => {
    expect(
      resolveCarouselItemAccessibility(
        () => '  季度活动  ',
        { id: 'one' },
        0,
        2
      )
    ).toEqual({
      label: '季度活动，第 1 项，共 2 项',
      diagnostics: [],
    });
  });
});
