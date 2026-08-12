import { describe, expect, test } from '@jest/globals';
import { ICONS, ICON_NAMES } from '../../src/icons';

describe('minimize icon', () => {
  test('作为 maximize 的反向语义公开，并使用四角向内路径', () => {
    expect(ICON_NAMES).toContain('minimize');
    expect(ICONS.minimize).toEqual({
      strokeWidth: 1.75,
      elements: [
        {
          kind: 'path',
          d: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
        },
      ],
    });
  });
});
