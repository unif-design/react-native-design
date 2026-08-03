import { navigate } from '../navigation/exampleNavigation';
import {
  appendShowcaseResult,
  clearShowcaseResults,
  createInitialShowcaseState,
  isFontScalePreset,
  isThemeMode,
  resetShowcaseScene,
  setShowcaseFontScale,
  setShowcaseThemeMode,
  updateShowcaseScene,
  type SafeResultInput,
  type SceneId,
  type ShowcaseState,
} from '../state/showcaseState';

test('theme mode 与 fontScale 只接受指定 literal preset', () => {
  expect(['system', 'light', 'dark'].every(isThemeMode)).toBe(true);
  expect(['auto', '', null, 1].some(isThemeMode)).toBe(false);
  expect([1, 1.25, 1.5, 2].every(isFontScalePreset)).toBe(true);
  expect([0, 1.1, 3, Number.NaN, '1.25'].some(isFontScalePreset)).toBe(false);

  const initial = createInitialShowcaseState();
  expect(setShowcaseThemeMode(initial, 'dark').themeMode).toBe('dark');
  expect(setShowcaseFontScale(initial, 1.5).fontScale).toBe(1.5);
  expect(setShowcaseThemeMode(initial, 'sepia')).toBe(initial);
  expect(setShowcaseFontScale(initial, 1.1)).toBe(initial);
});

test('八个 concrete scene draft 可独立更新且切换 route 不丢失', () => {
  let state = createInitialShowcaseState();
  state = updateShowcaseScene(state, 'foundation', (current) => ({
    ...current,
    iconQuery: 'arrow',
  }));
  state = updateShowcaseScene(state, 'actions', (current) => ({
    ...current,
    chipSelected: true,
  }));
  state = updateShowcaseScene(state, 'feedback', (current) => ({
    ...current,
    toastKind: 'success',
  }));
  state = updateShowcaseScene(state, 'forms', (current) => ({
    ...current,
    inputValue: '可复现输入',
  }));
  state = updateShowcaseScene(state, 'navigation', (current) => ({
    ...current,
    selectedTab: 'details',
  }));
  state = updateShowcaseScene(state, 'collections', (current) => ({
    ...current,
    carouselIndex: 2,
  }));
  state = updateShowcaseScene(state, 'media', (current) => ({
    ...current,
    thumbnailSelected: true,
  }));
  state = updateShowcaseScene(state, 'business', (current) => ({
    ...current,
    versionStatus: '需要更新',
  }));

  const navigated: ShowcaseState = {
    ...state,
    navigation: navigate(state.navigation, 'media'),
  };

  expect(navigated.scenes).toMatchObject({
    foundation: { iconQuery: 'arrow' },
    actions: { chipSelected: true },
    feedback: { toastKind: 'success' },
    forms: { inputValue: '可复现输入' },
    navigation: { selectedTab: 'details' },
    collections: { carouselIndex: 2 },
    media: { thumbnailSelected: true },
    business: { versionStatus: '需要更新' },
  });
});

test('每次初始化都创建八个互不共享的 scene draft', () => {
  const first = createInitialShowcaseState();
  const second = createInitialShowcaseState();
  const scenes: readonly SceneId[] = [
    'foundation',
    'actions',
    'feedback',
    'forms',
    'navigation',
    'collections',
    'media',
    'business',
  ];

  expect(first.scenes).not.toBe(second.scenes);
  for (const scene of scenes) {
    expect(first.scenes[scene]).not.toBe(second.scenes[scene]);
  }
});

test('scene draft 提供跨路由复现与按需挂载所需的最小字段', () => {
  const state = createInitialShowcaseState();

  expect(state.scenes.foundation.iconLoadedCount).toBe(24);
  expect(state.scenes.feedback).toMatchObject({
    revealVisible: true,
    blurDemoEnabled: false,
    blurIntensity: 'soft',
  });
  expect(state.scenes.collections).toMatchObject({
    cardVariant: 'default',
    cardBare: false,
    cardFill: false,
    carouselEnabled: false,
  });
});

test('Feedback blurIntensity 初始化与 reset 都回到 soft', () => {
  const initial = createInitialShowcaseState();
  expect(initial.scenes.feedback.blurIntensity).toBe('soft');

  const strong = updateShowcaseScene(initial, 'feedback', (current) => ({
    ...current,
    blurIntensity: 'strong',
  }));
  expect(strong.scenes.feedback.blurIntensity).toBe('strong');

  const reset = resetShowcaseScene(strong, 'feedback');
  expect(reset.scenes.feedback.blurIntensity).toBe('soft');
  expect(reset.scenes.feedback.blurDemoEnabled).toBe(false);
});

