#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDir, '..');

export class ExampleShowcaseVerificationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ExampleShowcaseVerificationError';
    this.code = code;
  }
}

function failVerification(code, message) {
  throw new ExampleShowcaseVerificationError(code, message);
}

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

const expectedSceneTitles = {
  foundation: '基础能力与图标',
  actions: '操作与状态',
  feedback: '反馈与浮层',
  forms: '表单与输入',
  navigation: '导航组件',
  collections: '容器与集合',
  media: '媒体展示',
  business: '业务复合组件',
};

const expectedRuntimeDependencies = {
  '@sbaiahmed1/react-native-blur': '4.6.2',
  '@unif/react-native-design': 'workspace:*',
  'react': '19.2.3',
  'react-native': '0.86.2',
  'react-native-gesture-handler': '3.1.0',
  'react-native-reanimated': '4.5.3',
  'react-native-reanimated-carousel': '5.0.0',
  'react-native-safe-area-context': '5.8.0',
  'react-native-svg': '15.15.5',
  'react-native-worklets': '0.11.3',
};

const expectedTemplateDevDependencies = {
  '@react-native-community/cli': '20.1.0',
  '@react-native-community/cli-platform-android': '20.1.0',
  '@react-native-community/cli-platform-ios': '20.1.0',
  '@react-native/babel-preset': '0.86.2',
  '@react-native/eslint-config': '0.86.2',
  '@react-native/jest-preset': '0.86.2',
  '@react-native/metro-config': '0.86.2',
  '@react-native/typescript-config': '0.86.2',
};

const expectedRootPeerDependencies = {
  '@sbaiahmed1/react-native-blur': '>=4',
  'react': '>=19.2.3 <20.0.0',
  'react-native': '>=0.86.0 <0.87.0',
  'react-native-gesture-handler': '>=3.0.0 <4.0.0',
  'react-native-reanimated': '>=4.5.2 <4.6.0',
  'react-native-reanimated-carousel': '>=5.0.0 <6.0.0',
  'react-native-safe-area-context': '>=5',
  'react-native-svg': '>=15',
  'react-native-worklets': '>=0.11.0 <0.12.0',
};

const expectedVerifyScript =
  'node --test scripts/__tests__/verify-example-showcase.test.mjs && node scripts/verify-example-showcase.mjs';

const expectedRootJestTestPathIgnorePatterns = [
  '/node_modules/',
  '<rootDir>/website/',
  '<rootDir>/example/',
  '<rootDir>/scripts/__tests__/',
];

const requiredCallableApis = new Set([
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
  'childTestID',
  'createLogger',
  'setLogLevel',
  'getLogLevel',
  'addTransport',
  'removeTransport',
  'confirm',
  'toast',
  'usePulse',
  'useSvgId',
]);

function parseSource(filePath) {
  let source;
  try {
    source = readFileSync(filePath, 'utf8');
  } catch (error) {
    failVerification(
      'SOURCE_READ',
      `无法读取 TypeScript source: ${filePath}；${String(error)}`
    );
  }
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    const diagnostic = sourceFile.parseDiagnostics[0];
    failVerification(
      'SOURCE_PARSE',
      `TypeScript source 无法解析: ${filePath}；${
        diagnostic
          ? ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
          : '未知错误'
      }`
    );
  }
  return sourceFile;
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
          failVerification(
            'CATALOG_STATIC_SHAPE',
            `${variableName} 必须是静态数组`
          );
        }
        return initializer;
      }
    }
  }
  failVerification(
    'CATALOG_STATIC_SHAPE',
    `catalog 缺少 ${variableName} 静态数组`
  );
}

