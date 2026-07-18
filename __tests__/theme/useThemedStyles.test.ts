import { describe, expect, test } from '@jest/globals';
import { scaleNamedStyles } from '../../src/theme/useThemedStyles';

/**
 * scaleNamedStyles —— useThemedStyles 出口的字号缩放纯函数。
 * 契约:只缩 fontSize / lineHeight / letterSpacing 三属性(与 RN
 * allowFontScaling 原生缩放范围一致),布局属性不动;factor = 1 与
 * 无字号属性的 style 都必须返回**原引用**(缓存 / snapshot 稳定契约)。
 */
describe('theme/scaleNamedStyles', () => {
  const styles = {
    title: {
      fontSize: 15,
      lineHeight: 22.5,
      letterSpacing: -0.2,
      color: '#000',
    },
    box: { padding: 16, height: 44 },
    caption: { fontSize: 13 },
  } as const;

  test('factor = 1 恒等返回原引用', () => {
    expect(scaleNamedStyles(styles, 1)).toBe(styles);
  });

  test('factor = 1.3 缩放字号三属性,布局与颜色不动', () => {
    const out = scaleNamedStyles(styles, 1.3);
    expect(out.title.fontSize).toBeCloseTo(19.5);
    expect(out.title.lineHeight).toBeCloseTo(29.25);
    // 负 letterSpacing 缩放后保持负值(收紧字距语义不变)。
    expect(out.title.letterSpacing).toBeCloseTo(-0.26);
    expect(out.title.color).toBe('#000');
    expect(out.caption.fontSize).toBeCloseTo(16.9);
    expect(out.box).toEqual({ padding: 16, height: 44 });
  });

  test('无字号属性的 style 保持原引用(只重建有字号的条目)', () => {
    const out = scaleNamedStyles(styles, 1.2);
    expect(out.box).toBe(styles.box);
    expect(out.title).not.toBe(styles.title);
  });

  test('不改动入参(纯函数,产物为新对象)', () => {
    scaleNamedStyles(styles, 1.3);
    expect(styles.title.fontSize).toBe(15);
    expect(styles.title.lineHeight).toBe(22.5);
  });
});
