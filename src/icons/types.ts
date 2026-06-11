/** 图标清单的稳定类型;几何与样式数据由 scripts/build-icons.js 生成。 */

/** 元素共享的可选样式属性(脚本从 svg 抽取,Icon 渲染端透传)。 */
type IconElementStyle = {
  /** `currentColor` → 渲染时换成主题 stroke 色;缺省则继承 Svg 根的 `fill="none"`。 */
  fill?: string;
  /** 元素不透明度(svg `opacity`),用于次要笔画(如格线 .55)。 */
  opacity?: number;
  /** `'none'` = 该元素不描边(纯 fill 的圆点/方块),覆盖 Svg 根的 stroke 继承。 */
  stroke?: 'none';
};

export type IconElement =
  | ({ kind: 'path'; d: string } & IconElementStyle)
  | ({ kind: 'circle'; cx: number; cy: number; r: number } & IconElementStyle)
  | ({
      kind: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      ry?: number;
    } & IconElementStyle);

export type IconDef = {
  strokeWidth: number;
  elements: IconElement[];
};
