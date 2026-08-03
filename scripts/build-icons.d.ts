import type { IconDef } from '../src/icons/types';

/** SVG 源的校验问题；error 会阻断生成。 */
export type SvgIssue = { level: 'error' | 'warn'; msg: string };

export type ScannedSvgElement = {
  readonly name: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly selfClosing: boolean;
};

export type ScannedSvg = {
  readonly name: string;
  readonly source: string;
  readonly root: ScannedSvgElement | undefined;
  readonly shapes: readonly ScannedSvgElement[];
  readonly issues: SvgIssue[];
};

/** 移除 SVG 注释；validator 与 generator 必须共享这份清理结果。 */
export declare function cleanSvgSource(src: string): string;

/** 扫描完整文档结构与双引号属性，不静默跳过未知标签或属性。 */
export declare function scanSvgDocument(
  cleanSrc: string,
  name: string
): ScannedSvg;

/** 校验单个 SVG 源；返回全部问题（空 = 合规）。 */
export declare function collectSvgIssues(src: string, name: string): SvgIssue[];

/** 把一个已验证的 SVG 源解析为 IconDef；非法源会抛错。 */
export declare function parseSvg(src: string): IconDef;

/**
 * 校验 + 解析的纯函数；有 error 时只返回问题，否则产出 data.ts 文本。
 */
export declare function runBuild(
  names: readonly string[],
  sources: readonly string[]
): { errors: SvgIssue[]; warns: SvgIssue[]; dataTs?: string };
