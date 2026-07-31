# Theme, Platform, and Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 fontScale、Theme fallback、图片 identity、Web/native 容器、SVG ID、Icon 构建器和 Website IconCatalog 具备一致、可验证且不会静默漂移的语义。

**Architecture:** Theme 层提供无副作用纯归一化函数和稳定 fallback，所有静态/动态 typography 共享一次缩放规则。图片组件先用可测试的语义序列化/校验，再通过 keyed 私有 `ImageAttempt` 隔离失败生命周期。平台组件把 caller layout 与内部视觉/动画拆层；Icon source 经过全标签/属性 allowlist validator 后才生成，Website 分类由 `ICON_NAMES` 反向补齐。

**Tech Stack:** React Native 0.86.2、React 19.2.3、TypeScript 6、React Native Web、Reanimated 4.5、react-native-svg、Node.js、Jest 30、Docusaurus

## Global Constraints

- 必须先完成 Dependency/Runtime 与 Input/Interaction 两份计划；本计划复核但不重复实现 `usePrefersReducedMotion()`。
- `normalizeFontScale` 只接受有限正数，不设上限；`scaleFontMetric` 只乘一次，不调用 `r()`/`rf()` 或额外取整。
- 只缩放 `fontSize`、`lineHeight`、`letterSpacing`；Icon、Spinner、padding、gap、尺寸、圆角和 `fixed.hitTarget` 不缩放。
- `ThemeContext` 不再公开；缺 Provider 返回模块级稳定 light fallback，开发诊断只能在 effect 中通过 `createLogger` 发生。
- 图片 identity 由 source 内容决定，不由对象引用、随机数、render 次数决定；invalid source 不挂载 Image。
- Reveal Web 公开结构只有一个 RN View；Spinner 和 Thumbnail 的 caller layout/transform 与内部视觉/动画必须分层。
- Icon validator 必须先收集全部 error，再决定是否写 `src/icons/data.ts`；任一 error 不写正式生成物。
- 不保留 Thumbnail `style` alias、未消毒 SVG override、Icon 属性 warning 降级或 IconCatalog 手工不完整集合。
- 每个公共改动同步对应 Website MDX 和 manual harness；最终 LLM mirror/Skill 收口由第四份计划执行。
- `AGENTS.md` / `CLAUDE.md` 属于另一个会话；只读取，不编辑、不暂存、不提交。

---

## File Structure

### Theme

- `src/theme/fontScale.ts`：`normalizeFontScale`、`scaleFontMetric`、`useFontScale`。
- `src/theme/themeContext.ts`：私有 Context、稳定 fallback 和纯 resolver/diagnostic predicate。
- `src/theme/ThemeProvider.tsx`：合法 context value 和 effect 诊断。
- `src/theme/useTheme.ts`：稳定 fallback 和 effect 诊断。
- `src/theme/useThemedStyles.ts`：maker typography 的唯一静态缩放入口。

### Image identity

- `src/utils/imageSource.ts`：canonical serialization、runtime source validation、`imageSourceKey`。
- `src/components/ui/shared/ImageAttempt.tsx`：每次合法 source 尝试独立持有失败 state。
- `src/components/ui/Avatar/Avatar.tsx`、`DrawerHeader.tsx`：父层只计算 key，不持有跨 source failure。

### Platform/style components

- `Reveal(.web).tsx`：native reduced-motion gate、Web 单 View/双 RAF。
- `Spinner(.web).tsx`：outer layout 与 inner rotating ring。
- `Thumbnail/normalize.ts`：公开 imageStyle 的 runtime reserved-field sanitizer。
- `Thumbnail.tsx`：outer layout、fixed visual frame、stable ring overlay。

### SVG and Icons

- `src/components/business/useSvgId.ts`：pure sanitizer/builder + public hook。
- `scripts/build-icons.js`：comment-cleaned full-tag validator/parser。
- `scripts/check-icons-generated.js`：双临时生成与 committed bytes/hash 检查。
- `website/src/components/iconCatalogCategories.ts`：分类重复/未知 fail-fast 和自动“未分类”。

---

### Task 1: Normalize fontScale and make Theme fallback reachable and stable

**Files:**

- Create: `src/theme/fontScale.ts`
- Create: `src/theme/themeContext.ts`
- Create: `__tests__/theme/themeContext.test.ts`
- Modify: `src/theme/ThemeProvider.tsx`
- Modify: `src/theme/useTheme.ts`
- Modify: `src/theme/useThemedStyles.ts`
- Modify: `src/theme/index.ts`
- Modify: `__tests__/theme/scale.test.ts`
- Modify: `__tests__/theme/useThemedStyles.test.ts`
- Modify: `website/docs/design/tokens/typography.md`
- Modify: `website/docs/UNIF-DESIGN.md`
- Modify: `website/docs/troubleshooting.md`

**Interfaces:**

- Consumes: `ThemeContextValue`, light colors/shadow, `createLogger`.
- Produces:
  - public `normalizeFontScale(value: unknown): number`
  - public `scaleFontMetric(value: number, fontScale: number): number`
  - public `useFontScale(): number`
  - private `ThemeContext<ThemeContextValue | undefined>`
  - private stable `FALLBACK_THEME`
  - `resolveThemeContext(value): ThemeContextValue`
  - `shouldWarnMissingThemeProvider(value, isDev): boolean`.

- [ ] **Step 1: Add failing font-scale tests**

```ts
test.each([
  [undefined, 1],
  [null, 1],
  ['2', 1],
  [0, 1],
  [-1, 1],
  [Number.NaN, 1],
  [Number.POSITIVE_INFINITY, 1],
  [Number.NEGATIVE_INFINITY, 1],
  [1.5, 1.5],
  [100, 100],
])('normalizeFontScale(%p) -> %p', (input, expected) => {
  expect(normalizeFontScale(input)).toBe(expected);
});

expect(scaleFontMetric(16, 1.5)).toBe(24);
expect(scaleFontMetric(-0.5, 2)).toBe(-1);
expect(scaleFontMetric(16, Number.NaN)).toBe(16);
```

