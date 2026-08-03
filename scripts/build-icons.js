#!/usr/bin/env node
/**
 * 把 src/icons/svg/*.svg 编译成 src/icons/data.ts。
 * 用法:`node scripts/build-icons.js`。解析器零依赖,仅末尾用仓内 prettier 格式化输出。
 *
 * SVG 文档必须只有一个规范根节点,且直接叶子只能是 path / rect / circle。
 * 校验器会先收集全部错误；任一错误存在时都不会写正式生成物。
 */
const fs = require('fs');
const path = require('path');

// 路径可由 env 覆盖，供测试和非写工作区检查使用；正常运行使用 src 下的默认路径。
const SVG_DIR =
  process.env.BUILD_ICONS_SVG_DIR ??
  path.resolve(__dirname, '../src/icons/svg');
const OUT =
  process.env.BUILD_ICONS_OUT ??
  path.resolve(__dirname, '../src/icons/data.ts');

const SHAPE_NAMES = new Set(['path', 'rect', 'circle']);
const ALLOWED_ATTRIBUTES = {
  svg: new Set([
    'xmlns',
    'viewBox',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
  ]),
  path: new Set(['d', 'fill', 'stroke', 'opacity']),
  rect: new Set([
    'x',
    'y',
    'width',
    'height',
    'rx',
    'fill',
    'stroke',
    'opacity',
  ]),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'opacity']),
};
const REQUIRED_ROOT_ATTRIBUTES = {
  'xmlns': 'http://www.w3.org/2000/svg',
  'viewBox': '0 0 24 24',
  'fill': 'none',
  'stroke': 'currentColor',
  'stroke-width': '1.75',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
};
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/u;
const TAG_RE = /<(\/?)([A-Za-z][A-Za-z0-9:._-]*)([^<>]*?)(\/?)>/gu;
const ATTRIBUTE_RE = /([A-Za-z_:][-A-Za-z0-9_:.]*)\s*=\s*"([^"]*)"/gu;

const errorIssue = (name, element, field, message) => ({
  level: 'error',
  msg: `${name}: <${element}> ${field}: ${message}`,
});

const cleanSvgSource = (src) => src.replace(/<!--[\s\S]*?-->/gu, '');

const parseFiniteNumber = (raw) =>
  typeof raw === 'string' && NUMBER.test(raw) && Number.isFinite(Number(raw))
    ? Number(raw)
    : undefined;

function parseAttributes(raw, element, name, issues) {
  const attributes = Object.create(null);
  let cursor = 0;

  for (const match of raw.matchAll(ATTRIBUTE_RE)) {
    const skipped = raw.slice(cursor, match.index);
    if (skipped.trim()) {
      issues.push(
        errorIssue(
          name,
          element,
          '属性',
          `无法解析片段 ${JSON.stringify(skipped.trim())}；只允许双引号属性`
        )
      );
    }

    const attributeName = match[1];
    const value = match[2];
    if (Object.hasOwn(attributes, attributeName)) {
      issues.push(
        errorIssue(name, element, attributeName, '同一属性不得重复声明')
      );
    } else {
      attributes[attributeName] = value;
    }
    cursor = (match.index ?? 0) + match[0].length;
  }

  const tail = raw.slice(cursor);
  if (tail.trim()) {
    issues.push(
      errorIssue(
        name,
        element,
        '属性',
        `无法解析片段 ${JSON.stringify(tail.trim())}；只允许双引号属性`
      )
    );
  }

  const allowlist = ALLOWED_ATTRIBUTES[element];
  if (allowlist) {
    for (const attributeName of Object.keys(attributes)) {
      if (!allowlist.has(attributeName)) {
        issues.push(
          errorIssue(
            name,
            element,
            attributeName,
            '不在该元素的属性 allowlist 中'
          )
        );
      }
    }
  }

  return attributes;
}

/**
 * 扫描清理后的完整 SVG 文档。结构错误会被收集到 issues，不会提前短路，
 * 这样一次构建能把同一文件中的全部问题一起报出。
 */
