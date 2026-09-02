#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptsDir, '..');
const require = createRequire(import.meta.url);

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

const expectedMediaDeployment = Object.freeze({
  origin: 'https://unif-design.github.io',
  baseUrl: '/react-native-design/',
  successUri: 'https://unif-design.github.io/react-native-design/img/logo.png',
  successSha256:
    '20bcaa5e8e5c090d84467f01fe1d3be90115cab90eba099a5674d054738c5a88',
  failureUri:
    'https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png',
  failureMarker: 'UNIF_MEDIA_DECODE_FAILURE_FIXTURE_V1\n',
});

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
  'CircularProgress',
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
  'Ribbon',
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
    'CircularProgress',
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
  collections: [
    'Card',
    'Ribbon',
    'Cell',
    'List',
    'Grid',
    'EntryCard',
    'Carousel',
  ],
  media: ['Avatar', 'Thumbnail', 'Logo'],
  business: expectedBusinessComponents,
};

const expectedSceneTestFiles = {
  foundation: 'FoundationScene.test.tsx',
  actions: 'ActionsScene.test.tsx',
  feedback: 'FeedbackScene.test.tsx',
  forms: 'FormsScene.test.tsx',
  navigation: 'NavigationScene.test.tsx',
  collections: 'CollectionsScene.test.tsx',
  media: 'MediaScene.test.tsx',
  business: 'BusinessScene.test.tsx',
};

const expectedStateIdsByComponent = {
  Icon: [
    'icon.all-icons',
    'icon.name-search',
    'icon.sizes',
    'icon.color',
    'icon.a11y-hidden',
  ],
  Button: [
    'button.variants',
    'button.sizes',
    'button.block',
    'button.leading-trailing-icons',
    'button.disabled',
    'button.loading',
  ],
  IconButton: [
    'icon-button.variants',
    'icon-button.sizes',
    'icon-button.a11y-name',
    'icon-button.disabled',
    'icon-button.loading',
  ],
  Chip: [
    'chip.static',
    'chip.clickable',
    'chip.unselected',
    'chip.selected',
    'chip.icon-slots',
    'chip.disabled',
    'chip.busy',
  ],
  Tag: ['tag.variants', 'tag.sizes'],
  StatusDot: [
    'status-dot.statuses',
    'status-dot.tones',
    'status-dot.sizes',
    'status-dot.a11y-name',
  ],
  Empty: [
    'empty.title',
    'empty.description',
    'empty.custom-icon',
    'empty.data-boundary',
  ],
  Skeleton: ['skeleton.line', 'skeleton.rect', 'skeleton.circle'],
  CircularProgress: [
    'circular-progress.determinate',
    'circular-progress.label',
    'circular-progress.a11y-value',
  ],
  Spinner: ['spinner.sizes', 'spinner.color', 'spinner.stroke-width'],
  Pulse: [
    'pulse.default',
    'pulse.opacity-range',
    'pulse.duration',
    'pulse.delay',
    'pulse.reduced-motion',
  ],
  PulseDot: [
    'pulse-dot.default',
    'pulse-dot.sizes',
    'pulse-dot.color',
    'pulse-dot.custom-timing',
    'pulse-dot.reduced-motion',
  ],
  Reveal: [
    'reveal.enter',
    'reveal.duration',
    'reveal.container-style',
    'reveal.reduced-motion',
  ],
  BlurLayer: [
    'blur-layer.soft',
    'blur-layer.strong',
    'blur-layer.custom-tint',
    'blur-layer.theme',
  ],
  ConfirmHost: [
    'confirm-host.confirm',
    'confirm-host.cancel',
    'confirm-host.destructive',
    'confirm-host.reentrant',
  ],
  ToastHost: [
    'toast-host.kinds',
    'toast-host.positions',
    'toast-host.duration',
    'toast-host.latest-wins',
  ],
  Input: [
    'input.controlled',
    'input.uncontrolled',
    'input.idle',
    'input.focus',
    'input.filled',
    'input.error',
    'input.disabled',
    'input.editable',
    'input.read-only',
    'input.display-slots',
    'input.action-slot',
  ],
  PasswordInput: [
    'password-input.controlled',
    'password-input.hidden',
    'password-input.visible',
    'password-input.error',
    'password-input.disabled',
    'password-input.safe-result',
  ],
  Textarea: [
    'textarea.controlled',
    'textarea.uncontrolled',
    'textarea.error',
    'textarea.disabled',
    'textarea.max-length',
  ],
  Search: [
    'search.controlled',
    'search.uncontrolled',
    'search.clear',
    'search.disabled',
    'search.submit',
  ],
  Checkbox: [
    'checkbox.unchecked',
    'checkbox.checked',
    'checkbox.disabled',
    'checkbox.a11y-state',
  ],
  Radio: ['radio.unchecked', 'radio.checked', 'radio.group', 'radio.disabled'],
  Switch: ['switch.off', 'switch.on', 'switch.disabled'],
  Stepper: [
    'stepper.min',
    'stepper.mid',
    'stepper.max',
    'stepper.step',
    'stepper.zero-range',
    'stepper.disabled',
    'stepper.sizes',
    'stepper.format-value',
  ],
  Form: ['form.single-group', 'form.multi-group'],
  FormGroup: ['form-group.labelled', 'form-group.unlabelled'],
  FormRow: [
    'form-row.default',
    'form-row.required',
    'form-row.error',
    'form-row.a11y-control',
  ],
  NavBar: [
    'nav-bar.title',
    'nav-bar.back',
    'nav-bar.actions',
    'nav-bar.safe-area',
    'nav-bar.default',
    'nav-bar.brand',
    'nav-bar.transparent',
  ],
  DrawerHeader: [
    'drawer-header.name',
    'drawer-header.subtitle',
    'drawer-header.avatar-source',
    'drawer-header.initial-fallback',
  ],
  Tabs: [
    'tabs.selected',
    'tabs.change',
    'tabs.item-disabled',
    'tabs.all-disabled',
  ],
  Segmented: ['segmented.selected', 'segmented.sizes', 'segmented.disabled'],
  TabBar: [
    'tab-bar.selected',
    'tab-bar.numeric-badge',
    'tab-bar.overflow-badge',
    'tab-bar.a11y',
  ],
  Card: ['card.default', 'card.plain', 'card.bare', 'card.fill'],
  Ribbon: ['ribbon.brand', 'ribbon.danger', 'ribbon.top-right', 'ribbon.a11y'],
  Cell: [
    'cell.static',
    'cell.action',
    'cell.control',
    'cell.arrow',
    'cell.danger',
    'cell.disabled',
  ],
  List: [
    'list.grouped',
    'list.flush',
    'list.divider-full',
    'list.divider-none',
  ],
  Grid: [
    'grid.static',
    'grid.action',
    'grid.columns',
    'grid.card',
    'grid.badge',
  ],
  EntryCard: [
    'entry-card.static',
    'entry-card.action',
    'entry-card.with-subtitle',
    'entry-card.without-subtitle',
  ],
  Carousel: [
    'carousel.single',
    'carousel.multiple',
    'carousel.action',
    'carousel.indicator',
    'carousel.autoplay',
    'carousel.loop',
    'carousel.ref',
  ],
  Avatar: [
    'avatar.variants',
    'avatar.sizes',
    'avatar.image',
    'avatar.initial-fallback',
  ],
  Thumbnail: [
    'thumbnail.sizes',
    'thumbnail.sources',
    'thumbnail.selected',
    'thumbnail.a11y-name',
    'thumbnail.load-error',
  ],
  Logo: ['logo.source', 'logo.sizes', 'logo.border-radius', 'logo.a11y-mode'],
  GradientWash: [
    'gradient-wash.color-opacity',
    'gradient-wash.custom-stops',
    'gradient-wash.height',
    'gradient-wash.gradient-id',
  ],
  RadialHalo: [
    'radial-halo.circle',
    'radial-halo.ellipse',
    'radial-halo.max-opacity',
    'radial-halo.custom-stops',
    'radial-halo.gradient-id',
  ],
  ScreenBackdrop: [
    'screen-backdrop.preset',
    'screen-backdrop.custom-halo',
    'screen-backdrop.theme',
  ],
  GlassStats: [
    'glass-stats.columns-2',
    'glass-stats.columns-3',
    'glass-stats.columns-4',
    'glass-stats.formatted-value',
  ],
  AvatarWithRing: [
    'avatar-with-ring.characters',
    'avatar-with-ring.sizes',
    'avatar-with-ring.ring-color',
  ],
  VersionPill: ['version-pill.status', 'version-pill.version-text'],
};

