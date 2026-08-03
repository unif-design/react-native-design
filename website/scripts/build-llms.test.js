'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const b = require('./build-llms.js');
const {
  findBalancedEnd,
  protectCode,
  rewriteInternalLinks,
} = require('./llms/markdown');
const {
  buildRouteMap,
  collisionKey,
  normalizeRelSlug,
} = require('./llms/routes');

function test(name, run) {
  try {
    run();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n`);
    throw error;
  }
}

const count = (value, needle) => value.split(needle).length - 1;

function document(sourcePath, frontmatter = {}) {
  return {
    id: sourcePath,
    sourceName: `docs/${sourcePath}`,
    sourcePath,
    ...frontmatter,
  };
}

function loadWebsiteDocuments() {
  const docsDirectory = path.join(__dirname, '..', 'docs');
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(absolutePath);
      } else if (/\.mdx?$/iu.test(entry.name)) {
        files.push(absolutePath);
      }
    }
  };
  visit(docsDirectory);

  return files.sort().map((absolutePath) => {
    const sourcePath = path
      .relative(docsDirectory, absolutePath)
      .split(path.sep)
      .join('/');
    const raw = fs.readFileSync(absolutePath, 'utf8');
    const frontmatter = b.parseFrontmatter(raw);
    return document(sourcePath, {
      slug: frontmatter.slug,
      title: frontmatter.title,
      description: frontmatter.description,
      body: frontmatter.body,
      raw,
    });
  });
}

test('frontmatter description is parsed', () => {
  const parsed = b.parseFrontmatter(
    '---\ntitle: T\ndescription: D 描述\n---\nbody'
  );

  assert.strictEqual(parsed.description, 'D 描述');
  assert.strictEqual(parsed.body, 'body');
});

test('uppercase source and lowercase alias share one canonical output', () => {
  const map = buildRouteMap([
    document('UNIF-DESIGN.md', { slug: '/unif-design' }),
  ]);

  assert.strictEqual(map.documents[0].outputPath, 'md/UNIF-DESIGN.md');
  assert.strictEqual(
    map.resolve('/docs/UNIF-DESIGN').outputPath,
    'md/UNIF-DESIGN.md'
  );
  assert.strictEqual(
    map.resolve('/docs/unif-design').outputPath,
    'md/UNIF-DESIGN.md'
  );
  assert.strictEqual(map.documents.length, 1);
});

test('route map rejects case-only canonical output collisions', () => {
  assert.throws(
    () => buildRouteMap([document('Guide.md'), document('guide.mdx')]),
    /canonical output collision.*Guide\.md.*guide\.mdx/iu
  );
});

test('route map rejects NFC-equivalent canonical output collisions', () => {
  assert.throws(
    () => buildRouteMap([document('café.md'), document('cafe\u0301.mdx')]),
    /canonical output collision.*café\.md.*café\.mdx/iu
  );
});

test('route map rejects case-only and NFC-equivalent alias collisions', () => {
  assert.throws(
    () =>
      buildRouteMap([
        document('first.md', { slug: '/shared' }),
        document('second.md', { slug: '/SHARED' }),
      ]),
    /route alias collision.*first\.md.*second\.md/iu
  );
  assert.throws(
    () =>
      buildRouteMap([
        document('first.md', { slug: '/café' }),
        document('second.md', { slug: '/cafe\u0301' }),
      ]),
    /route alias collision.*first\.md.*second\.md/iu
  );
});

test('relative slugs preserve case, normalize NFC, and share collision keys', () => {
  assert.strictEqual(
    normalizeRelSlug('Components/Cafe\u0301', 'docs/source.md'),
    'Components/Café'
  );
  assert.strictEqual(collisionKey('Components/CAFÉ'), 'components/café');
  assert.strictEqual(
    collisionKey('Components/Cafe\u0301'),
    collisionKey('components/café')
  );
});

test('relative slugs reject absolute, backslash, control, and unsafe segments', () => {
  const unsafe = [
    '',
    '/absolute',
    'C:/absolute',
    'components\\button',
    'components//button',
    '.',
    'components/./button',
    '..',
    'components/../button',
    'components/\u0001button',
  ];

  for (const value of unsafe) {
    assert.throws(
      () => normalizeRelSlug(value, 'docs/source.md'),
      /docs\/source\.md: unsafe/u
    );
  }
});

test('frontmatter aliases require exactly one leading slash', () => {
  for (const slug of ['components/button', '//components/button']) {
    assert.throws(
      () => buildRouteMap([document('button.md', { slug })]),
      /docs\/button\.md: unsafe frontmatter slug/u
    );
  }
});

test('source-derived routes reject reserved targets and the md namespace', () => {
  const fixtures = [
    ['LLMS.TXT.md', 'llms.txt'],
    ['Llms-Full.Txt.mdx', 'llms-full.txt'],
    ['MD.md', 'md'],
    ['Md/Index.Json.md', 'md/index.json'],
    ['mD/components/button.mdx', 'md'],
  ];

  for (const [sourcePath, reservedTarget] of fixtures) {
    assert.throws(
      () => buildRouteMap([document(sourcePath)]),
      (error) =>
        error.message.includes(`docs/${sourcePath}`) &&
        error.message.includes(reservedTarget)
    );
  }
});

test('frontmatter aliases reject reserved targets and the md namespace', () => {
  const fixtures = [
    ['/LLMS.TXT', 'llms.txt'],
    ['/Llms-Full.Txt', 'llms-full.txt'],
    ['/MD', 'md'],
    ['/Md/Index.Json', 'md/index.json'],
    ['/mD/components/button', 'md'],
  ];

  for (const [slug, reservedTarget] of fixtures) {
    const sourcePath = `safe-${reservedTarget.replace('/', '-')}.md`;
    assert.throws(
      () => buildRouteMap([document(sourcePath, { slug })]),
      (error) =>
        error.message.includes(`docs/${sourcePath}`) &&
        error.message.includes(reservedTarget)
    );
  }
});

test('internal links resolve only through canonical routes and preserve fragments', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx', { slug: '/catalog/deep/card' }),
    document('components/button.mdx'),
    document('components/cell.mdx'),
    document('getting-started.md'),
  ]);
  const sourceDocument = routeMap.documents[0];
  const fragment = '#API-Cafe\u0301-中文%20X';
  const markdown = [
    `[Button](/docs/components/button${fragment})`,
    '[Cell](./cell.mdx)',
    '[Button source](./button.mdx)',
    '[Next](../getting-started.md)',
    '[Http](http://x)',
    '[Web](https://x)',
    '[Mail](mailto:a@b)',
    '[Here](#local)',
  ].join(' ');

  assert.strictEqual(
    rewriteInternalLinks(markdown, sourceDocument, routeMap),
    [
      `[Button](button.md${fragment})`,
      '[Cell](cell.md)',
      '[Button source](button.md)',
      '[Next](../getting-started.md)',
      '[Http](http://x)',
      '[Web](https://x)',
      '[Mail](mailto:a@b)',
      '[Here](#local)',
    ].join(' ')
  );
  assert.strictEqual(
    rewriteInternalLinks(
      `[Button](/docs/components/button${fragment})`,
      { ...sourceDocument, outputPath: 'llms-full.txt' },
      routeMap
    ),
    `[Button](md/components/button.md${fragment})`
  );
});

test('whitelisted schemes use the unescaped semantic target but preserve source bytes', () => {
  const routeMap = buildRouteMap([document('components/card.mdx')]);
  const source = [
    '[Web](https\\://example.com/docs)',
    '[Mail](mailto\\:docs@example.com)',
  ].join(' ');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    source
  );
});

test('non-whitelisted schemes and protocol-relative targets fail through route lookup', () => {
  const routeMap = buildRouteMap([document('components/card.mdx')]);
  const targets = [
    'ftp://example.com/guide',
    'tel:+123456',
    'data:text/plain,guide',
    'javascript:alert(1)',
    '//cdn.example.com/guide',
  ];

  for (const target of targets) {
    assert.throws(
      () =>
        rewriteInternalLinks(
          `[Target](${target})`,
          routeMap.documents[0],
          routeMap
        ),
      (error) =>
        error.message.includes('docs/components/card.mdx') &&
        error.message.includes(target)
    );
  }
});

test('structured inline links support nested and escaped labels while preserving titles', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/button.mdx'),
  ]);
  const source = [
    '[Button [primary]](/docs/components/button#props "Primary button")',
    "[Button \\]](./button.mdx#api 'Escaped label')",
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    [
      '[Button [primary]](button.md#props "Primary button")',
      "[Button \\]](button.md#api 'Escaped label')",
    ].join('\n')
  );
});

test('inline destinations unescape CommonMark ASCII punctuation before route lookup', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/guide(test).md'),
  ]);

  assert.strictEqual(
    rewriteInternalLinks(
      '[Guide](./guide\\(test\\).md)',
      routeMap.documents[0],
      routeMap
    ),
    '[Guide](guide(test).md)'
  );
});

test('escaped fragment delimiters are split from the CommonMark semantic target', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/button.mdx'),
  ]);
  const source = [
    '[Inline](./button.md\\#Inline-Props)',
    '[Reference][button]',
    '',
    '[button]: ./button.mdx\\#Reference-Props',
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    [
      '[Inline](button.md#Inline-Props)',
      '[Reference][button]',
      '',
      '[button]: button.md#Reference-Props',
    ].join('\n')
  );
});

test('escaped literal link syntax remains byte-for-byte unchanged', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/button.mdx'),
  ]);
  const source = '\\[Button](/docs/components/button)';

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    source
  );
});

test('reference definitions rewrite destinations and preserve uses and titles', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/button.mdx'),
  ]);
  const source = [
    '[Button][button]',
    '[Web][web] [Mail][mail] [Local][local]',
    '',
    '[button]: /docs/components/button#Props "Button title"',
    '[web]: https://example.com/docs',
    '[mail]: mailto:docs@example.com',
    '[local]: #same-page',
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    [
      '[Button][button]',
      '[Web][web] [Mail][mail] [Local][local]',
      '',
      '[button]: button.md#Props "Button title"',
      '[web]: https://example.com/docs',
      '[mail]: mailto:docs@example.com',
      '[local]: #same-page',
    ].join('\n')
  );
});

test('reference labels normalize escapes whitespace and case for full collapsed and shortcut links', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/button.mdx'),
  ]);
  const source = [
    '[Full][  BuTton\\!   Docs ]',
    '[Collapsed][]',
    '[Shortcut]',
    '',
    '[button! docs]: /docs/components/button#full',
    '[collapsed]: /docs/components/button#collapsed',
    '[shortcut]: /docs/components/button#shortcut',
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    [
      '[Full][  BuTton\\!   Docs ]',
      '[Collapsed][]',
      '[Shortcut]',
      '',
      '[button! docs]: button.md#full',
      '[collapsed]: button.md#collapsed',
      '[shortcut]: button.md#shortcut',
    ].join('\n')
  );
});

test('only the first normalized reference definition is active', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/button.mdx'),
  ]);
  const source = [
    '[Button][shared]',
    '',
    '[shared]: /docs/components/button#first',
    '[SHARED]: ./missing.mdx#inactive',
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    [
      '[Button][shared]',
      '',
      '[shared]: button.md#first',
      '[SHARED]: ./missing.mdx#inactive',
    ].join('\n')
  );
});

test('multiline plain and angle reference definitions preserve layout and titles', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/guide(test).md'),
  ]);
  const source = [
    '[Plain][plain]',
    '[Angle][angle]',
    '',
    '[plain]: ./guide\\(test\\).md',
    '  "Plain title"',
    '[angle]:',
    '  </docs/components/guide(test).md#API>',
    "  'Angle title'",
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    [
      '[Plain][plain]',
      '[Angle][angle]',
      '',
      '[plain]: guide(test).md',
      '  "Plain title"',
      '[angle]:',
      '  <guide(test).md#API>',
      "  'Angle title'",
    ].join('\n')
  );
});

test('image-only and unused reference definitions remain byte-for-byte', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/button.mdx'),
  ]);
  const source = [
    '![Button][image]',
    '',
    '[image]: /docs/components/button#image "Image target"',
    '[unused]: ./missing.mdx#unused "Unused target"',
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    source
  );
});

test('a reference label used by both link and image fails explicitly', () => {
  const routeMap = buildRouteMap([
    document('components/card.mdx'),
    document('components/button.mdx'),
  ]);

  assert.throws(
    () =>
      rewriteInternalLinks(
        [
          '[Button][shared]',
          '![Button][shared]',
          '',
          '[shared]: /docs/components/button',
        ].join('\n'),
        routeMap.documents[0],
        routeMap
      ),
    /docs\/components\/card\.mdx: reference label shared is used by both link and image/iu
  );
});

test('reference definitions inside fenced and inline code remain byte-for-byte', () => {
  const routeMap = buildRouteMap([document('components/card.mdx')]);
  const source = [
    '正文 `[missing]: /docs/missing` 保留。',
    '```md',
    '[missing]: ./missing.mdx#props "Missing"',
    '```',
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    source
  );
});

