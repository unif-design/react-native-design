import { describe, expect, test } from '@jest/globals';
import {
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