- [ ] **Step 2: Add failing context tests**

```ts
test('缺 Provider 总是返回同一个 fallback 引用', () => {
  expect(resolveThemeContext(undefined)).toBe(FALLBACK_THEME);
  expect(resolveThemeContext(undefined)).toBe(FALLBACK_THEME);
});

test('只有 dev + missing 才标记诊断', () => {
  expect(shouldWarnMissingThemeProvider(undefined, true)).toBe(true);
  expect(shouldWarnMissingThemeProvider(undefined, false)).toBe(false);
  expect(shouldWarnMissingThemeProvider(FALLBACK_THEME, true)).toBe(false);
});
```

- [ ] **Step 3: Run focused tests**

```bash
yarn test __tests__/theme/scale.test.ts __tests__/theme/themeContext.test.ts __tests__/theme/useThemedStyles.test.ts
```

Expected: FAIL because the new helpers/context module do not exist.

- [ ] **Step 4: Implement pure scaling**

```ts
export function normalizeFontScale(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : 1;
}

export function scaleFontMetric(value: number, fontScale: number): number {
  return value * normalizeFontScale(fontScale);
}

export function useFontScale(): number {
  return normalizeFontScale(useTheme().fontScale);
}
```

No helper logs or caps.

- [ ] **Step 5: Move private Context/fallback to `themeContext.ts`**

```ts
export const FALLBACK_THEME: ThemeContextValue = {
  scheme: 'light',
  colors: lightColors,
  shadow: lightShadow,
  fontScale: 1,
};

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

export const resolveThemeContext = (
  value: ThemeContextValue | undefined
): ThemeContextValue => value ?? FALLBACK_THEME;

export const shouldWarnMissingThemeProvider = (
  value: ThemeContextValue | undefined,
  isDev: boolean
): boolean => value === undefined && isDev;
```

Keep `ThemeContextValue`/`ColorScheme` type definitions in `ThemeProvider.tsx` and import them with `import type` to avoid runtime cycles. `src/theme/index.ts` exports the types and ThemeProvider, but no longer exports `ThemeContext`.

- [ ] **Step 6: Normalize Provider and move warnings to effects**

Provider:

```ts
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const log = createLogger('ThemeProvider');
const warnedInvalidFontScales = new Set<string>();

const normalizedFontScale = normalizeFontScale(fontScale);
useEffect(() => {
  const warningKey = `${typeof fontScale}:${String(fontScale)}`;
  if (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    normalizedFontScale !== fontScale &&
    !warnedInvalidFontScales.has(warningKey)
  ) {
    warnedInvalidFontScales.add(warningKey);
    log.warn(`fontScale=${String(fontScale)} 无效，已回退为 1`);
  }
}, [fontScale, normalizedFontScale]);
```

Keep the logger and `warnedInvalidFontScales` at module scope, outside the component; equivalent invalid values warn once even across remounts. Memoize context by `[scheme, normalizedFontScale]`.

`useTheme()` always calls an effect:

```ts
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;
const log = createLogger('useTheme');
let warnedMissing = false;

const context = useContext(ThemeContext);
useEffect(() => {
  if (shouldWarnMissingThemeProvider(context, isDev) && !warnedMissing) {
    warnedMissing = true;
    log.warn('缺少 ThemeProvider，已使用稳定 light fallback');
  }
}, [context]);
return resolveThemeContext(context);
```

Use module-level logger/boolean; no `console` and no render-time side effect.

- [ ] **Step 7: Route maker scaling through the public pure helper**

`scaleTextStyle` calls `scaleFontMetric` for the three numeric metrics. `scaleNamedStyles` first normalizes its unknown runtime factor and returns the original styles object when it resolves to 1. `useThemedStyles` must not call `useTheme()` indirectly a second time through `useFontScale`; normalize the value from its one context read:

```ts
const { colors, shadow, fontScale: rawFontScale } = useTheme();
const fontScale = normalizeFontScale(rawFontScale);
return useMemo(
  () => scaleNamedStyles(maker(colors, shadow), fontScale),
  [colors, shadow, fontScale, maker]
);
```

Other components that only need the scale consume public `useFontScale()`.

- [ ] **Step 8: Verify and document**

```bash
yarn test __tests__/theme/scale.test.ts __tests__/theme/themeContext.test.ts __tests__/theme/useThemedStyles.test.ts
yarn typecheck
yarn prepare
rg -n "ThemeContext" lib/typescript/src/index.d.ts
```

Expected: tests/build pass; final command has no public ThemeContext export.

Document valid scale, no cap, exact metric scope, fallback warning timing and the three new root imports.

- [ ] **Step 9: Commit**

```bash
git add src/theme __tests__/theme website/docs/design/tokens/typography.md website/docs/UNIF-DESIGN.md website/docs/troubleshooting.md
git diff --cached --name-only
git commit -m "feat: normalize theme font scaling"
```

---

### Task 2: Apply fontScale exactly once to every dynamic text metric

**Files:**