test('missing reference destinations report source and original target', () => {
  const routeMap = buildRouteMap([document('components/card.mdx')]);

  assert.throws(
    () =>
      rewriteInternalLinks(
        [
          '[Missing][missing]',
          '',
          '[missing]: ./missing.mdx#props "Missing"',
        ].join('\n'),
        routeMap.documents[0],
        routeMap
      ),
    /docs\/components\/card\.mdx: missing internal route \.\/missing\.mdx#props/u
  );
});

test('real relative and alias routes resolve to canonical mirror paths', () => {
  const routeMap = buildRouteMap([
    document('UNIF-DESIGN.md', { slug: '/unif-design' }),
    document('components/overview.md', { slug: '/components' }),
    document('components/drawer-header.mdx'),
    document('components/avatar.mdx'),
    document('components/pulse.mdx'),
    document('design/tokens/motion.md'),
  ]);
  const bySource = new Map(
    routeMap.documents.map((item) => [item.sourcePath, item])
  );

  assert.strictEqual(
    rewriteInternalLinks(
      '[Components](/docs/components)',
      bySource.get('UNIF-DESIGN.md'),
      routeMap
    ),
    '[Components](components/overview.md)'
  );
  assert.strictEqual(
    rewriteInternalLinks(
      '[Avatar](./avatar#图片-source-identity-与失败隔离)',
      bySource.get('components/drawer-header.mdx'),
      routeMap
    ),
    '[Avatar](avatar.md#图片-source-identity-与失败隔离)'
  );
  assert.strictEqual(
    rewriteInternalLinks(
      '[Pulse](../../components/pulse)',
      bySource.get('design/tokens/motion.md'),
      routeMap
    ),
    '[Pulse](../../components/pulse.md)'
  );
});