const expectedWitnessTargetsByStateId = {
  'empty.data-boundary': 'Empty',
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

// Runtime proof 的 owner/ID 映射必须由 production verifier 独立锚定，不能从
// example catalog 或测试 helper 读取，否则两边同步删项时会一起假绿。
const expectedRuntimeProofIdsByOwner = {
  app: ['ThemeProvider', 'normalizeFontScale'],
  foundation: [
    'useTheme',
    'useColors',
    'useShadow',
    'useFontScale',
    'useThemedStyles',
    'usePrefersReducedMotion',
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
  ],
  feedback: ['confirm', 'toast', 'usePulse'],
  business: ['useSvgId'],
};

const expectedRuntimeProofTestFiles = {
  app: 'App.test.tsx',
  foundation: 'FoundationScene.test.tsx',
  feedback: 'FeedbackScene.test.tsx',
  business: 'BusinessScene.test.tsx',
};

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
  'react-native': '0.87.1',
  'react-native-gesture-handler': '3.1.0',
  'react-native-reanimated': '4.6.0',
  'react-native-reanimated-carousel': '5.0.0',
  'react-native-safe-area-context': '5.8.0',
  'react-native-svg': '15.15.5',
  'react-native-worklets': '0.12.1',
};

const expectedTemplateDevDependencies = {
  '@react-native-community/cli': '20.2.0',
  '@react-native-community/cli-platform-android': '20.2.0',
  '@react-native-community/cli-platform-ios': '20.2.0',
  '@react-native/babel-preset': '0.87.1',
  '@react-native/eslint-config': '0.87.1',
  '@react-native/jest-preset': '0.87.1',
  '@react-native/metro-config': '0.87.1',
  '@react-native/typescript-config': '0.87.1',
};

const expectedRootPeerDependencies = {
  '@sbaiahmed1/react-native-blur': '>=4',
  'react': '>=19.2.3 <20.0.0',
  'react-native': '>=0.86.0',
  'react-native-gesture-handler': '>=3.0.0 <4.0.0',
  'react-native-reanimated': '>=4.5.2 <4.7.0',
  'react-native-reanimated-carousel': '>=5.0.0 <6.0.0',
  'react-native-safe-area-context': '>=5',
  'react-native-svg': '>=15',
  'react-native-worklets': '>=0.11.0 <0.13.0',
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

function stateContractProperty(object, propertyName, label) {
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
    'COMPONENT_STATE_CONTRACT_SHAPE',
    `${label} 缺少 ${propertyName}`
  );
}

function stateContractString(object, propertyName, label) {
  const initializer = stateContractProperty(object, propertyName, label);
  if (!ts.isStringLiteral(initializer)) {
    failVerification(
      'COMPONENT_STATE_CONTRACT_SHAPE',
      `${label}.${propertyName} 必须是 string literal`
    );
  }
  return initializer.text;
}

function optionalStateContractString(object, propertyName, label) {
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      ((ts.isIdentifier(candidate.name) &&
        candidate.name.text === propertyName) ||
        (ts.isStringLiteral(candidate.name) &&
          candidate.name.text === propertyName))
  );
  if (!property || !ts.isPropertyAssignment(property)) return undefined;
  if (!ts.isStringLiteral(property.initializer)) {
    failVerification(
      'COMPONENT_STATE_CONTRACT_SHAPE',
      `${label}.${propertyName} 必须是 string literal`
    );
  }
  return property.initializer.text;
}

function stateContractStringArray(object, propertyName, label) {
  const initializer = unwrapExpression(
    stateContractProperty(object, propertyName, label)
  );
  if (!ts.isArrayLiteralExpression(initializer)) {
    failVerification(
      'COMPONENT_STATE_CONTRACT_SHAPE',
      `${label}.${propertyName} 必须是 static string array`
    );
  }
  return initializer.elements.map((element, index) => {
    if (!ts.isStringLiteral(element)) {
      failVerification(
        'COMPONENT_STATE_CONTRACT_SHAPE',
        `${label}.${propertyName}[${index}] 必须是 string literal`
      );
    }
    return element.text;
  });
}

function optionalStateContractStringArray(object, propertyName, label) {
  const property = object.properties.find(
    (candidate) =>
      ts.isPropertyAssignment(candidate) &&
      ((ts.isIdentifier(candidate.name) &&
        candidate.name.text === propertyName) ||
        (ts.isStringLiteral(candidate.name) &&
          candidate.name.text === propertyName))
  );
  if (!property || !ts.isPropertyAssignment(property)) return [];
  const initializer = unwrapExpression(property.initializer);
  if (!ts.isArrayLiteralExpression(initializer)) {
    failVerification(
      'COMPONENT_STATE_CONTRACT_SHAPE',
      `${label}.${propertyName} 必须是 static string array`
    );
  }
  return initializer.elements.map((element, index) => {
    if (!ts.isStringLiteral(element)) {
      failVerification(
        'COMPONENT_STATE_CONTRACT_SHAPE',
        `${label}.${propertyName}[${index}] 必须是 string literal`
      );
    }
    return element.text;
  });
}

function stateWitnessScalar(node, label) {
  const value = unwrapExpression(node);
  if (ts.isStringLiteral(value) || ts.isNumericLiteral(value)) {
    return ts.isNumericLiteral(value) ? Number(value.text) : value.text;
  }
  if (value.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (value.kind === ts.SyntaxKind.FalseKeyword) return false;
  failVerification(
    'COMPONENT_STATE_CONTRACT_SHAPE',
    `${label} 必须是 string/number/boolean literal`
  );
}

function readStateWitnessProps(node, label) {
  const object = unwrapExpression(node);
  if (!ts.isObjectLiteralExpression(object)) {
    failVerification(
      'COMPONENT_STATE_CONTRACT_SHAPE',
      `${label} 必须是 props object literal`
    );
  }
  const props = {};
  for (const property of object.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))
    ) {
      failVerification(
        'COMPONENT_STATE_CONTRACT_SHAPE',
        `${label} 只允许静态 props property`
      );
    }
    props[property.name.text] = stateWitnessScalar(
      property.initializer,
      `${label}.${property.name.text}`
    );
  }
  return props;
}

