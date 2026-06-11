/** 图标清单的稳定类型;几何与样式数据由 scripts/build-icons.js 生成。 */

/** 元素共享的可选样式属性(脚本从 svg 抽取,Icon 渲染端透传)。 */
type IconElementStyle = {
  /** `currentColor` → 渲染时换成主题 stroke 色;缺省则继承 Svg 根的 `fill="none"`。 */
  readonly fill?: string;
  /** 元素不透明度(svg `opacity`),用于次要笔画(如格线 .55)。 */
  readonly opacity?: number;
  /** `'none'` = 该元素不描边(纯 fill 的圆点/方块),覆盖 Svg 根的 stroke 继承。 */
  readonly stroke?: 'none';
};

// readonly 防止消费端原地改 ICONS 的元素数据污染模块级单例。
export type IconElement =
  | (Readonly<{ kind: 'path'; d: string }> & IconElementStyle)
  | (Readonly<{ kind: 'circle'; cx: number; cy: number; r: number }> &
      IconElementStyle)
  | (Readonly<{
      kind: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      // ry 未被 build-icons.js 抽取(脚本只取 rx),不在生成物中 —— 此处不声明,
      // 保持类型与生成端契约一致,防渲染端出现永远不可达的 ry 分支。
      rx?: number;
    }> &
      IconElementStyle);

export type IconDef = Readonly<{
  strokeWidth: number;
  // readonly 数组:防止消费端 push/splice ICONS 的 elements 污染单例。
  elements: readonly IconElement[];
}>;