test('internal links inside fenced and inline code remain byte-for-byte', () => {
  const routeMap = buildRouteMap([document('source.md')]);
  const source = [
    '正文 `[Missing](/docs/missing)` 保留。',
    '```md',
    '[Also missing](./missing.mdx)',
    '```',
  ].join('\n');

  assert.strictEqual(
    rewriteInternalLinks(source, routeMap.documents[0], routeMap),
    source
  );
});

test('missing internal routes report source file and original target', () => {
  const routeMap = buildRouteMap([document('components/card.mdx')]);

  assert.throws(
    () =>
      rewriteInternalLinks(
        '[Missing](./missing.mdx#props)',
        routeMap.documents[0],
        routeMap
      ),
    /docs\/components\/card\.mdx: missing internal route \.\/missing\.mdx#props/u
  );
});

test('all 54 website sources produce one canonical mirror and resolvable links', () => {
  const routeMap = buildRouteMap(loadWebsiteDocuments());
  assert.strictEqual(routeMap.documents.length, 54);
  assert.strictEqual(
    new Set(routeMap.documents.map((item) => item.outputPath)).size,
    54
  );
  assert.strictEqual(
    routeMap.resolve('/docs/components').outputPath,
    'md/components/overview.md'
  );
  assert.strictEqual(
    routeMap.resolve('/docs/design').outputPath,
    'md/design/intro.md'
  );
  assert.strictEqual(
    routeMap.resolve('/docs/unif-design').outputPath,
    'md/UNIF-DESIGN.md'
  );
  assert(
    !routeMap.documents.some((item) => item.outputPath === 'md/components.md')
  );
  assert(
    !routeMap.documents.some((item) => item.outputPath === 'md/design.md')
  );

  for (const item of routeMap.documents) {
    const converted = b.convertMdxBody(item.body, item.sourceName);
    rewriteInternalLinks(converted, item, routeMap);
  }
});