function readShowcaseStateContract(filePath) {
  const array = findStaticArray(parseSource(filePath), 'showcaseStateContract');
  return array.elements.map((element, index) => {
    if (!ts.isObjectLiteralExpression(element)) {
      failVerification(
        'COMPONENT_STATE_CONTRACT_SHAPE',
        `showcaseStateContract[${index}] 必须是 object literal`
      );
    }
    const label = `showcaseStateContract[${index}]`;
    const witnessNode = unwrapExpression(
      stateContractProperty(element, 'witness', label)
    );
    if (!ts.isObjectLiteralExpression(witnessNode)) {
      failVerification(
        'COMPONENT_STATE_CONTRACT_SHAPE',
        `${label}.witness 必须是 object literal`
      );
    }
    const kind = stateContractString(witnessNode, 'kind', `${label}.witness`);
    let witness;
    if (kind === 'jsx-props') {
      const specimensNode = unwrapExpression(
        stateContractProperty(witnessNode, 'specimens', `${label}.witness`)
      );
      if (
        !ts.isArrayLiteralExpression(specimensNode) ||
        specimensNode.elements.length === 0
      ) {
        failVerification(
          'COMPONENT_STATE_CONTRACT_SHAPE',
          `${label}.witness.specimens 必须是非空静态数组`
        );
      }
      const specimens = specimensNode.elements.map(
        (specimen, specimenIndex) => {
          if (!ts.isObjectLiteralExpression(specimen)) {
            failVerification(
              'COMPONENT_STATE_CONTRACT_SHAPE',
              `${label}.witness.specimens[${specimenIndex}] 必须是 object literal`
            );
          }
          const specimenLabel = `${label}.witness.specimens[${specimenIndex}]`;
          return {
            testID: optionalStateContractString(
              specimen,
              'testID',
              specimenLabel
            ),
            props: readStateWitnessProps(
              stateContractProperty(specimen, 'props', specimenLabel),
              `${specimenLabel}.props`
            ),
            presentProps: optionalStateContractStringArray(
              specimen,
              'presentProps',
              specimenLabel
            ),
          };
        }
      );
      witness = {
        kind,
        targetComponent: optionalStateContractString(
          witnessNode,
          'targetComponent',
          `${label}.witness`
        ),
        specimens,
      };
    } else if (kind === 'interaction') {
      witness = {
        kind,
        targetComponent: stateContractString(
          witnessNode,
          'targetComponent',
          `${label}.witness`
        ),
        testID: stateContractString(witnessNode, 'testID', `${label}.witness`),
        handler: stateContractString(
          witnessNode,
          'handler',
          `${label}.witness`
        ),
        calls: stateContractStringArray(
          witnessNode,
          'calls',
          `${label}.witness`
        ),
        rootHost: optionalStateContractString(
          witnessNode,
          'rootHost',
          `${label}.witness`
        ),
      };
    } else if (kind === 'runtime-api') {
      const calls = stateContractStringArray(
        witnessNode,
        'calls',
        `${label}.witness`
      );
      if (calls.length === 0) {
        failVerification(
          'COMPONENT_STATE_CONTRACT_SHAPE',
          `${label}.witness.calls 不得为空`
        );
      }
      witness = {
        kind,
        calls,
        rootHost: optionalStateContractString(
          witnessNode,
          'rootHost',
          `${label}.witness`
        ),
      };
    } else {
      failVerification(
        'COMPONENT_STATE_CONTRACT_SHAPE',
        `${label}.witness.kind 尚未支持: ${kind}`
      );
    }
    return {
      id: stateContractString(element, 'id', label),
      component: stateContractString(element, 'component', label),
      scene: stateContractString(element, 'scene', label),
      label: stateContractString(element, 'label', label),
      witness,
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

function createRuntimeBindingAnalysis(filePaths) {
  const absolutePaths = [
    ...new Set(filePaths.map((filePath) => path.resolve(filePath))),
  ];
  const program = ts.createProgram({
    rootNames: absolutePaths,
    options: {
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.ESNext,
      noEmit: true,
      noLib: true,
      noResolve: true,
      skipLibCheck: true,
      target: ts.ScriptTarget.Latest,
    },
  });
  const sourceFiles = new Map();
  for (const filePath of absolutePaths) {
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
      failVerification(
        'SOURCE_READ',
        `TypeScript binding analysis 无法读取 source: ${filePath}`
      );
    }
    sourceFiles.set(filePath, sourceFile);
  }
  return {
    checker: program.getTypeChecker(),
    sourceFiles,
  };
}

function isTypeOnlyIdentifierUse(node) {
  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isTypeNode(current)) return true;
    if (
      ts.isExpression(current) ||
      ts.isStatement(current) ||
      ts.isJsxAttribute(current)
    ) {
      return false;
    }
    current = current.parent;
  }
  return false;
}

function jsxUseNode(identifier) {
  if (
    ts.isJsxOpeningElement(identifier.parent) &&
    identifier.parent.tagName === identifier
  ) {
    return identifier.parent.parent;
  }
  if (
    ts.isJsxSelfClosingElement(identifier.parent) &&
    identifier.parent.tagName === identifier
  ) {
    return identifier.parent;
  }
  return undefined;
}

function collectRuntimeImportBindings(
  filePaths,
  moduleName,
  bindingAnalysis = createRuntimeBindingAnalysis(filePaths)
) {
  const bindings = new Map();
  const bindingsBySymbol = new Map();
  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath);
    const sourceFile = bindingAnalysis.sourceFiles.get(absolutePath);
    if (!sourceFile) {
      failVerification(
        'SOURCE_READ',
        `binding analysis 缺少 source: ${absolutePath}`
      );
    }
    for (const statement of sourceFile.statements) {
      if (importModuleName(statement) !== moduleName) continue;
      const clause = statement.importClause;
      if (!clause || clause.isTypeOnly || !clause.namedBindings) continue;
      if (!ts.isNamedImports(clause.namedBindings)) continue;
      for (const specifier of clause.namedBindings.elements) {
        if (specifier.isTypeOnly) continue;
        const imported = specifier.propertyName?.text ?? specifier.name.text;
        const binding = bindings.get(imported) ?? {
          imported,
          uses: 0,
          jsxUses: 0,
          callUses: 0,
          files: new Set(),
          jsxNodes: [],
        };
        const symbol = bindingAnalysis.checker.getSymbolAtLocation(
          specifier.name
        );
        if (!symbol) {
          failVerification(
            'SOURCE_BINDING',
            `无法解析 public-root import binding: ${specifier.name.text} in ${absolutePath}`
          );
        }
        binding.files.add(absolutePath);
        bindings.set(imported, binding);
        bindingsBySymbol.set(symbol, binding);
      }
    }

    const visit = (node) => {
      if (ts.isImportDeclaration(node)) return;
      if (ts.isIdentifier(node) && !isTypeOnlyIdentifierUse(node)) {
        const symbol = bindingAnalysis.checker.getSymbolAtLocation(node);
        const binding = symbol ? bindingsBySymbol.get(symbol) : undefined;
        if (binding) {
          binding.uses += 1;
          const jsxNode = jsxUseNode(node);
          if (jsxNode) {
            binding.jsxUses += 1;
            binding.jsxNodes.push(jsxNode);
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

function importDeclarationHasRuntimeValue(statement) {
  const clause = statement.importClause;
  if (!clause) return true;
  if (clause.isTypeOnly) return false;
  if (clause.name) return true;
  if (!clause.namedBindings) return false;
  if (ts.isNamespaceImport(clause.namedBindings)) return true;
  return clause.namedBindings.elements.some(
    (specifier) => !specifier.isTypeOnly
  );
}

function exportDeclarationHasRuntimeValue(statement) {
  if (statement.isTypeOnly) return false;
  if (!statement.exportClause) return true;
  if (!ts.isNamedExports(statement.exportClause)) return true;
  return statement.exportClause.elements.some(
    (specifier) => !specifier.isTypeOnly
  );
}

function relativeRuntimeModuleNames(sourceFile) {
  const moduleNames = new Set();
  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      importDeclarationHasRuntimeValue(statement)
    ) {
      const moduleName = importModuleName(statement);
      if (moduleName?.startsWith('.')) moduleNames.add(moduleName);
      continue;
    }
    if (
      ts.isExportDeclaration(statement) &&
      exportDeclarationHasRuntimeValue(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('.')
    ) {
      moduleNames.add(statement.moduleSpecifier.text);
    }
  }

  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0]) &&
      node.arguments[0].text.startsWith('.')
    ) {
      moduleNames.add(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return moduleNames;
}

function collectReachableRuntimeFiles(entryFile) {
  const reachable = new Set();
  const pending = [path.resolve(entryFile)];
  while (pending.length > 0) {
    const filePath = pending.pop();
    if (!filePath || reachable.has(filePath)) continue;
    reachable.add(filePath);
    const sourceFile = parseSource(filePath);
    for (const moduleName of relativeRuntimeModuleNames(sourceFile)) {
      const dependency = resolveModuleFile(filePath, moduleName);
      if (!reachable.has(dependency)) pending.push(dependency);
    }
  }
  return [...reachable];
}

function isWithinDirectory(filePath, directory) {
  const relativePath = path.relative(directory, filePath);
  return (
    relativePath === '' ||
    (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
  );
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

function directRuntimeJsxChildren(element) {
  if (!ts.isJsxElement(element)) return [];
  return element.children.flatMap((child) => {
    if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) {
      return [child];
    }
    if (!ts.isJsxExpression(child) || !child.expression) return [];
    const expression = unwrapExpression(child.expression);
    if (!ts.isConditionalExpression(expression)) return [];
    return [expression.whenTrue, expression.whenFalse]
      .map(unwrapExpression)
      .filter(
        (branch) =>
          ts.isJsxElement(branch) || ts.isJsxSelfClosingElement(branch)
      );
  });
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

function assertDirectRuntimeChild(parent, binding, expectedName) {
  const expectedNodes = new Set(binding?.jsxNodes ?? []);
  const matches = directRuntimeJsxChildren(parent).filter((child) =>
    expectedNodes.has(child)
  );
  if (matches.length !== 1) {
    failVerification(
      'ROOT_PROVIDER_HIERARCHY',
      `root runtime 必须恰有一个直接子节点 ${expectedName}`
    );
  }
  return matches[0];
}

function assertPersistentRuntimeChild(parent, binding, expectedName) {
  const expectedNodes = new Set(binding?.jsxNodes ?? []);
  const matches = parent.children.filter(
    (child) =>
      (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child)) &&
      expectedNodes.has(child)
  );
  if (matches.length !== 1) {
    failVerification(
      'ROOT_RUNTIME_PERSISTENCE',
      `root runtime ${expectedName} 必须作为 ThemeProvider 的无条件直接子节点常驻`
    );
  }
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
    examplePackage.scripts?.test !==
      'node ../scripts/run-example-jest.mjs --forbidOnly' ||
    examplePackage.scripts?.['test:focused'] !==
      'node ../scripts/run-example-jest-focused.mjs --forbidOnly --config jest.focused.config.js' ||
    examplePackage.scripts?.typecheck !== 'tsc --noEmit' ||
    examplePackage.scripts?.lint !== 'eslint .'
  ) {
    failVerification('WORKSPACE_SCRIPTS', 'root/example scripts contract 漂移');
  }
  const exampleJestConfig = readFileSync(
    path.join(root, 'example/jest.config.js'),
    'utf8'
  );
  if (
    !existsSync(path.join(root, 'scripts/run-example-jest.mjs')) ||
    !existsSync(path.join(root, 'scripts/run-example-jest-focused.mjs')) ||
    !existsSync(path.join(root, 'example/jest.focused.config.js')) ||
    !existsSync(path.join(root, 'example/jest.showcaseGate.js')) ||
    !existsSync(path.join(root, 'example/jest.forbidOnlyReporter.js')) ||
    !/reporters:\s*\[\s*'default',\s*'<rootDir>\/jest\.forbidOnlyReporter\.js'\s*\]/u.test(
      exampleJestConfig
    )
  ) {
    failVerification(
      'WORKSPACE_SCRIPTS',
      'example Jest 必须通过 --forbidOnly 入口与 reporter 拒绝 focused/skipped/todo tests'
    );
  }
  const governedOwnerTestFiles = require(
    path.join(root, 'example/jest.showcaseGate.js')
  ).governedOwnerTestFiles;
  assertExactSet(
    'production Jest governed owner suites',
    governedOwnerTestFiles,
    [
      'src/__tests__/App.test.tsx',
      ...Object.values(expectedSceneTestFiles).map(
        (testFile) => `src/__tests__/${testFile}`
      ),
    ],
    {
      duplicateCode: 'JEST_GOVERNED_SUITE_CONTRACT',
      mismatchCode: 'JEST_GOVERNED_SUITE_CONTRACT',
    }
  );
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
    // example 吃本包发布的 preset(狗粮):走与消费者相同的 exports 子路径解析,
    // 接线一改就被 example 的 15 个 suite 回归覆盖。
    !jest.includes("preset: '@unif/react-native-design/jest-preset'") ||
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
  const wrapper = readText(
    root,
    'example/android/gradle/wrapper/gradle-wrapper.properties'
  );
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
    /getDefaultProguardFile\("proguard-android-optimize\.txt"\)/u.test(
      appGradle
    ) &&
    /buildToolsVersion = "37\.0\.0"/u.test(rootGradle) &&
    /minSdkVersion = 24/u.test(rootGradle) &&
    /compileSdkVersion = 37/u.test(rootGradle) &&
    /targetSdkVersion = 36/u.test(rootGradle) &&
    /kotlinVersion = "2\.2\.0"/u.test(rootGradle) &&
    /gradle-9\.4\.1-bin\.zip/u.test(wrapper) &&
    /rootProject\.name = 'ReactNativeDesignExample'/u.test(settings) &&
    /autolinkLibrariesFromCommand\(\)/u.test(settings) &&
    /^newArchEnabled=true$/mu.test(properties) &&
    /^hermesEnabled=true$/mu.test(properties) &&
    /^edgeToEdgeEnabled=true$/mu.test(properties) &&
    /^android\.builtInKotlin=false$/mu.test(properties) &&
    /^android\.newDsl=false$/mu.test(properties) &&
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

function isFunctionLikeNode(node) {
  return (
    ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    ts.isFunctionDeclaration(node) ||
    ts.isMethodDeclaration(node)
  );
}

function nearestFunctionLike(node) {
  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (isFunctionLikeNode(current)) return current;
    current = current.parent;
  }
  return undefined;
}

function enclosingImportModuleName(node) {
  let current = node.parent;
  while (current && !ts.isSourceFile(current)) {
    if (ts.isImportDeclaration(current)) return importModuleName(current);
    current = current.parent;
  }
  return undefined;
}

function isUnshadowedJestIdentifier(identifier, names, checker) {
  if (!names.includes(identifier.text)) return false;
  const symbol = checker.getSymbolAtLocation(identifier);
  if (!symbol) return true;
  return (symbol.declarations ?? []).every(
    (declaration) =>
      declaration.getSourceFile() !== identifier.getSourceFile() ||
      enclosingImportModuleName(declaration) === '@jest/globals'
  );
}

function isJestTestRootExpression(expression, checker) {
  const value = unwrapExpression(expression);
  return (
    ts.isIdentifier(value) &&
    isUnshadowedJestIdentifier(value, ['test', 'it'], checker)
  );
}

function jestRegistrationRoot(expression, checker) {
  const value = unwrapExpression(expression);
  if (ts.isIdentifier(value)) {
    return isUnshadowedJestIdentifier(
      value,
      ['test', 'it', 'describe', 'fit', 'fdescribe', 'xit', 'xtest'],
      checker
    )
      ? value.text
      : undefined;
  }
  if (ts.isPropertyAccessExpression(value)) {
    return jestRegistrationRoot(value.expression, checker);
  }
  if (ts.isElementAccessExpression(value)) {
    return jestRegistrationRoot(value.expression, checker);
  }
  if (ts.isCallExpression(value)) {
    return jestRegistrationRoot(value.expression, checker);
  }
  return undefined;
}

function jestRegistrationModifier(node) {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (
    ts.isElementAccessExpression(node) &&
    node.argumentExpression &&
    ts.isStringLiteralLike(node.argumentExpression)
  ) {
    return node.argumentExpression.text;
  }
  return undefined;
}

function verifyGovernedJestRegistrations(root) {
  const testDirectory = path.join(root, 'example/src/__tests__');
  const testFiles = listSourceFiles(testDirectory, true);
  const analysis = createRuntimeBindingAnalysis(testFiles);
  for (const testFile of testFiles) {
    const sourceFile = analysis.sourceFiles.get(path.resolve(testFile));
    if (!sourceFile) continue;
    const checker = analysis.checker;
    const visit = (node) => {
      if (ts.isCallExpression(node)) {
        const registrationRoot = jestRegistrationRoot(node.expression, checker);
        if (
          registrationRoot &&
          ['fit', 'fdescribe', 'xit', 'xtest'].includes(registrationRoot)
        ) {
          failVerification(
            'RUNTIME_API_TEST_PROOF',
            `${path.relative(root, testFile)} 禁止 focused/skipped Jest registration: ${registrationRoot}`
          );
        }
      }
      if (
        (ts.isPropertyAccessExpression(node) ||
          ts.isElementAccessExpression(node)) &&
        jestRegistrationRoot(node, checker)
      ) {
        const modifier = jestRegistrationModifier(node);
        if (modifier === 'only' || modifier === 'skip' || modifier === 'todo') {
          failVerification(
            'RUNTIME_API_TEST_PROOF',
            `${path.relative(root, testFile)} 禁止 focused/skipped Jest registration modifier: ${modifier}`
          );
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
}

export function verifyExampleTestRegistrations(root) {
  const resolvedRoot = path.resolve(root);
  verifyGovernedJestRegistrations(resolvedRoot);
  verifySceneStateTestProofs(resolvedRoot);
  verifyRuntimeApiTestProofs(resolvedRoot);
}

function executableJestCallback(node, checker) {
  const callback = nearestFunctionLike(node);
  if (
    !callback ||
    !ts.isCallExpression(callback.parent) ||
    callback.parent.arguments[1] !== callback
  ) {
    return undefined;
  }
  const registration = callback.parent;
  const callee = unwrapExpression(registration.expression);
  if (!isJestTestRootExpression(callee, checker)) {
    return undefined;
  }
  if (
    !ts.isExpressionStatement(registration.parent) ||
    !ts.isSourceFile(registration.parent.parent)
  ) {
    return undefined;
  }
  return callback;
}

function callbackHasDirectExpectation(callback, checker) {
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (node !== callback && isFunctionLikeNode(node)) return;
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      isUnshadowedJestIdentifier(node.expression, ['expect'], checker)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(callback);
  return found;
}

function importedFactorySymbols(sourceFile, checker, moduleName, factoryName) {
  const symbols = new Set();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      importModuleName(statement) !== moduleName
    ) {
      continue;
    }
    const clause = statement.importClause;
    if (
      !clause ||
      clause.isTypeOnly ||
      !clause.namedBindings ||
      !ts.isNamedImports(clause.namedBindings)
    ) {
      continue;
    }
    for (const specifier of clause.namedBindings.elements) {
      if (
        specifier.isTypeOnly ||
        (specifier.propertyName?.text ?? specifier.name.text) !== factoryName
      ) {
        continue;
      }
      const symbol = checker.getSymbolAtLocation(specifier.name);
      if (symbol) symbols.add(symbol);
    }
  }
  return symbols;
}

function isConstVariableDeclaration(node) {
  return (
    ts.isVariableDeclaration(node) &&
    ts.isVariableDeclarationList(node.parent) &&
    (node.parent.flags & ts.NodeFlags.Const) !== 0
  );
}

function isAsyncFunctionLike(node) {
  return Boolean(
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword
    )
  );
}

function verifyTypedProofCoverage({
  root,
  relativeTestFile,
  moduleName,
  factoryName,
  expectedIdsByOwner,
  code,
  proofLabel,
}) {
  const testFile = path.join(root, 'example/src/__tests__', relativeTestFile);
  const bindingAnalysis = createRuntimeBindingAnalysis([testFile]);
  const sourceFile = bindingAnalysis.sourceFiles.get(path.resolve(testFile));
  if (!sourceFile) {
    failVerification(code, `${proofLabel} 缺少 Jest 文件 ${relativeTestFile}`);
  }
  const checker = bindingAnalysis.checker;
  const factorySymbols = importedFactorySymbols(
    sourceFile,
    checker,
    moduleName,
    factoryName
  );
  if (factorySymbols.size !== 1) {
    failVerification(
      code,
      `${relativeTestFile} 必须从 ${moduleName} 唯一导入真实 ${factoryName} symbol`
    );
  }

  const coverageRecords = [];
  const coverageBySymbol = new Map();
  const collectFactories = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      factorySymbols.has(checker.getSymbolAtLocation(node.expression))
    ) {
      const [ownerNode] = node.arguments;
      if (
        node.arguments.length !== 1 ||
        !ownerNode ||
        !ts.isStringLiteral(ownerNode) ||
        !isConstVariableDeclaration(node.parent) ||
        node.parent.initializer !== node ||
        !ts.isIdentifier(node.parent.name)
      ) {
        failVerification(
          code,
          `${relativeTestFile} 的 ${factoryName} 必须直接赋给局部 const，且 owner 使用 string literal`
        );
      }
      const coverageSymbol = checker.getSymbolAtLocation(node.parent.name);
      if (!coverageSymbol) {
        failVerification(
          code,
          `${relativeTestFile} 无法解析 ${ownerNode.text} proof coverage binding`
        );
      }
      const testCallback = executableJestCallback(node, checker);
      if (!testCallback) {
        failVerification(
          code,
          `${relativeTestFile}/${ownerNode.text} factory 必须位于顶层、未 skip 的 test/it callback`
        );
      }
      if (
        !ts.isBlock(testCallback.body) ||
        !ts.isVariableDeclarationList(node.parent.parent) ||
        !ts.isVariableStatement(node.parent.parent.parent) ||
        node.parent.parent.parent.parent !== testCallback.body
      ) {
        failVerification(
          code,
          `${relativeTestFile}/${ownerNode.text} factory declaration 必须是 owned test/it callback block 的直接 VariableStatement`
        );
      }
      const record = {
        callback: testCallback,
        owner: ownerNode.text,
        proved: [],
        proofPositions: [],
        expectCompletePositions: [],
      };
      coverageRecords.push(record);
      coverageBySymbol.set(coverageSymbol, record);
    }
    ts.forEachChild(node, collectFactories);
  };
  collectFactories(sourceFile);

  const collectProofCalls = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression)
    ) {
      const coverageSymbol = checker.getSymbolAtLocation(
        node.expression.expression
      );
      const record = coverageSymbol
        ? coverageBySymbol.get(coverageSymbol)
        : undefined;
      const method = node.expression.name.text;
      if (record && method === 'consume') {
        failVerification(
          code,
          `${relativeTestFile}/${record.owner} 禁止 legacy consume；必须使用带 inline assertion callback 的 prove`
        );
      }
      if (record && method === 'prove') {
        if (
          nearestFunctionLike(node) !== record.callback ||
          !ts.isBlock(record.callback.body) ||
          !ts.isExpressionStatement(node.parent) ||
          node.parent.parent !== record.callback.body
        ) {
          failVerification(
            code,
            `${relativeTestFile}/${record.owner} prove 必须是 factory 所在 test/it callback block 的直接 ExpressionStatement`
          );
        }
        if (node.arguments.length < 2) {
          failVerification(
            code,
            `${relativeTestFile}/${record.owner} prove 需要至少一个 literal ID 与 inline callback`
          );
        }
        const proofNode = unwrapExpression(node.arguments.at(-1));
        if (
          (!ts.isArrowFunction(proofNode) &&
            !ts.isFunctionExpression(proofNode)) ||
          isAsyncFunctionLike(proofNode)
        ) {
          failVerification(
            code,
            `${relativeTestFile}/${record.owner} prove 最后一个参数必须是同步 inline callback`
          );
        }
        if (!callbackHasDirectExpectation(proofNode, checker)) {
          failVerification(
            code,
            `${relativeTestFile}/${record.owner} prove callback 必须包含直接 Jest expect`
          );
        }
        for (const [index, argument] of node.arguments.slice(0, -1).entries()) {
          if (!ts.isStringLiteral(argument)) {
            failVerification(
              code,
              `${relativeTestFile}/${record.owner} prove[${index}] 必须是 string literal ID`
            );
          }
          record.proved.push(argument.text);
        }
        record.proofPositions.push(node.getStart(sourceFile));
      } else if (record && method === 'expectComplete') {
        if (
          nearestFunctionLike(node) !== record.callback ||
          !ts.isBlock(record.callback.body) ||
          !ts.isExpressionStatement(node.parent) ||
          node.parent.parent !== record.callback.body
        ) {
          failVerification(
            code,
            `${relativeTestFile}/${record.owner} expectComplete 必须是 factory 所在 test/it callback block 的直接 ExpressionStatement`
          );
        }
        if (node.arguments.length !== 0) {
          failVerification(
            code,
            `${relativeTestFile}/${record.owner} expectComplete 不接受参数`
          );
        }
        record.expectCompletePositions.push(node.getStart(sourceFile));
      }
    }
    ts.forEachChild(node, collectProofCalls);
  };
  collectProofCalls(sourceFile);

  assertExactSet(
    `${relativeTestFile} ${proofLabel} owners`,
    coverageRecords.map((record) => record.owner),
    Object.keys(expectedIdsByOwner),
    { duplicateCode: code, mismatchCode: code }
  );
  for (const record of coverageRecords) {
    const expectedIds = expectedIdsByOwner[record.owner];
    if (!expectedIds) {
      failVerification(
        code,
        `${relativeTestFile} 包含未独立锚定的 ${proofLabel} owner ${record.owner}`
      );
    }
    assertExactSet(
      `${relativeTestFile}/${record.owner} proved IDs`,
      record.proved,
      expectedIds,
      { duplicateCode: code, mismatchCode: code }
    );
    if (record.expectCompletePositions.length !== 1) {
      failVerification(
        code,
        `${relativeTestFile}/${record.owner} 必须恰好调用一次 expectComplete，实际=${record.expectCompletePositions.length}`
      );
    }
    const [completionPosition] = record.expectCompletePositions;
    if (
      completionPosition !== undefined &&
      record.proofPositions.some((position) => position > completionPosition)
    ) {
      failVerification(
        code,
        `${relativeTestFile}/${record.owner} expectComplete 必须位于全部 prove 之后`
      );
    }
    const inspectReturn = (node) => {
      if (
        ts.isReturnStatement(node) &&
        nearestFunctionLike(node) === record.callback
      ) {
        failVerification(
          code,
          `${relativeTestFile}/${record.owner} owned proof test callback 禁止 return，以免跳过 proof lifecycle`
        );
      }
      ts.forEachChild(node, inspectReturn);
    };
    inspectReturn(record.callback.body);
  }
}

