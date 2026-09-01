import { describe, expect, test } from '@jest/globals';
import { resolveRibbonLayout } from '../../../../src/components/ui/Ribbon/layout';

describe('resolveRibbonLayout', () => {
  test('默认把缎带固定在右上，并用独立折角衔接条带', () => {
    expect(resolveRibbonLayout({ top: 8, barHeight: 20, foldSize: 3 })).toEqual(
      {
        overlay: {
          position: 'absolute',
          top: 8,
          right: 0,
          zIndex: 1,
          alignItems: 'flex-end',
        },
        bar: { height: 20 },
        fold: { width: 0, height: 0, borderWidth: 3 },
      }
    );
  });
});