test('index and full metadata use one deployment-relative canonical entry per source', () => {
  const routeMap = buildRouteMap(loadWebsiteDocuments());
  const entries = routeMap.documents.map((item) => b.createIndexEntry(item));
  const index = b.buildLlmsIndex('Unif Design', entries);

  assert.strictEqual(entries.length, 54);
  assert.strictEqual(new Set(entries.map((item) => item.mdPath)).size, 54);
  assert(entries.every((item) => item.mdPath.startsWith('md/')));
  assert(entries.every((item) => !item.mdPath.startsWith('/')));
  assert.strictEqual(count(index, '](md/'), 54);
  assert.strictEqual(count(index, '](llms-full.txt)'), 1);
  assert(!index.includes('](/md/'));
  assert(!index.includes('](/llms-full.txt)'));

  const canonical = routeMap.resolve('/docs/unif-design');
  assert.strictEqual(
    b.formatFullMetadata(canonical),
    '*Source: `docs/UNIF-DESIGN.md` · Mirror: `md/UNIF-DESIGN.md`*'
  );
});

test('direct LiveDemo retains one support definition and nested source', () => {
  const source = [
    "import { LiveDemo } from '@site/src/components/LiveDemo';",
    'export const Support = ({ children }) => {',
    '  const [on] = useState(true);',
    '  const value = { nested: { label: on ? "开" : "关" } };',
    '  return <View data-label={value.nested.label}>{children}</View>;',
    '};',
    '## 预览',
    '<LiveDemo client:load data-options={{ nested: true }}>',
    '  <Support>',
    '    <Button label="开始" onPress={() => undefined} />',
    '  </Support>',
    '</LiveDemo>',
  ].join('\n');

  const output = b.convertMdxBody(source, 'direct.mdx');

  assert.strictEqual(count(output, 'const Support'), 1);
  assert.strictEqual(count(output, '```tsx'), 1);
  assert.strictEqual(count(output, 'LiveDemo'), 0);
  assert.strictEqual(count(output, 'export const Support'), 0);
  assert(output.includes('const [on] = useState(true);'));
  assert(output.includes('<Support>'));
  assert(output.includes('<Button label="开始"'));
  assert(
    output.includes(
      'return <View data-label={value.nested.label}>{children}</View>;\n' +
        '};\n\n' +
        '  <Support>'
    ),
    'support 与首个 demo body 之间恰好保留一个空白行'
  );
});

