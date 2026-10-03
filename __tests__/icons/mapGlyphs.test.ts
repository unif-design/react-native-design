import { expect, test } from '@jest/globals';
import { ICONS } from '../../src/icons';
import type { IconName } from '../../src/icons';

const outlines: [IconName, string][] = [
  ['chevron-left', 'M15 6l-6 6 6 6'],
  ['plus', 'M12 5v14 M5 12h14'],
  ['minus', 'M5 12h14'],
  [
    'crosshair',
    'M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0 M12 2v3 M12 19v3 M2 12h3 M19 12h3',
  ],
  [
    'store',
    'M4 9l1.2-4h13.6L20 9 M5 9.5V20h14V9.5 M4 9c0 1.4 1 2.3 2.2 2.3S8.4 10.4 8.4 9 M8.4 9c0 1.4 1 2.3 2.2 2.3S12.8 10.4 12.8 9 M12.8 9c0 1.4 1 2.3 2.2 2.3S17.2 10.4 17.2 9 M17.2 9c0 1.4 1 2.3 2.2 2.3 M9.5 20v-5h5v5',
  ],
  [
    'utensils',
    'M7 3v7 M5 3v4a2 2 0 0 0 2 2 M9 3v4a2 2 0 0 1-2 2 M7 11v10 M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 M16 3v18',
  ],
  ['shopping-bag', 'M5 8h14l-1 12H6L5 8z M9 8V6a3 3 0 0 1 6 0v2'],
  ['bank', 'M3 9l9-5 9 5 M5 9v8 M9 9v8 M15 9v8 M19 9v8 M3 21h18 M4 17h16'],
  [
    'fuel',
    'M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16 M4 21h11 M7 9h5 M14 8l3 3v6a2 2 0 0 0 2 2 2 2 0 0 0 2-2v-7l-3-3',
  ],
  [
    'coffee',
    'M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z M17 9h2a2 2 0 0 1 0 6h-2 M8 3v2 M12 3v2',
  ],
  ['bed', 'M3 6v12 M3 11h18v7 M21 18v-3 M7 11V9a1 1 0 0 1 1-1h9a3 3 0 0 1 3 3'],
  [
    'medical-cross',
    'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z M12 8v8 M8 12h8',
  ],
  ['navigation-pointer', 'M21 4L3 11l7 2 2 7 9-16z'],
  [
    'star-filled',
    'M12 3.2l2.5 5.1 5.6.8-4.05 3.95.96 5.6L12 16.9 6.99 18.65l.96-5.6L3.9 9.1l5.6-.8L12 3.2z',
  ],
];

test.each(outlines)('%s 保留采用的通用轮廓', (name, path) => {
  const def = ICONS[name];
  expect(def?.elements).toHaveLength(1);
  const shape = def?.elements[0];
  expect(shape?.kind).toBe('path');
  if (shape?.kind === 'path')
    expect(shape.d.replace(/\s/gu, '')).toBe(path.replace(/\s/gu, ''));
  if (name === 'star-filled')
    expect(shape).toMatchObject({ fill: 'currentColor', stroke: 'none' });
  else expect(def?.strokeWidth).toBe(1.75);
});
