import { describe, expect, test } from '@jest/globals';
import {
  cleanSvgSource,
  collectSvgIssues,
  parseSvg,
  runBuild,
  scanSvgDocument,
} from '../../scripts/build-icons';

const SVG = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

describe('parseSvg — 属性抽取', () => {
  test('抽取元素级 opacity(svg `opacity` → element.opacity)', () => {
    const def = parseSvg(SVG('<path d="M6 10v4" opacity=".55"></path>'));
    expect(def.elements[0]).toMatchObject({ kind: 'path', opacity: 0.55 });
  });

  test("抽取元素级 stroke='none'(纯 fill 圆点,不继承根描边)", () => {
    const def = parseSvg(
      SVG(
        '<circle cx="9" cy="13" r=".9" fill="currentColor" stroke="none"></circle>'
      )
    );
    expect(def.elements[0]).toMatchObject({
      kind: 'circle',
      fill: 'currentColor',
      stroke: 'none',
    });
  });

  test('元素级 currentColor stroke 不重复写入 data(描边色继承主题)', () => {
    const def = parseSvg(SVG('<path d="M2 2" stroke="currentColor"></path>'));
    expect(def.elements[0]).not.toHaveProperty('stroke');
  });

  test('无 opacity / stroke 的常规元素不附加这些字段(现有图标不受影响)', () => {
    const def = parseSvg(SVG('<path d="M2 2"></path>'));
    expect(def.elements[0]).toEqual({ kind: 'path', d: 'M2 2' });
  });

  test('attr 属性名带左边界:rx 排在 x 前时 x 仍取自身值(防前缀碰撞)', () => {
    // SVGO sortAttrs 按字母序(height, rx, width, x, y)会让 rx 排在 x 之前;
    // 无左边界的 `x=` 正则会先命中 `rx="3"` 里的子串,把 x 取成 3。
    const def = parseSvg(
      SVG('<rect height="2" rx="3" width="2" x="5" y="6"></rect>')
    );
    expect(def.elements[0]).toMatchObject({ kind: 'rect', x: 5, y: 6, rx: 3 });
  });
});

const errorsOf = (src: string) =>
  collectSvgIssues(src, 'test').filter((i) => i.level === 'error');