- Modify: `src/components/ui/Button/Button.tsx`
- Modify: `src/components/ui/Avatar/Avatar.tsx`
- Modify: `src/components/ui/Segmented/Segmented.tsx`
- Modify: `src/components/ui/Stepper/Stepper.tsx`
- Modify: `src/components/ui/Tag/Tag.tsx`
- Modify: `src/components/business/AvatarWithRing/AvatarWithRing.tsx`
- Modify: `src/components/business/AvatarWithRing/styles.ts`
- Modify: `website/docs/components/button.mdx`
- Modify: `website/docs/components/avatar.mdx`
- Modify: `website/docs/components/stepper.mdx`
- Modify: `website/docs/components/tag.mdx`
- Modify: `website/docs/components/avatar-with-ring.mdx`
- Modify: `website/docs/design/tokens/typography.md`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `useFontScale()` and `scaleFontMetric(value, scale)`.
- Produces: every render-time typography metric scaled once, while Icon/layout metrics remain at their original size.

- [ ] **Step 1: Perform and save the source audit**

Run:

```bash
rg -n "fontSize|lineHeight|letterSpacing" src --glob "*.{ts,tsx}"
```

Classify every match:

- maker output consumed by `useThemedStyles`: no callsite change;
- render-time dynamic metric: use `scaleFontMetric`;
- non-text layout or Icon size: do not scale;
- `AvatarWithRing` custom factory: pass normalized fontScale explicitly.

The known dynamic set must include Button, Avatar, Segmented, Stepper, Tag and AvatarWithRing. Any additional dynamic match discovered is added to this task before commit.

- [ ] **Step 2: Scale text without scaling Icons**

Button pattern:

```tsx
const fontScale = useFontScale();
const textSize = scaleFontMetric(sizing.fs, fontScale);
<Icon name={leftIcon} size={sizing.fs + 2} color={palette.fg} />
<Text style={[styles.label, { color: palette.fg, fontSize: textSize }]} />
```

Use the same separation in Avatar, Segmented, Stepper and Tag. Do not derive Icon size from the already-scaled text value.

- [ ] **Step 3: Scale AvatarWithRing’s custom factory**

Pass `fontScale` into `makeAvatarStyles` and include it in `useMemo` dependencies:

```ts
label: {
  fontSize: scaleFontMetric(r(Math.round(safeSize * 0.4)), fontScale),
  letterSpacing: scaleFontMetric(-0.5, fontScale),
  fontWeight: fw.bold,
  color: c.onPrimary,
  textAlign: 'center',
}
```

Remove the render-time `{ lineHeight: inner }` geometry hack. `avatarCore` flex centering remains the only vertical centering mechanism.

- [ ] **Step 4: Verify no double-scaling path**

```bash
yarn typecheck
yarn prepare
rg -n "fontSize: (sizing|dims)\\.fs|lineHeight: inner|fontSize: r\\(Math\\.round\\(safeSize" src
```

Expected: no unscaled known dynamic text match and no AvatarWithRing line-height hack. Manually inspect that maker values are not wrapped again.

- [ ] **Step 5: Update docs/harness and commit**

Add a `fontScale={1.5}` harness section with Button text+icon, Avatar, Segmented, Stepper, Tag and AvatarWithRing. Record that text changes while hit targets/icons/container geometry remain fixed.

```bash
git add src/components/ui/Button/Button.tsx src/components/ui/Avatar/Avatar.tsx src/components/ui/Segmented/Segmented.tsx src/components/ui/Stepper/Stepper.tsx src/components/ui/Tag/Tag.tsx src/components/business/AvatarWithRing website/docs/components/button.mdx website/docs/components/avatar.mdx website/docs/components/stepper.mdx website/docs/components/tag.mdx website/docs/components/avatar-with-ring.mdx website/docs/design/tokens/typography.md manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "fix: scale dynamic typography once"
```

---

### Task 3: Give image sources semantic identity and attempt-local failure state

**Files:**

- Create: `src/utils/imageSource.ts`
- Create: `src/components/ui/shared/ImageAttempt.tsx`
- Create: `__tests__/utils/imageSource.test.ts`
- Modify: `src/components/ui/Avatar/Avatar.tsx`
- Modify: `src/components/ui/DrawerHeader/DrawerHeader.tsx`
- Modify: `website/docs/components/avatar.mdx`
- Modify: `website/docs/UNIF-DESIGN.md`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: RN `ImageSourcePropType`.
- Produces:
  - `canonicalSourceValue(value: unknown): string`
  - `imageSourceKey(source: ImageSourcePropType | undefined): string`
  - `isValidImageSource(source: unknown): source is ImageSourcePropType`
  - private stable `<ImageAttempt key={sourceKey} source ... fallback ... />`.

- [ ] **Step 1: Add canonical identity tests**

```ts
test('object/header key order 不影响 identity', () => {
  expect(
    imageSourceKey({
      uri: 'https://x/a.png',
      headers: { Authorization: 'a', Accept: 'image/png' },
    })
  ).toBe(
    imageSourceKey({
      headers: { Accept: 'image/png', Authorization: 'a' },
      uri: 'https://x/a.png',
    })
  );
});

test('真实 source 差异和 primitive 类型会改变 identity', () => {
  expect(imageSourceKey({ uri: 'a', headers: { token: '1' } })).not.toBe(
    imageSourceKey({ uri: 'a', headers: { token: '2' } })
  );
  expect(canonicalSourceValue(1)).not.toBe(canonicalSourceValue('1'));
});

test('undefined/空数组/空对象彼此不同', () => {
  expect(
    new Set([
      canonicalSourceValue(undefined),
      canonicalSourceValue([]),
      canonicalSourceValue({}),
    ]).size
  ).toBe(3);
});
```

Add array order, dimensions/cache/scale, local asset number, cycle, function, symbol, bigint and non-finite number cases.

- [ ] **Step 2: Add source validation tests**

```ts
test.each([undefined, 0, -1, Number.NaN, {}, [], { uri: '   ' }])(
  'invalid source %p',
  (source) => expect(isValidImageSource(source)).toBe(false)
);
expect(isValidImageSource(1)).toBe(true);
expect(isValidImageSource({ uri: 'https://x/a.png' })).toBe(true);
expect(
  isValidImageSource([{ uri: 'a' }, { uri: 'b', headers: { token: 'x' } }])
).toBe(true);
```

