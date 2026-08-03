import type { SceneId } from '../catalog/componentCatalog';
import type { NavigationState } from '../navigation/exampleNavigation';

export type { SceneId } from '../catalog/componentCatalog';

export type ThemeMode = 'system' | 'light' | 'dark';
export type FontScalePreset = 1 | 1.25 | 1.5 | 2;

export type FoundationSceneState = Readonly<{
  iconQuery: string;
  iconSize: 16 | 24 | 32;
  iconLoadedCount: number;
}>;

export type ActionsSceneState = Readonly<{
  buttonVariant:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'neutral'
    | 'outline'
    | 'danger'
    | 'text';
  buttonSize: 'sm' | 'md' | 'lg';
  buttonLoading: boolean;
  chipSelected: boolean;
}>;

export type FeedbackSceneState = Readonly<{
  toastKind: 'info' | 'success' | 'error';
  toastPosition: 'top' | 'bottom' | 'center';
  revealDuration: 0 | 200 | 500;
  revealVisible: boolean;
  blurDemoEnabled: boolean;
  blurIntensity: 'soft' | 'strong';
}>;

export type FormsSceneState = Readonly<{
  inputValue: string;
  passwordValue: string;
  textareaValue: string;
  searchValue: string;
  checkboxChecked: boolean;
  radioValue: string;
  switchValue: boolean;
  stepperValue: number;
}>;

export type NavigationSceneState = Readonly<{
  selectedTab: string;
  selectedSegment: string;
  selectedTabBarItem: string;
}>;

export type CollectionsSceneState = Readonly<{
  cardVariant: 'default' | 'plain';
  cardBare: boolean;
  cardFill: boolean;
  carouselEnabled: boolean;
  carouselIndex: number;
  carouselAutoplay: boolean;
  carouselLoop: boolean;
}>;

export type MediaSceneState = Readonly<{
  avatarVariant: 'brand' | 'info' | 'soft' | 'neutral';
  avatarSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  thumbnailSize: 'sm' | 'md' | 'lg';
  thumbnailSelected: boolean;
  logoSize: number;
  remoteUri: string;
}>;

export type BusinessSceneState = Readonly<{
  backdropPreset: 'warmOrange' | 'custom';
  versionStatus: string;
}>;

export type SceneStateMap = Readonly<{
  foundation: FoundationSceneState;
  actions: ActionsSceneState;
  feedback: FeedbackSceneState;
  forms: FormsSceneState;
  navigation: NavigationSceneState;
  collections: CollectionsSceneState;
  media: MediaSceneState;
  business: BusinessSceneState;
}>;

export type SafeResult = Readonly<{
  scene: SceneId;
  component: string;
  action: string;
  summary: string;
}>;

export type SafeResultInput = SafeResult;
export type ResultRecord = SafeResult & Readonly<{ id: number }>;

export type ShowcaseState = Readonly<{
  navigation: NavigationState;
  themeMode: ThemeMode;
  fontScale: FontScalePreset;
  scenes: SceneStateMap;
  results: readonly ResultRecord[];
  nextResultId: number;
  lastInteractionByScene: Readonly<Record<SceneId, SafeResult | null>>;
}>;

