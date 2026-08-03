#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDir, '..');

const expectedScenes = [
  'foundation',
  'actions',
  'feedback',
  'forms',
  'navigation',
  'collections',
  'media',
  'business',
];

const expectedUiComponents = [
  'Avatar',
  'BlurLayer',
  'Button',
  'Card',
  'Carousel',
  'Cell',
  'List',
  'Checkbox',
  'Chip',
  'ConfirmHost',
  'DrawerHeader',
  'Empty',
  'EntryCard',
  'Form',
  'FormGroup',
  'FormRow',
  'Grid',
  'Icon',
  'IconButton',
  'Input',
  'Logo',
  'NavBar',
  'PasswordInput',
  'Pulse',
  'PulseDot',
  'Radio',
  'Reveal',
  'Search',
  'Segmented',
  'Skeleton',
  'Spinner',
  'StatusDot',
  'Stepper',
  'Switch',
  'TabBar',
  'Tabs',
  'Tag',
  'Textarea',
  'Thumbnail',
  'ToastHost',
];

const expectedBusinessComponents = [
  'GradientWash',
  'RadialHalo',
  'ScreenBackdrop',
  'GlassStats',
  'AvatarWithRing',
  'VersionPill',
];

const expectedComponentsByScene = {
  foundation: ['Icon'],
  actions: ['Button', 'IconButton', 'Chip', 'Tag', 'StatusDot'],
  feedback: [
    'Empty',
    'Skeleton',
    'Spinner',
    'Pulse',
    'PulseDot',
    'Reveal',
    'BlurLayer',
    'ConfirmHost',
    'ToastHost',
  ],
  forms: [
    'Input',
    'PasswordInput',
    'Textarea',
    'Search',
    'Checkbox',
    'Radio',
    'Switch',
    'Stepper',
    'Form',
    'FormGroup',
    'FormRow',
  ],
  navigation: ['NavBar', 'DrawerHeader', 'Tabs', 'Segmented', 'TabBar'],
  collections: ['Card', 'Cell', 'List', 'Grid', 'EntryCard', 'Carousel'],
  media: ['Avatar', 'Thumbnail', 'Logo'],
  business: expectedBusinessComponents,
};

const expectedRuntimeApis = [
  'ThemeProvider',
  'useTheme',
  'useColors',
  'useShadow',
  'useFontScale',
  'useThemedStyles',
  'usePrefersReducedMotion',
  'normalizeFontScale',
  'scaleFontMetric',
  'r',
  'rf',
  'lightColors',
  'darkColors',
  'avatarGradient',
  'BRAND_ORANGE',
  'warmOrangePalette',
  'lightShadow',
  'darkShadow',
  'fontMono',
  'type',
  'fw',
  'space',
  'radius',
  'avatar',
  'icon',
  'control',
  'dim',
  'fixed',
  'motion',
  'pressedOpacity',
  'blur',
  'ICONS',
  'ICON_NAMES',
  'childTestID',
  'createLogger',
  'setLogLevel',
  'getLogLevel',
  'addTransport',
  'removeTransport',
  'consoleTransport',
  'confirm',
  'toast',
  'usePulse',
  'useSvgId',
];

function parseSource(filePath) {
  return ts.createSourceFile(
    filePath,
    readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
}

function unwrapExpression(expression) {
  let current = expression;
  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function findStaticArray(sourceFile, variableName) {
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName &&
        declaration.initializer
      ) {
        const initializer = unwrapExpression(declaration.initializer);
        if (!ts.isArrayLiteralExpression(initializer)) {
          throw new Error(`${variableName} 必须是静态数组`);
        }
        return initializer;
      }
    }
  }
  throw new Error(`catalog 缺少 ${variableName} 静态数组`);
}

function stringLiteralValue(node, label) {
  if (!node || !ts.isStringLiteral(node)) {
    throw new Error(`${label} 必须是字符串 literal`);
  }
  return node.text;
}

function propertyInitializer(object, propertyName) {
  for (const property of object.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      ((ts.isIdentifier(property.name) &&
        property.name.text === propertyName) ||
        (ts.isStringLiteral(property.name) &&
          property.name.text === propertyName))
    ) {
      return property.initializer;
    }
  }
  throw new Error(`component catalog 项缺少 ${propertyName}`);
}

function readCatalogEntries(catalogPath) {
  const array = findStaticArray(parseSource(catalogPath), 'componentCatalog');
  return array.elements.map((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      throw new Error(`component catalog 第 ${index + 1} 项必须是对象 literal`);
    }
    const states = unwrapExpression(propertyInitializer(element, 'states'));
    if (!ts.isArrayLiteralExpression(states) || states.elements.length === 0) {
      throw new Error(`component catalog 第 ${index + 1} 项 states 必须非空`);
    }
    return {
      id: stringLiteralValue(
        propertyInitializer(element, 'id'),
        `component catalog 第 ${index + 1} 项 id`
      ),
      scene: stringLiteralValue(
        propertyInitializer(element, 'scene'),
        `component catalog 第 ${index + 1} 项 scene`
      ),
      states: states.elements.map((state, stateIndex) =>
        stringLiteralValue(
          state,
          `component catalog 第 ${index + 1} 项 states[${stateIndex}]`
        )
      ),
    };
  });
}

function readStaticStrings(sourceFile, variableName) {
  const array = findStaticArray(sourceFile, variableName);
  return array.elements.map((element, index) =>
    stringLiteralValue(element, `${variableName}[${index}]`)
  );
}