test('multiple support definitions keep source order and emit only once', () => {
  const source = [
    'export const FIRST = { order: 1 };',
    'export function secondLabel() { return "second"; }',
    '<LiveDemo><Text>{FIRST.order} {secondLabel()}</Text></LiveDemo>',
    '<LiveDemo><Text>later</Text></LiveDemo>',
  ].join('\n');

  const output = b.convertMdxBody(source, 'support-order.mdx');
  const firstIndex = output.indexOf('const FIRST');
  const secondIndex = output.indexOf('function secondLabel');
  const demoIndex = output.indexOf('<Text>{FIRST.order}');

  assert(firstIndex >= 0);
  assert(firstIndex < secondIndex);
  assert(secondIndex < demoIndex);
  assert.strictEqual(count(output, 'const FIRST'), 1);
  assert.strictEqual(count(output, 'function secondLabel'), 1);
});

test('exported function/const and multiple demos are emitted once', () => {
  const source = [
    'export const SHARED = { label: "共享" };',
    'export function FirstDemo() {',
    '  const [on, setOn] = useState(false);',
    '  return (',
    '    <LiveDemo>',
    '      <Button label={on ? SHARED.label : "关"} onPress={() => setOn(!on)} />',
    '    </LiveDemo>',
    '  );',
    '}',
    'export const SecondDemo = () => {',
    '  const value = { nested: { ok: true } };',
    '  return <Text>{String(value.nested.ok)}</Text>;',
    '};',
    '<FirstDemo />',
    '<SecondDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'multi.mdx');

  assert.strictEqual(count(output, 'function FirstDemo'), 1);
  assert.strictEqual(count(output, 'const SecondDemo'), 1);
  assert.strictEqual(count(output, 'const SHARED'), 1);
  assert.strictEqual(count(output, '<FirstDemo />'), 0);
  assert.strictEqual(count(output, '<SecondDemo />'), 0);
  assert.strictEqual(count(output, 'LiveDemo'), 0);
  assert(output.includes('<>'));
  assert(output.includes('</>'));
});

test('an exported exact Demo is emitted for its self-closing invocation', () => {
  const source = [
    'export const Demo = () => <Text>exact</Text>;',
    '<Demo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'exact-demo.mdx');

  assert.strictEqual(count(output, 'const Demo'), 1);
  assert.strictEqual(count(output, '<Demo />'), 0);
  assert(output.includes('<Text>exact</Text>'));
});

test('an unknown exact Demo invocation fails with source and name', () => {
  assert.throws(
    () => b.convertMdxBody('<Demo />', 'unknown-exact-demo.mdx'),
    /unknown-exact-demo\.mdx: unknown Demo Demo/u
  );
});

test('unknown Demo fails with source name and component name', () => {
  assert.throws(
    () => b.convertMdxBody('## 预览\n<MissingDemo />\n', 'unknown.mdx'),
    /unknown\.mdx: unknown Demo MissingDemo/u
  );
});

test('unknown self-closing Demo with props keeps the unknown error contract', () => {
  assert.throws(
    () =>
      b.convertMdxBody(
        '## 预览\n<MissingDemo value={{ nested: true }} />\n',
        'unknown-props.mdx'
      ),
    /unknown-props\.mdx: unknown Demo MissingDemo/u
  );
});

test('known Demo invocations with props fail instead of dropping props', () => {
  const source = [
    'export const KnownDemo = () => <Text>known</Text>;',
    '<KnownDemo value={{ nested: true }} />',
  ].join('\n');

  assert.throws(
    () => b.convertMdxBody(source, 'known-props.mdx'),
    /known-props\.mdx: unprocessed Demo KnownDemo/u
  );
});

test('known paired Demo invocations fail instead of leaving dangling JSX', () => {
  const source = [
    'export const KnownDemo = () => <Text>known</Text>;',
    '<KnownDemo value="paired"><Text>child</Text></KnownDemo>',
  ].join('\n');

  assert.throws(
    () => b.convertMdxBody(source, 'known-paired.mdx'),
    /known-paired\.mdx: unprocessed Demo KnownDemo/u
  );
});

test('unknown paired Demo invocations fail with source and name', () => {
  const source = '<MissingDemo value="paired"><Text>child</Text></MissingDemo>';

  assert.throws(
    () => b.convertMdxBody(source, 'unknown-paired.mdx'),
    /unknown-paired\.mdx: unknown Demo MissingDemo/u
  );
});

test('ordinary self-closing MDX components are preserved', () => {
  const source = ['## 内容', '<Tabs />', '<DemoPanel />'].join('\n');

  assert.strictEqual(b.convertMdxBody(source, 'ordinary.mdx'), source);
});

test('support definitions without a generated demo fail', () => {
  assert.throws(
    () =>
      b.convertMdxBody(
        'export const OPTIONS = { enabled: true };\n## 正文\n',
        'orphan.mdx'
      ),
    /orphan\.mdx: orphan support definition/u
  );
});

test('duplicate Demo definitions fail', () => {
  const source = [
    'export const SameDemo = () => <Text>A</Text>;',
    'export function SameDemo() { return <Text>B</Text>; }',
    '<SameDemo />',
  ].join('\n');

  assert.throws(
    () => b.convertMdxBody(source, 'duplicate.mdx'),
    /duplicate\.mdx: duplicate Demo SameDemo/u
  );
});

test('unsupported top-level exports fail with source line', () => {
  assert.throws(
    () =>
      b.convertMdxBody(
        ['## 内容', 'export default function DemoPage() {}'].join('\n'),
        'unsupported.mdx'
      ),
    /unsupported\.mdx: unsupported export at 2/u
  );
});

test('unsupported export line numbers include preceding protected code', () => {
  const source = [
    '```tsx',
    'export default function ExampleOnly() {}',
    '```',
    '',
    'export default function RealExport() {}',
  ].join('\n');

  assert.throws(
    () => b.convertMdxBody(source, 'line-number.mdx'),
    /line-number\.mdx: unsupported export at 5/u
  );
});

test('fenced and inline code remain byte-for-byte unchanged', () => {
  const protectedText = [
    '~~~tsx',
    'export const FakeDemo = () => <LiveDemo />;',
    '<UnknownDemo />',
    '~~~',
    '正文 `export const InlineDemo = () => <LiveDemo />` 保留。',
  ].join('\n');

  assert.strictEqual(
    b.convertMdxBody(protectedText, 'protected.mdx'),
    protectedText
  );
});

test('a longer backtick fence is closed only by the same run length', () => {
  const protectedText = [
    '`````tsx',
    'export const FakeDemo = () => (',
    '  <LiveDemo>',
    '```',
    '  <UnknownDemo />',
    '```',
    '  </LiveDemo>',
    ');',
    '`````',
  ].join('\n');

  assert.strictEqual(
    b.convertMdxBody(protectedText, 'long-fence.mdx'),
    protectedText
  );
});

test('Demo normalization changes only real JSX LiveDemo wrappers', () => {
  const source = [
    'export const LexicalDemo = () => {',
    "  const literal = '<LiveDemo>string</LiveDemo>';",
    '  // <LiveDemo>line comment</LiveDemo>',
    '  /* <LiveDemo>block comment</LiveDemo> */',
    '  const template = `<LiveDemo>template raw</LiveDemo>`;',
    '  return <LiveDemo><Text>{literal}</Text></LiveDemo>;',
    '};',
    '<LexicalDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'lexical-live-demo.mdx');

  assert(output.includes("const literal = '<LiveDemo>string</LiveDemo>';"));
  assert(output.includes('// <LiveDemo>line comment</LiveDemo>'));
  assert(output.includes('/* <LiveDemo>block comment</LiveDemo> */'));
  assert(
    output.includes('const template = `<LiveDemo>template raw</LiveDemo>`;')
  );
  assert(output.includes('return <><Text>{literal}</Text></>;'));
});

test('HTML and MDX comments cannot declare exported demos', () => {
  const source = [
    '<!--',
    'export const HiddenDemo = () => <LiveDemo><Text>HTML</Text></LiveDemo>;',
    '<HiddenDemo />',
    '-->',
    '',
    '{/*',
    'export const AlsoHiddenDemo = () => <LiveDemo><Text>MDX</Text></LiveDemo>;',
    '<AlsoHiddenDemo />',
    '*/}',
  ].join('\n');

  assert.strictEqual(b.convertMdxBody(source, 'comments.mdx'), source);
});

test('protected ranges restore nested tokens without changing sentinel-like source', () => {
  const originalSentinel = '\u0000PROTECTED_0\u0000';
  const source = [
    `原始 ${originalSentinel} 保留，\`跨行 code span`,
    '```tsx',
    "import { Hidden } from './hidden';",
    '```',
    '结束` 后继续。',
  ].join('\n');
  const protectedSource = protectCode(source);

  assert.strictEqual(protectedSource.restore(protectedSource.source), source);
  assert.strictEqual(b.convertMdxBody(source, 'nested-protection.mdx'), source);
  assert.strictEqual(count(source, originalSentinel), 1);
});

test('matching multi-backtick inline code and protected imports stay byte-for-byte', () => {
  const source = [
    '正文 ``import Fake from "inline"; ` 内层 backtick`` 保留。',
    '~~~tsx',
    "import { Fenced } from './fenced';",
    '~~~',
    '尾注 `import AlsoFake from "inline";` 保留。',
  ].join('\n');

  assert.strictEqual(b.convertMdxBody(source, 'protected-imports.mdx'), source);
});

test('exported Demo preserves an escaped backtick in a template literal', () => {
  const templateLine = '  const text = `tick \\` value ${1}`;';
  const source = [
    'export const EscapedTemplateDemo = () => {',
    templateLine,
    '  return <LiveDemo><Text>{text}</Text></LiveDemo>;',
    '};',
    '<EscapedTemplateDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'escaped-exported-template.mdx');

  assert(output.includes(templateLine));
  assert(output.includes('return <><Text>{text}</Text></>;'));
});

test('direct LiveDemo preserves an escaped backtick in a template literal', () => {
  const templateExpression = '{`tick \\` value ${1}`}';
  const source = [
    '<LiveDemo>',
    `  <Text>${templateExpression}</Text>`,
    '</LiveDemo>',
  ].join('\n');

  const output = b.convertMdxBody(source, 'escaped-direct-template.mdx');

  assert(output.includes(`<Text>${templateExpression}</Text>`));
  assert.strictEqual(count(output, '```tsx'), 1);
});

test('exported Demo preserves escaped single quotes and template raw text', () => {
  const quoteLine = "  const text = 'it\\'s <LiveDemo>string raw</LiveDemo>';";
  const templateLine =
    '  const template = `keep <LiveDemo>template raw</LiveDemo> and \\`tick`;';
  const source = [
    'export const EscapedStringDemo = () => {',
    quoteLine,
    templateLine,
    '  return <LiveDemo><Text>{text + template}</Text></LiveDemo>;',
    '};',
    '<EscapedStringDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'escaped-string-pipeline.mdx');

  assert(output.includes(quoteLine));
  assert(output.includes(templateLine));
  assert(output.includes('return <><Text>{text + template}</Text></>;'));
});

test('exported Demo preserves nested template expressions end-to-end', () => {
  const templateLine = '  const text = `outer ${`inner ${value}`}`;';
  const source = [
    'export const NestedTemplateDemo = () => {',
    '  const value = "nested";',
    templateLine,
    '  return <LiveDemo><Text>{text}</Text></LiveDemo>;',
    '};',
    '<NestedTemplateDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'nested-template.mdx');

  assert(output.includes(templateLine));
  assert(output.includes('return <><Text>{text}</Text></>;'));
});

test('exported Demo supports regex literals inside JSX event handlers', () => {
  const handlerLine =
    '    <Button onPress={() => /[}]/u.test(value)} label="检查" />';
  const source = [
    'export const RegexHandlerDemo = () => {',
    '  const value = "ok";',
    '  return (',
    '    <LiveDemo>',
    handlerLine,
    '    </LiveDemo>',
    '  );',
    '};',
    '<RegexHandlerDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'regex-handler.mdx');

  assert(output.includes(handlerLine));
  assert(output.includes('return ('));
});

test('Demo token scanning ignores LiveDemo text inside regex literals', () => {
  const patternLine = '  const pattern = /<LiveDemo>raw<\\/LiveDemo>/u;';
  const source = [
    'export const RegexRawDemo = () => {',
    patternLine,
    '  return <LiveDemo><Text>{pattern.source}</Text></LiveDemo>;',
    '};',
    '<RegexRawDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'regex-raw-live-demo.mdx');

  assert(output.includes(patternLine));
  assert(output.includes('return <><Text>{pattern.source}</Text></>;'));
});

test('balanced scanner ignores comments, escaped quotes, and templates', () => {
  const declaration = [
    'export const ComplexDemo = () => {',
    '  const escaped = "} \\" still-string";',
    '  const template = `value ${(() => ({ nested: "]" }))()}`;',
    '  // }]); must not close the declaration',
    '  /* {[( must not open it either */',
    '  return <Text>{template}</Text>;',
    '};',
  ].join('\n');
  const source = `${declaration}\nAFTER`;

  assert.strictEqual(findBalancedEnd(source, 0), declaration.length);
});

test('balanced scanner consumes semicolons in concise JSX text', () => {
  const declaration = 'export const TextDemo = () => <Text>semi;colon</Text>;';
  const source = `${declaration}\n<TextDemo />`;

  assert.strictEqual(findBalancedEnd(source, 0), declaration.length);
  assert(
    b
      .convertMdxBody(source, 'concise-jsx.mdx')
      .includes('const TextDemo = () => <Text>semi;colon</Text>;')
  );
});

test('balanced scanner consumes delimiters and semicolons in regex literals', () => {
  const declaration = 'export const PATTERN = /[});;]+/u;';
  const source = [
    declaration,
    '<LiveDemo><Text>{PATTERN.source}</Text></LiveDemo>',
  ].join('\n');

  assert.strictEqual(findBalancedEnd(source, 0), declaration.length);
  assert(
    b
      .convertMdxBody(source, 'regex-support.mdx')
      .includes('const PATTERN = /[});;]+/u;')
  );
});

test('balanced scanner treats division after postfix increment and decrement as division', () => {
  const incrementLine = '  const incremented = count++ / total;';
  const decrementLine = '  const decremented = count-- / total;';
  const source = [
    'export const PostfixDivisionDemo = () => {',
    '  let count = 2;',
    '  const total = 4;',
    incrementLine,
    decrementLine,
    '  return <LiveDemo><Text>{incremented + decremented}</Text></LiveDemo>;',
    '};',
    '<PostfixDivisionDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'postfix-division.mdx');

  assert(output.includes(incrementLine));
  assert(output.includes(decrementLine));
});

test('balanced scanner still recognizes regex literals after return', () => {
  const regexLine = '  return /[}]/u;';
  const source = [
    'export function ReturnRegexDemo() {',
    regexLine,
    '}',
    '<ReturnRegexDemo />',
  ].join('\n');

  const output = b.convertMdxBody(source, 'return-regex.mdx');

  assert(output.includes(regexLine));
});

test('balanced scanner ends a function declaration at its body brace', () => {
  const declaration = [
    'export async function StatefulDemo() {',
    '  return <View>{`value ${1 + 1}`}</View>;',
    '}',
  ].join('\n');

  assert.strictEqual(
    findBalancedEnd(`${declaration}\nAFTER`, 0),
    declaration.length
  );
});

test('balanced scanner accepts a top-level function indented up to three spaces', () => {
  const declaration = [
    '  export function IndentedDemo() {',
    '    return <Text>缩进声明</Text>;',
    '  }',
  ].join('\n');

  assert.strictEqual(
    findBalancedEnd(`${declaration}\nAFTER`, 0),
    declaration.length
  );
});

test('balanced scanner rejects mismatched and unclosed declarations', () => {
  assert.throws(
    () => findBalancedEnd('export const BrokenDemo = ({ value: true ];', 0),
    /mismatched \] at \d+/u
  );
  assert.throws(
    () => findBalancedEnd('export const BrokenDemo = ({ value: true', 0),
    /unclosed export declaration at 0/u
  );
});

test('mismatched LiveDemo wrappers fail with source name', () => {
  assert.throws(
    () =>
      b.convertMdxBody(
        [
          'export const BrokenDemo = () => (',
          '  <LiveDemo><Text>未闭合</Text>',
          ');',
          '<BrokenDemo />',
        ].join('\n'),
        'broken-live.mdx'
      ),
    /broken-live\.mdx: unclosed LiveDemo/u
  );
});

test('nested and self-closing LiveDemo wrappers fail explicitly', () => {
  assert.throws(
    () =>
      b.convertMdxBody(
        '<LiveDemo><LiveDemo><Text>nested</Text></LiveDemo></LiveDemo>',
        'nested-live.mdx'
      ),
    /nested-live\.mdx: nested LiveDemo is not supported/u
  );
  assert.throws(
    () => b.convertMdxBody('<LiveDemo />', 'self-closing-live.mdx'),
    /self-closing-live\.mdx: self-closing LiveDemo is not supported/u
  );
});

test('Markdown assembly collapses blank lines only outside fenced code', () => {
  const parts = [
    'before',
    '',
    '',
    [
      '```tsx',
      'const first = true;',
      '',
      '',
      'const second = true;',
      '```',
    ].join('\n'),
    '',
    '',
    'after',
  ];

  assert.strictEqual(
    b.assembleMarkdown(parts),
    [
      'before',
      '',
      '```tsx',
      'const first = true;',
      '',
      '',
      'const second = true;',
      '```',
      '',
      'after',
    ].join('\n')
  );
});

test('index formatting helpers keep their existing behavior', () => {
  assert.strictEqual(
    b.formatIndexLine({
      title: 'Button 按钮',
      mdPath: '/md/components/button.md',
      description: '主/次',
    }),
    '- [Button 按钮](/md/components/button.md) — 主/次'
  );
  assert.strictEqual(
    b.formatIndexLine({
      title: 'X',
      mdPath: '/md/x.md',
      description: null,
    }),
    '- [X](/md/x.md)'
  );
  assert.deepStrictEqual(b.sortSections(['components', '概览', 'design']), [
    '概览',
    'components',
    'design',
  ]);
  assert(b.buildToc(['A', 'B']).startsWith('## 目录'));
  assert(b.buildToc(['A', 'B']).includes('- A'));
});

process.stdout.write('ALL PASS\n');