- [ ] **Step 3: Run and confirm failure**

```bash
yarn test __tests__/utils/imageSource.test.ts
```

- [ ] **Step 4: Implement deterministic canonical serialization**

Use type prefixes and sorted object keys:

```ts
function visit(value: unknown, seen: WeakSet<object>): string {
  if (value === undefined) return 'undefined:';
  if (value === null) return 'null:';
  if (typeof value === 'string') return `string:${JSON.stringify(value)}`;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `number:${value}` : 'invalid:number';
  }
  if (typeof value !== 'object') return `invalid:${typeof value}`;
  if (seen.has(value)) return 'invalid:cycle';
  seen.add(value);
  const result = Array.isArray(value)
    ? `array:[${value.map((item) => visit(item, seen)).join(',')}]`
    : `object:{${Object.keys(value)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${visit(
              (value as Record<string, unknown>)[key],
              seen
            )}`
        )
        .join(',')}}`;
  seen.delete(value);
  return result;
}
```

Validation accepts finite positive integer local assets, non-empty URI objects, and non-empty arrays whose every item is a valid URI object. Invalid input never throws.

- [ ] **Step 5: Implement stable private ImageAttempt**

```tsx
export function ImageAttempt({
  source,
  fallback,
  ...imageProps
}: ImageAttemptProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <>{fallback}</>
  ) : (
    <Image {...imageProps} source={source} onError={() => setFailed(true)} />
  );
}
```

It is defined at module scope, owns its failure boolean, and has no parent callback.

Avatar/Drawer flow:

```tsx
const validSource = isValidImageSource(source) ? source : undefined;
const sourceKey =
  validSource === undefined ? undefined : imageSourceKey(validSource);
return validSource && sourceKey ? (
  <ImageAttempt key={sourceKey} source={validSource} fallback={fallback} />
) : (
  fallback
);
```

No parent `imageFailed`, reset effect or `failedSourceKey` remains. Drawer’s whole avatar stays decorative per the Input plan.

- [ ] **Step 6: Verify and extend the ABA harness**

```bash
yarn test __tests__/utils/imageSource.test.ts
yarn typecheck
yarn prepare
```

Add controlled sources A₁ (new object), B and A₂ (semantically A), with a fixture that can deliver late `onError(A₁)`. Verify equivalent A references do not remount, actual source changes do, and the late old setter cannot affect A₂.

- [ ] **Step 7: Document and commit**

```bash
git add src/utils/imageSource.ts src/components/ui/shared/ImageAttempt.tsx src/components/ui/Avatar/Avatar.tsx src/components/ui/DrawerHeader/DrawerHeader.tsx __tests__/utils/imageSource.test.ts website/docs/components/avatar.mdx website/docs/UNIF-DESIGN.md manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "fix: isolate image source attempts"
```

---

### Task 4: Restore Reveal and Spinner platform container semantics

**Files:**

- Modify: `src/components/ui/Reveal/Reveal.tsx`
- Modify: `src/components/ui/Reveal/Reveal.web.tsx`
- Modify: `src/components/ui/Reveal/types.ts`
- Modify: `src/components/ui/Spinner/Spinner.tsx`
- Modify: `src/components/ui/Spinner/Spinner.web.tsx`
- Modify: `src/components/ui/Spinner/shared.ts`
- Modify: `src/components/ui/Spinner/types.ts`
- Modify: `website/docs/components/reveal.mdx`
- Modify: `website/docs/components/loading.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `usePrefersReducedMotion`, `sanitizeSpinnerProps`, `A11Y_HIDDEN_PROPS`.
- Produces: one public Reveal View on Web and two-layer Spinner on both platforms.

- [ ] **Step 1: Make native Reveal explicitly respect reduced motion**

```tsx
const reduced = usePrefersReducedMotion();
<Animated.View
  entering={reduced ? undefined : FadeIn.duration(duration)}
  exiting={reduced ? undefined : FadeOut.duration(duration)}
  style={style}
  testID={testID}
>
  {children}
</Animated.View>;
```

- [ ] **Step 2: Replace Web Reveal’s DOM wrapper**

Resolve caller target:

```ts
const flattened = StyleSheet.flatten(style);
const targetOpacity =
  typeof flattened?.opacity === 'number' &&
  Number.isFinite(flattened.opacity) &&
  flattened.opacity >= 0 &&
  flattened.opacity <= 1
    ? flattened.opacity
    : 1;
```

Use two separately tracked RAF ids and a generation/cancelled guard. Reduced motion sets visible immediately and schedules none.

Render one View:

```tsx
type WebTransitionStyle = ViewStyle & {
  transitionProperty?: 'opacity';
  transitionDuration?: string;
  transitionTimingFunction?: string;
};
const animatedWebStyle: WebTransitionStyle = {
  opacity: visible ? targetOpacity : 0,
  ...(reduced
    ? null
    : {
        transitionProperty: 'opacity',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'ease-out',
      }),
};
return (
  <View style={[style, animatedWebStyle]} testID={testID}>
    {children}
  </View>
);
```

No `<div>`, wrapper or transition shorthand remains.

- [ ] **Step 3: Rebuild native Spinner as outer layout + inner ring**

```tsx
<View
  style={[
    { width: safeSize, height: safeSize },
    style,
    { alignItems: 'center', justifyContent: 'center' },
  ]}
  testID={testID}
  {...A11Y_HIDDEN_PROPS}
>
  <Animated.View
    style={[
      {
        width: safeSize,
        height: safeSize,
        borderRadius: safeSize / 2,
        borderWidth: safeThickness,
        borderColor: colors.outline,
        borderTopColor: stroke,
      },
      animatedStyle,
    ]}
  />
</View>
```

