import {
  componentCatalog,
  requiredRuntimeApis,
  sceneIds,
} from '../catalog/componentCatalog';

const expectedComponentIds = [
  'ActionMenuContent',
  'TextEntryContent',
  'SmsField',
  'ImagePreview',
  'Sheet',

  'Avatar',
  'AvatarGroup',
  'GlassLayer',
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
  'GradientWash',
  'RadialHalo',
  'ScreenBackdrop',
  'GlassStats',
  'AvatarWithRing',
  'VersionPill',
] as const;

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
] as const;

const expectedComponentsByScene = {
  foundation: ['Icon'],
  actions: [
    'ActionMenuContent',
    'Button',
    'IconButton',
    'Chip',
    'Tag',
    'StatusDot',
  ],
  feedback: [
    'CircularProgress',
    'Empty',
    'Skeleton',
    'Spinner',
    'Pulse',
    'PulseDot',
    'Reveal',
    'GlassLayer',
    'ConfirmHost',
    'ToastHost',
  ],
  forms: [
    'TextEntryContent',
    'SmsField',
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
    'Sheet',
    'Card',
    'Ribbon',
    'Cell',
    'List',
    'Grid',
    'EntryCard',
    'Carousel',
  ],
  media: ['ImagePreview', 'Avatar', 'AvatarGroup', 'Thumbnail', 'Logo'],
  business: [
    'GradientWash',
    'RadialHalo',
    'ScreenBackdrop',
    'GlassStats',
    'AvatarWithRing',
    'VersionPill',
  ],
} as const;

test('catalog 精确覆盖 54 个公开组件且每项只有一个非空主场景', () => {
  expect(componentCatalog.map((entry) => entry.id).sort()).toEqual(
    [...expectedComponentIds].sort()
  );
  expect(new Set(componentCatalog.map((entry) => entry.id)).size).toBe(54);
  expect(componentCatalog).toHaveLength(54);
  expect(componentCatalog.every((entry) => entry.states.length > 0)).toBe(true);
});

test('每个公开组件遵守 exact 主 scene mapping', () => {
  expect(sceneIds).toEqual([
    'foundation',
    'actions',
    'feedback',
    'forms',
    'navigation',
    'collections',
    'media',
    'business',
  ]);
  for (const scene of sceneIds) {
    expect(
      componentCatalog
        .filter((entry) => entry.scene === scene)
        .map((entry) => entry.id)
        .sort()
    ).toEqual([...expectedComponentsByScene[scene]].sort());
  }
});

test('required runtime API 精确覆盖展厅使用的非组件能力', () => {
  expect([...requiredRuntimeApis].sort()).toEqual(
    [...expectedRuntimeApis].sort()
  );
});