function resolveModuleFile(fromFile, moduleName) {
  const base = path.resolve(path.dirname(fromFile), moduleName);
  const candidates = [
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  const resolved = candidates.find((candidate) => existsSync(candidate));
  if (!resolved) {
    throw new Error(
      `无法解析 TypeScript module: ${moduleName} from ${fromFile}`
    );
  }
  return resolved;
}

function exportedDeclarationName(statement) {
  const hasExport = statement.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
  );
  if (!hasExport) return undefined;

  if (
    (ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement)) &&
    statement.name
  ) {
    return [statement.name.text];
  }
  if (ts.isVariableStatement(statement)) {
    const names = [];
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) names.push(declaration.name.text);
    }
    return names;
  }
  return undefined;
}

function collectRuntimeExports(filePath, visited = new Set()) {
  const absolutePath = path.resolve(filePath);
  if (visited.has(absolutePath)) return new Set();
  visited.add(absolutePath);

  const exports = new Set();
  const sourceFile = parseSource(absolutePath);
  for (const statement of sourceFile.statements) {
    const declarationNames = exportedDeclarationName(statement);
    if (declarationNames) {
      for (const name of declarationNames) exports.add(name);
      continue;
    }
    if (!ts.isExportDeclaration(statement) || statement.isTypeOnly) continue;

    if (statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const specifier of statement.exportClause.elements) {
        if (!specifier.isTypeOnly) exports.add(specifier.name.text);
      }
      continue;
    }

    if (
      !statement.exportClause &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const child = resolveModuleFile(
        absolutePath,
        statement.moduleSpecifier.text
      );
      for (const name of collectRuntimeExports(child, visited)) {
        exports.add(name);
      }
    }
  }
  return exports;
}

function isUppercasePublicName(name) {
  const firstCode = name.charCodeAt(0);
  return firstCode >= 65 && firstCode <= 90;
}

function assertExactSet(label, actualValues, expectedValues) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const duplicates = actualValues.filter(
    (value, index) => actualValues.indexOf(value) !== index
  );
  const missing = expectedValues.filter((value) => !actual.has(value));
  const extra = actualValues.filter((value) => !expected.has(value));

  if (duplicates.length || missing.length || extra.length) {
    throw new Error(
      `${label} contract 漂移；重复: ${duplicates.join(', ') || '无'}；缺少: ${
        missing.join(', ') || '无'
      }；多出: ${extra.join(', ') || '无'}`
    );
  }
}

export function verifyExampleShowcase(root) {
  const catalogPath = path.join(
    root,
    'example/src/catalog/componentCatalog.ts'
  );
  const catalogSource = parseSource(catalogPath);
  const entries = readCatalogEntries(catalogPath);
  const catalogIds = entries.map((entry) => entry.id);
  const expectedComponents = [
    ...expectedUiComponents,
    ...expectedBusinessComponents,
  ];
  assertExactSet('component catalog', catalogIds, expectedComponents);

  const invalidScenes = entries
    .map((entry) => entry.scene)
    .filter((scene) => !expectedScenes.includes(scene));
  if (invalidScenes.length) {
    throw new Error(
      `component catalog scene 非法: ${invalidScenes.join(', ')}`
    );
  }
  const emptyScenes = expectedScenes.filter(
    (scene) => !entries.some((entry) => entry.scene === scene)
  );
  if (emptyScenes.length) {
    throw new Error(
      `component catalog scene 无主归属: ${emptyScenes.join(', ')}`
    );
  }
  for (const scene of expectedScenes) {
    assertExactSet(
      `component catalog scene ${scene}`,
      entries.filter((entry) => entry.scene === scene).map((entry) => entry.id),
      expectedComponentsByScene[scene]
    );
  }

  const uiRuntime = [
    ...collectRuntimeExports(path.join(root, 'src/components/ui/index.ts')),
  ].filter(isUppercasePublicName);
  const businessRuntime = [
    ...collectRuntimeExports(
      path.join(root, 'src/components/business/index.ts')
    ),
  ].filter(isUppercasePublicName);
  assertExactSet('UI component runtime', uiRuntime, expectedUiComponents);
  assertExactSet(
    'business component runtime',
    businessRuntime,
    expectedBusinessComponents
  );
  assertExactSet('component catalog/public runtime', catalogIds, [
    ...uiRuntime,
    ...businessRuntime,
  ]);

  const runtimeApis = readStaticStrings(catalogSource, 'requiredRuntimeApis');
  assertExactSet('required runtime API', runtimeApis, expectedRuntimeApis);
  const rootRuntime = collectRuntimeExports(path.join(root, 'src/index.tsx'));
  const unavailable = runtimeApis.filter((name) => !rootRuntime.has(name));
  if (unavailable.length) {
    throw new Error(
      `required runtime API 未从 public barrel 导出: ${unavailable.join(', ')}`
    );
  }
}

function runCli() {
  const contractRoot = path.resolve(process.argv[2] ?? repositoryRoot);
  const args = ['--test'];

  args.push(
    path.join(scriptsDir, '__tests__/example-showcase-contract.test.mjs')
  );

  const env = {
    ...process.env,
    EXAMPLE_SHOWCASE_ROOT: contractRoot,
  };
  delete env.EXAMPLE_SHOWCASE_TEST_NAME_PATTERN;
  // 集成测试也会调用正式 verifier；不继承 node:test 的递归保护标记。
  delete env.NODE_TEST_CONTEXT;

  const result = spawnSync(process.execPath, args, {
    cwd: repositoryRoot,
    env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }
  process.exitCode = result.status ?? 1;
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCli();
}
