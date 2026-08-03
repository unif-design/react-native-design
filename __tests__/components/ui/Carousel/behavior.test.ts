import { describe, expect, test } from '@jest/globals';
import {
  effectiveCarouselAutoplay,
  shouldRenderCarouselPagination,
} from '../../../../src/components/ui/Carousel/behavior';

describe('Carousel behavior', () => {
  test('系统开启 reduced motion 时停止 autoplay', () => {
    expect(effectiveCarouselAutoplay(true, false)).toBe(true);
    expect(effectiveCarouselAutoplay(true, true)).toBe(false);
  });

  test('只有多页且调用方要求时才渲染 Pagination', () => {
    expect(shouldRenderCarouselPagination(true, 1)).toBe(false);
    expect(shouldRenderCarouselPagination(true, 2)).toBe(true);
  });
});
