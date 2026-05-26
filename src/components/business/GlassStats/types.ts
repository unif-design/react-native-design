/** 单元格元组 —— [count, label] —— count 已格式化好(如 '12' / '¥2,016') */
export type GlassStatItem = readonly [count: string, label: string];

export type GlassStatsProps = {
  /** 数据列。一般 2~4 列均可,不强制数量。 */
  items: ReadonlyArray<GlassStatItem>;
};