describe('collectSvgIssues — fail-fast 校验', () => {
  test('无任何支持元素(空图标)→ error', () => {
    const issues = errorsOf(SVG(''));
    expect(issues.some((i) => /空|无.*元素/.test(i.msg))).toBe(true);
  });

  test.each([
    [
      'viewBox',
      SVG('<path d="M2 2"></path>').replace('0 0 24 24', '0 0 16 16'),
    ],
    [
      'fill',
      SVG('<path d="M2 2"></path>').replace('fill="none"', 'fill="red"'),
    ],
    [
      'stroke',
      SVG('<path d="M2 2"></path>').replace(
        'stroke="currentColor"',
        'stroke="#000"'
      ),
    ],
    [
      'stroke-width',
      SVG('<path d="M2 2"></path>').replace(
        'stroke-width="1.75"',
        'stroke-width="0"'
      ),
    ],
    [
      'stroke-width',
      SVG('<path d="M2 2"></path>').replace(
        'stroke-width="1.75"',
        'stroke-width="2"'
      ),
    ],
    [
      'stroke-linecap',
      SVG('<path d="M2 2"></path>').replace(
        'stroke-linecap="round"',
        'stroke-linecap="butt"'
      ),
    ],
    [
      'stroke-linejoin',
      SVG('<path d="M2 2"></path>').replace(
        'stroke-linejoin="round"',
        'stroke-linejoin="bevel"'
      ),
    ],
  ])('根 %s 不符合规范 → error', (field, src) => {
    expect(errorsOf(src).some((i) => i.msg.includes(field))).toBe(true);
  });

  test.each([
    ['xmlns', ''],
    ['viewBox', ''],
    ['fill', ''],
    ['stroke', ''],
    ['stroke-width', ''],
    ['stroke-linecap', ''],
    ['stroke-linejoin', ''],
  ])('根缺少 %s → error', (field) => {
    const src = SVG('<path d="M2 2"></path>').replace(
      new RegExp(` ${field}="[^"]*"`),
      ''
    );
    expect(errorsOf(src).some((i) => i.msg.includes(field))).toBe(true);
  });

  test.each([
    ['空 path d', SVG('<path d="  "></path>'), /path.*d/u],
    ['rect 缺 width', SVG('<rect height="2"></rect>'), /rect.*width/u],
    [
      'rect width 非正数',
      SVG('<rect width="0" height="2"></rect>'),
      /rect.*width/u,
    ],
    [
      'rect height 非正数',
      SVG('<rect width="2" height="-1"></rect>'),
      /rect.*height/u,
    ],
    [
      'rect rx 为负数',
      SVG('<rect width="2" height="2" rx="-1"></rect>'),
      /rect.*rx/u,
    ],
    ['circle 缺 r', SVG('<circle cx="1" cy="1"></circle>'), /circle.*r/u],
    ['circle 缺 cx', SVG('<circle cy="1" r="1"></circle>'), /circle.*cx/u],
    ['circle 缺 cy', SVG('<circle cx="1" r="1"></circle>'), /circle.*cy/u],
    [
      'circle 同时缺 cx/cy',
      SVG('<circle r="1"></circle>'),
      /circle.*(?:cx|cy)/u,
    ],
    [
      'circle r 非正数',
      SVG('<circle cx="1" cy="1" r="0"></circle>'),
      /circle.*r/u,
    ],
    [
      '非法数字语法',
      SVG('<circle cx="1e2" cy="1" r="1"></circle>'),
      /circle.*cx/u,
    ],
    ['opacity 小于 0', SVG('<path d="M2 2" opacity="-.1"></path>'), /opacity/u],
    ['opacity 大于 1', SVG('<path d="M2 2" opacity="1.1"></path>'), /opacity/u],
  ])('%s → error', (_label, src, expected) => {
    expect(errorsOf(src).some((i) => expected.test(i.msg))).toBe(true);
  });

  test.each([
    [
      'root unknown',
      SVG('<path d="M2 2"></path>').replace('<svg ', '<svg id="x" '),
    ],
    ['path unknown', SVG('<path d="M2 2" stroke-width="3"></path>')],
    ['rect unknown', SVG('<rect width="2" height="2" ry="1"></rect>')],
    ['circle unknown', SVG('<circle r="1" class="dot"></circle>')],
    ['single quote', SVG("<path d='M2 2'></path>")],
    ['hard-coded fill', SVG('<path d="M2 2" fill="#f00"></path>')],
    ['hard-coded stroke', SVG('<path d="M2 2" stroke="red"></path>')],
  ])('%s 属性 → error', (_label, src) => {
    expect(errorsOf(src)).not.toHaveLength(0);
  });

  test.each([
    ['polyline', '<polyline points="0,0"></polyline>'],
    ['symbol', '<symbol></symbol>'],
    ['title', '<title>icon</title>'],
    ['future-widget', '<future-widget></future-widget>'],
  ])('未知标签 <%s> → error', (tag, body) => {
    expect(errorsOf(SVG(body)).some((i) => i.msg.includes(tag))).toBe(true);
  });

  test.each([
    [
      '多个根',
      `${SVG('<path d="M2 2"></path>')}${SVG('<path d="M3 3"></path>')}`,
    ],
    ['闭合标签不匹配', SVG('<path d="M2 2"></circle>')],
    [
      '未闭合标签',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M2 2">',
    ],
    ['shape 嵌套 shape', SVG('<path d="M2 2"><circle r="1"></circle></path>')],
    ['shape 不在根的直接子层', SVG('<g><path d="M2 2"></path></g>')],
  ])('%s → error', (_label, src) => {
    expect(errorsOf(src)).not.toHaveLength(0);
  });

  test('注释中的 shape 同时被校验和生成忽略', () => {
    const source = SVG('<!-- <path d="M0 0"></path> --><path d="M2 2"></path>');
    const result = runBuild(['one'], [source]);
    expect(result.errors).toEqual([]);
    expect(result.dataTs).toContain('M2 2');
    expect(result.dataTs).not.toContain('M0 0');
  });

  test('合规 svg(含 stroke=none / opacity)→ 无 issue', () => {
    expect(
      collectSvgIssues(
        SVG(
          '<circle cx="9" cy="13" r=".9" fill="currentColor" stroke="none"></circle>'
        ),
        'test'
      )
    ).toHaveLength(0);
  });
});

describe('scanSvgDocument — 完整文档扫描', () => {
  test('cleanSvgSource 只移除注释，scanner 保留真实叶子顺序', () => {
    const clean = cleanSvgSource(
      SVG(
        '<!-- <path d="ignored"></path> --><path d="first"></path><circle r="1"></circle>'
      )
    );
    const scan = scanSvgDocument(clean, 'order.svg');
    expect(scan.shapes.map((shape) => shape.name)).toEqual(['path', 'circle']);
  });

  test('属性值含 slash 不再让合法元素静默丢失，而由属性 allowlist 明确报错', () => {
    const issues = errorsOf(SVG('<path d="M2/2" data-source="a/b"></path>'));
    expect(issues.some((i) => /data-source/u.test(i.msg))).toBe(true);
  });
});

describe('runBuild — 校验通过才生成(fail-fast 编排)', () => {
  const ok = SVG('<path d="M2 2"></path>');
  const bad =
    '<svg viewBox="0 0 24 24"><polyline points="0,0"></polyline></svg>';

  test('有 error 的 svg → 返回 errors 且不产出 dataTs(阻断生成)', () => {
    const r = runBuild(['bad'], [bad]);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.dataTs).toBeUndefined();
  });

  test('全合规 → 无 error 且产出含该图标的 dataTs', () => {
    const r = runBuild(['ok'], [ok]);
    expect(r.errors).toHaveLength(0);
    expect(r.dataTs).toContain("'ok'");
    expect(r.dataTs).toContain('export const ICONS');
  });

  test('一坏一好混合 → 整体阻断(任一 error 即不生成)', () => {
    const r = runBuild(['ok', 'bad'], [ok, bad]);
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.dataTs).toBeUndefined();
  });
});
