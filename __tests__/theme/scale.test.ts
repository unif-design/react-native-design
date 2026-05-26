import { beforeEach, describe, expect, jest, test } from '@jest/globals';

/**
 * scale.ts 在模块加载时算一次 ratio,因此每个 test 切换 Dimensions
 * 必须 jest.resetModules() + jest.doMock + require 重新加载。
 *
 * 不用 `jest.requireActual('react-native')` —— RN 0.85 的 index.js
 * 是 lazy proxy,展开/spread 任意属性都会触发 TurboModule init
 * (DevMenu 等),在 jest 环境会 invariant violation。
 * 这里只提供 scale.ts 实际 import 的 3 个 API,行为复刻 PixelRatio.js
 * 的 roundToNearestPixel = round(n*scale)/scale。
 *
 * 直 require '../../src/theme/scale' 而非 barrel,避免触发 tokens.ts /
 * StyleSheet.create 等无关 RN 路径。
 */
describe('scale', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  /**
   * pixelScale 默认 100,让 PixelRatio.roundToNearestPixel 在单测里近似 no-op
   * (1/100 = 0.01 步进),这样可以纯粹断言 ratio 数学;真机 @3x 像素栅格的
   * 行为不是 scale.ts 的责任,而是 RN PixelRatio 的契约。
   */
  const mockRN = (
    width: number,
    platform: 'ios' | 'web' = 'ios',
    pixelScale = 100
  ) => {
    jest.doMock('react-native', () => ({
      Platform: {
        OS: platform,
        select: (m: Record<string, unknown>) =>
          m[platform] ?? m.default ?? m.native,
      },
      Dimensions: {
        get: () => ({
          width,
          height: 874,
          scale: pixelScale,
          fontScale: 1,
        }),
      },
      PixelRatio: {
        get: () => pixelScale,
        roundToNearestPixel: (n: number) =>
          Math.round(n * pixelScale) / pixelScale,
      },
    }));
  };

  const loadScale = (
    width: number,
    platform: 'ios' | 'web' = 'ios'
  ): typeof import('../../src/theme/scale') => {
    mockRN(width, platform);
    return require('../../src/theme/scale');
  };

  test('ratio=1 at design width 402: r(16)===16, rf(15)===15', () => {
    const { r, rf } = loadScale(402);
    expect(r(16)).toBe(16);
    expect(rf(15)).toBe(15);
  });

  test('SE 375pt → r(16) ≈ 14.93, rf(15) ≈ 14.66', () => {
    const { r, rf } = loadScale(375);
    expect(r(16)).toBeCloseTo(14.93, 1);
    expect(rf(15)).toBeCloseTo(14.66, 1);
  });

  test('17 Pro Max 440pt → r(16) ≈ 17.51, rf(15) ≈ 15.43', () => {
    const { r, rf } = loadScale(440);
    expect(r(16)).toBeCloseTo(17.51, 1);
    expect(rf(15)).toBeCloseTo(15.43, 1);
  });

  test('Web no-op regardless of width', () => {
    const { r, rf } = loadScale(375, 'web');
    expect(r(16)).toBe(16);
    expect(rf(15)).toBe(15);
  });

  test('Dimensions.width fallback to DESIGN_WIDTH when 0/undefined', () => {
    mockRN(0, 'ios');
    const { r } = require('../../src/theme/scale');
    expect(r(16)).toBe(16);
  });
});