Caller flex/margin/position/transform stays outer; reserved centering is last. Rotation writes only inner transform.

- [ ] **Step 4: Mirror the same responsibilities on Web**

Use the same outer View/style order. Attach the CSS animation ref to the inner ring View only. Static keyframes remain hard-coded and never interpolate props. Caller transform remains on outer.

- [ ] **Step 5: Verify structure in the harness**

```bash
yarn typecheck
yarn prepare
yarn workspace @unif/react-native-design-website typecheck
```

Harness cases:

- Reveal inside a flex row keeps flex/layout and finishes at caller opacity `0.35`;
- reduced Reveal has no two-RAF delay;
- Spinner outer has caller `scale/translate`, width/height larger than ring, and ring still rotates centered;
- caller `alignItems` cannot displace the inner ring.

- [ ] **Step 6: Update docs and commit**

```bash
git add src/components/ui/Reveal src/components/ui/Spinner website/docs/components/reveal.mdx website/docs/components/loading.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "fix: preserve platform animation containers"
```

---

### Task 5: Rebuild Thumbnail with a stable layout/visual/ring structure

**Files:**

- Create: `src/components/ui/Thumbnail/normalize.ts`
- Create: `__tests__/components/ui/Thumbnail/normalize.test.ts`
- Modify: `src/components/ui/Thumbnail/types.ts`
- Modify: `src/components/ui/Thumbnail/Thumbnail.tsx`
- Modify: `src/components/ui/Thumbnail/styles.ts`
- Modify: `src/components/ui/Thumbnail/index.ts`
- Modify: `type-tests/public-api.tsx`
- Modify: `website/docs/components/thumbnail.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `isValidImageSource`, `A11Y_HIDDEN_PROPS`.
- Produces:
  - strict `{ uri; source?: never } | { source; uri?: never }`
  - `ThumbnailImageStyle`
  - `sanitizeThumbnailImageStyle(style): { style; diagnostics }`.

- [ ] **Step 1: Add style sanitizer tests**

```ts
const result = sanitizeThumbnailImageStyle({
  opacity: 0.5,
  tintColor: 'red',
  position: 'absolute',
  width: 999,
  height: 999,
  top: 1,
});
expect(result.style).toEqual({ opacity: 0.5, tintColor: 'red' });
expect(result.diagnostics).toEqual(['position', 'width', 'height', 'top']);
```

Test all reserved geometry keys, array/registered flattened styles and non-mutation.

- [ ] **Step 2: Add type fixtures**

```tsx
<Thumbnail
  uri="https://x/a.png"
  containerStyle={{ marginLeft: 8 }}
  imageStyle={{ opacity: 0.5 }}
/>;
<Thumbnail source={logoSource} />;
// @ts-expect-error exactly one source
<Thumbnail />;
// @ts-expect-error uri/source mutually exclusive
<Thumbnail uri="a" source={logoSource} />;
// @ts-expect-error old style alias removed
<Thumbnail uri="a" style={{ opacity: 0.5 }} />;
// @ts-expect-error imageStyle cannot change geometry
<Thumbnail uri="a" imageStyle={{ width: 999 }} />;
```

- [ ] **Step 3: Run failures**

```bash
yarn test __tests__/components/ui/Thumbnail/normalize.test.ts
yarn typecheck
```

- [ ] **Step 4: Define the new public type**

```ts
export type ThumbnailImageStyle = Omit<
  ImageStyle,
  | 'position'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'minHeight'
  | 'maxWidth'
  | 'maxHeight'
>;

type ThumbnailSource =
  | { uri: string; source?: never }
  | { source: ImageSourcePropType; uri?: never };

export type ThumbnailProps = ThumbnailSource & {
  size?: ThumbnailSize;
  selected?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ThumbnailImageStyle>;
  resizeMode?: ImageResizeMode;
  accessibilityLabel?: string;
  testID?: string;
};
```

- [ ] **Step 5: Render the stable structure**

Normalize `uri` into `{ uri: uri.trim() }`, validate source, and log invalid input in a dev effect. Invalid input still renders:

```tsx
<View style={containerStyle} testID={testID}>
  <View
    style={[
      styles.visualFrame,
      {
        width: dim.width,
        height: dim.height,
        borderRadius: dim.borderRadius,
      },
    ]}
  >
    {validSource ? (
      <Image
        source={validSource}
        style={[sanitizedImageStyle, StyleSheet.absoluteFillObject]}
        resizeMode={resizeMode}
        accessibilityLabel={accessibilityLabel}
      />
    ) : null}
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        styles.ring,
        {
          borderRadius: dim.borderRadius,
          borderWidth: 2,
          borderColor: selected ? colors.primary : 'transparent',
        },
      ]}
      {...A11Y_HIDDEN_PROPS}
    />
  </View>