function stringLiteralValue(node, label) {
  if (!node || !ts.isStringLiteral(node)) {
    failVerification('CATALOG_STATIC_SHAPE', `${label} 必须是字符串 literal`);
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
  failVerification(
    'CATALOG_STATIC_SHAPE',
    `component catalog 项缺少 ${propertyName}`
  );
}

function readCatalogEntries(catalogPath) {
  const array = findStaticArray(parseSource(catalogPath), 'componentCatalog');
  return array.elements.map((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      failVerification(
        'CATALOG_STATIC_SHAPE',
        `component catalog 第 ${index + 1} 项必须是对象 literal`
      );
    }
    const states = unwrapExpression(propertyInitializer(element, 'states'));
    if (!ts.isArrayLiteralExpression(states) || states.elements.length === 0) {
      failVerification(
        'CATALOG_STATIC_SHAPE',
        `component catalog 第 ${index + 1} 项 states 必须非空`
      );
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
    failVerification(
      'MODULE_RESOLUTION',
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

function assertExactSet(
  label,
  actualValues,
  expectedValues,
  {
    duplicateCode = 'EXACT_SET_DUPLICATE',
    mismatchCode = 'EXACT_SET_MISMATCH',
  } = {}
) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const duplicates = actualValues.filter(
    (value, index) => actualValues.indexOf(value) !== index
  );
  const missing = expectedValues.filter((value) => !actual.has(value));
  const extra = actualValues.filter((value) => !expected.has(value));

  if (duplicates.length) {
    failVerification(
      duplicateCode,
      `${label} contract 漂移；重复: ${duplicates.join(', ')}`
    );
  }
  if (missing.length || extra.length) {
    failVerification(
      mismatchCode,
      `${label} contract 漂移；重复: ${duplicates.join(', ') || '无'}；缺少: ${
        missing.join(', ') || '无'
      }；多出: ${extra.join(', ') || '无'}`
    );
  }
}

function readText(root, relativePath) {
  const filePath = path.join(root, relativePath);
  try {
    return readFileSync(filePath, 'utf8');
  } catch (error) {
    failVerification(
      'SOURCE_READ',
      `无法读取 contract 文件: ${relativePath}；${String(error)}`
    );
  }
}

function readJson(root, relativePath) {
  const source = readText(root, relativePath);
  try {
    return JSON.parse(source);
  } catch (error) {
    failVerification(
      'JSON_PARSE',
      `无法解析 JSON: ${relativePath}；${String(error)}`
    );
  }
}

function assertRecordEqual(code, label, actual, expected) {
  const actualKeys = Object.keys(actual ?? {}).sort();
  const expectedKeys = Object.keys(expected).sort();
  if (
    JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys) ||
    expectedKeys.some((key) => actual?.[key] !== expected[key])
  ) {
    failVerification(
      code,
      `${label} 漂移；expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`
    );
  }
}

function listSourceFiles(directory, includeTests = false) {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch (error) {
    failVerification(
      'SOURCE_READ',
      `无法遍历 source 目录: ${directory}；${String(error)}`
    );
  }
  const files = [];
  for (const entry of entries) {
    const candidate = path.join(directory, entry);
    if (statSync(candidate).isDirectory()) {
      if (includeTests || entry !== '__tests__') {
        files.push(...listSourceFiles(candidate, includeTests));
      }
    } else if (/\.[jt]sx?$/u.test(entry)) {
      files.push(candidate);
    }
  }
  return files;
}

function importModuleName(statement) {
  if (
    ts.isImportDeclaration(statement) &&
    ts.isStringLiteral(statement.moduleSpecifier)
  ) {
    return statement.moduleSpecifier.text;
  }
  return undefined;
}

function collectRuntimeImportBindings(filePaths, moduleName) {
  const bindings = new Map();
  for (const filePath of filePaths) {
    const sourceFile = parseSource(filePath);
    const localBindings = new Map();
    for (const statement of sourceFile.statements) {
      if (importModuleName(statement) !== moduleName) continue;
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly || !clause.namedBindings) continue;
      if (!ts.isNamedImports(clause.namedBindings)) continue;
      for (const specifier of clause.namedBindings.elements) {
        if (specifier.isTypeOnly) continue;
        const imported = specifier.propertyName?.text ?? specifier.name.text;
        const local = specifier.name.text;
        localBindings.set(local, imported);
        const binding = bindings.get(imported) ?? {
          imported,
          uses: 0,
          jsxUses: 0,
          callUses: 0,
          files: new Set(),
        };
        binding.files.add(filePath);
        bindings.set(imported, binding);
      }
    }

    const visit = (node) => {
      if (ts.isImportDeclaration(node)) return;
      if (ts.isIdentifier(node)) {
        const imported = localBindings.get(node.text);
        const binding = imported ? bindings.get(imported) : undefined;
        if (binding) {
          binding.uses += 1;
          if (
            (ts.isJsxOpeningElement(node.parent) &&
              node.parent.tagName === node) ||
            (ts.isJsxSelfClosingElement(node.parent) &&
              node.parent.tagName === node)
          ) {
            binding.jsxUses += 1;
          }
          if (
            (ts.isCallExpression(node.parent) &&
              node.parent.expression === node) ||
            (ts.isPropertyAccessExpression(node.parent) &&
              node.parent.expression === node &&
              ts.isCallExpression(node.parent.parent) &&
              node.parent.parent.expression === node.parent)
          ) {
            binding.callUses += 1;
          }
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  return bindings;
}

function readStaticObjectArray(sourceFile, variableName, properties) {
  const array = findStaticArray(sourceFile, variableName);
  return array.elements.map((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      failVerification(
        'STATIC_CONTRACT_SHAPE',
        `${variableName}[${index}] 必须是对象 literal`
      );
    }
    return Object.fromEntries(
      properties.map((property) => [
        property,
        stringLiteralValue(
          propertyInitializer(element, property),
          `${variableName}[${index}].${property}`
        ),
      ])
    );
  });
}

function jsxTagName(node) {
  const tagName = node.tagName;
  return ts.isIdentifier(tagName) ? tagName.text : undefined;
}

function findJsxElements(sourceFile, name) {
  const matches = [];
  const visit = (node) => {
    if (
      (ts.isJsxElement(node) && jsxTagName(node.openingElement) === name) ||
      (ts.isJsxSelfClosingElement(node) && jsxTagName(node) === name)
    ) {
      matches.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return matches;
}

function directJsxChildren(element) {
  if (!ts.isJsxElement(element)) return [];
  return element.children.filter(
    (child) => ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)
  );
}

function assertDirectChild(parent, expectedName, code) {
  const matches = directJsxChildren(parent).filter((child) => {
    if (ts.isJsxElement(child))
      return jsxTagName(child.openingElement) === expectedName;
    return jsxTagName(child) === expectedName;
  });
  if (matches.length !== 1) {
    failVerification(
      code,
      `${jsxTagName(parent.openingElement)} 必须恰有一个直接子节点 ${expectedName}`
    );
  }
  return matches[0];
}

function jsxAttributeLiteral(element, attributeName, code) {
  const attributes = ts.isJsxElement(element)
    ? element.openingElement.attributes.properties
    : element.attributes.properties;
  const attribute = attributes.find(
    (candidate) =>
      ts.isJsxAttribute(candidate) &&
      ts.isIdentifier(candidate.name) &&
      candidate.name.text === attributeName
  );
  if (
    !attribute ||
    !ts.isJsxAttribute(attribute) ||
    !attribute.initializer ||
    !ts.isStringLiteral(attribute.initializer)
  ) {
    failVerification(
      code,
      `ShowcaseScaffold ${attributeName} 必须是 string literal`
    );
  }
  return attribute.initializer.text;
}

function verifyForbiddenSource(root) {
  const sourceFiles = listSourceFiles(path.join(root, 'example/src'), true);
  for (const filePath of sourceFiles) {
    const sourceFile = parseSource(filePath);
    const relativePath = path.relative(root, filePath);

    for (const statement of sourceFile.statements) {
      const moduleName = importModuleName(statement);
      if (!moduleName) continue;
      if (moduleName.startsWith('@unif/react-native-design/')) {
        failVerification(
          'SOURCE_DEEP_IMPORT',
          `${relativePath} 禁止 Design deep import: ${moduleName}`
        );
      }
      if (
        moduleName === 'react-native-design' ||
        moduleName === 'react-native-designdd'
      ) {
        failVerification(
          'SOURCE_LEGACY_PACKAGE',
          `${relativePath} 仍导入旧包名: ${moduleName}`
        );
      }
      if (moduleName === 'react-native') {
        const namedBindings = statement.importClause?.namedBindings;
        if (namedBindings && ts.isNamedImports(namedBindings)) {
          const forbidden = namedBindings.elements
            .map(
              (specifier) => specifier.propertyName?.text ?? specifier.name.text
            )
            .filter(
              (name) =>
                name === 'Pressable' ||
                name === 'TouchableOpacity' ||
                name === 'TouchableHighlight' ||
                name === 'TouchableWithoutFeedback' ||
                name === 'TouchableNativeFeedback'
            );
          if (forbidden.length) {
            failVerification(
              'SOURCE_RN_PRESSABLE',
              `${relativePath} 禁止从 react-native 导入 ${forbidden.join(', ')}`
            );
          }
        }
      }
    }

    const visit = (node) => {
      if (
        ts.isStringLiteralLike(node) &&
        (/(?:^|[^\w])#[0-9a-f]{3,8}(?:$|[^\w])/iu.test(node.text) ||
          /rgba?\s*\(/iu.test(node.text))
      ) {
        failVerification(
          'SOURCE_HARDCODED_COLOR',
          `${relativePath} 包含硬编码颜色: ${node.text}`
        );
      }
      if (
        ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'console'
      ) {
        failVerification(
          'SOURCE_CONSOLE',
          `${relativePath} 禁止 console.*，请使用 createLogger`
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
}

function verifyRuntimeAndNativeContract(root) {
  const rootPackage = readJson(root, 'package.json');
  const examplePackage = readJson(root, 'example/package.json');

  assertRecordEqual(
    'RUNTIME_DEPENDENCIES',
    'example runtime dependencies',
    examplePackage.dependencies,
    expectedRuntimeDependencies
  );
  for (const [name, version] of Object.entries(
    expectedTemplateDevDependencies
  )) {
    if (examplePackage.devDependencies?.[name] !== version) {
      failVerification(
        'TOOLCHAIN_VERSION',
        `${name} 必须为 ${version}，实际为 ${String(examplePackage.devDependencies?.[name])}`
      );
    }
  }
  assertRecordEqual(
    'ROOT_PEER_DEPENDENCIES',
    'root peerDependencies',
    rootPackage.peerDependencies,
    expectedRootPeerDependencies
  );
  if (
    rootPackage.scripts?.example !==
      'yarn workspace @unif/react-native-design-example' ||
    rootPackage.scripts?.['verify:example-showcase'] !== expectedVerifyScript ||
    examplePackage.scripts?.test !== 'jest' ||
    examplePackage.scripts?.typecheck !== 'tsc --noEmit' ||
    examplePackage.scripts?.lint !== 'eslint .'
  ) {
    failVerification('WORKSPACE_SCRIPTS', 'root/example scripts contract 漂移');
  }
  if (
    JSON.stringify(rootPackage.jest?.testPathIgnorePatterns) !==
    JSON.stringify(expectedRootJestTestPathIgnorePatterns)
  ) {
    failVerification(
      'ROOT_JEST_NODE_TEST_BOUNDARY',
      'root Jest 必须排除使用 node:test 的 scripts/__tests__'
    );
  }

  const babelPath = path.join(root, 'example/babel.config.js');
  const babelSource = parseSource(babelPath);
  const pluginArrays = [];
  const visitBabel = (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      ((ts.isIdentifier(node.name) && node.name.text === 'plugins') ||
        (ts.isStringLiteral(node.name) && node.name.text === 'plugins'))
    ) {
      const initializer = unwrapExpression(node.initializer);
      if (ts.isArrayLiteralExpression(initializer)) {
        pluginArrays.push(
          initializer.elements.map((element, index) =>
            stringLiteralValue(element, `plugins[${index}]`)
          )
        );
      }
    }
    ts.forEachChild(node, visitBabel);
  };
  visitBabel(babelSource);
  if (
    pluginArrays.length !== 1 ||
    pluginArrays[0].at(-1) !== 'react-native-worklets/plugin'
  ) {
    failVerification(
      'BABEL_PLUGIN_ORDER',
      'react-native-worklets/plugin 必须是唯一 Babel plugins 数组的最后一项'
    );
  }
  const babelText = readText(root, 'example/babel.config.js');
  const metro = readText(root, 'example/metro.config.js');
  const jest = readText(root, 'example/jest.config.js');
  const tsconfig = readJson(root, 'example/tsconfig.json');
  if (!babelText.includes("'module:@react-native/babel-preset'")) {
    failVerification('BABEL_PRESET', 'example Babel preset 漂移');
  }
  if (
    !metro.includes("require('react-native-monorepo-config')") ||
    !metro.includes('withMetroConfig(getDefaultConfig(__dirname),') ||
    !metro.includes('root,')
  ) {
    failVerification(
      'METRO_SOURCE_MAPPING',
      'Metro 未保持 workspace source mapping'
    );
  }
  if (
    !jest.includes("preset: '@react-native/jest-preset'") ||
    !jest.includes(
      "'^@unif/react-native-design$': '<rootDir>/../src/index.tsx'"
    ) ||
    tsconfig.extends !== '@react-native/typescript-config' ||
    tsconfig.compilerOptions?.paths?.['@unif/react-native-design']?.[0] !==
      '../src/index.tsx'
  ) {
    failVerification(
      'EXAMPLE_TOOL_CONFIG',
      'Jest/TypeScript workspace source contract 漂移'
    );
  }

  const app = readJson(root, 'example/app.json');
  const index = readText(root, 'example/index.js');
  const appGradle = readText(root, 'example/android/app/build.gradle');
  const rootGradle = readText(root, 'example/android/build.gradle');
  const settings = readText(root, 'example/android/settings.gradle');
  const properties = readText(root, 'example/android/gradle.properties');
  const activity = readText(
    root,
    'example/android/app/src/main/java/unif/reactnativedesign/example/MainActivity.kt'
  );
  const application = readText(
    root,
    'example/android/app/src/main/java/unif/reactnativedesign/example/MainApplication.kt'
  );
  const podfile = readText(root, 'example/ios/Podfile');
  const delegate = readText(
    root,
    'example/ios/ReactNativeDesignExample/AppDelegate.swift'
  );
  const project = readText(
    root,
    'example/ios/ReactNativeDesignExample.xcodeproj/project.pbxproj'
  );
  const scheme = readText(
    root,
    'example/ios/ReactNativeDesignExample.xcodeproj/xcshareddata/xcschemes/ReactNativeDesignExample.xcscheme'
  );
  const identityValid =
    app.name === 'ReactNativeDesignExample' &&
    app.displayName === 'ReactNativeDesignExample' &&
    index.indexOf("import 'react-native-gesture-handler';") >= 0 &&
    index.indexOf("import 'react-native-gesture-handler';") <
      index.indexOf("import { AppRegistry } from 'react-native';") &&
    /namespace "unif\.reactnativedesign\.example"/u.test(appGradle) &&
    /applicationId "unif\.reactnativedesign\.example"/u.test(appGradle) &&
    /autolinkLibrariesWithApp\(\)/u.test(appGradle) &&
    /minSdkVersion = 24/u.test(rootGradle) &&
    /compileSdkVersion = 36/u.test(rootGradle) &&
    /targetSdkVersion = 36/u.test(rootGradle) &&
    /rootProject\.name = 'ReactNativeDesignExample'/u.test(settings) &&
    /autolinkLibrariesFromCommand\(\)/u.test(settings) &&
    /^newArchEnabled=true$/mu.test(properties) &&
    /^hermesEnabled=true$/mu.test(properties) &&
    /^package unif\.reactnativedesign\.example$/mu.test(activity) &&
    /getMainComponentName\(\): String = "ReactNativeDesignExample"/u.test(
      activity
    ) &&
    /^package unif\.reactnativedesign\.example$/mu.test(application) &&
    /target 'ReactNativeDesignExample' do/u.test(podfile) &&
    /config = use_native_modules!/u.test(podfile) &&
    /withModuleName: "ReactNativeDesignExample"/u.test(delegate) &&
    !/DesignddExample|designdd\.example/u.test(project) &&
    /ReactNativeDesignExample\.app/u.test(project) &&
    /PRODUCT_BUNDLE_IDENTIFIER = "?unif\.reactnativedesign\.example"?;/u.test(
      project
    ) &&
    !/DesignddExample/u.test(scheme) &&
    /container:ReactNativeDesignExample\.xcodeproj/u.test(scheme);
  if (!identityValid) {
    failVerification(
      'NATIVE_IDENTITY',
      'app/workspace/Android/iOS identity contract 漂移'
    );
  }

  const manifest = readText(
    root,
    'example/android/app/src/main/AndroidManifest.xml'
  );
  const permissions = [
    ...manifest.matchAll(/<uses-permission\s+android:name="([^"]+)"\s*\/>/gu),
  ].map((match) => match[1]);
  if (
    permissions.length !== 1 ||
    permissions[0] !== 'android.permission.INTERNET'
  ) {
    failVerification(
      'NATIVE_PERMISSIONS',
      'Android manifest 只能声明 INTERNET 权限'
    );
  }

  const plist = readText(
    root,
    'example/ios/ReactNativeDesignExample/Info.plist'
  );
  if (
    /<key>NS(?:Location|Camera|Photo)[^<]*UsageDescription<\/key>/u.test(plist)
  ) {
    failVerification(
      'NATIVE_PERMISSIONS',
      'iOS 禁止无关敏感 usage description'
    );
  }
  const orientationMatch = plist.match(
    /<key>UISupportedInterfaceOrientations<\/key>\s*<array>([\s\S]*?)<\/array>/u
  );
  const orientations = orientationMatch
    ? [...orientationMatch[1].matchAll(/<string>([^<]+)<\/string>/gu)].map(
        (match) => match[1]
      )
    : [];
  assertExactSet(
    'iPhone orientation',
    orientations,
    [
      'UIInterfaceOrientationPortrait',
      'UIInterfaceOrientationLandscapeLeft',
      'UIInterfaceOrientationLandscapeRight',
    ],
    {
      duplicateCode: 'NATIVE_ORIENTATION',
      mismatchCode: 'NATIVE_ORIENTATION',
    }
  );
}

function verifySceneContract(root, entries) {
  const catalogPath = path.join(
    root,
    'example/src/catalog/componentCatalog.ts'
  );
  const sceneIds = readStaticStrings(parseSource(catalogPath), 'sceneIds');
  assertExactSet('sceneIds', sceneIds, expectedScenes, {
    duplicateCode: 'SCENE_ID_SET',
    mismatchCode: 'SCENE_ID_SET',
  });

  const routerPath = path.join(root, 'example/src/app/ExampleRouter.tsx');
  const routerSource = readText(root, 'example/src/app/ExampleRouter.tsx');
  const routerAst = parseSource(routerPath);
  const routeImports = new Map();
  for (const statement of routerAst.statements) {
    const moduleName = importModuleName(statement);
    const match = moduleName?.match(/^\.\.\/showcases\/([^/]+)\//u);
    if (!match) continue;
    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;
    const names = namedBindings.elements.map(
      (specifier) => specifier.name.text
    );
    if (names.length === 1) routeImports.set(match[1], names[0]);
  }
  const routeEntries = [];
  for (const scene of expectedScenes.slice(0, -1)) {
    const componentName = routeImports.get(scene);
    if (
      !componentName ||
      !new RegExp(
        `if\\s*\\(route\\s*===\\s*['"]${scene}['"]\\)\\s*return\\s*<${componentName}\\s*\\/>`,
        'u'
      ).test(routerSource)
    ) {
      failVerification(
        'ROUTE_REGISTRY',
        `Router 未把 ${scene} 指向真实 scene component`
      );
    }
    routeEntries.push(scene);
  }
  const businessComponent = routeImports.get('business');
  if (
    !businessComponent ||
    !new RegExp(`return\\s*<${businessComponent}\\s*\\/>;`, 'u').test(
      routerSource
    )
  ) {
    failVerification(
      'ROUTE_REGISTRY',
      'Router business fallback 未指向真实 scene component'
    );
  }
  routeEntries.push('business');
  assertExactSet('route registry', routeEntries, expectedScenes, {
    duplicateCode: 'ROUTE_REGISTRY',
    mismatchCode: 'ROUTE_REGISTRY',
  });
  if (/\bPendingScene\b/u.test(routerSource)) {
    failVerification('ROUTE_REGISTRY', 'Router 仍包含 PendingScene');
  }

  for (const scene of expectedScenes) {
    const componentName = routeImports.get(scene);
    const sceneFiles = listSourceFiles(
      path.join(root, `example/src/showcases/${scene}`)
    );
    const routeTargetFile = componentName
      ? sceneFiles.find((filePath) =>
          new RegExp(`export\\s+function\\s+${componentName}\\b`, 'u').test(
            readFileSync(filePath, 'utf8')
          )
        )
      : undefined;
    if (!routeTargetFile) {
      failVerification(
        'ROUTE_REGISTRY',
        `${scene} route target 不是实际导出的 scene`
      );
    }
    const scaffolds = findJsxElements(
      parseSource(routeTargetFile),
      'ShowcaseScaffold'
    );
    if (scaffolds.length !== 1) {
      failVerification(
        'SCENE_TITLE_CONTRACT',
        `${scene} 必须恰有一个 ShowcaseScaffold`
      );
    }
    const scaffoldScene = jsxAttributeLiteral(
      scaffolds[0],
      'scene',
      'SCENE_TITLE_CONTRACT'
    );
    const scaffoldTitle = jsxAttributeLiteral(
      scaffolds[0],
      'title',
      'SCENE_TITLE_CONTRACT'
    );
    if (
      scaffoldScene !== scene ||
      scaffoldTitle !== expectedSceneTitles[scene]
    ) {
      failVerification(
        'SCENE_TITLE_CONTRACT',
        `${scene} ShowcaseScaffold 应为 scene=${scene} title=${expectedSceneTitles[scene]}，实际为 scene=${scaffoldScene} title=${scaffoldTitle}`
      );
    }

    const bindings = collectRuntimeImportBindings(
      sceneFiles,
      '@unif/react-native-design'
    );
    const requiredComponents = entries
      .filter(
        (entry) =>
          entry.scene === scene &&
          entry.id !== 'ConfirmHost' &&
          entry.id !== 'ToastHost'
      )
      .map((entry) => entry.id);
    const missingComponents = requiredComponents.filter(
      (name) => (bindings.get(name)?.jsxUses ?? 0) === 0
    );
    if (missingComponents.length) {
      failVerification(
        'SCENE_COMPONENT_CONSUMPTION',
        `${scene} 未从 public root 真实消费主归属组件: ${missingComponents.join(', ')}`
      );
    }

    const requiredByScene =
      scene === 'foundation'
        ? expectedRuntimeApis.filter(
            (name) =>
              name !== 'ThemeProvider' &&
              name !== 'confirm' &&
              name !== 'toast' &&
              name !== 'usePulse' &&
              name !== 'useSvgId'
          )
        : scene === 'feedback'
          ? ['confirm', 'toast', 'usePulse']
          : scene === 'business'
            ? ['useSvgId']
            : [];
    const missingApis = requiredByScene.filter((name) =>
      requiredCallableApis.has(name)
        ? (bindings.get(name)?.callUses ?? 0) === 0
        : (bindings.get(name)?.uses ?? 0) === 0
    );
    if (missingApis.length) {
      failVerification(
        'SCENE_RUNTIME_API_CONSUMPTION',
        `${scene} 未真实消费 required runtime API: ${missingApis.join(', ')}`
      );
    }
    if (scene === 'business' && (bindings.get('useSvgId')?.callUses ?? 0) < 2) {
      failVerification(
        'SCENE_RUNTIME_API_CONSUMPTION',
        'Business 必须至少两次调用 useSvgId 证明同屏唯一性'
      );
    }
  }

  const homePath = path.join(root, 'example/src/screens/HomeScreen.tsx');
  const homeAst = parseSource(homePath);
  const homeEntries = readStaticObjectArray(homeAst, 'homeScenes', [
    'id',
    'title',
  ]);
  assertExactSet(
    'Home scene ids',
    homeEntries.map((entry) => entry.id),
    expectedScenes,
    {
      duplicateCode: 'HOME_SCENE_SET',
      mismatchCode: 'HOME_SCENE_SET',
    }
  );
  for (const entry of homeEntries) {
    if (entry.title !== expectedSceneTitles[entry.id]) {
      failVerification(
        'HOME_SCENE_TITLE',
        `Home ${entry.id} 标题应为 ${expectedSceneTitles[entry.id]}，实际为 ${entry.title}`
      );
    }
  }

  for (const statement of homeAst.statements) {
    const moduleName = importModuleName(statement);
    if (moduleName?.includes('/showcases/')) {
      failVerification(
        'HOME_HEAVY_IMPORT',
        `Home 禁止 eager import scene: ${moduleName}`
      );
    }
    if (moduleName === '@unif/react-native-design') {
      const namedBindings = statement.importClause?.namedBindings;
      if (namedBindings && ts.isNamedImports(namedBindings)) {
        const importedHeavy = namedBindings.elements
          .map(
            (specifier) => specifier.propertyName?.text ?? specifier.name.text
          )
          .filter((name) =>
            ['Carousel', 'BlurLayer', 'ICONS', 'ICON_NAMES'].includes(name)
          );
        if (importedHeavy.length) {
          failVerification(
            'HOME_HEAVY_IMPORT',
            `Home 禁止 eager import heavy runtime: ${importedHeavy.join(', ')}`
          );
        }
      }
    }
  }
  const heavyNames = new Set([
    'Carousel',
    'BlurLayer',
    'ICONS',
    'ICON_NAMES',
    'IconCatalog',
    ...[...routeImports.values()],
  ]);
  const homeImports = collectRuntimeImportBindings(
    [homePath],
    '@unif/react-native-design'
  );
  const eagerHeavy = [...heavyNames].filter(
    (name) => (homeImports.get(name)?.uses ?? 0) > 0
  );
  if (eagerHeavy.length) {
    failVerification(
      'HOME_HEAVY_IMPORT',
      `Home 禁止 eager import/render heavy runtime: ${eagerHeavy.join(', ')}`
    );
  }
}

function verifyRootRuntime(root) {
  const runtimeFiles = listSourceFiles(path.join(root, 'example/src'));
  const counts = Object.fromEntries(
    ['GestureHandlerRootView', 'ThemeProvider', 'ConfirmHost', 'ToastHost'].map(
      (name) => [
        name,
        runtimeFiles.reduce(
          (count, filePath) =>
            count + findJsxElements(parseSource(filePath), name).length,
          0
        ),
      ]
    )
  );
  const invalid = Object.entries(counts).filter(([, count]) => count !== 1);
  if (invalid.length) {
    failVerification(
      'ROOT_RUNTIME_UNIQUENESS',
      `根 runtime 必须各恰好一份: ${invalid
        .map(([name, count]) => `${name}=${count}`)
        .join(', ')}`
    );
  }

  const providersPath = path.join(root, 'example/src/app/AppProviders.tsx');
  const providersAst = parseSource(providersPath);
  const gesture = findJsxElements(providersAst, 'GestureHandlerRootView')[0];
  const safeArea = gesture
    ? assertDirectChild(gesture, 'SafeAreaProvider', 'ROOT_PROVIDER_HIERARCHY')
    : undefined;
  const showcase = safeArea
    ? assertDirectChild(safeArea, 'ShowcaseProvider', 'ROOT_PROVIDER_HIERARCHY')
    : undefined;
  if (showcase) {
    assertDirectChild(showcase, 'DesignRuntime', 'ROOT_PROVIDER_HIERARCHY');
  }
  const theme = findJsxElements(providersAst, 'ThemeProvider')[0];
  if (!theme) {
    failVerification('ROOT_PROVIDER_HIERARCHY', '缺少 ThemeProvider');
  }
  assertDirectChild(theme, 'ConfirmHost', 'ROOT_PROVIDER_HIERARCHY');
  assertDirectChild(theme, 'ToastHost', 'ROOT_PROVIDER_HIERARCHY');

  const bindings = collectRuntimeImportBindings(
    [providersPath],
    '@unif/react-native-design'
  );
  if ((bindings.get('ThemeProvider')?.jsxUses ?? 0) === 0) {
    failVerification(
      'SCENE_RUNTIME_API_CONSUMPTION',
      '根装配未从 public root 真实消费 ThemeProvider'
    );
  }
}

function documentSection(source, heading, code) {
  const start = source.indexOf(heading);
  if (start < 0) {
    failVerification(code, `文档缺少 section: ${heading}`);
  }
  const next = source.indexOf('\n## ', start + heading.length);
  return source.slice(start, next < 0 ? source.length : next);
}

function readDocumentSceneEntries(source, heading) {
  const section = documentSection(source, heading, 'README_SCENE_SET');
  return [
    ...section.matchAll(
      /^\|[ \t]*`([^`]+)`[ \t]*\|[ \t]*([^|\n]+?)[ \t]*\|/gmu
    ),
  ].map((match) => ({ id: match[1], title: match[2].trim() }));
}

function verifyDocumentSceneTable(label, source, heading) {
  const entries = readDocumentSceneEntries(source, heading);
  assertExactSet(
    `${label} scene`,
    entries.map((entry) => entry.id),
    expectedScenes,
    {
      duplicateCode: 'README_SCENE_SET',
      mismatchCode: 'README_SCENE_SET',
    }
  );
  for (const entry of entries) {
    if (entry.title !== expectedSceneTitles[entry.id]) {
      failVerification(
        'README_SCENE_TITLE',
        `${label} ${entry.id} 标题应为 ${expectedSceneTitles[entry.id]}，实际为 ${entry.title}`
      );
    }
  }
}

function assertDocumentContainsAll(source, values, code, label) {
  const missing = values.filter((value) => !source.includes(value));
  if (missing.length) {
    failVerification(code, `${label} 缺少: ${missing.join(', ')}`);
  }
}

function verifyDocumentation(root) {
  const rootReadme = readText(root, 'README.md');
  const exampleReadme = readText(root, 'example/README.md');
  const agents = readText(root, 'AGENTS.md');
  const contributing = readText(root, 'CONTRIBUTING.md');

  verifyDocumentSceneTable('root README', rootReadme, '## RN 0.86.2 组件展厅');
  verifyDocumentSceneTable('example README', exampleReadme, '## 5. 八个场景');

  assertDocumentContainsAll(
    rootReadme,
    [
      'yarn install --immutable',
      'yarn example start',
      'yarn example android',
      'yarn example ios',
      'yarn verify:example-showcase',
      'yarn example typecheck',
      'yarn example lint',
      'yarn example test --maxWorkers=2',
    ],
    'README_COMMANDS',
    'root README commands'
  );
  assertDocumentContainsAll(
    exampleReadme,
    [
      'yarn install --immutable',
      'cd example && bundle install',
      'cd example && bundle exec pod install --project-directory=ios',
      'yarn example start',
      'yarn example android',
      'yarn example ios',
      'yarn example build:android',
      'yarn example build:ios',
      'yarn check:config',
      'yarn check:runtime-peers',
      'yarn check:icons',
      'yarn verify:example-showcase',
      'yarn example typecheck',
      'yarn example lint',
      'yarn example test --maxWorkers=2',
      'yarn typecheck',
      'yarn lint',
      'yarn test --maxWorkers=2',
      'yarn prepare',
    ],
    'README_COMMANDS',
    'example README commands'
  );

  const orderedHeadings = [
    '## 1. 安装',
    '## 2. 安装 iOS Pods',
    '## 3. 启动 Metro',
    '## 4. Simulator 与真机',
    '## 5. 八个场景',
    '## 6. 主题、字号与减少动态效果',
    '## 7. 自动化',
    '## 8. 人工验收矩阵',
    '## 9. 复制边界',
  ];
  let previousHeading = -1;
  for (const heading of orderedHeadings) {
    const current = exampleReadme.indexOf(heading);
    if (current <= previousHeading) {
      failVerification(
        'README_ORDER',
        `example README section 顺序错误: ${heading}`
      );
    }
    previousHeading = current;
  }

  assertDocumentContainsAll(
    exampleReadme,
    [
      '`system`、`light`、`dark`',
      '1 / 1.25 / 1.5 / 2',
      'reduced motion',
      'Android emulator',
      'Android 真机',
      'iOS Simulator',
      'iOS 真机',
      'VoiceOver',
      'TalkBack',
      'portrait',
      'landscape',
      'remote image success/failure',
      'Toast/Confirm',
      'Carousel action/autoplay',
      'Android hardware back',
      'Blur soft/strong/fallback',
      '@unif/react-native-design',
      'package root',
    ],
    'README_MANUAL_MATRIX',
    'example README manual/public boundary'
  );
  if (/^\|[^\n]*\|\s*PASS\s*\|/gmu.test(exampleReadme)) {
    failVerification(
      'README_MANUAL_MATRIX',
      '未执行的真机/a11y矩阵不得预填 PASS'
    );
  }
  const pendingRows = [
    ...exampleReadme.matchAll(
      /^\|[^\n]+\|\s*(?:待人工执行|BLOCKED[^|]*)\s*\|$/gmu
    ),
  ];
  if (pendingRows.length < 12) {
    failVerification(
      'README_MANUAL_MATRIX',
      '人工矩阵必须逐项标为待人工执行或 BLOCKED'
    );
  }
  if (/RN `?0\.85\.3|旧 0\.85|不能作为 RN `?0\.86/u.test(rootReadme)) {
    failVerification(
      'DOCUMENTATION_FACTS',
      'root README 仍保留旧 RN shell 事实'
    );
  }

  for (const [label, source] of [
    ['AGENTS', agents],
    ['CONTRIBUTING', contributing],
  ]) {
    assertDocumentContainsAll(
      source,
      [
        '@unif/react-native-design-example',
        'ReactNativeDesignExample',
        '0.86.2',
        'yarn install --immutable',
        'yarn verify:example-showcase',
      ],
      'DOCUMENTATION_FACTS',
      label
    );
    if (
      /react-native-designdd-example|DesignddExample|RN `?0\.85\.3/u.test(
        source
      )
    ) {
      failVerification(
        'DOCUMENTATION_FACTS',
        `${label} 仍包含失效 workspace/runtime 事实`
      );
    }
  }
}

function verifyWorkflowContract(root) {
  const sharedCi = readText(root, '.github/workflows/ci.yml');
  const digest = createHash('sha256').update(sharedCi).digest('hex');
  if (
    digest !==
    'd2ac60869b254ee49490126e5a31a803a31be5e52f9c4de4343ef9de1b99552b'
  ) {
    failVerification(
      'SHARED_CI_DIGEST',
      `共享 ci.yml 必须保持组织模板 digest，实际为 ${digest}`
    );
  }

  const workflow = readText(root, '.github/workflows/example-showcase.yml');
  if (
    !/^on:\n  push:\n    branches:\n      - main\n  pull_request:\n    branches:\n      - main\n  merge_group:/mu.test(
      workflow
    ) ||
    /^\s+paths(?:-ignore)?:/mu.test(workflow)
  ) {
    failVerification(
      'WORKFLOW_TRIGGER',
      'example workflow 必须触发 main push/PR + merge_group 且无 paths filter'
    );
  }
  if (
    !/^permissions:\n  contents: read$/mu.test(workflow) ||
    !/cancel-in-progress: true/u.test(workflow) ||
    !/actions\/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd/u.test(
      workflow
    ) ||
    !/uses: \.\/\.github\/actions\/setup/u.test(workflow)
  ) {
    failVerification(
      'WORKFLOW_SAFETY',
      'example workflow 权限、concurrency、checkout 或 setup contract 漂移'
    );
  }
  const requiredCommands = [
    'yarn install --immutable',
    'yarn check:config',
    'yarn check:runtime-peers',
    'yarn check:icons',
    'yarn verify:example-showcase',
    'yarn example typecheck',
    'yarn example lint',
    'yarn example test --maxWorkers=2',
    'yarn lint',
    'yarn typecheck',
    'yarn test --maxWorkers=2',
    'yarn prepare',
  ];
  const missingCommands = requiredCommands.filter(
    (command) => !workflow.includes(`run: ${command}`)
  );
  if (missingCommands.length) {
    failVerification(
      'WORKFLOW_GATES',
      `example workflow 缺少 gates: ${missingCommands.join(', ')}`
    );
  }
  if (
    /yarn example (?:build:android|build:ios|android|ios)|pod install/u.test(
      workflow
    )
  ) {
    failVerification('WORKFLOW_GATES', 'example workflow 不得运行 native gate');
  }
}

function verifyTurboContract(root) {
  const turbo = readJson(root, 'turbo.json');
  const expectedTasks = [
    '@unif/react-native-design-example#build:android',
    '@unif/react-native-design-example#build:ios',
    '@unif/react-native-design-example#test',
  ];
  assertExactSet('Turbo tasks', Object.keys(turbo.tasks ?? {}), expectedTasks, {
    duplicateCode: 'TURBO_TASKS',
    mismatchCode: 'TURBO_TASKS',
  });

  const commonInputs = [
    '$TURBO_ROOT$/package.json',
    '$TURBO_ROOT$/yarn.lock',
    '$TURBO_ROOT$/.yarnrc.yml',
    '$TURBO_ROOT$/.nvmrc',
    '$TURBO_ROOT$/src/**',
    '$TURBO_ROOT$/example/package.json',
    '$TURBO_ROOT$/example/app.json',
    '$TURBO_ROOT$/example/index.js',
    '$TURBO_ROOT$/example/babel.config.js',
    '$TURBO_ROOT$/example/metro.config.js',
    '$TURBO_ROOT$/example/tsconfig.json',
    '$TURBO_ROOT$/example/src/**',
  ];
  for (const [taskName, task] of Object.entries(turbo.tasks)) {
    const inputs = task.inputs;
    if (
      !Array.isArray(inputs) ||
      inputs.some(
        (input) =>
          typeof input !== 'string' ||
          (!input.startsWith('$TURBO_ROOT$/') &&
            !input.startsWith('!$TURBO_ROOT$/'))
      ) ||
      commonInputs.some((input) => !inputs.includes(input))
    ) {
      failVerification(
        'TURBO_INPUTS',
        `${taskName} 必须使用 $TURBO_ROOT$ 并覆盖 root/example 深层 source`
      );
    }
  }

  const testInputs =
    turbo.tasks['@unif/react-native-design-example#test'].inputs;
  const androidInputs =
    turbo.tasks['@unif/react-native-design-example#build:android'].inputs;
  const iosInputs =
    turbo.tasks['@unif/react-native-design-example#build:ios'].inputs;
  const androidValid =
    androidInputs.includes('$TURBO_ROOT$/example/android/**') &&
    androidInputs.includes('!$TURBO_ROOT$/example/android/.gradle/**') &&
    androidInputs.includes('!$TURBO_ROOT$/example/android/**/.cxx/**') &&
    androidInputs.includes('!$TURBO_ROOT$/example/android/**/build/**') &&
    androidInputs.includes('!$TURBO_ROOT$/example/android/local.properties') &&
    !androidInputs.some((input) => input.includes('/example/ios'));
  const iosValid =
    iosInputs.includes('$TURBO_ROOT$/example/Gemfile') &&
    iosInputs.includes('$TURBO_ROOT$/example/Gemfile.lock') &&
    iosInputs.includes('$TURBO_ROOT$/example/ios/**') &&
    iosInputs.includes('!$TURBO_ROOT$/example/ios/Pods/**') &&
    iosInputs.includes('!$TURBO_ROOT$/example/ios/**/build/**') &&
    iosInputs.includes('!$TURBO_ROOT$/example/ios/**/DerivedData/**') &&
    iosInputs.includes('!$TURBO_ROOT$/example/ios/.xcode.env.local') &&
    !iosInputs.some((input) => input.includes('/example/android'));
  const testValid = !testInputs.some(
    (input) =>
      input.includes('/example/android') || input.includes('/example/ios')
  );
  if (!androidValid || !iosValid || !testValid) {
    failVerification(
      'TURBO_PLATFORM_ISOLATION',
      'Turbo Android/iOS/test inputs 未保持目标平台隔离或 generated/local 排除'
    );
  }
}

export function verifyExampleShowcase(root) {
  verifyForbiddenSource(root);
  verifyRuntimeAndNativeContract(root);

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
  assertExactSet('component catalog', catalogIds, expectedComponents, {
    duplicateCode: 'CATALOG_COMPONENT_DUPLICATE',
    mismatchCode: 'CATALOG_COMPONENT_SET',
  });

  const invalidScenes = entries
    .map((entry) => entry.scene)
    .filter((scene) => !expectedScenes.includes(scene));
  if (invalidScenes.length) {
    failVerification(
      'CATALOG_SCENE_INVALID',
      `component catalog scene 非法: ${invalidScenes.join(', ')}`
    );
  }
  const emptyScenes = expectedScenes.filter(
    (scene) => !entries.some((entry) => entry.scene === scene)
  );
  if (emptyScenes.length) {
    failVerification(
      'CATALOG_SCENE_MAPPING',
      `component catalog scene 无主归属: ${emptyScenes.join(', ')}`
    );
  }
  for (const scene of expectedScenes) {
    assertExactSet(
      `component catalog scene ${scene}`,
      entries.filter((entry) => entry.scene === scene).map((entry) => entry.id),
      expectedComponentsByScene[scene],
      {
        duplicateCode: 'CATALOG_SCENE_MAPPING',
        mismatchCode: 'CATALOG_SCENE_MAPPING',
      }
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
  assertExactSet('UI component runtime', uiRuntime, expectedUiComponents, {
    duplicateCode: 'UI_RUNTIME_DUPLICATE',
    mismatchCode: 'UI_RUNTIME_SET',
  });
  assertExactSet(
    'business component runtime',
    businessRuntime,
    expectedBusinessComponents,
    {
      duplicateCode: 'BUSINESS_RUNTIME_DUPLICATE',
      mismatchCode: 'BUSINESS_RUNTIME_SET',
    }
  );
  assertExactSet(
    'component catalog/public runtime',
    catalogIds,
    [...uiRuntime, ...businessRuntime],
    {
      duplicateCode: 'CATALOG_PUBLIC_RUNTIME_DUPLICATE',
      mismatchCode: 'CATALOG_PUBLIC_RUNTIME_SET',
    }
  );

  const runtimeApis = readStaticStrings(catalogSource, 'requiredRuntimeApis');
  assertExactSet('required runtime API', runtimeApis, expectedRuntimeApis, {
    duplicateCode: 'REQUIRED_RUNTIME_API_DUPLICATE',
    mismatchCode: 'REQUIRED_RUNTIME_API_SET',
  });
  const rootRuntime = collectRuntimeExports(path.join(root, 'src/index.tsx'));
  const unavailable = runtimeApis.filter((name) => !rootRuntime.has(name));
  if (unavailable.length) {
    failVerification(
      'REQUIRED_RUNTIME_API_UNAVAILABLE',
      `required runtime API 未从 public barrel 导出: ${unavailable.join(', ')}`
    );
  }

  verifySceneContract(root, entries);
  verifyRootRuntime(root);
  verifyDocumentation(root);
  verifyWorkflowContract(root);
  verifyTurboContract(root);
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
