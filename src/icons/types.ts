/** 图标清单的稳定类型；path 数据由脚本生成。 */
export type IconElement =
  | { kind: 'path'; d: string; fill?: string }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: string }
  | {
      kind: 'rect';
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      ry?: number;
      fill?: string;
    };

export type IconDef = {
  strokeWidth: number;
  elements: IconElement[];
};