function verifySceneStateTestProofs(root) {
  for (const scene of expectedScenes) {
    const expectedIdsByComponent = Object.fromEntries(
      expectedComponentsByScene[scene].map((component) => [
        component,
        expectedStateIdsByComponent[component],
      ])
    );
    verifyTypedProofCoverage({
      root,
      relativeTestFile: expectedSceneTestFiles[scene],
      moduleName: './helpers/showcaseStateCoverage',
      factoryName: 'createShowcaseStateCoverage',
      expectedIdsByOwner: expectedIdsByComponent,
      code: 'SCENE_STATE_TEST_CONSUMPTION',
      proofLabel: `${scene} state proof`,
    });
  }
}

function verifyRuntimeApiTestProofs(root) {
  assertExactSet(
    'independent runtime proof IDs',
    Object.values(expectedRuntimeProofIdsByOwner).flat(),
    expectedRuntimeApis,
    {
      duplicateCode: 'RUNTIME_API_TEST_PROOF',
      mismatchCode: 'RUNTIME_API_TEST_PROOF',
    }
  );
  for (const [owner, runtimeIds] of Object.entries(
    expectedRuntimeProofIdsByOwner
  )) {
    verifyTypedProofCoverage({
      root,
      relativeTestFile: expectedRuntimeProofTestFiles[owner],
      moduleName: './helpers/showcaseRuntimeCoverage',
      factoryName: 'createShowcaseRuntimeCoverage',
      expectedIdsByOwner: { [owner]: runtimeIds },
      code: 'RUNTIME_API_TEST_PROOF',
      proofLabel: 'runtime API proof',
    });
  }
}