function scanSvgDocument(cleanSrc, name) {
  const issues = [];
  const stack = [];
  const shapes = [];
  let root;
  let rootCount = 0;
  let cursor = 0;

  for (const match of cleanSrc.matchAll(TAG_RE)) {
    const skipped = cleanSrc.slice(cursor, match.index);
    if (skipped.trim()) {
      issues.push(
        errorIssue(
          name,
          'document',
          '结构',
          `标签之间含无法解析的内容 ${JSON.stringify(skipped.trim())}`
        )
      );
    }
    cursor = (match.index ?? 0) + match[0].length;

    const closing = match[1] === '/';
    const elementName = match[2];
    const rawAttributes = match[3] ?? '';
    const selfClosing = match[4] === '/';

    if (closing) {
      if (rawAttributes.trim() || selfClosing) {
        issues.push(
          errorIssue(
            name,
            elementName,
            '结构',
            '闭合标签不得包含属性或自闭合标记'
          )
        );
      }
      const current = stack.pop();
      if (!current) {
        issues.push(
          errorIssue(name, elementName, '结构', '出现没有对应开标签的闭合标签')
        );
      } else if (current.name !== elementName) {
        issues.push(
          errorIssue(
            name,
            elementName,
            '结构',
            `闭合标签与当前 <${current.name}> 不匹配`
          )
        );
      }
      continue;
    }

    const attributes = parseAttributes(
      rawAttributes,
      elementName,
      name,
      issues
    );
    const element = {
      name: elementName,
      attributes,
      selfClosing,
    };
    const parent = stack.at(-1);

    if (parent && SHAPE_NAMES.has(parent.name)) {
      issues.push(
        errorIssue(
          name,
          parent.name,
          '结构',
          `shape 必须是叶子，不能包含 <${elementName}>`
        )
      );
    }

    if (elementName === 'svg') {
      rootCount += 1;
      if (parent) {
        issues.push(
          errorIssue(name, elementName, '结构', 'svg 只能作为唯一顶层根节点')
        );
      }
      if (!root) root = element;
    } else if (SHAPE_NAMES.has(elementName)) {
      if (parent?.name !== 'svg') {
        issues.push(
          errorIssue(
            name,
            elementName,
            '结构',
            'shape 必须是根 svg 的直接子叶子'
          )
        );
      } else {
        shapes.push(element);
      }
    } else {
      issues.push(
        errorIssue(
          name,
          elementName,
          '结构',
          '未知标签；根的直接叶子只允许 path、rect、circle'
        )
      );
    }

    if (!selfClosing) stack.push(element);
  }

  const tail = cleanSrc.slice(cursor);
  if (tail.trim()) {
    issues.push(
      errorIssue(
        name,
        'document',
        '结构',
        `文档末尾含无法解析的内容 ${JSON.stringify(tail.trim())}`
      )
    );
  }
  if (stack.length) {
    issues.push(
      errorIssue(
        name,
        'document',
        '结构',
        `存在未闭合标签 ${stack.map((entry) => `<${entry.name}>`).join('、')}`
      )
    );
  }
  if (rootCount !== 1) {
    issues.push(
      errorIssue(
        name,
        'document',
        '结构',
        `必须且只能有一个 svg 根节点，当前为 ${rootCount}`
      )
    );
  }

  return { name, source: cleanSrc, root, shapes, issues };
}

const checkNumberAttribute = (
  scan,
  shape,
  field,
  { required = false, positive = false, nonNegative = false } = {}
) => {
  const raw = shape.attributes[field];
  if (raw === undefined) {
    if (required) {
      scan.issues.push(
        errorIssue(scan.name, shape.name, field, '必须提供有限数值')
      );
    }
    return;
  }

  const value = parseFiniteNumber(raw);
  if (value === undefined) {
    scan.issues.push(
      errorIssue(scan.name, shape.name, field, `不是严格有限数值: ${raw}`)
    );
  } else if (positive && value <= 0) {
    scan.issues.push(
      errorIssue(scan.name, shape.name, field, `必须大于 0，当前为 ${raw}`)
    );
  } else if (nonNegative && value < 0) {
    scan.issues.push(
      errorIssue(scan.name, shape.name, field, `不得小于 0，当前为 ${raw}`)
    );
  }
};

function collectScannedSvgIssues(scan) {
  const root = scan.root;
  if (root) {
    for (const [field, expected] of Object.entries(REQUIRED_ROOT_ATTRIBUTES)) {
      const actual = root.attributes[field];
      if (actual !== expected) {
        scan.issues.push(
          errorIssue(
            scan.name,
            'svg',
            field,
            `必须精确为 ${JSON.stringify(expected)}，当前为 ${JSON.stringify(
              actual
            )}`
          )
        );
      }
    }
  }

  if (scan.shapes.length === 0) {
    scan.issues.push(
      errorIssue(
        scan.name,
        'svg',
        '结构',
        '无任何直接 path、rect 或 circle 叶子，会生成空图标'
      )
    );
  }

  for (const shape of scan.shapes) {
    const { attributes } = shape;
    for (const field of ['fill', 'stroke']) {
      const value = attributes[field];
      if (value !== undefined && value !== 'none' && value !== 'currentColor') {
        scan.issues.push(
          errorIssue(
            scan.name,
            shape.name,
            field,
            `只允许 "none" 或 "currentColor"，禁止硬编码 ${JSON.stringify(
              value
            )}`
          )
        );
      }
    }

    if (attributes.opacity !== undefined) {
      const opacity = parseFiniteNumber(attributes.opacity);
      if (opacity === undefined || opacity < 0 || opacity > 1) {
        scan.issues.push(
          errorIssue(
            scan.name,
            shape.name,
            'opacity',
            `必须是 [0, 1] 内的有限数值，当前为 ${JSON.stringify(
              attributes.opacity
            )}`
          )
        );
      }
    }

    if (shape.name === 'path') {
      if (!attributes.d?.trim()) {
        scan.issues.push(
          errorIssue(scan.name, shape.name, 'd', '必须提供非空路径数据')
        );
      }
    } else if (shape.name === 'rect') {
      checkNumberAttribute(scan, shape, 'x');
      checkNumberAttribute(scan, shape, 'y');
      checkNumberAttribute(scan, shape, 'width', {
        required: true,
        positive: true,
      });
      checkNumberAttribute(scan, shape, 'height', {
        required: true,
        positive: true,
      });
      checkNumberAttribute(scan, shape, 'rx', { nonNegative: true });
    } else if (shape.name === 'circle') {
      checkNumberAttribute(scan, shape, 'cx');
      checkNumberAttribute(scan, shape, 'cy');
      checkNumberAttribute(scan, shape, 'r', {
        required: true,
        positive: true,
      });
    }
  }

  return scan.issues;
}

