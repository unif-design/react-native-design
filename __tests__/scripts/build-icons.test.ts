import { describe, expect, test } from '@jest/globals';
import {
  collectSvgIssues,
  parseSvg,
  runBuild,
} from '../../scripts/build-icons';

const SVG = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">${body}</svg>`;

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

  test('元素级 stroke 非 none 值不抽取(描边色应继承主题,不硬编码进 data)', () => {
    const def = parseSvg(SVG('<path d="M2 2" stroke="#f00"></path>'));
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
const warnsOf = (src: string) =>
  collectSvgIssues(src, 'test').filter((i) => i.level === 'warn');

describe('collectSvgIssues — fail-fast 校验', () => {
  test('不支持元素(polyline)→ error,且 msg 指出标签名', () => {
    const issues = errorsOf(
      SVG('<path d="M2 2"></path><polyline points="0,0"></polyline>')
    );
    expect(issues.some((i) => /polyline/.test(i.msg))).toBe(true);
  });

  test('单引号属性 → error(attr 只认双引号会静默丢)', () => {
    expect(errorsOf(SVG("<path d='M2 2'></path>"))).not.toHaveLength(0);
  });

  test('无任何支持元素(空图标)→ error', () => {
    const issues = errorsOf(SVG(''));
    expect(issues.some((i) => /空|无.*元素/.test(i.msg))).toBe(true);
  });

  test('viewBox 非 0 0 24 24 → error(运行时按 24 网格渲染会缩放失真)', () => {
    const src =
      '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M2 2"></path></svg>';
    expect(errorsOf(src).some((i) => /viewBox/.test(i.msg))).toBe(true);
  });

  test('受支持元素属性值含 / 致整元素被丢 → 开标签计数交叉校验 error', () => {
    // regex `[^/>]*` 在属性值含 `/` 时整个元素匹配失败,被静默丢弃。
    const issues = errorsOf(SVG('<path d="M2 2" class="a/b"></path>'));
    expect(issues.some((i) => /计数|抽取/.test(i.msg))).toBe(true);
  });

  test('非 round linecap → warn(Icon 强制 round,源非 round 会误导)', () => {
    const src =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="butt"><path d="M2 2"></path></svg>';
    expect(warnsOf(src).some((i) => /linecap|round/.test(i.msg))).toBe(true);
  });

  test('元素级 stroke-width → warn(脚本只读根 stroke-width,元素级会被丢)', () => {
    expect(
      warnsOf(SVG('<path d="M2 2" stroke-width="3"></path>')).some((i) =>
        /stroke-width/.test(i.msg)
      )
    ).toBe(true);
  });

  test('元素级 stroke 非 none → warn(被 parseSvg 忽略,描边色应继承主题)', () => {
    expect(
      warnsOf(SVG('<path d="M2 2" stroke="#f00"></path>')).some((i) =>
        /stroke/.test(i.msg)
      )
    ).toBe(true);
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
