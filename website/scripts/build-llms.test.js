'use strict';

const assert = require('node:assert');
const b = require('./build-llms.js');
const { findBalancedEnd, protectCode } = require('./llms/markdown');

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

test('frontmatter description is parsed', () => {
  const parsed = b.parseFrontmatter(
    '---\ntitle: T\ndescription: D 描述\n---\nbody'
  );

  assert.strictEqual(parsed.description, 'D 描述');
  assert.strictEqual(parsed.body, 'body');
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