function verifyShowcaseStateContract(root, catalogEntries) {
  const stateEntries = readShowcaseStateContract(
    path.join(root, 'example/src/catalog/showcaseStateContract.ts')
  );
  const anchoredComponents = Object.keys(expectedStateIdsByComponent);
  const expectedStateIds = Object.values(expectedStateIdsByComponent).flat();
  assertExactSet(
    'global required state ids',
    stateEntries.map((entry) => entry.id),
    expectedStateIds,
    {
      duplicateCode: 'COMPONENT_STATE_REQUIRED_SET',
      mismatchCode: 'COMPONENT_STATE_REQUIRED_SET',
    }
  );
  const unanchoredEntries = stateEntries.filter(
    (entry) => !anchoredComponents.includes(entry.component)
  );
  if (unanchoredEntries.length > 0) {
    failVerification(
      'COMPONENT_STATE_REQUIRED_SET',
      `state contract 包含未独立锚定的 component: ${unanchoredEntries
        .map((entry) => entry.component)
        .join(', ')}`
    );
  }

  for (const [component, requiredIds] of Object.entries(
    expectedStateIdsByComponent
  )) {
    const componentStates = stateEntries.filter(
      (entry) => entry.component === component
    );
    assertExactSet(
      `${component} required state ids`,
      componentStates.map((entry) => entry.id),
      requiredIds,
      {
        duplicateCode: 'COMPONENT_STATE_REQUIRED_SET',
        mismatchCode: 'COMPONENT_STATE_REQUIRED_SET',
      }
    );

    const catalogEntry = catalogEntries.find((entry) => entry.id === component);
    if (!catalogEntry) {
      failVerification(
        'COMPONENT_STATE_CATALOG_SET',
        `${component} 缺少 component catalog entry`
      );
    }
    assertExactSet(
      `${component} catalog state labels`,
      catalogEntry.states,
      componentStates.map((entry) => entry.label),
      {
        duplicateCode: 'COMPONENT_STATE_CATALOG_SET',
        mismatchCode: 'COMPONENT_STATE_CATALOG_SET',
      }
    );

    for (const state of componentStates) {
      if (!/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/u.test(state.id)) {
        failVerification(
          'COMPONENT_STATE_REQUIRED_SET',
          `${state.id} 不是稳定的 component-slug.state-slug ID`
        );
      }
      if (state.scene !== catalogEntry.scene) {
        failVerification(
          'COMPONENT_STATE_CATALOG_SET',
          `${state.id} scene=${state.scene} 与 catalog scene=${catalogEntry.scene} 不一致`
        );
      }
      if (state.witness.rootHost && state.witness.rootHost !== component) {
        failVerification(
          'COMPONENT_STATE_WITNESS',
          `${state.id} rootHost=${state.witness.rootHost} 与 component=${component} 不一致`
        );
      }
      const expectedTarget = expectedWitnessTargetsByStateId[state.id];
      if (expectedTarget && state.witness.targetComponent !== expectedTarget) {
        failVerification(
          'COMPONENT_STATE_WITNESS',
          `${state.id} targetComponent=${state.witness.targetComponent ?? '<missing>'} 与 required target=${expectedTarget} 不一致`
        );
      }
    }
  }
  verifyGovernedJestRegistrations(root);
  verifySceneStateTestProofs(root);
  verifyRuntimeApiTestProofs(root);
}