</View>
```

The visual frame supplies placeholder background and `overflow: 'hidden'`. Ring always exists with literal `borderWidth: 2` and no padding; do not call `r(2)` or `scaleFontMetric`. Delete `RING_EXTRA_RADIUS`.

- [ ] **Step 6: Verify, document, and commit**

```bash
yarn test __tests__/components/ui/Thumbnail/normalize.test.ts __tests__/utils/imageSource.test.ts
yarn typecheck
yarn prepare
yarn lint src/components/ui/Thumbnail __tests__/components/ui/Thumbnail type-tests/public-api.tsx
```

Harness measures identical outer/inner sizes before/after selected, invalid placeholder stability, caller outer transform and image opacity.

```bash
git add src/components/ui/Thumbnail __tests__/components/ui/Thumbnail type-tests/public-api.tsx website/docs/components/thumbnail.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "feat: stabilize thumbnail layout semantics"
```

---

### Task 6: Sanitize every SVG ID input

**Files:**

- Modify: `src/components/business/useSvgId.ts`
- Create: `__tests__/components/business/useSvgId.test.ts`
- Modify: `website/docs/components/decorations.mdx`
- Modify: `website/docs/components/avatar-with-ring.mdx`
- Modify: `website/docs/UNIF-DESIGN.md`

**Interfaces:**

- Consumes: React 19 `useId()`.
- Produces:
  - test seam `sanitizeSvgIdPart(value: string): string`
  - test seam `buildSvgId(prefix: string, override: string | undefined, reactId: string): string`
  - unchanged public `useSvgId(prefix, override?): string`.

- [ ] **Step 1: Add failing sanitizer tests**

```ts
test.each([
  ['a:b c', 'a-b-c'],
  ['..a__b--', 'a__b'],
  ['___', '___'],
  [':::', ''],
])('sanitize %p', (input, expected) => {
  expect(sanitizeSvgIdPart(input)).toBe(expected);
});

expect(buildSvgId('9 grad', undefined, ':r0:')).toBe('svg-id-9-grad-r0');
expect(buildSvgId('grad', ':::', ':r1:')).toBe('grad-r1');
expect(buildSvgId(':::', undefined, ':::')).toBe('svg-id');
expect(buildSvgId('grad', 'custom:id', ':r2:')).toBe('custom-id');
```

- [ ] **Step 2: Run and confirm failure**

```bash
yarn test __tests__/components/business/useSvgId.test.ts
```

- [ ] **Step 3: Implement the exact builder**

```ts
export function sanitizeSvgIdPart(value: string): string {
  return value
    .replace(/[^A-Za-z0-9_.-]+/gu, '-')
    .replace(/^[.-]+|[.-]+$/gu, '');
}

export function buildSvgId(
  prefix: string,
  override: string | undefined,
  reactId: string
): string {
  const cleanOverride =
    override === undefined ? '' : sanitizeSvgIdPart(override);
  const cleanPrefix = sanitizeSvgIdPart(prefix);
  const cleanReactId = sanitizeSvgIdPart(reactId);
  const automatic =
    [cleanPrefix, cleanReactId].filter(Boolean).join('-') ||
    ['svg-id', cleanReactId].filter(Boolean).join('-') ||
    'svg-id';
  const candidate = cleanOverride || automatic;
  return /^[A-Za-z_]/u.test(candidate) ? candidate : `svg-id-${candidate}`;
}

export function useSvgId(prefix: string, override?: string): string {
  const reactId = useId();
  return buildSvgId(prefix, override, reactId);
}
```

`useId()` is unconditional. Only `useSvgId` remains in the business/root barrel.

- [ ] **Step 4: Verify, document, and commit**

```bash
yarn test __tests__/components/business/useSvgId.test.ts
yarn typecheck
yarn prepare
rg -n "buildSvgId|sanitizeSvgIdPart" lib/typescript/src/index.d.ts
```

Expected: tests/build pass; helper names are absent from public root declaration.

```bash
git add src/components/business/useSvgId.ts __tests__/components/business/useSvgId.test.ts website/docs/components/decorations.mdx website/docs/components/avatar-with-ring.mdx website/docs/UNIF-DESIGN.md
git diff --cached --name-only
git commit -m "fix: sanitize svg identifiers"
```

---

### Task 7: Make Icon generation full-tag, allowlist-only, and reproducible

**Files:**

- Modify: `scripts/build-icons.js`
- Modify: `scripts/build-icons.d.ts`
- Modify: `__tests__/scripts/build-icons.test.ts`
- Create: `scripts/check-icons-generated.js`
- Modify: `package.json`
- Modify: `src/icons/svg/stop.svg`
- Regenerate only if bytes actually differ: `src/icons/data.ts`
- Modify: `website/docs/components/icons.mdx`

**Interfaces:**

- Consumes: SVG files and Prettier.
- Produces:
  - `cleanSvgSource(src): string`
  - `scanSvgDocument(cleanSrc, name): ScannedSvg`
  - strict `collectSvgIssues(cleanSrc, name): SvgIssue[]`
  - `runBuild(names, sources)` that parses only cleaned sources
  - root `yarn check:icons`.

- [ ] **Step 1: Expand failing validator fixtures**

Add a canonical valid root:

```ts
const SVG = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
```

Add table tests for:

- missing/non-positive root stroke-width;
- incorrect root fill/stroke/cap/join;
- empty path `d`;
- missing/non-positive rect width/height and negative rx;
- missing/non-positive circle radius;
- opacity outside `[0,1]`;
- hard-coded fill/stroke;
- every disallowed root/shape attribute;
- `symbol`, `title`, a never-before-blacklisted tag, multiple roots, mismatched/unclosed tags and nested shapes;
- a comment containing a valid path that must not be parsed/generated.

Example:

```ts
test('comment shape is ignored by both validation and generation', () => {
  const source = SVG('<!-- <path d="M0 0"></path> --><path d="M2 2"></path>');
  const result = runBuild(['one'], [source]);
  expect(result.errors).toEqual([]);
  expect(result.dataTs).toContain('M2 2');
  expect(result.dataTs).not.toContain('M0 0');
});
```

- [ ] **Step 2: Run the suite and observe failures**

```bash
yarn test __tests__/scripts/build-icons.test.ts
```

- [ ] **Step 3: Implement comment cleaning and a stack scanner**

```js
const cleanSvgSource = (src) => src.replace(/<!--[\s\S]*?-->/gu, '');
const TAG_RE = /<\/?([A-Za-z][A-Za-z0-9:._-]*)(?:\s[^<>]*?)?\/?>/gu;
```

Walk all tags with a stack. Require one top-level `svg`; only `path`, `rect`, `circle` may be direct children; shapes must be leaves; closing names must match; no unclosed stack remains. Reject every other tag instead of maintaining a blacklist.

Parse attributes with a double-quoted attribute regex and reject any unconsumed non-whitespace tag text. Apply allowlists:

```js
const ALLOWED_ATTRIBUTES = {
  svg: new Set([
    'xmlns',
    'viewBox',
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
  ]),
  path: new Set(['d', 'fill', 'stroke', 'opacity']),
  rect: new Set([
    'x',
    'y',
    'width',
    'height',
    'rx',
    'fill',
    'stroke',
    'opacity',
  ]),
  circle: new Set(['cx', 'cy', 'r', 'fill', 'stroke', 'opacity']),
};
```

Use strict numeric syntax:

```js
const NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/u;
const parseFiniteNumber = (raw) =>
  typeof raw === 'string' && NUMBER.test(raw) && Number.isFinite(Number(raw))
    ? Number(raw)
    : undefined;
