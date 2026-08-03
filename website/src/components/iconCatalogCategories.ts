export type IconCategory<TName extends string = string> = {
  readonly name: string;
  readonly desc: string;
  readonly items: ReadonlyArray<TName>;
};

/**
 * 手工分类只负责语义分组；源清单负责完整性。重复或未知名称立即抛错，
 * 其余合法图标自动进入末尾“未分类”，避免新增图标在 Website 静默消失。
 */
export function buildIconCategories<TName extends string>(
  allNames: readonly TName[],
  manualCategories: ReadonlyArray<IconCategory<string>>
): Array<IconCategory<TName>> {
  const allNameSet = new Set<TName>();
  for (const name of allNames) {
    if (allNameSet.has(name)) {
      throw new Error(`ICON_NAMES 含重复图标名: ${name}`);
    }
    allNameSet.add(name);
  }

  const categorized = new Set<TName>();
  const categories = manualCategories.map((category) => {
    const items = category.items.map((name) => {
      if (!allNameSet.has(name as TName)) {
        throw new Error(`分类“${category.name}”含未知图标名: ${name}`);
      }
      const typedName = name as TName;
      if (categorized.has(typedName)) {
        throw new Error(`分类中重复出现图标名: ${name}`);
      }
      categorized.add(typedName);
      return typedName;
    });
    return { name: category.name, desc: category.desc, items };
  });

  const uncategorized = allNames
    .filter((name) => !categorized.has(name))
    .sort();
  if (uncategorized.length) {
    categories.push({
      name: '未分类',
      desc: 'Uncategorized',
      items: uncategorized,
    });
  }
  return categories;
}