// 便捷测试 seam；真实构建通过 runBuild 保证清理、扫描、校验和解析共享同一份 scan。
function collectSvgIssues(src, name) {
  const scan = scanSvgDocument(cleanSvgSource(src), name);
  return collectScannedSvgIssues(scan);
}

const elementStyle = (attributes) => {
  const style = {};
  if (attributes.fill === 'currentColor') style.fill = 'currentColor';
  if (attributes.opacity !== undefined) {
    style.opacity = Number(attributes.opacity);
  }
  if (attributes.stroke === 'none') style.stroke = 'none';
  return style;
};

function parseScannedSvg(scan) {
  const elements = scan.shapes.map((shape) => {
    const { attributes } = shape;
    const style = elementStyle(attributes);
    if (shape.name === 'path') {
      return { kind: 'path', d: attributes.d, ...style };
    }
    if (shape.name === 'rect') {
      const element = {
        kind: 'rect',
        x: Number(attributes.x ?? 0),
        y: Number(attributes.y ?? 0),
        width: Number(attributes.width),
        height: Number(attributes.height),
      };
      if (attributes.rx !== undefined) element.rx = Number(attributes.rx);
      return { ...element, ...style };
    }
    return {
      kind: 'circle',
      cx: Number(attributes.cx ?? 0),
      cy: Number(attributes.cy ?? 0),
      r: Number(attributes.r),
      ...style,
    };
  });

  return {
    strokeWidth: Number(scan.root.attributes['stroke-width']),
    elements,
  };
}

function parseSvg(src) {
  const scan = scanSvgDocument(cleanSvgSource(src), 'inline.svg');
  const issues = collectScannedSvgIssues(scan);
  if (issues.length) {
    throw new Error(issues.map((issue) => issue.msg).join('\n'));
  }
  return parseScannedSvg(scan);
}

// 由 names + 已解析 icons 拼出 data.ts 源文本（未经 prettier 格式化）。
function generateDataTs(names, icons) {
  const union = names.map((name) => `'${name}'`).join(' | ');
  const body = names
    .map(
      (name) =>
        `  '${name}': ${JSON.stringify(icons[name], null, 4).replace(
          /\n/gu,
          '\n  '
        )},`
    )
    .join('\n');
  const list = names.map((name) => `  '${name}',`).join('\n');

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

// 校验 + 解析纯函数：所有源先清理并扫描；有 error 时绝不产生 dataTs。
function runBuild(names, sources) {
  if (names.length !== sources.length) {
    const issue = errorIssue(
      'build-icons',
      'document',
      '输入',
      `名称数 ${names.length} 与源码数 ${sources.length} 不一致`
    );
    return { errors: [issue], warns: [] };
  }

  const cleaned = sources.map(cleanSvgSource);
  const scans = cleaned.map((source, index) =>
    scanSvgDocument(source, `${names[index]}.svg`)
  );
  const issues = scans.flatMap(collectScannedSvgIssues);
  const errors = issues.filter((issue) => issue.level === 'error');
  const warns = issues.filter((issue) => issue.level === 'warn');
  if (errors.length) return { errors, warns };

  const icons = Object.fromEntries(
    names.map((name, index) => [name, parseScannedSvg(scans[index])])
  );
  return { errors, warns, dataTs: generateDataTs(names, icons) };
}

async function main() {
  const files = fs
    .readdirSync(SVG_DIR)
    .filter((file) => file.endsWith('.svg'))
    .sort();
  const names = files.map((file) => file.replace(/\.svg$/u, ''));
  const sources = files.map((file) =>
    fs.readFileSync(path.join(SVG_DIR, file), 'utf8')
  );

  const { errors, warns, dataTs } = runBuild(names, sources);
  for (const warning of warns) console.warn(`⚠ ${warning.msg}`);
  if (errors.length) {
    for (const error of errors) console.error(`✖ ${error.msg}`);
    console.error(
      `build-icons: ${errors.length} 个错误，未生成 data.ts。修复上述 svg 后重试。`
    );
    process.exit(1);
  }

  // 末尾统一格式化，保证正式生成和临时可复现检查逐字节一致。
  const prettier = require('prettier');
  const config = require('../package.json').prettier ?? {};
  const formatted = await prettier.format(dataTs, { ...config, filepath: OUT });
  fs.writeFileSync(OUT, formatted);
  console.log(
    `build-icons: wrote ${names.length} icons → ${path.relative(
      process.cwd(),
      OUT
    )}`
  );
}

module.exports = {
  cleanSvgSource,
  collectSvgIssues,
  parseSvg,
  runBuild,
  scanSvgDocument,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
