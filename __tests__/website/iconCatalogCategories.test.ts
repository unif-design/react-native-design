import { describe, expect, test } from '@jest/globals';
import { buildIconCategories } from '../../website/src/components/iconCatalogCategories';

describe('buildIconCategories', () => {
  const all = ['a', 'b', 'c'] as const;

  test('未手工分类的合法 icon 排序后进入末尾“未分类”', () => {
    expect(
      buildIconCategories(all, [{ name: '手工', desc: 'Manual', items: ['b'] }])
    ).toEqual([
      { name: '手工', desc: 'Manual', items: ['b'] },
      { name: '未分类', desc: 'Uncategorized', items: ['a', 'c'] },
    ]);
  });

  test('全部手工覆盖时不追加空的“未分类”', () => {
    expect(
      buildIconCategories(all, [
        { name: '一', desc: 'One', items: ['a', 'b'] },
        { name: '二', desc: 'Two', items: ['c'] },
      ])
    ).toEqual([
      { name: '一', desc: 'One', items: ['a', 'b'] },
      { name: '二', desc: 'Two', items: ['c'] },
    ]);
  });

  test('跨分类或同一分类重复名称都 fail-fast', () => {
    expect(() =>
      buildIconCategories(all, [
        { name: '一', desc: 'One', items: ['a'] },
        { name: '二', desc: 'Two', items: ['a'] },
      ])
    ).toThrow(/重复.*a/u);

    expect(() =>
      buildIconCategories(all, [{ name: '一', desc: 'One', items: ['a', 'a'] }])
    ).toThrow(/重复.*a/u);
  });

  test('手工分类含未知名称时 fail-fast', () => {
    expect(() =>
      buildIconCategories(all, [
        { name: '一', desc: 'One', items: ['missing'] },
      ])
    ).toThrow(/未知.*missing/u);
  });

  test('源 ICON_NAMES 自身重复时 fail-fast', () => {
    expect(() =>
      buildIconCategories(
        ['a', 'a'],
        [{ name: '一', desc: 'One', items: ['a'] }]
      )
    ).toThrow(/ICON_NAMES.*重复.*a/u);
  });

  test('不修改调用方的名称或分类数组', () => {
    const names = ['c', 'a', 'b'] as const;
    const items = ['b'] as const;
    const manual = [{ name: '手工', desc: 'Manual', items }] as const;

    buildIconCategories(names, manual);

    expect(names).toEqual(['c', 'a', 'b']);
    expect(items).toEqual(['b']);
    expect(manual[0]?.items).toBe(items);
  });
});
