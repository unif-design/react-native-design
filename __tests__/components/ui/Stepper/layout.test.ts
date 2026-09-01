import { describe, expect, test } from '@jest/globals';
import { resolveStepperLayout } from '../../../../src/components/ui/Stepper/layout';

describe('resolveStepperLayout', () => {
  test('xs 使用三块互不重叠的 dense frame，不注入 hitSlop 或根 padding', () => {
    const layout = resolveStepperLayout(
      { h: 24, btn: 24, w: 40 },
      { compact: true }
    );

    expect(layout).toEqual({
      decrementFrame: { width: 24, height: 44, alignItems: 'flex-end' },
      valueFrame: { width: 40, height: 44 },
      incrementFrame: { width: 24, height: 44, alignItems: 'flex-start' },
    });
    expect(
      layout.decrementFrame.width +
        layout.valueFrame.width +
        layout.incrementFrame.width
    ).toBe(88);
    expect(JSON.stringify(layout)).not.toMatch(/hitSlop|padding/u);
  });

  test('narrow visual 使用真实 44pt outer', () => {
    expect(resolveStepperLayout({ h: 28, btn: 28, w: 40 })).toEqual({
      decrementFrame: { width: 44, height: 44, alignItems: 'flex-end' },
      valueFrame: { width: 44, height: 44 },
      incrementFrame: { width: 44, height: 44, alignItems: 'flex-start' },
    });
  });

  test('402pt md 保留 48pt value visual 且 side 至少 44pt', () => {
    expect(resolveStepperLayout({ h: 32, btn: 32, w: 48 })).toEqual({
      decrementFrame: { width: 44, height: 44, alignItems: 'flex-end' },
      valueFrame: { width: 48, height: 44 },
      incrementFrame: { width: 44, height: 44, alignItems: 'flex-start' },
    });
  });

  test('wide native outer 随 visual 增长且无 padding/hitSlop', () => {
    const layout = resolveStepperLayout({ h: 61, btn: 61, w: 92 });
    expect(layout).toEqual({
      decrementFrame: { width: 61, height: 61, alignItems: 'flex-end' },
      valueFrame: { width: 92, height: 61 },
      incrementFrame: { width: 61, height: 61, alignItems: 'flex-start' },
    });
    expect(JSON.stringify(layout)).not.toMatch(/padding|hitSlop/);
  });
});