function verifySceneContract(root, entries, bindingAnalysis) {
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
  const routeTargets = new Map();
  for (const statement of routerAst.statements) {
    const moduleName = importModuleName(statement);
    const match = moduleName?.match(/^\.\.\/showcases\/([^/]+)\//u);
    if (!match) continue;
    const namedBindings = statement.importClause?.namedBindings;
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue;
    const valueSpecifiers = namedBindings.elements.filter(
      (specifier) => !specifier.isTypeOnly
    );
    if (valueSpecifiers.length !== 1 || !moduleName) continue;
    const specifier = valueSpecifiers[0];
    routeTargets.set(match[1], {
      importedName: specifier.propertyName?.text ?? specifier.name.text,
      localName: specifier.name.text,
      filePath: resolveModuleFile(routerPath, moduleName),
    });
  }
  const routeEntries = [];
  for (const scene of expectedScenes.slice(0, -1)) {
    const componentName = routeTargets.get(scene)?.localName;
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
  const businessComponent = routeTargets.get('business')?.localName;
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
    const routeTarget = routeTargets.get(scene);
    if (
      !routeTarget ||
      !new RegExp(
        `export\\s+function\\s+${routeTarget.importedName}\\b`,
        'u'
      ).test(readFileSync(routeTarget.filePath, 'utf8'))
    ) {
      failVerification(
        'ROUTE_REGISTRY',
        `${scene} route target 不是实际导出的 scene`
      );
    }
    const routeTargetFile = routeTarget.filePath;
    const reachableFiles = collectReachableRuntimeFiles(routeTargetFile);
    const sceneDirectory = path.join(root, `example/src/showcases/${scene}`);
    const reachableSceneFiles = reachableFiles.filter((filePath) =>
      isWithinDirectory(filePath, sceneDirectory)
    );
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

    const allBindings = collectRuntimeImportBindings(
      reachableSceneFiles,
      '@unif/react-native-design',
      bindingAnalysis
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
      (name) => (allBindings.get(name)?.jsxUses ?? 0) === 0
    );
    if (missingComponents.length) {
      failVerification(
        'SCENE_COMPONENT_CONSUMPTION',
        `${scene} 缺少 route-reachable public-root 组件绑定: ${missingComponents.join(', ')}`
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
        ? (allBindings.get(name)?.callUses ?? 0) === 0
        : (allBindings.get(name)?.uses ?? 0) === 0
    );
    if (missingApis.length) {
      failVerification(
        'SCENE_RUNTIME_API_CONSUMPTION',
        `${scene} 缺少 route-reachable required runtime API public binding: ${missingApis.join(', ')}`
      );
    }
    if (
      scene === 'business' &&
      (allBindings.get('useSvgId')?.callUses ?? 0) < 2
    ) {
      failVerification(
        'SCENE_RUNTIME_API_CONSUMPTION',
        'Business 必须保留至少两个 useSvgId public binding call site'
      );
    }
  }

  verifyShowcaseStateContract(root, entries);

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
    ...[...routeTargets.values()].map((target) => target.localName),
  ]);
  const homeImports = collectRuntimeImportBindings(
    [homePath],
    '@unif/react-native-design',
    bindingAnalysis
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

function verifyRootRuntime(root, bindingAnalysis) {
  const runtimeFiles = listSourceFiles(path.join(root, 'example/src'));
  const designBindings = collectRuntimeImportBindings(
    runtimeFiles,
    '@unif/react-native-design',
    bindingAnalysis
  );
  const gestureBindings = collectRuntimeImportBindings(
    runtimeFiles,
    'react-native-gesture-handler',
    bindingAnalysis
  );
  const runtimeBindings = new Map([
    ['GestureHandlerRootView', gestureBindings.get('GestureHandlerRootView')],
    ['ThemeProvider', designBindings.get('ThemeProvider')],
    ['ConfirmHost', designBindings.get('ConfirmHost')],
    ['ToastHost', designBindings.get('ToastHost')],
  ]);
  const counts = Object.fromEntries(
    [...runtimeBindings].map(([name, binding]) => [name, binding?.jsxUses ?? 0])
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
  const providerDesignBindings = collectRuntimeImportBindings(
    [providersPath],
    '@unif/react-native-design',
    bindingAnalysis
  );
  const providerGestureBindings = collectRuntimeImportBindings(
    [providersPath],
    'react-native-gesture-handler',
    bindingAnalysis
  );
  const gesture = providerGestureBindings.get('GestureHandlerRootView')
    ?.jsxNodes[0];
  if (!gesture || !ts.isJsxElement(gesture)) {
    failVerification(
      'ROOT_PROVIDER_HIERARCHY',
      '缺少 public react-native-gesture-handler GestureHandlerRootView 根节点'
    );
  }
  const safeArea = gesture
    ? assertDirectChild(gesture, 'SafeAreaProvider', 'ROOT_PROVIDER_HIERARCHY')
    : undefined;
  const showcase = safeArea
    ? assertDirectChild(safeArea, 'ShowcaseProvider', 'ROOT_PROVIDER_HIERARCHY')
    : undefined;
  if (showcase) {
    assertDirectChild(showcase, 'DesignRuntime', 'ROOT_PROVIDER_HIERARCHY');
  }
  const theme = providerDesignBindings.get('ThemeProvider')?.jsxNodes[0];
  if (!theme || !ts.isJsxElement(theme)) {
    failVerification(
      'ROOT_PROVIDER_HIERARCHY',
      '缺少 public-root ThemeProvider'
    );
  }
  assertDirectRuntimeChild(
    theme,
    providerDesignBindings.get('ConfirmHost'),
    'ConfirmHost'
  );
  assertDirectRuntimeChild(
    theme,
    providerDesignBindings.get('ToastHost'),
    'ToastHost'
  );
  assertPersistentRuntimeChild(
    theme,
    providerDesignBindings.get('ConfirmHost'),
    'ConfirmHost'
  );
  assertPersistentRuntimeChild(
    theme,
    providerDesignBindings.get('ToastHost'),
    'ToastHost'
  );
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

function mediaVariableInitializer(sourceFile, variableName, requireExport) {
  const matches = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === variableName
      ) {
        matches.push({ declaration, statement });
      }
    }
  }
  const match = matches[0];
  const exported = match?.statement.modifiers?.some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword
  );
  if (
    matches.length !== 1 ||
    !match?.declaration.initializer ||
    (match.statement.declarationList.flags & ts.NodeFlags.Const) === 0 ||
    (requireExport && !exported)
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `${variableName} 必须是唯一的${requireExport ? ' exported' : ''} const initializer`
    );
  }
  return unwrapExpression(match.declaration.initializer);
}

function mediaStringConstant(sourceFile, variableName) {
  const initializer = mediaVariableInitializer(sourceFile, variableName, true);
  if (!ts.isStringLiteral(initializer)) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `${variableName} 必须是 string literal`
    );
  }
  return initializer.text;
}

function mediaPropertyName(property) {
  const name = property.name;
  if (!name) return undefined;
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression)) {
    return name.expression.text;
  }
  return undefined;
}

function mediaObjectProperty(object, propertyName, label) {
  const matches = object.properties.filter(
    (property) => mediaPropertyName(property) === propertyName
  );
  if (matches.length !== 1 || !ts.isPropertyAssignment(matches[0])) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `${label}.${propertyName} 必须是唯一的 direct property assignment`
    );
  }
  return unwrapExpression(matches[0].initializer);
}

function mediaObjectStringProperty(object, propertyName) {
  const initializer = mediaObjectProperty(
    object,
    propertyName,
    'Docusaurus config'
  );
  if (!initializer || !ts.isStringLiteral(initializer)) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `Docusaurus config.${propertyName} 必须是唯一的 direct string property`
    );
  }
  return initializer.text;
}

function jsxAttributes(element) {
  return ts.isJsxElement(element)
    ? element.openingElement.attributes.properties
    : element.attributes.properties;
}