```

All validation errors include file, element and field. Allowed fill is absent/`none`/`currentColor`; allowed stroke is absent/`none`/`currentColor`. Root values are exact. Convert former warnings for dropped properties into errors.

- [ ] **Step 4: Guarantee parser/validator use one cleaned source**

`runBuild` must:

```js
const cleaned = sources.map(cleanSvgSource);
const scans = cleaned.map((src, index) =>
  scanSvgDocument(src, `${names[index]}.svg`)
);
const issues = scans.flatMap((scan) => collectSvgIssues(scan));
if (issues.some((issue) => issue.level === 'error')) {
  return { errors, warns: [] };
}
const icons = Object.fromEntries(
  names.map((name, index) => [name, parseScannedSvg(scans[index])])
);
```

No later call may read original `sources[index]`.

- [ ] **Step 5: Normalize `stop.svg` and regenerate**

Use:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none"></rect></svg>
```

Run:

```bash
node scripts/build-icons.js
```

Expected: all 118 sources pass. `src/icons/data.ts` should remain byte-equivalent for this normalization; if Prettier/parser output legitimately changes, inspect and commit the generated diff.

- [ ] **Step 6: Add non-mutating reproducibility checker**

`scripts/check-icons-generated.js` creates two owned temp directories, runs the real build script twice with `BUILD_ICONS_OUT`, then byte-compares temp A, temp B and committed `src/icons/data.ts`. On mismatch print SHA-256 for all three and exit nonzero. Cleanup both exact owned dirs in `finally`; never write the worktree.

Register:

```json
{
  "scripts": {
    "check:icons": "node scripts/check-icons-generated.js"
  }
}
```

- [ ] **Step 7: Verify, document, and commit**

```bash
yarn test __tests__/scripts/build-icons.test.ts
yarn check:icons
yarn typecheck
yarn prepare
```

Expected: all pass and a pre/post hash check shows committed `data.ts` unchanged by `check:icons`.

```bash
git add scripts/build-icons.js scripts/build-icons.d.ts scripts/check-icons-generated.js __tests__/scripts/build-icons.test.ts package.json src/icons/svg/stop.svg src/icons/data.ts website/docs/components/icons.mdx
git diff --cached --name-only
git commit -m "feat: enforce icon source integrity"
```

---

### Task 8: Make Website IconCatalog cover every generated icon

**Files:**

- Create: `website/src/components/iconCatalogCategories.ts`
- Create: `__tests__/website/iconCatalogCategories.test.ts`
- Modify: `website/src/components/IconCatalog.tsx`
- Modify: `website/src/components/iconsCatalog.ts`
- Modify: `website/docs/components/icons.mdx`

**Interfaces:**

- Consumes: generated `ICON_NAMES`, `ICONS`, `IconElement`.
- Produces:
  - `buildIconCategories(allNames, manualCategories): IconCategory[]`
  - import-time failure on duplicate or unknown category names
  - automatic final “未分类” category.

- [ ] **Step 1: Add pure category tests**

```ts
const all = ['a', 'b', 'c'] as const;

test('未手工分类的合法 icon 自动进入未分类', () => {
  expect(
    buildIconCategories(all, [
      { name: '手工', desc: 'Manual', items: ['a', 'b'] },
    ])
  ).toEqual([
    { name: '手工', desc: 'Manual', items: ['a', 'b'] },
    { name: '未分类', desc: 'Uncategorized', items: ['c'] },
  ]);
});

test('重复和未知名称都抛错', () => {
  expect(() =>
    buildIconCategories(all, [
      { name: '一', desc: 'One', items: ['a'] },
      { name: '二', desc: 'Two', items: ['a'] },
    ])
  ).toThrow(/重复.*a/u);
  expect(() =>
    buildIconCategories(all, [{ name: '一', desc: 'One', items: ['missing'] }])
  ).toThrow(/未知.*missing/u);
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
yarn test __tests__/website/iconCatalogCategories.test.ts
```

- [ ] **Step 3: Implement the fail-fast helper**

The helper accepts readonly strings so tests can provide unknown names. It builds an `allNames` Set, rejects unknowns, rejects any second occurrence, preserves manual category order, then appends sorted remaining names as “未分类” only when non-empty.

At module scope:

```ts
const CATEGORIES = buildIconCategories(ICON_NAMES, MANUAL_CATEGORIES);
```

Do not catch or downgrade its errors; SSR/build must fail.

- [ ] **Step 4: Align renderer and totals with source data**

`totalIcons = ICON_NAMES.length`; search iterates the complete computed categories.

For every SVG shape:

```tsx
const shapeProps = {
  fill: el.fill === 'currentColor' ? 'currentColor' : (el.fill ?? 'none'),
  opacity: el.opacity,
  stroke: el.stroke ?? 'currentColor',
};
```

