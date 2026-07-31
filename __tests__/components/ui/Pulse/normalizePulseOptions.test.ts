import { describe, expect, test } from '@jest/globals';
import {
  normalizePulseOptions,
  shouldAnimatePulse,
} from '../../../../src/components/ui/Pulse/normalizePulseOptions';
import type {
  PulseDefaults,
  PulseOptions,
} from '../../../../src/components/ui/Pulse/normalizePulseOptions';

/** Pulse / <Pulse> 的默认值。 */
const BASE: PulseDefaults = { duration: 700, delay: 0, from: 0.6, to: 1 };
/** PulseDot / Skeleton 的默认值 —— 只有 from 不同。 */
const DOT: PulseDefaults = { ...BASE, from: 0.5 };

type Case = [PulseOptions, keyof PulseDefaults, number];

describe('normalizePulseOptions — 非法输入回退到 defaults', () => {
  const cases: Case[] = [
    [{ duration: 0 }, 'duration', 700],
    [{ duration: 2 ** 31 }, 'duration', 700],
    [{ delay: -1 }, 'delay', 0],
    [{ from: Number.NaN }, 'from', 0.6],
    [{ to: Number.POSITIVE_INFINITY }, 'to', 1],
  ];

  test.each(cases)('非法输入 %p 使用 fallback', (input, field, fallback) => {
    const result = normalizePulseOptions(input, BASE);
    expect(result[field]).toBe(fallback);
    expect(result.diagnostics.map((item) => item.field)).toContain(field);
  });

  test('诊断带上原始值与回退值,供 dev 告警逐条说明', () => {
    const result = normalizePulseOptions({ duration: -5 }, BASE);
    expect(result.diagnostics).toEqual([
      { field: 'duration', received: -5, fallback: 700 },
    ]);
  });

  test('非 number 类型同样回退并记录诊断', () => {
    const result = normalizePulseOptions(
      { duration: '700' } as unknown as PulseOptions,
      BASE
    );
    expect(result.duration).toBe(700);
    expect(result.diagnostics[0]).toEqual({
      field: 'duration',
      received: '700',
      fallback: 700,
    });
  });

  test('多个非法字段各记一条诊断', () => {
    const result = normalizePulseOptions(
      { duration: 0, delay: -1, from: 2 },
      BASE
    );
    expect(result.diagnostics.map((item) => item.field)).toEqual([
      'duration',
      'delay',
      'from',
    ]);
  });
});

describe('normalizePulseOptions — 合法输入原样保留', () => {
  test('未传字段使用 defaults,不记诊断', () => {
    expect(normalizePulseOptions({}, DOT)).toEqual({
      duration: 700,
      delay: 0,
      from: 0.5,
      to: 1,
      isStatic: false,
      diagnostics: [],
    });
  });

  test('undefined 与缺省等价', () => {
    expect(
      normalizePulseOptions(
        {
          duration: undefined,
          delay: undefined,
          from: undefined,
          to: undefined,
        },
        BASE
      ).diagnostics
    ).toEqual([]);
  });

  test('不做 clamp 也不做取整 —— 小数 duration 原样保留', () => {
    const result = normalizePulseOptions(
      { duration: 700.5, delay: 0.25 },
      BASE
    );
    expect(result.duration).toBe(700.5);
    expect(result.delay).toBe(0.25);
    expect(result.diagnostics).toEqual([]);
  });

  test('边界值:duration=1 与 delay=0 合法,opacity 0 与 1 合法', () => {
    const result = normalizePulseOptions(
      { duration: 1, delay: 0, from: 0, to: 1 },
      BASE
    );
    expect(result).toMatchObject({ duration: 1, delay: 0, from: 0, to: 1 });
    expect(result.diagnostics).toEqual([]);
  });

  test('duration 与 delay 的上界是开区间 2^31', () => {
    expect(
      normalizePulseOptions({ duration: 2 ** 31 - 1 }, BASE).diagnostics
    ).toEqual([]);
    expect(
      normalizePulseOptions({ delay: 2 ** 31 - 1 }, BASE).diagnostics
    ).toEqual([]);
  });
});

describe('normalizePulseOptions — isStatic', () => {
  test('from === to 为静态,from > to 保持反向值', () => {
    expect(normalizePulseOptions({ from: 0.5, to: 0.5 }, DOT).isStatic).toBe(
      true
    );
    expect(normalizePulseOptions({ from: 0.9, to: 0.2 }, BASE)).toMatchObject({
      from: 0.9,
      to: 0.2,
      isStatic: false,
    });
  });

  test('回退后才相等也算静态', () => {
    // to 非法回退到 1,而 from 显式传 1 —— 归一化之后两端相等
    expect(
      normalizePulseOptions({ from: 1, to: Number.NaN }, BASE).isStatic
    ).toBe(true);
  });
});

describe('shouldAnimatePulse', () => {
  test('静态或 reduced motion 都不启动 driver', () => {
    const moving = normalizePulseOptions({}, BASE);
    const still = normalizePulseOptions({ from: 1, to: 1 }, BASE);
    expect(shouldAnimatePulse(moving, true)).toBe(false);
    expect(shouldAnimatePulse(still, false)).toBe(false);
    expect(shouldAnimatePulse(still, true)).toBe(false);
  });

  test('非静态且未开启 reduced motion 才启动', () => {
    expect(shouldAnimatePulse(normalizePulseOptions({}, BASE), false)).toBe(
      true
    );
  });
});
