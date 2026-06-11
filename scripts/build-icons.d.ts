import type { IconDef } from '../src/icons/types';

/** 把单个 svg 源字符串解析为 IconDef(strokeWidth + elements)。 */
export declare function parseSvg(src: string): IconDef;

/** svg 源的校验问题(error 阻断生成、warn 仅提示)。 */
export type SvgIssue = { level: 'error' | 'warn'; msg: string };

/** 校验单个 svg 源是否会被脚本静默产坏数据;返回问题清单(空 = 合规)。 */
export declare function collectSvgIssues(src: string, name: string): SvgIssue[];

/**
 * 校验 + 解析的纯函数:有 error 则只返回问题(dataTs 缺省),否则产出 data.ts 文本。
 */
export declare function runBuild(
  names: string[],
  sources: string[]
): { errors: SvgIssue[]; warns: SvgIssue[]; dataTs?: string };