test('Media 只持久化稳定 HTTPS fixture，Business reset 回到暖橙预设', () => {
  const initial = createInitialShowcaseState();
  expect(initial.scenes.media.remoteUri).toBe(
    'https://images.example.com/unif-avatar.png'
  );
  expect(initial.scenes.business.backdropPreset).toBe('warmOrange');

  const customizedMedia = updateShowcaseScene(initial, 'media', (current) => ({
    ...current,
    remoteUri: 'https://cdn.example.com/avatar.png',
  }));
  const customizedBusiness = updateShowcaseScene(
    customizedMedia,
    'business',
    (current) => ({
      ...current,
      backdropPreset: 'custom',
    })
  );

  expect(customizedBusiness.scenes.media.remoteUri).toBe(
    'https://cdn.example.com/avatar.png'
  );
  expect(customizedBusiness.scenes.business.backdropPreset).toBe('custom');
  expect(
    resetShowcaseScene(customizedBusiness, 'media').scenes.media.remoteUri
  ).toBe('https://images.example.com/unif-avatar.png');
  expect(
    resetShowcaseScene(customizedBusiness, 'business').scenes.business
      .backdropPreset
  ).toBe('warmOrange');
});

test('reset 只新建目标 draft 并保留 route、偏好、结果、id 与其他引用', () => {
  let state = createInitialShowcaseState();
  state = {
    ...state,
    navigation: ['home', 'forms'],
    themeMode: 'dark',
    fontScale: 2,
  };
  state = updateShowcaseScene(state, 'forms', (current) => ({
    ...current,
    inputValue: '待重置',
    switchValue: true,
  }));
  state = updateShowcaseScene(state, 'media', (current) => ({
    ...current,
    thumbnailSelected: true,
  }));
  state = appendShowcaseResult(state, {
    scene: 'forms',
    component: 'Input',
    action: '提交',
    summary: '已提交 4 个字符',
  });

  const previousForms = state.scenes.forms;
  const previousMedia = state.scenes.media;
  const reset = resetShowcaseScene(state, 'forms');

  expect(reset.scenes.forms).toEqual(createInitialShowcaseState().scenes.forms);
  expect(reset.scenes.forms).not.toBe(previousForms);
  expect(reset.scenes.media).toBe(previousMedia);
  expect(reset.navigation).toBe(state.navigation);
  expect(reset.themeMode).toBe('dark');
  expect(reset.fontScale).toBe(2);
  expect(reset.results).toBe(state.results);
  expect(reset.nextResultId).toBe(state.nextResultId);
});

test('result newest-first、上限 50、id 单调且同步 last interaction', () => {
  let state = createInitialShowcaseState();
  for (let index = 1; index <= 51; index += 1) {
    state = appendShowcaseResult(state, {
      scene: 'actions',
      component: 'Button',
      action: '点击',
      summary: `第 ${index} 次`,
    });
  }

  expect(state.results).toHaveLength(50);
  expect(state.results[0]).toMatchObject({ id: 51, summary: '第 51 次' });
  expect(state.results[49]).toMatchObject({ id: 2, summary: '第 2 次' });
  expect(state.nextResultId).toBe(52);
  expect(state.lastInteractionByScene.actions).toEqual({
    scene: 'actions',
    component: 'Button',
    action: '点击',
    summary: '第 51 次',
  });

  state = clearShowcaseResults(state);
  expect(state.results).toEqual([]);
  expect(state.nextResultId).toBe(52);
  state = appendShowcaseResult(state, {
    scene: 'feedback',
    component: 'ToastHost',
    action: '展示',
    summary: 'success',
  });
  expect(state.results[0]?.id).toBe(52);
});

test('password action 只保存调用方安全摘要并丢弃额外敏感字段', () => {
  const password = 'NeverStoreThisPassword!';
  const unsafeInput = {
    scene: 'forms',
    component: 'PasswordInput',
    action: '校验',
    summary: '密码长度 23，格式有效',
    password,
    value: password,
    uri: 'file:///private/photo.jpg',
    image: { uri: 'file:///private/photo.jpg' },
    args: [password],
    metadata: { raw: password },
  } as unknown as SafeResultInput;

  const state = appendShowcaseResult(createInitialShowcaseState(), unsafeInput);
  const serializedState = JSON.stringify(state);
  const serializedResults = JSON.stringify(state.results);

  expect(state.results).toEqual([
    {
      id: 1,
      scene: 'forms',
      component: 'PasswordInput',
      action: '校验',
      summary: '密码长度 23，格式有效',
    },
  ]);
  expect(serializedState).not.toContain(password);
  expect(serializedState).not.toContain('file:///private/photo.jpg');
  expect(serializedResults).not.toContain(password);
  expect(serializedResults).not.toContain('file:///private/photo.jpg');
});