const sceneStateFactories: {
  [K in SceneId]: () => SceneStateMap[K];
} = {
  foundation: () => ({ iconQuery: '', iconSize: 24, iconLoadedCount: 24 }),
  actions: () => ({
    buttonVariant: 'primary',
    buttonSize: 'md',
    buttonLoading: false,
    chipSelected: false,
  }),
  feedback: () => ({
    toastKind: 'info',
    toastPosition: 'bottom',
    revealDuration: 200,
    revealVisible: true,
    blurDemoEnabled: false,
    blurIntensity: 'soft',
  }),
  forms: () => ({
    inputValue: '',
    passwordValue: '',
    textareaValue: '',
    searchValue: '',
    checkboxChecked: false,
    radioValue: 'first',
    switchValue: false,
    stepperValue: 0,
  }),
  navigation: () => ({
    selectedTab: 'overview',
    selectedSegment: 'first',
    selectedTabBarItem: 'home',
  }),
  collections: () => ({
    cardVariant: 'default',
    cardBare: false,
    cardFill: false,
    carouselEnabled: false,
    carouselIndex: 0,
    carouselAutoplay: false,
    carouselLoop: true,
  }),
  media: () => ({
    avatarVariant: 'neutral',
    avatarSize: 'md',
    thumbnailSize: 'md',
    thumbnailSelected: false,
    logoSize: 64,
    remoteUri: 'https://images.example.com/unif-avatar.png',
  }),
  business: () => ({
    backdropPreset: 'warmOrange',
    versionStatus: '正常',
  }),
};

export function createInitialSceneStateMap(): SceneStateMap {
  return {
    foundation: sceneStateFactories.foundation(),
    actions: sceneStateFactories.actions(),
    feedback: sceneStateFactories.feedback(),
    forms: sceneStateFactories.forms(),
    navigation: sceneStateFactories.navigation(),
    collections: sceneStateFactories.collections(),
    media: sceneStateFactories.media(),
    business: sceneStateFactories.business(),
  };
}

function createEmptyLastInteraction(): Readonly<
  Record<SceneId, SafeResult | null>
> {
  return {
    foundation: null,
    actions: null,
    feedback: null,
    forms: null,
    navigation: null,
    collections: null,
    media: null,
    business: null,
  };
}

export function createInitialShowcaseState(): ShowcaseState {
  return {
    navigation: ['home'],
    themeMode: 'system',
    fontScale: 1,
    scenes: createInitialSceneStateMap(),
    results: [],
    nextResultId: 1,
    lastInteractionByScene: createEmptyLastInteraction(),
  };
}

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function isFontScalePreset(value: unknown): value is FontScalePreset {
  return value === 1 || value === 1.25 || value === 1.5 || value === 2;
}

export function setShowcaseThemeMode(
  state: ShowcaseState,
  mode: unknown
): ShowcaseState {
  if (!isThemeMode(mode) || state.themeMode === mode) return state;
  return { ...state, themeMode: mode };
}

export function setShowcaseFontScale(
  state: ShowcaseState,
  scale: unknown
): ShowcaseState {
  if (!isFontScalePreset(scale) || state.fontScale === scale) return state;
  return { ...state, fontScale: scale };
}

export function updateShowcaseScene<K extends SceneId>(
  state: ShowcaseState,
  scene: K,
  updater: (current: SceneStateMap[K]) => SceneStateMap[K]
): ShowcaseState {
  const current = state.scenes[scene];
  const next = updater(current);
  if (next === current) return state;
  return {
    ...state,
    scenes: {
      ...state.scenes,
      [scene]: next,
    },
  };
}

export function resetShowcaseScene<K extends SceneId>(
  state: ShowcaseState,
  scene: K
): ShowcaseState {
  return {
    ...state,
    scenes: {
      ...state.scenes,
      [scene]: sceneStateFactories[scene](),
    },
  };
}

export function appendShowcaseResult(
  state: ShowcaseState,
  input: SafeResultInput
): ShowcaseState {
  const { scene, component, action, summary } = input;
  const safeResult: SafeResult = { scene, component, action, summary };
  const result: ResultRecord = {
    id: state.nextResultId,
    ...safeResult,
  };

  return {
    ...state,
    results: [result, ...state.results].slice(0, 50),
    nextResultId: state.nextResultId + 1,
    lastInteractionByScene: {
      ...state.lastInteractionByScene,
      [scene]: safeResult,
    },
  };
}

export function clearShowcaseResults(state: ShowcaseState): ShowcaseState {
  if (state.results.length === 0) return state;
  return { ...state, results: [] };
}
