#!/usr/bin/env node
/**
 * 把 src/icons/svg/*.svg 编译成 src/icons/data.ts。
 * 用法:`node scripts/build-icons.js`。解析纯 regex 零依赖,仅末尾用仓内 prettier 格式化输出。
 *
 * 支持元素:<path d=.../>、<rect x y width height rx?/>、<circle cx cy r/>。
 * 其它(polyline / polygon …)请先转 path —— 违反会被 collectSvgIssues 拦下并 exit 1。
 */
const fs = require('fs');
const path = require('path');

// 路径可由 env 覆盖(供测试指向 fixture 目录;正常运行用默认 src 路径)。
const SVG_DIR =
  process.env.BUILD_ICONS_SVG_DIR ??
  path.resolve(__dirname, '../src/icons/svg');
const OUT =
  process.env.BUILD_ICONS_OUT ??
  path.resolve(__dirname, '../src/icons/data.ts');
const DEFAULT_STROKE = 1.75;

const attr = (tag, name) => {
  // 左边界 `(?:^|\s)` 防属性名前缀碰撞:无它则取 `x` 会先命中 `rx="…"` 的子串
  // (y↔ry、d↔id、r↔filter 同理)。标签内属性间必有空白分隔,左边界恒成立。
  const m = tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`));
  return m ? m[1] : undefined;
};
const num = (v) => (v === undefined ? undefined : Number(v));
const elFill = (tag) =>
  attr(tag, 'fill') === 'currentColor' ? 'currentColor' : undefined;

// 元素级样式属性(fill / opacity / stroke),Icon 渲染端按需透传。
const elStyle = (tag) => {
  const style = {};
  const fill = elFill(tag);
  if (fill) style.fill = fill;
  const opacity = num(attr(tag, 'opacity'));
  if (opacity !== undefined) style.opacity = opacity;
  // 仅抽 stroke="none"(纯 fill 元素去掉根描边继承);其它 stroke 值是描边色,
  // 应由主题经 Svg 根继承,硬编码进 data 会绕过主题 —— 留给 collectSvgIssues 告警。
  if (attr(tag, 'stroke') === 'none') style.stroke = 'none';
  return style;
};

function parseSvg(src) {
  const stroke =
    num(attr(src.match(/<svg[^>]*>/)?.[0] ?? '', 'stroke-width')) ??
    DEFAULT_STROKE;
  const elements = [];
  for (const m of src.matchAll(/<(path|rect|circle)\b([^/>]*)\/?>/g)) {
    const [, kind, raw] = m;
    const tag = `<${kind}${raw}>`;
    const style = elStyle(tag);
    if (kind === 'path') {
      const d = attr(tag, 'd');
      if (d) elements.push({ kind, d, ...style });
    } else if (kind === 'rect') {
      const e = {
        kind,
        x: num(attr(tag, 'x')) ?? 0,
        y: num(attr(tag, 'y')) ?? 0,
        width: num(attr(tag, 'width')) ?? 0,
        height: num(attr(tag, 'height')) ?? 0,
      };
      const rx = num(attr(tag, 'rx'));
      if (rx !== undefined) e.rx = rx;
      Object.assign(e, style);
      elements.push(e);
    } else if (kind === 'circle') {
      const e = {
        kind,
        cx: num(attr(tag, 'cx')) ?? 0,
        cy: num(attr(tag, 'cy')) ?? 0,
        r: num(attr(tag, 'r')) ?? 0,
      };
      Object.assign(e, style);
      elements.push(e);
    }
  }
  return { strokeWidth: stroke, elements };
}

// 脚本不支持的元素:只认 path/rect/circle,其它(含容器/渐变/文本)会被静默丢。
const UNSUPPORTED_TAGS =
  /<(polyline|polygon|line|ellipse|g|use|defs|text|tspan|mask|clipPath|filter|image)\b/g;

// 校验单个 svg 源,返回会导致「静默产坏数据」的问题清单(空 = 合规)。
// error 阻断生成(违反即红),warn 仅提示。把 [H-1]/[H-2]/[M-2] 的契约从注释升级为校验。
function collectSvgIssues(src, name) {
  const issues = [];
  const err = (msg) => issues.push({ level: 'error', msg: `${name}: ${msg}` });
  const warn = (msg) => issues.push({ level: 'warn', msg: `${name}: ${msg}` });
  const svgTag = src.match(/<svg[^>]*>/)?.[0] ?? '';

  // [M-2] viewBox 必须 0 0 24 24 —— Icon.tsx 硬编码该网格,不符会静默缩放失真。
  const viewBox = attr(svgTag, 'viewBox');
  if (viewBox !== '0 0 24 24') {
    err(`viewBox="${viewBox}" 不是 "0 0 24 24"(Icon 按 24 网格渲染会缩放失真)`);
  }

  // [H-1] 不支持元素 —— 静默丢会缺笔画。
  const unsupported = [
    ...new Set([...src.matchAll(UNSUPPORTED_TAGS)].map((m) => m[1])),
  ];
  if (unsupported.length) {
    err(`含不支持元素 <${unsupported.join('>/<')}>(请先在 svg 里转成 path)`);
  }

  // [H-1] 单引号属性 —— attr() 只解析双引号,单引号会被静默丢。
  if (/[\w-]+\s*=\s*'/.test(src)) {
    err(`含单引号属性(脚本只解析双引号,该属性会被静默丢弃)`);
  }

  // [H-1] 空图标 + 开标签计数交叉校验 —— 属性值含 `/` 时元素 regex 整体失配、被静默丢。
  const openTags = (src.match(/<(path|rect|circle)\b/g) ?? []).length;
  const parsed = parseSvg(src).elements.length;
  if (openTags === 0) {
    err(`无任何支持元素(path/rect/circle),会生成空图标`);
  } else if (openTags !== parsed) {
    err(
      `${openTags} 个支持元素开标签但仅抽出 ${parsed} 个(属性值含 / 等致抽取失败)`
    );
  }

  // [M-2]/[H-2] 元素级属性告警 —— 这些会被脚本丢弃,与源设计不符。
  for (const m of src.matchAll(/<(path|rect|circle)\b([^/>]*)\/?>/g)) {
    const tag = `<${m[1]}${m[2]}>`;
    if (attr(tag, 'stroke-width') !== undefined) {
      warn(`元素级 stroke-width 会被丢弃(脚本只读根 <svg> 的 stroke-width)`);
    }
    const elStroke = attr(tag, 'stroke');
    if (elStroke !== undefined && elStroke !== 'none') {
      warn(
        `元素级 stroke="${elStroke}" 会被忽略(描边色应由主题经根 <svg> 继承)`
      );
    }
  }

  // [M-2] 非 round caps —— Icon 渲染强制 round,源写非 round 会造成源/渲染不一致的误导。
  for (const cap of ['stroke-linecap', 'stroke-linejoin']) {
    const v = attr(svgTag, cap);
    if (v !== undefined && v !== 'round') {
      warn(`根 ${cap}="${v}" 非 round(Icon 渲染恒为 round,源与渲染不一致)`);
    }
  }

  return issues;
}

// 由 names + 已解析 icons 拼出 data.ts 源文本(未经 prettier 格式化)。
function generateDataTs(names, icons) {
  const union = names.map((n) => `'${n}'`).join(' | ');
  const body = names
    .map(
      (n) =>
        `  '${n}': ${JSON.stringify(icons[n], null, 4).replace(/\n/g, '\n  ')},`
    )
    .join('\n');
  const list = names.map((n) => `  '${n}',`).join('\n');

  return `// AUTO-GENERATED by scripts/build-icons.js — DO NOT EDIT BY HAND.
// Source: src/icons/svg/*.svg
// To regenerate: \`node scripts/build-icons.js\`

import type { IconDef } from './types';

export type IconName = ${union};

export const ICONS: Record<IconName, IconDef> = {
${body}
};

export const ICON_NAMES: IconName[] = [
${list}
];
`;
}

// 校验 + 解析的纯函数:有 error 则只返回问题(不产出 dataTs),否则产出 data.ts 文本。
// 把「校验决定是否生成」的编排与 fs/exit 副作用分离,便于无子进程单测。
function runBuild(names, sources) {
  const issues = names.flatMap((n, i) =>
    collectSvgIssues(sources[i], `${n}.svg`)
  );
  const errors = issues.filter((it) => it.level === 'error');
  const warns = issues.filter((it) => it.level === 'warn');
  if (errors.length) return { errors, warns };
  const icons = Object.fromEntries(
    names.map((n, i) => [n, parseSvg(sources[i])])
  );
  return { errors, warns, dataTs: generateDataTs(names, icons) };
}

async function main() {
  const files = fs
    .readdirSync(SVG_DIR)
    .filter((f) => f.endsWith('.svg'))
    .sort();
  const names = files.map((f) => f.replace(/\.svg$/, ''));
  const sources = files.map((f) =>
    fs.readFileSync(path.join(SVG_DIR, f), 'utf8')
  );

  const { errors, warns, dataTs } = runBuild(names, sources);
  for (const w of warns) console.warn(`⚠ ${w.msg}`);
  if (errors.length) {
    for (const e of errors) console.error(`✖ ${e.msg}`);
    console.error(
      `build-icons: ${errors.length} 个错误,未生成 data.ts。修复上述 svg 后重试。`
    );
    process.exit(1);
  }

  // 用仓内 prettier 格式化,使再生成幂等 ——
  // `node scripts/build-icons.js && git diff --exit-code` 可作 CI 一致性校验。
  const prettier = require('prettier');
  const config = require('../package.json').prettier ?? {};
  const formatted = await prettier.format(dataTs, { ...config, filepath: OUT });
  fs.writeFileSync(OUT, formatted);
  console.log(
    `build-icons: wrote ${names.length} icons → ${path.relative(process.cwd(), OUT)}`
  );
}

module.exports = { parseSvg, collectSvgIssues, runBuild };

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