Pass `shapeProps` to path/circle/rect. Delete `rect.ry`.

- [ ] **Step 5: Verify current catalog counts**

```bash
yarn test __tests__/website/iconCatalogCategories.test.ts
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
```

Expected baseline: `ICON_NAMES` 118, manual categories 102 unique names, computed “未分类” 16; if source count changed in Task 7, assertions derive from actual `ICON_NAMES` rather than hard-code a stale page total.

- [ ] **Step 6: Update docs and commit**

```bash
git add website/src/components/iconCatalogCategories.ts website/src/components/IconCatalog.tsx website/src/components/iconsCatalog.ts __tests__/website/iconCatalogCategories.test.ts website/docs/components/icons.mdx
git diff --cached --name-only
git commit -m "fix: render the complete icon catalog"
```

---

### Task 9: Audit the Theme/platform surface in the RN 0.86.2 harness

**Files:**

- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`
- Modify if the audit finds an omitted final behavior: `website/docs/design/tokens/typography.md`
- Modify if the audit finds an omitted final behavior: `website/docs/UNIF-DESIGN.md`
- Modify if the audit finds an omitted final behavior: `website/docs/troubleshooting.md`
- Modify if the audit finds an omitted final behavior: `website/docs/components/button.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/avatar.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/stepper.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/tag.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/avatar-with-ring.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/reveal.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/loading.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/thumbnail.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/decorations.mdx`
- Modify if the audit finds an omitted final behavior: `website/docs/components/icons.mdx`

**Interfaces:**

- Consumes: all interfaces in this plan and `yarn create:runtime-harness`.
- Produces: executable cases/evidence for final verification rows; no unexecuted PASS claims.

- [ ] **Step 1: Complete the screen cases**

Include controls for:

- valid/invalid/large fontScale and missing Provider fallback;
- every known dynamic text component beside a non-scaled Icon/layout ruler;
- image A₁→B→A₂→late error;
- Reveal flex/opacity/two-RAF/reduced;
- Spinner caller transform plus inner rotation;
- Thumbnail invalid source, outer sizing, inner clipping and selected ring;
- multiple Decorations/AvatarWithRing instances with dirty prefix/override SVG ids.

- [ ] **Step 2: Run static verification**

```bash
yarn test __tests__/theme/scale.test.ts __tests__/theme/themeContext.test.ts __tests__/theme/useThemedStyles.test.ts __tests__/utils/imageSource.test.ts __tests__/components/ui/Thumbnail/normalize.test.ts __tests__/components/business/useSvgId.test.ts __tests__/scripts/build-icons.test.ts __tests__/website/iconCatalogCategories.test.ts
yarn check:icons
yarn typecheck
yarn lint
yarn prepare
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
```

- [ ] **Step 3: Run native/Web cases**

Generate a fresh harness:

```bash
yarn create:runtime-harness
```

Run Android/iOS from its printed path, and Website from the repository:

```bash
yarn workspace @unif/react-native-design-website start
```

Capture actual evidence paths/URLs for the final verification document. A case that cannot be executed is recorded later as `BLOCKED`, never inferred as PASS.

- [ ] **Step 4: Commit only audit fixes**

```bash
git add manual-tests/runtime-api/RuntimeApiScreen.tsx website/docs/design/tokens/typography.md website/docs/UNIF-DESIGN.md website/docs/troubleshooting.md website/docs/components/button.mdx website/docs/components/avatar.mdx website/docs/components/stepper.mdx website/docs/components/tag.mdx website/docs/components/avatar-with-ring.mdx website/docs/components/reveal.mdx website/docs/components/loading.mdx website/docs/components/thumbnail.mdx website/docs/components/decorations.mdx website/docs/components/icons.mdx
git diff --cached --name-only
git commit -m "test: cover theme platform runtime contracts"
```

Skip an empty commit when the audit produces no file changes.

---

## Plan Verification Gate

- [ ] Run the full plan-local command set:

```bash
yarn test __tests__/theme/scale.test.ts __tests__/theme/themeContext.test.ts __tests__/theme/useThemedStyles.test.ts __tests__/utils/imageSource.test.ts __tests__/components/ui/Thumbnail/normalize.test.ts __tests__/components/business/useSvgId.test.ts __tests__/scripts/build-icons.test.ts __tests__/website/iconCatalogCategories.test.ts
yarn check:icons
yarn typecheck
yarn lint
yarn prepare
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
```

- [ ] Run public/private export scans:

```bash
rg -n "ThemeContext|buildSvgId|sanitizeSvgIdPart|imageSourceKey|ImageAttempt" lib/typescript/src/index.d.ts
```

Expected: no private helper export; `normalizeFontScale`, `scaleFontMetric`, `useFontScale` are present.

- [ ] Run typography and platform structure scans:

```bash
rg -n "fontSize|lineHeight|letterSpacing" src --glob "*.{ts,tsx}"
rg -n "<div|transition:" src/components/ui/Reveal src/components/ui/Spinner
rg -n "RING_EXTRA_RADIUS|statusColor|ThumbnailProps.*style" src
```

Expected: every typography match is classified, no Reveal div/shorthand, no old Thumbnail ring/style contract.

- [ ] Inspect `/Users/liulijun/tongyi/design/skills/skills/design/` and record affected theming/a11y/recipe/doctor guidance: fontScale helpers, missing Provider, image behavior, Reveal/Spinner/Thumbnail, SVG ID and icon workflow. Final sync remains incomplete until the fourth plan updates and validates that separate repository.

- [ ] Confirm commits exclude `AGENTS.md`, `CLAUDE.md`, `example/`, generated temp apps and external Skill files.