function mediaJsxSpecimen(sourceFile, componentName, testID) {
  const matches = findJsxElements(sourceFile, componentName).filter((element) =>
    jsxAttributes(element).some(
      (attribute) =>
        ts.isJsxAttribute(attribute) &&
        ts.isIdentifier(attribute.name) &&
        attribute.name.text === 'testID' &&
        attribute.initializer &&
        ts.isStringLiteral(attribute.initializer) &&
        attribute.initializer.text === testID
    )
  );
  if (matches.length !== 1) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `${componentName} ${testID} 必须恰有一个 route-reachable specimen`
    );
  }
  return matches[0];
}

function mediaJsxExpression(element, attributeName) {
  const matches = jsxAttributes(element).filter(
    (attribute) =>
      ts.isJsxAttribute(attribute) &&
      ts.isIdentifier(attribute.name) &&
      attribute.name.text === attributeName
  );
  const initializer =
    matches.length === 1 && ts.isJsxAttribute(matches[0])
      ? matches[0].initializer
      : undefined;
  if (
    !initializer ||
    !ts.isJsxExpression(initializer) ||
    !initializer.expression
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `Media controlled specimen ${attributeName} 必须是唯一的 JSX expression`
    );
  }
  return unwrapExpression(initializer.expression);
}

function assertMediaSpecimenHasNoSpread(element, testID) {
  if (
    jsxAttributes(element).some((attribute) =>
      ts.isJsxSpreadAttribute(attribute)
    )
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `${testID} 禁止 JSX spread 覆盖受控 URI props`
    );
  }
}

function mediaAvatarSourceUri(expression, testID) {
  if (
    !ts.isObjectLiteralExpression(expression) ||
    expression.properties.length !== 1 ||
    expression.properties.some(
      (property) =>
        ts.isSpreadAssignment(property) ||
        (property.name && ts.isComputedPropertyName(property.name))
    )
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `${testID} source 必须是只含 direct uri 的 object literal`
    );
  }
  return mediaObjectProperty(expression, 'uri', `${testID} source`);
}

function verifyMediaFixtureDeployment(root, bindingAnalysis) {
  const gitAttributes = readText(root, '.gitattributes');
  if (
    !/^website\/static\/example-fixtures\/media-decode-failure-v1\.png -text$/mu.test(
      gitAttributes
    )
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'decode-failure fixture 必须以 -text 禁止跨平台换行转换'
    );
  }
  const docusaurusConfig = parseSource(
    path.join(root, 'website/docusaurus.config.ts')
  );
  const configInitializer = mediaVariableInitializer(
    docusaurusConfig,
    'config',
    false
  );
  const defaultExports = docusaurusConfig.statements.filter(
    (statement) => ts.isExportAssignment(statement) && !statement.isExportEquals
  );
  const configIdentifiers = [];
  const visitConfigIdentifiers = (node) => {
    if (ts.isIdentifier(node) && node.text === 'config') {
      configIdentifiers.push(node);
    }
    ts.forEachChild(node, visitConfigIdentifiers);
  };
  visitConfigIdentifiers(docusaurusConfig);
  if (
    !ts.isObjectLiteralExpression(configInitializer) ||
    configInitializer.properties.some(
      (property) =>
        ts.isSpreadAssignment(property) ||
        (property.name && ts.isComputedPropertyName(property.name))
    ) ||
    defaultExports.length !== 1 ||
    !ts.isExportAssignment(defaultExports[0]) ||
    !ts.isIdentifier(defaultExports[0].expression) ||
    defaultExports[0].expression.text !== 'config' ||
    configIdentifiers.length !== 2 ||
    mediaObjectStringProperty(configInitializer, 'url') !==
      expectedMediaDeployment.origin ||
    mediaObjectStringProperty(configInitializer, 'baseUrl') !==
      expectedMediaDeployment.baseUrl
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `Docusaurus deployment 必须固定为 ${expectedMediaDeployment.origin}${expectedMediaDeployment.baseUrl}`
    );
  }

  let successFixture;
  let failureFixture;
  try {
    successFixture = readFileSync(
      path.join(root, 'website/static/img/logo.png')
    );
    failureFixture = readFileSync(
      path.join(
        root,
        'website/static/example-fixtures/media-decode-failure-v1.png'
      )
    );
  } catch (error) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      `Media deployment fixture 无法读取：${String(error)}`
    );
  }

  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    successFixture.length <= pngSignature.length ||
    pngSignature.some((byte, index) => successFixture[index] !== byte) ||
    createHash('sha256').update(successFixture).digest('hex') !==
      expectedMediaDeployment.successSha256
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'Media success fixture 必须是仓库内非空 PNG 资产'
    );
  }
  if (
    failureFixture.toString('utf8') !== expectedMediaDeployment.failureMarker ||
    pngSignature.every((byte, index) => failureFixture[index] === byte)
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'Media failure fixture 必须是仓库控制、明确不可解码的固定 marker'
    );
  }

  const showcaseState = parseSource(
    path.join(root, 'example/src/state/showcaseState.ts')
  );
  const mediaScenePath = path.join(
    root,
    'example/src/showcases/media/MediaScene.tsx'
  );
  const mediaScene = bindingAnalysis.sourceFiles.get(
    path.resolve(mediaScenePath)
  );
  if (!mediaScene) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'binding analysis 缺少 MediaScene source'
    );
  }
  if (
    mediaStringConstant(showcaseState, 'DEFAULT_MEDIA_REMOTE_URI') !==
      expectedMediaDeployment.successUri ||
    mediaStringConstant(showcaseState, 'MEDIA_DECODE_FAILURE_URI') !==
      expectedMediaDeployment.failureUri
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'Media scene URI wiring 必须精确指向 Docusaurus static success/decode-failure fixtures'
    );
  }

  const sceneFactories = mediaVariableInitializer(
    showcaseState,
    'sceneStateFactories',
    false
  );
  if (
    !ts.isObjectLiteralExpression(sceneFactories) ||
    sceneFactories.properties.some((property) =>
      ts.isSpreadAssignment(property)
    )
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'sceneStateFactories 必须是无 spread 的 static object literal'
    );
  }
  const mediaFactory = mediaObjectProperty(
    sceneFactories,
    'media',
    'sceneStateFactories'
  );
  const mediaFactoryBody = ts.isArrowFunction(mediaFactory)
    ? unwrapExpression(mediaFactory.body)
    : undefined;
  if (
    !mediaFactoryBody ||
    !ts.isObjectLiteralExpression(mediaFactoryBody) ||
    mediaFactory.parameters.length !== 0 ||
    mediaFactoryBody.properties.some((property) =>
      ts.isSpreadAssignment(property)
    )
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'sceneStateFactories.media 必须返回无 spread 的 static draft'
    );
  }
  const defaultRemoteUri = mediaObjectProperty(
    mediaFactoryBody,
    'remoteUri',
    'sceneStateFactories.media draft'
  );
  if (
    !ts.isIdentifier(defaultRemoteUri) ||
    defaultRemoteUri.text !== 'DEFAULT_MEDIA_REMOTE_URI'
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'Media initial draft remoteUri 必须直接使用 DEFAULT_MEDIA_REMOTE_URI'
    );
  }

  const stateImports = mediaScene.statements.filter(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === '../../state/showcaseState'
  );
  const importedNames =
    stateImports.length === 1 &&
    ts.isImportDeclaration(stateImports[0]) &&
    stateImports[0].importClause?.namedBindings &&
    ts.isNamedImports(stateImports[0].importClause.namedBindings)
      ? stateImports[0].importClause.namedBindings.elements.map((element) => ({
          imported: element.propertyName?.text ?? element.name.text,
          local: element.name.text,
        }))
      : [];
  const requiredImports = [
    'DEFAULT_MEDIA_REMOTE_URI',
    'MEDIA_DECODE_FAILURE_URI',
  ];
  if (
    requiredImports.some(
      (name) =>
        importedNames.filter(
          (binding) => binding.imported === name && binding.local === name
        ).length !== 1
    )
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'Media scene 必须从 showcaseState 无别名导入精确 fixture URI'
    );
  }

  const failureAvatar = mediaJsxSpecimen(
    mediaScene,
    'Avatar',
    'media-avatar-failure'
  );
  const avatarSource = mediaJsxExpression(failureAvatar, 'source');
  const avatarUriInitializer = mediaAvatarSourceUri(
    avatarSource,
    'media-avatar-failure'
  );
  const failureThumbnail = mediaJsxSpecimen(
    mediaScene,
    'Thumbnail',
    'media-thumbnail-failure'
  );
  const thumbnailUri = mediaJsxExpression(failureThumbnail, 'uri');
  const successAvatar = mediaJsxSpecimen(
    mediaScene,
    'Avatar',
    'media-avatar-remote'
  );
  const successAvatarSource = mediaJsxExpression(successAvatar, 'source');
  const successAvatarUri = mediaAvatarSourceUri(
    successAvatarSource,
    'media-avatar-remote'
  );
  const successThumbnail = mediaJsxSpecimen(
    mediaScene,
    'Thumbnail',
    'media-thumbnail-uri-sm'
  );
  const successThumbnailUri = mediaJsxExpression(successThumbnail, 'uri');
  for (const [specimen, testID] of [
    [failureAvatar, 'media-avatar-failure'],
    [failureThumbnail, 'media-thumbnail-failure'],
    [successAvatar, 'media-avatar-remote'],
    [successThumbnail, 'media-thumbnail-uri-sm'],
  ]) {
    assertMediaSpecimenHasNoSpread(specimen, testID);
  }
  const isDraftRemoteUri = (expression) =>
    Boolean(
      expression &&
      ts.isPropertyAccessExpression(expression) &&
      ts.isIdentifier(expression.expression) &&
      expression.expression.text === 'draft' &&
      expression.name.text === 'remoteUri'
    );
  const mediaDesignBindings = collectRuntimeImportBindings(
    [mediaScenePath],
    '@unif/react-native-design',
    bindingAnalysis
  );
  const avatarNodes = new Set(
    mediaDesignBindings.get('Avatar')?.jsxNodes ?? []
  );
  const thumbnailNodes = new Set(
    mediaDesignBindings.get('Thumbnail')?.jsxNodes ?? []
  );
  if (
    !avatarUriInitializer ||
    !ts.isIdentifier(avatarUriInitializer) ||
    avatarUriInitializer.text !== 'MEDIA_DECODE_FAILURE_URI' ||
    !ts.isIdentifier(thumbnailUri) ||
    thumbnailUri.text !== 'MEDIA_DECODE_FAILURE_URI' ||
    !isDraftRemoteUri(successAvatarUri) ||
    !isDraftRemoteUri(successThumbnailUri) ||
    !avatarNodes.has(failureAvatar) ||
    !avatarNodes.has(successAvatar) ||
    !thumbnailNodes.has(failureThumbnail) ||
    !thumbnailNodes.has(successThumbnail)
  ) {
    failVerification(
      'MEDIA_FIXTURE_DEPLOYMENT',
      'public Avatar/Thumbnail success/failure specimens 必须直接使用对应受控 URI'
    );
  }
}

function verifyDocumentation(root) {
  const rootReadme = readText(root, 'README.md');
  const exampleReadme = readText(root, 'example/README.md');
  const agents = readText(root, 'AGENTS.md');
  const contributing = readText(root, 'CONTRIBUTING.md');
  const canonicalIosCommands = [
    '(cd example && bundle install)',
    '(cd example && bundle exec pod install --project-directory=ios)',
  ];

  for (const [label, source] of [
    ['AGENTS', agents],
    ['CONTRIBUTING', contributing],
    ['example README', exampleReadme],
  ]) {
    const commandLines = source
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.includes('bundle install') ||
          line.includes('bundle exec pod install --project-directory=ios')
      );
    if (
      commandLines.length !== canonicalIosCommands.length ||
      commandLines.some(
        (command, index) => command !== canonicalIosCommands[index]
      )
    ) {
      failVerification(
        'DOCUMENTATION_IOS_COMMANDS',
        `${label} 必须精确保留可从 repo root 顺序执行的 canonical iOS commands`
      );
    }
  }

  verifyDocumentSceneTable('root README', rootReadme, '## RN 0.87.1 组件展厅');
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
      ...canonicalIosCommands,
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
  const mediaFixtureUris = [
    'https://unif-design.github.io/react-native-design/img/logo.png',
    'https://unif-design.github.io/react-native-design/example-fixtures/media-decode-failure-v1.png',
  ];
  assertDocumentContainsAll(
    rootReadme,
    [...mediaFixtureUris, 'Jest 只证明 source wiring'],
    'README_MEDIA_FIXTURES',
    'root README media fixture boundary'
  );
  assertDocumentContainsAll(
    exampleReadme,
    [...mediaFixtureUris, 'Jest 只验证 source wiring'],
    'README_MEDIA_FIXTURES',
    'example README media fixture boundary'
  );
  assertDocumentContainsAll(
    rootReadme,
    [
      '本仓不使用全局 `logFilters`',
      '`yarn check:runtime-peers` 只接受 root、example、website 三条精确的 RNRC 5 / RNGH 3 例外',
      'harness 不继承本仓 `check:runtime-peers` 的 workspace 精确 allowlist',
    ],
    'README_PEER_FACTS',
    'root README runtime peer facts'
  );
  if (/本仓[^\n]*\.yarnrc\.yml[^\n]*logFilters/u.test(rootReadme)) {
    failVerification(
      'README_PEER_FACTS',
      'root README 不得声称 .yarnrc.yml 存在已删除的 logFilters'
    );
  }
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
        '0.87.1',
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

// GitHub Actions 的 `run:` 有两种写法:单行标量与 `run: |` 块标量。对 workflow 原文做
// `includes('run: <command>')` 只认得前者,块标量 step 的命令在后续更深缩进的行上,永远
// 匹配不到 —— 那正是 jest 入口两条命令当初只能逐条显式补断言的原因。这里手写一个最小
// 聚合(不引 YAML 依赖):把两种写法的命令正文都抽出来,gate 一律查这份聚合文本。
// 只收 run 正文的另一个好处:step `name:`、注释里出现同名命令不会假绿。
function collectWorkflowRunCommands(workflow) {
  const lines = workflow.split('\n');
  const commands = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    index += 1;
    const match = /^(\s*)(?:-\s+)?run:(.*)$/u.exec(line);
    if (!match) continue;
    const runIndent = match[1].length;
    const inline = match[2].trim();
    // `run: <command>`:正文就在本行。`|`/`>` 及其 chomping 后缀是块标量指示符,不是命令。
    if (inline && !/^[|>][-+]?\d*$/u.test(inline)) {
      commands.push(inline);
      continue;
    }
    // `run: |`:正文是后续缩进更深的行,缩进退回 step 层级即结束。
    while (index < lines.length) {
      const body = lines[index];
      if (body.trim() !== '') {
        if (body.length - body.trimStart().length <= runIndent) break;
        commands.push(body.trim());
      }
      index += 1;
    }
  }
  return commands.join('\n');
}

function verifyWorkflowContract(root) {
  const sharedCi = readText(root, '.github/workflows/ci.yml');
  const digest = createHash('sha256').update(sharedCi).digest('hex');
  if (
    digest !==
    '83e9a350da8f7e89d5c196001fe1ce686fb6ae9d9f4fc582a8fbcfc723cf75fa'
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
  const workflowCommands = collectWorkflowRunCommands(workflow);
  const missingCommands = requiredCommands.filter(
    (command) => !workflowCommands.includes(command)
  );
  if (missingCommands.length) {
    failVerification(
      'WORKFLOW_GATES',
      `example workflow 缺少 gates: ${missingCommands.join(', ')}`
    );
  }
  // 单列一组只为报错能指名道姓:根 jest 忽略 scripts/__tests__/、共享 ci.yml 又是组织
  // 模板不能动 —— 这两条命令是那批 gate 唯一进 CI 的路径,漏了就是「文件在、gate 永远
  // 不跑」,值得和普通 gate 分开提示。
  const missingJestEntryGates = [
    'yarn check:jest-entries',
    'node --test "scripts/__tests__/jest-*.test.mjs"',
  ].filter((command) => !workflowCommands.includes(command));
  if (missingJestEntryGates.length) {
    failVerification(
      'WORKFLOW_GATES',
      `example workflow 缺少 jest 入口 gates: ${missingJestEntryGates.join(', ')}`
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
  const requiredTestInputs = [
    '$TURBO_ROOT$/scripts/run-example-jest.mjs',
    '$TURBO_ROOT$/scripts/verify-example-showcase.mjs',
    '$TURBO_ROOT$/example/jest.forbidOnlyReporter.js',
    '$TURBO_ROOT$/example/jest.showcaseGate.js',
    // example 的 jest 接线现在整份来自仓根 preset(example/jest.config.js 只写
    // preset 字符串),这三个文件是 example test 的**真实**输入。漏在 inputs 外,
    // 改接线不会让 turbo 缓存失效 —— 拿旧缓存直接判绿,是最坏的一类假绿。
    '$TURBO_ROOT$/jest-preset.js',
    '$TURBO_ROOT$/jest-setup.js',
    '$TURBO_ROOT$/jest-resolver.js',
  ];
  const androidInputs =
    turbo.tasks['@unif/react-native-design-example#build:android'].inputs;
  const iosInputs =
    turbo.tasks['@unif/react-native-design-example#build:ios'].inputs;
  const missingTestInputs = requiredTestInputs.filter(
    (input) => !testInputs.includes(input)
  );
  if (missingTestInputs.length > 0) {
    failVerification(
      'TURBO_INPUTS',
      `example test task 缺少直接 gate inputs: ${missingTestInputs.join(', ')}`
    );
  }
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

  const exampleSourceFiles = listSourceFiles(path.join(root, 'example/src'));
  const bindingAnalysis = createRuntimeBindingAnalysis(exampleSourceFiles);
  verifySceneContract(root, entries, bindingAnalysis);
  verifyRootRuntime(root, bindingAnalysis);
  verifyMediaFixtureDeployment(root, bindingAnalysis);
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
