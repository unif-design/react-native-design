# Input, Interaction, and Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用严格判别联合、单一值状态机、真实 44pt frame 和完整 accessible name 收紧所有输入与交互组件公共契约。

**Architecture:** TextField 家族共享纯值状态机、布局归一化、受控 slot renderer 和窄 `TextFieldHandle`；其他组件按“真实操作 / 纯展示 / 内嵌 control”分支建模，避免运行时猜测。纯行为下沉为 Jest 可测 helper，组件结构通过 TypeScript compile fixture、RN 0.86.2 runtime harness 和 Website build 验证。

**Tech Stack:** React Native 0.86.2、React 19.2.3、TypeScript 6 strict API、RNGH 3、Reanimated 4.5、Jest 30、Docusaurus/React Native Web

## Global Constraints

- 必须先完成 `2026-07-30-dependency-runtime-state.md`；本计划直接消费其 RN 0.86.2 基线、`usePrefersReducedMotion(): boolean` 和 runtime harness。
- 不保留 `inputProps`、`label`、`statusColor`、任意 `ReactNode` slot、原生 TextInput ref 或其他旧 alias；这是 breaking cleanup。
- `Input`、`Textarea`、`Search` 的 controlled/uncontrolled 模式首次 render 锁定；显式 `value={undefined}` 视为 uncontrolled。
- 固定命中目标使用 `fixed.hitTarget`，不经过 `r()` 或 fontScale；本轮确认的 TextField action slot、Switch、Stepper 必须拥有真实至少 44×44 的布局 frame。
- `aria-disabled`、`readOnly`、`role`、`enterKeyHint`、`clearTextOnFocus` 等高优先级/重复入口从 TextField 公共类型删除。
- disabled/loading/边界无 action 时必须同时移除 handler/action 并上报真实 accessibility state。
- 每个 breaking API 在同一任务中修复仓内调用点、Website MDX、compile-only fixture 和 manual screen，不把文档推迟到最终 Website 计划。
- Jest 只测试纯状态机/helper；不引入组件 snapshot 或 renderer。
- 实施前重新读取最终版 `AGENTS.md` / `CLAUDE.md`，但不得编辑、暂存或提交这两个并行会话文件。
- 每项公共契约记录 `/Users/liulijun/tongyi/design/skills/skills/design/` 影响；最终 Skill 更新和 doctor 由 Website/LLM/Docs 计划执行。

---

## File Structure

### Shared TextField core

- `src/components/ui/TextField/types.ts`：公开 `TextFieldHandle`、`TextFieldSlot`、`TextFieldContainerStyle` 和内部值联合。
- `src/components/ui/TextField/valueState.ts`：可测试的 immutable controlled/uncontrolled transition。
- `src/components/ui/TextField/useTextFieldValue.ts`：React hook 包装纯 transition 和诊断。
- `src/components/ui/TextField/normalize.ts`：height/min/max/icon size 和 container style 的纯归一化。
- `src/components/ui/TextField/TextFieldSlot.tsx`：唯一 display/action slot renderer。
- `src/components/ui/TextField/useErrorAnnouncement.ts`：iOS mount 后 error change announce。
- `src/components/ui/TextField/TextFieldBase.tsx`：内部组合器；不进入公共 barrel。

### Component-local pure seams

- `src/components/ui/Cell/content.ts`：primitive 文本和 actionable label 组合。
- `src/components/ui/Stepper/normalizeStepper.ts`：范围、按钮、accessibility actions。
- `src/components/ui/Carousel/behavior.ts`：reduced autoplay 和 Pagination 条件。
- `src/components/ui/Grid/accessibility.ts`：badge-aware 默认名称。
- `src/components/business/VersionPill/content.ts`：状态默认值、可见文案和组合名称。
- `src/components/ui/shared/a11y.ts`：Logo、Drawer avatar、Carousel Pagination、display slot 共用的跨平台隐藏 props。

### Verification seams

- `type-tests/public-api.tsx`：由根 `tsc` 执行的合法/非法调用 fixture。
- `manual-tests/runtime-api/RuntimeApiScreen.tsx`：在上一计划基础上增加输入、44pt、a11y 和 reduced-motion case。
- `__tests__/components/ui/**`：只测试上述纯 helper。

---

### Task 1: Build the shared TextField value and layout state machines

**Files:**

- Create: `src/components/ui/TextField/valueState.ts`
- Create: `src/components/ui/TextField/useTextFieldValue.ts`
- Create: `src/components/ui/TextField/normalize.ts`
- Create: `__tests__/components/ui/TextField/valueState.test.ts`
- Create: `__tests__/components/ui/TextField/normalize.test.ts`
- Modify: `src/components/ui/TextField/types.ts`

**Interfaces:**

- Consumes: React state/ref and `createLogger(scope)`.
- Produces:
  - `TextFieldValueProps = ControlledTextValueProps | UncontrolledTextValueProps`
  - `ValueState { mode; value; lastValidControlledValue }`
  - `createValueState(value, defaultValue): ValueState`
  - `reconcileValueState(state, incomingValue): ValueTransition`
  - `applyTextChange(state, text): ValueState`
  - `useTextFieldValue(props, scope): TextFieldValueController`
  - `normalizeInputHeight`, `normalizeTextareaHeights`, `normalizeSlotIconSize`, `sanitizeTextFieldContainerStyle`.

- [ ] **Step 1: Add failing state-machine tests**

```ts
test('controlled 丢失 value 时保留最后合法字符串且不切 mode', () => {
  const initial = createValueState('A', undefined);
  const lost = reconcileValueState(initial, undefined);
  expect(lost).toMatchObject({
    value: 'A',
    diagnostic: 'controlled-to-uncontrolled',
    state: { mode: 'controlled', lastValidControlledValue: 'A' },
  });
  const restored = reconcileValueState(lost.state, 'B');
  expect(restored.value).toBe('B');
});

test('uncontrolled 忽略后续 value/defaultValue，只接受用户输入', () => {
  const initial = createValueState(undefined, 'seed');
  const injected = reconcileValueState(initial, 'controlled later');
  expect(injected.value).toBe('seed');
  expect(injected.diagnostic).toBe('uncontrolled-to-controlled');
  expect(applyTextChange(injected.state, 'typed').value).toBe('typed');
});
```

Add cases for initial explicit `undefined`, controlled missing callback diagnostic, empty string, and defaultValue changing after mount.

- [ ] **Step 2: Add failing layout tests**

```ts
expect(normalizeInputHeight(36)).toEqual({
  value: 44,
  diagnostics: ['height'],
});
expect(normalizeTextareaHeights(120, 100)).toEqual({
  minHeight: 120,
  maxHeight: undefined,
  diagnostics: ['maxHeight'],
});
expect(normalizeSlotIconSize(33)).toEqual({
  value: 18,
  diagnostics: ['slot.size'],
});
```

Test `NaN`, infinities, negative values, valid `44`, valid Textarea max, and a registered/wide style containing every reserved key.

- [ ] **Step 3: Run focused tests**

```bash
yarn test __tests__/components/ui/TextField/valueState.test.ts __tests__/components/ui/TextField/normalize.test.ts
```

Expected: FAIL because the new modules are absent.

- [ ] **Step 4: Define the strict types**

In `TextField/types.ts`:

```ts
export type ControlledTextValueProps = {
  value: string;
  onChangeText: (value: string) => void;
  defaultValue?: never;
};

export type UncontrolledTextValueProps = {
  value?: never;
  defaultValue?: string;
  onChangeText?: (value: string) => void;
};

export type TextFieldValueProps =
  | ControlledTextValueProps
  | UncontrolledTextValueProps;

export type TextFieldHandle = {
  focus: () => void;
  blur: () => void;
};

export type TextFieldSlot =
  | { kind: 'icon'; icon: IconName; size?: number; color?: string }
  | { kind: 'text'; value: string | number }
  | {
      kind: 'action';
      icon: IconName;
      onPress: () => void;
      accessibilityLabel: string;
      disabled?: boolean;
    };

export type TextFieldContainerStyle = Omit<
  ViewStyle,
  'height' | 'minHeight' | 'maxHeight' | 'minWidth' | 'maxWidth' | 'overflow'
>;
```

`TextFieldValueProps` remains internal; the other three types are exported by Input/Textarea/UI/root barrels.

- [ ] **Step 5: Implement immutable value transitions and the hook**

Use this pure result:

```ts
export type ValueState =
  | {
      mode: 'controlled';
      value: string;
      lastValidControlledValue: string;
    }
  | {
      mode: 'uncontrolled';
      value: string;
      lastValidControlledValue?: never;
    };

export type ValueTransition = {
  state: ValueState;
  value: string;
  diagnostic?: 'controlled-to-uncontrolled' | 'uncontrolled-to-controlled';
};

export type TextFieldValueController = {
  mode: ValueState['mode'];
  value: string;
  canUpdate: boolean;
  onChangeText: (value: string) => void;
};
```

`createValueState()` accepts `value: string | undefined` and chooses controlled exactly when `value !== undefined`; explicit `undefined` therefore initializes uncontrolled from `defaultValue ?? ''`. Do not use `'value' in props` or `typeof value === 'string'` as the mode predicate. `reconcileValueState()` never changes `mode`; controlled accepts the next string or retains `lastValidControlledValue`, uncontrolled ignores incoming strings. `applyTextChange()` mutates only the uncontrolled value.

`useTextFieldValue()` keeps the `ValueState` in a ref plus a render tick for uncontrolled writes. It returns exactly the controller shape above: uncontrolled mode always has `canUpdate: true`; controlled mode has `canUpdate: typeof onChangeText === 'function'`. It calls caller `onChangeText` after updating uncontrolled state; controlled never writes internal value. If a controlled non-type-safe call has no callback, `onChangeText` no-ops and reports through a module-level logger in an effect, never during render.

- [ ] **Step 6: Implement layout/style normalization**

Rules:

```ts
const isFiniteAtLeast = (value: unknown, min: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min;

export const normalizeInputHeight = (value: unknown) =>
  isFiniteAtLeast(value, 44)
    ? { value, diagnostics: [] }
    : { value: 44, diagnostics: ['height'] };
```

Textarea defaults to 96; `maxHeight` becomes `undefined` unless finite and `>= normalized min`. Slot icon size accepts only finite `[1,32]`, otherwise 18.

`sanitizeTextFieldContainerStyle` uses `StyleSheet.flatten`, destructures the six reserved fields away, returns the remaining style plus a diagnostic field list. It must not mutate caller/registered styles.

- [ ] **Step 7: Pass focused checks and commit**

```bash
yarn test __tests__/components/ui/TextField/valueState.test.ts __tests__/components/ui/TextField/normalize.test.ts
yarn typecheck
yarn lint src/components/ui/TextField __tests__/components/ui/TextField
git add src/components/ui/TextField/types.ts src/components/ui/TextField/valueState.ts src/components/ui/TextField/useTextFieldValue.ts src/components/ui/TextField/normalize.ts __tests__/components/ui/TextField
git diff --cached --name-only
git commit -m "feat: add strict text field state primitives"
```

---

### Task 2: Rebuild TextFieldBase, Input, and Textarea on the shared core

**Files:**

- Create: `src/components/ui/shared/a11y.ts`
- Create: `src/components/ui/TextField/TextFieldSlot.tsx`
- Create: `src/components/ui/TextField/useErrorAnnouncement.ts`
- Modify: `src/components/ui/TextField/TextFieldBase.tsx`
- Modify: `src/components/ui/TextField/styles.ts`
- Modify: `src/components/ui/Input/types.ts`
- Modify: `src/components/ui/Input/Input.tsx`
- Modify: `src/components/ui/Input/index.ts`
- Modify: `src/components/ui/Textarea/types.ts`
- Modify: `src/components/ui/Textarea/Textarea.tsx`
- Modify: `src/components/ui/Textarea/index.ts`
- Modify: `src/components/ui/index.ts`
- Create: `type-tests/public-api.tsx`
- Modify: `website/docs/components/text-field.mdx`
- Modify: `website/docs/components/input.mdx`
- Modify: `website/docs/components/textarea.mdx`
- Modify: `website/docs/components/form.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: Task 1 value/layout functions and `fixed.hitTarget`.
- Produces: strict `InputProps`, strict `TextareaProps`, public `TextFieldHandle`, `TextFieldSlot`, `TextFieldContainerStyle`, shared `A11Y_HIDDEN_PROPS`, and internal action slot frame.

- [ ] **Step 1: Add compile-only failures before changing the component types**

Create `type-tests/public-api.tsx` and include:

```tsx
import { createRef } from 'react';
import { Pressable } from 'react-native';
import { Input, Textarea, type TextFieldHandle } from '../src';

const setText = (_value: string) => {};
const inputRef = createRef<TextFieldHandle>();

<Input value="ok" onChangeText={setText} />;
<Input defaultValue="seed" />;
<Textarea value="ok" onChangeText={setText} />;

// @ts-expect-error controlled Input 必须有更新入口
<Input value="locked" />;
// @ts-expect-error value/defaultValue 互斥
<Input value="x" defaultValue="y" onChangeText={setText} />;
// @ts-expect-error readOnly 已删除，使用 editable={false}
<Input readOnly />;
// @ts-expect-error 原生 clear 不能从公开 handle 取得
inputRef.current?.clear();
// @ts-expect-error 任意 ReactElement 不再是 slot
<Input trailing={<Pressable />} />;
// @ts-expect-error containerStyle 不能改最小 frame
<Input containerStyle={{ height: 20 }} />;
```

At each later task, extend this import list only when that task adds its first fixture; `noUnusedLocals`/`noUnusedParameters` stay enabled throughout. Do not pre-import future components or add ambient `declare` values merely to silence the compiler.

- [ ] **Step 2: Run root typecheck and confirm expected-error directives are unused**

```bash
yarn typecheck
```

Expected: FAIL with unused `@ts-expect-error` directives because old types still permit those calls.

- [ ] **Step 3: Implement the shared slot renderer**

Create the shared hidden contract first:

```ts
export const A11Y_HIDDEN_PROPS = {
  'accessible': false,
  'accessibilityElementsHidden': true,
  'importantForAccessibility': 'no-hide-descendants',
  'aria-hidden': true,
} as const;
```

Apply it only to local RN `View`/`Image` nodes, never unknown third-party components.

`TextFieldSlot` accepts `{ slot, effectiveEditable, testID }`. Display branches use local View/Text/Icon plus `A11Y_HIDDEN_PROPS`; action branch renders a 44×44 RNGH `Pressable`:

```tsx
const actionDisabled = !effectiveEditable || slot.disabled === true;
return (
  <Pressable
    onPress={actionDisabled ? undefined : slot.onPress}
    disabled={actionDisabled}
    accessibilityRole="button"
    accessibilityLabel={slot.accessibilityLabel}
    accessibilityState={{ disabled: actionDisabled }}
    style={styles.actionFrame}
    testID={testID}
  >
    <Icon name={slot.icon} size={18} color={colors.foregroundMuted} />
  </Pressable>
);
```

Normalize `icon.size` with Task 1 helper; diagnostic logging occurs in an effect. Display nodes cannot contain nested actions and are hidden from the accessibility tree.

- [ ] **Step 4: Implement the narrow ref, precedence, and stable value**

`TextFieldBase` uses an internal `TextInput` ref and exposes only:

```ts
useImperativeHandle(
  forwardedRef,
  () => ({
    focus: () => nativeRef.current?.focus(),
    blur: () => nativeRef.current?.blur(),
  }),
  []
);
```

Resolve:

```ts
const controller = useTextFieldValue(
  { value, defaultValue, onChangeText },
  scope
);
const effectiveEditable = disabled !== true && editable !== false;
const mergedAccessibilityState = {
  ...accessibilityState,
  disabled: !effectiveEditable,
};
```

Before spreading, destructure every owned prop and removed native alias out of the runtime object so untyped JavaScript cannot bypass the public precedence rules:

```ts
const {
  value,
  defaultValue,
  onChangeText,
  disabled,
  editable,
  accessibilityState,
  placeholderTextColor: callerPlaceholder,
  ['aria-disabled']: _ariaDisabled,
  readOnly: _readOnly,
  role: _role,
  enterKeyHint: _enterKeyHint,
  clearTextOnFocus: _clearTextOnFocus,
  ...allowedNativeProps
} = props as TextFieldBaseProps & Record<string, unknown>;
void [_ariaDisabled, _readOnly, _role, _enterKeyHint, _clearTextOnFocus];
```

Destructure all other TextField-owned layout/slot/error props in the same statement. Spread `allowedNativeProps` first, then force `value={controller.value}`, `onChangeText={controller.onChangeText}`, `editable={effectiveEditable}`, `accessibilityRole`, `accessibilityState={mergedAccessibilityState}`, and `placeholderTextColor={callerPlaceholder ?? colors.foregroundSubtle}`. Never pass `defaultValue` or any removed alias to native.

Root style order is sanitized caller style, disabled opacity, then internal `{ minWidth: 44, minHeight: normalizedHeight }`; caller width may expand it. Input uses normalized height. Textarea uses normalized min/max and top-aligned text.

- [ ] **Step 5: Implement iOS error announcement**

`useErrorAnnouncement(error)` tracks first commit. On iOS, schedule `AccessibilityInfo.announceForAccessibility(error)` only when a mounted component transitions empty→non-empty or changes between non-empty strings. Use an effect-local zero-delay timer so rapid changes/unmount can cancel stale announcements:

```ts
const previousError = useRef('');
const didCommit = useRef(false);

useEffect(() => {
  const nextError = error ?? '';
  const previous = previousError.current;
  previousError.current = nextError;

  if (!didCommit.current) {
    didCommit.current = true;
    return undefined;
  }
  if (Platform.OS !== 'ios' || nextError === '' || nextError === previous) {
    return undefined;
  }

  const timer = setTimeout(() => {
    AccessibilityInfo.announceForAccessibility(nextError);
  }, 0);
  return () => clearTimeout(timer);
}, [error]);
```

Android continues to put `accessibilityLiveRegion="polite"` on visible error text. Empty errors do not announce.

- [ ] **Step 6: Define Input/Textarea types from one native prop base**

Use this omit set in both:

```ts
type RemovedTextInputProps =
  | 'style'
  | 'multiline'
  | 'numberOfLines'
  | 'value'
  | 'defaultValue'
  | 'onChangeText'
  | 'aria-disabled'
  | 'readOnly'
  | 'role'
  | 'enterKeyHint'
  | 'clearTextOnFocus';
```

`InputProps` is `Omit<TextInputProps, RemovedTextInputProps> & common props & TextFieldValueProps`; Textarea is the same with `minHeight`/`maxHeight`. Both forward `TextFieldHandle`. Export `TextFieldHandle`, `TextFieldSlot`, and `TextFieldContainerStyle` through both component barrels, `src/components/ui/index.ts`, and therefore `src/index.tsx`.

- [ ] **Step 7: Run type, pure and build checks**

```bash
yarn test __tests__/components/ui/TextField/valueState.test.ts __tests__/components/ui/TextField/normalize.test.ts
yarn typecheck
yarn prepare
yarn lint src/components/ui/TextField src/components/ui/Input src/components/ui/Textarea type-tests/public-api.tsx
```

Expected: all pass; generated root declarations expose only `focus`/`blur`.

- [ ] **Step 8: Update docs and harness cases**

Document strict modes, one-time defaultValue, mode lock, placeholder precedence, removed aliases, effective editable, error announcements, slot union, height validation, reserved container style and narrow handle. Update Form examples to use valid controlled/uncontrolled calls.

Add runtime cases for uncontrolled initialization, controlled editing, mode-switch diagnostic, disabled slot, 44×44 action frame, invalid heights, placeholder override and iOS error change.

- [ ] **Step 9: Commit**

```bash
git add src/components/ui/shared/a11y.ts src/components/ui/TextField src/components/ui/Input src/components/ui/Textarea src/components/ui/index.ts type-tests/public-api.tsx website/docs/components/text-field.mdx website/docs/components/input.mdx website/docs/components/textarea.mdx website/docs/components/form.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "feat: enforce strict text field contracts"
```

---

### Task 3: Make Search and PasswordInput single-source controlled components

**Files:**

- Modify: `src/components/ui/Search/types.ts`
- Modify: `src/components/ui/Search/Search.tsx`
- Modify: `src/components/ui/Search/index.ts`
- Modify: `src/components/ui/PasswordInput/types.ts`
- Modify: `src/components/ui/PasswordInput/PasswordInput.tsx`
- Modify: `src/components/ui/PasswordInput/styles.ts`
- Modify: `src/components/ui/PasswordInput/index.ts`
- Modify: `type-tests/public-api.tsx`
- Modify: `website/docs/components/search.mdx`
- Modify: `website/docs/components/password-input.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `InputProps`, `TextFieldHandle`, `TextFieldSlot`, `useTextFieldValue`.
- Produces: exact `SearchProps` controlled/uncontrolled union and exact controlled `PasswordInputProps`.

- [ ] **Step 1: Add failing type fixtures**

Extend the root import with `Search` and `PasswordInput`, then add:

```tsx
<Search defaultValue="seed" onSubmit={setText} />;
<Search value="query" onChangeText={setText} />;
// @ts-expect-error controlled Search 必须有 updater
<Search value="query" />;
// @ts-expect-error Search owns leading slot
<Search leading={{ kind: 'icon', icon: 'search' }} />;
// @ts-expect-error Search 不公开原生 clearButtonMode
<Search clearButtonMode="always" />;

<PasswordInput
  value="secret"
  onChangeText={setText}
  autoComplete="current-password"
/>;
// @ts-expect-error 删除嵌套 inputProps
<PasswordInput
  value="secret"
  onChangeText={setText}
  inputProps={{ maxLength: 20 }}
/>;
// @ts-expect-error 密码输入不接收 defaultValue
<PasswordInput value="secret" onChangeText={setText} defaultValue="x" />;
```

- [ ] **Step 2: Run typecheck and observe unused directives**

```bash
yarn typecheck
```

Expected: FAIL because the old public types remain permissive.

- [ ] **Step 3: Define and implement Search**

Use the exact design union:

```ts
type SearchBaseProps = Omit<
  InputProps,
  | 'value'
  | 'defaultValue'
  | 'onChangeText'
  | 'leading'
  | 'trailing'
  | 'height'
  | 'returnKeyType'
  | 'accessibilityRole'
  | 'role'
  | 'onSubmitEditing'
  | 'clearButtonMode'
  | 'enterKeyHint'
> & {
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  onSubmit?: (value: string) => void;
};

export type SearchProps = SearchBaseProps &
  (
    | {
        value: string;
        onChangeText: (value: string) => void;
        defaultValue?: never;
      }
    | {
        value?: never;
        defaultValue?: string;
        onChangeText?: (value: string) => void;
      }
  );
```

At the Search level call `useTextFieldValue`; pass `controller.value` as controlled input to internal `TextFieldBase`. Render the clear action only when value is non-empty, effective editable is true, and `controller.canUpdate` is true. Clear calls `controller.onChangeText('')`. Native `onSubmitEditing(event)` runs first, then `onSubmit(controller.value)`.

Use the shared slot primitive and a 44pt interaction frame while keeping the visible Search surface 36pt centered inside the component’s minimum 44pt root.

- [ ] **Step 4: Define and implement PasswordInput**

```ts
export type PasswordInputProps = Omit<
  InputProps,
  | 'value'
  | 'defaultValue'
  | 'onChangeText'
  | 'secureTextEntry'
  | 'leading'
  | 'trailing'
> & {
  value: string;
  onChangeText: (value: string) => void;
};
```

All native options are top-level. Apply password defaults with `caller ?? default`, then force `secureTextEntry={!showPassword}`. Use the shared action slot. If `disabled === true || editable === false`, its handler is absent and state disabled is true. Toggling visibility changes only `secureTextEntry`.

- [ ] **Step 5: Verify**

```bash
yarn typecheck
yarn prepare
yarn lint src/components/ui/Search src/components/ui/PasswordInput type-tests/public-api.tsx
```

Expected: pass; generated Search/Password refs resolve to `TextFieldHandle`.

- [ ] **Step 6: Update docs and harness**

Search docs must state mode lock, `controller.value` as the single current value, clear order, native callback before convenience callback, owned props and narrow ref. Password docs must show top-level autofill/maxLength props and no `inputProps`. Add Search clear/submit and disabled password-toggle cases to the manual screen.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Search src/components/ui/PasswordInput type-tests/public-api.tsx website/docs/components/search.mdx website/docs/components/password-input.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "feat: tighten search and password input state"
```

---

### Task 4: Require real Button actions and strict NavBar action objects

**Files:**

- Modify: `src/components/ui/Button/types.ts`
- Modify: `src/components/ui/Button/ButtonBase.tsx`
- Modify: `src/components/ui/Button/Button.tsx`
- Modify: `src/components/ui/IconButton/types.ts`
- Modify: `src/components/ui/IconButton/IconButton.tsx`
- Modify: `src/components/ui/NavBar/types.ts`
- Modify: `src/components/ui/NavBar/isSlot.ts`
- Modify: `src/components/ui/NavBar/NavBar.tsx`
- Modify: `src/components/ui/NavBar/index.ts`
- Modify: `src/components/ui/Confirm/ConfirmHost.tsx`
- Modify: `src/components/ui/index.ts`
- Modify: `type-tests/public-api.tsx`
- Modify: `website/docs/components/button.mdx`
- Modify: `website/docs/components/icon-button.mdx`
- Modify: `website/docs/components/navbar.mdx`
- Modify: `website/docs/components/confirm.mdx`
- Modify: `website/docs/components/toast.mdx`
- Modify: `website/src/pages/index.tsx`

**Interfaces:**

- Consumes: existing Button sizing/palette and Confirm row styles.
- Produces:
  - required `ButtonProps.onPress` and `IconButtonProps.onPress`
  - `accessibilityState?: Omit<AccessibilityState, 'disabled' | 'busy'>`
  - `NavBarAction { icon; onPress; accessibilityLabel }`
  - `NavBarSlot = NavBarAction | ReactNode`.

- [ ] **Step 1: Add failing type fixtures**

Extend the root import with `Button`, `IconButton`, and `NavBar`; extend the React Native import with `Text`; add `const noop = () => {};`, which remains the concrete callback for later fixtures.

```tsx
// @ts-expect-error Button is always an action
<Button label="保存" />;
// @ts-expect-error IconButton is always an action
<IconButton icon="close" accessibilityLabel="关闭" />;
// @ts-expect-error NavBar action object requires handler and name
<NavBar title="标题" left={{ icon: 'arrow-left' }} />;

<NavBar
  title="标题"
  left={{ icon: 'arrow-left', onPress: noop, accessibilityLabel: '返回' }}
/>;
<NavBar title="标题" right={<Text>只读</Text>} />;
```

- [ ] **Step 2: Run typecheck and confirm failure**

```bash
yarn typecheck
```

Expected: unused expected-error directives.

- [ ] **Step 3: Tighten ButtonBase state and layout**

Make all three `onPress` types required. Add:

```ts
accessibilityState?: Omit<AccessibilityState, 'disabled' | 'busy'>;
```

Then use:

```tsx
const unavailable = disabled === true || loading === true;
<Pressable
  onPress={unavailable ? undefined : onPress}
  disabled={unavailable}
  accessibilityState={{
    ...accessibilityState,
    disabled: unavailable,
    busy: loading === true,
  }}
/>;
```

`block` sets only `alignSelf: 'stretch'`; remove its `flexGrow`. Icon sizes remain derived from the unscaled base size; the later Theme plan scales only text.

Change Confirm buttons from `block` to `style={{ flex: 1 }}` so the action row owns main-axis sizing.

- [ ] **Step 4: Replace NavBar fallback config**

```ts
export type NavBarAction = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
};
export type NavBarSlot = NavBarAction | ReactNode;
```

`isSlot.ts` exports `isNavBarAction` and checks all three fields. `NavBar.tsx` renders valid action objects with `IconButton`; React nodes render directly. For a non-type-safe plain object that is neither a React element nor a valid action, log once with `createLogger('NavBar')` and render `null`; do not invent an icon-name label or no-op handler.

Export `NavBarAction` and `NavBarSlot`; remove `NavBarSlotConfig`.

- [ ] **Step 5: Fix every in-repo callsite**

Use:

```bash
rg -n "<(Button|IconButton)\\b|left=\\{\\{|right=\\{\\{" src website --glob "*.{ts,tsx,mdx}"
```

Every Button/IconButton example gets a real handler such as `onPress={() => setCount((value) => value + 1)}` inside LiveDemo state, never an empty optional omission. Update the homepage’s displayed ThemeProvider/Button sample to show current valid APIs.

- [ ] **Step 6: Verify**

```bash
yarn typecheck
yarn workspace @unif/react-native-design-website typecheck
yarn prepare
yarn lint src/components/ui/Button src/components/ui/IconButton src/components/ui/NavBar src/components/ui/Confirm website/src/pages/index.tsx type-tests/public-api.tsx
```

Expected: pass; no optional Button handler or `NavBarSlotConfig` remains.

- [ ] **Step 7: Update docs and commit**

Document required handlers, loading busy+disabled, handler removal and cross-axis-only `block`. Document strict NavBar action vs display node.

```bash
git add src/components/ui/Button src/components/ui/IconButton src/components/ui/NavBar src/components/ui/Confirm/ConfirmHost.tsx src/components/ui/index.ts type-tests/public-api.tsx website/docs/components/button.mdx website/docs/components/icon-button.mdx website/docs/components/navbar.mdx website/docs/components/confirm.mdx website/docs/components/toast.mdx website/src/pages/index.tsx
git diff --cached --name-only
git commit -m "feat: require explicit button actions"
```

---

### Task 5: Enforce accessible names and real Switch frames

**Files:**

- Modify: `src/components/ui/Checkbox/types.ts`
- Modify: `src/components/ui/Checkbox/Checkbox.tsx`
- Modify: `src/components/ui/Radio/types.ts`
- Modify: `src/components/ui/Radio/Radio.tsx`
- Modify: `src/components/ui/Radio/RadioGroup.tsx`
- Modify: `src/components/ui/Switch/types.ts`
- Modify: `src/components/ui/Switch/Switch.tsx`
- Modify: `src/components/ui/Switch/Switch.web.tsx`
- Modify: `src/components/ui/Switch/styles.ts`
- Modify: `type-tests/public-api.tsx`
- Modify: `website/docs/components/checkbox.mdx`
- Modify: `website/docs/components/radio.mdx`
- Modify: `website/docs/components/switch.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `fixed.hitTarget`, `usePrefersReducedMotion`, and Task 2 `A11Y_HIDDEN_PROPS`.
- Produces:
  - named Checkbox/Radio unions
  - required `Radio.Group.accessibilityLabel`
  - required `Switch.accessibilityLabel`
  - hidden display descendants that reuse the shared contract.

- [ ] **Step 1: Add type fixtures**

Extend the root import with `Checkbox`, `Radio`, and `Switch`.

```tsx
<Checkbox checked={false} onChange={noop} label="同意协议" />;
<Checkbox checked={false} onChange={noop} accessibilityLabel="同意协议" />;
// @ts-expect-error 无可见 label 时 accessible name 必填
<Checkbox checked={false} onChange={noop} />;

<Radio.Group value="a" onChange={noop} accessibilityLabel="套餐">
  <Radio value="a" label="A" />
</Radio.Group>;
// @ts-expect-error radiogroup 自身必须命名
<Radio.Group value="a" onChange={noop}>
  <Radio value="a" label="A" />
</Radio.Group>;
// @ts-expect-error Switch 没有内置可见 label
<Switch value={false} onChange={noop} />;
```

- [ ] **Step 2: Run typecheck and observe failure**

```bash
yarn typecheck
```

Expected: old optional-name APIs make expected-error directives unused.

- [ ] **Step 3: Define the named unions**

```ts
type AccessibleName =
  | { label: string; accessibilityLabel?: string }
  | { label?: never; accessibilityLabel: string };

export type CheckboxProps = CheckboxBehaviorProps & AccessibleName;
export type RadioProps = RadioBehaviorProps & AccessibleName;
export type GroupProps = {
  value: Value;
  onChange: (value: Value) => void;
  accessibilityLabel: string;
  children: ReactNode;
  testID?: string;
};
export type SwitchProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
  testID?: string;
};
```

Every disabled branch passes `onPress={undefined}` as well as `disabled`.

- [ ] **Step 4: Apply the shared hidden contract**

Reuse Task 2 `A11Y_HIDDEN_PROPS` for purely decorative/local display descendants. Do not duplicate the object and do not spread it onto unknown third-party components.

- [ ] **Step 5: Rebuild Switch interaction frames**

Both platforms render a transparent outer RNGH Pressable with:

```ts
{
  width: fixed.hitTarget,
  height: fixed.hitTarget,
  alignItems: 'center',
  justifyContent: 'center',
}
```

The existing visual 32×20 track remains centered. Remove `hitSlop`.

Native effect:

```ts
if (reducedMotion) {
  cancelAnimation(progress);
  progress.value = value ? 1 : 0;
} else {
  progress.value = withTiming(value ? 1 : 0, { duration: motion.base });
}
```

Web omits transition properties when reduced motion is true. Disabled Pressables have no handler.

- [ ] **Step 6: Verify and update docs/harness**

```bash
yarn typecheck
yarn prepare
yarn lint src/components/ui/Checkbox src/components/ui/Radio src/components/ui/Switch src/components/ui/shared/a11y.ts type-tests/public-api.tsx
```

Document name unions, group label, checked/disabled state and reduced motion. Add native/Web measurements showing the Switch Pressable is 44×44 while the visual track remains 32×20.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/Checkbox src/components/ui/Radio src/components/ui/Switch src/components/ui/shared/a11y.ts type-tests/public-api.tsx website/docs/components/checkbox.mdx website/docs/components/radio.mdx website/docs/components/switch.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "feat: enforce accessible selection controls"
```

---

### Task 6: Replace Cell runtime guessing with three explicit branches

**Files:**

- Create: `src/components/ui/Cell/content.ts`
- Create: `__tests__/components/ui/Cell/content.test.ts`
- Modify: `src/components/ui/Cell/types.ts`
- Modify: `src/components/ui/Cell/Cell.tsx`
- Modify: `src/components/ui/Cell/Leading.tsx`
- Modify: `src/components/ui/Cell/index.ts`
- Modify: `src/components/ui/index.ts`
- Modify: `type-tests/public-api.tsx`
- Modify: `website/docs/components/cell.mdx`
- Modify: `website/docs/components/form.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `A11Y_HIDDEN_PROPS`, `IconName`.
- Produces: public `CellTextValue`, `CellLeading`, `CellExtra`, and `CellProps` actionable/control/static union.

- [ ] **Step 1: Write pure content tests**

```ts
test('bigint/number 均转换为 Text 安全字符串', () => {
  expect(stringifyCellText(0)).toBe('0');
  expect(stringifyCellText(12n)).toBe('12');
});

test('默认 action label 按 title/desc/extra 顺序组合', () => {
  expect(
    buildCellAccessibilityLabel({
      title: '订单',
      desc: '待支付',
      extra: { kind: 'text', value: 0 },
    })
  ).toBe('订单，待支付，0');
});

test('actionable display 只有非空 accessibilityText 才进入组合名称', () => {
  expect(
    buildCellAccessibilityLabel({
      title: '设备',
      extra: { kind: 'display', node: fakeElement, accessibilityText: '在线' },
    })
  ).toBe('设备，在线');
});
```

- [ ] **Step 2: Add type fixtures**

Extend the root import with `Cell`.

```tsx
<Cell title="设置" onPress={noop} arrow />;
<Cell title="状态" extra={{ kind: 'text', value: 0 }} />;
const staticDisplayCellProps = {
  title: '设备',
  extra: {
    kind: 'display',
    node: <Text>在线</Text>,
    accessibilityText: '在线',
  },
} as const;
<Cell {...staticDisplayCellProps} onPress={noop} />;
// @ts-expect-error static display 是装饰内容，不能声明 accessibilityText
<Cell {...staticDisplayCellProps} />;
<Cell
  title="通知"
  extra={{
    kind: 'control',
    node: <Switch value={false} onChange={noop} accessibilityLabel="通知" />,
  }}
/>;
// @ts-expect-error control Cell 禁止外层 action
<Cell
  title="通知"
  onPress={noop}
  extra={{ kind: 'control', node: <Text /> }}
/>;
// @ts-expect-error static Cell 不能画 action arrow
<Cell title="只读" arrow />;
// @ts-expect-error title 不再接受任意 element
<Cell title={<Text>标题</Text>} />;
```

- [ ] **Step 3: Run failing tests/typecheck**

```bash
yarn test __tests__/components/ui/Cell/content.test.ts
yarn typecheck
```

Expected: missing helper plus unused expected-error failures.

- [ ] **Step 4: Define exact Cell unions**

```ts
export type CellTextValue = string | number | bigint;
export type CellLeading = IconName | { kind: 'display'; node: ReactElement };
export type CellExtra =
  | { kind: 'text'; value: CellTextValue }
  | {
      kind: 'display';
      node: ReactElement;
      accessibilityText?: string;
    }
  | { kind: 'control'; node: ReactElement };

type ActionableExtra = Exclude<CellExtra, { kind: 'control' }>;
type StaticExtra =
  | Extract<CellExtra, { kind: 'text' }>
  | {
      kind: 'display';
      node: ReactElement;
      accessibilityText?: never;
    };
type SharedCellProps = {
  title: CellTextValue;
  titleLines?: number;
  desc?: CellTextValue;
  leading?: CellLeading;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type ActionableCellProps = {
  onPress: () => void;
  extra?: ActionableExtra;
  arrow?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
};
type ControlCellProps = {
  extra: Extract<CellExtra, { kind: 'control' }>;
  onPress?: never;
  arrow?: never;
  disabled?: never;
  accessibilityLabel?: never;
  accessibilityHint?: never;
};
type StaticCellProps = {
  extra?: StaticExtra;
  onPress?: never;
  arrow?: never;
  disabled?: never;
  accessibilityLabel?: never;
  accessibilityHint?: never;
};
export type CellProps = SharedCellProps &
  (ActionableCellProps | ControlCellProps | StaticCellProps);
```

- [ ] **Step 5: Render branches without heuristics**

Always wrap title/desc/text-extra in library Text using `stringifyCellText`. Hide leading/display nodes with `A11Y_HIDDEN_PROPS`; only an actionable display extra may declare accessibility text, which contributes through the outer actionable label rather than becoming a second focus. Static display is always decorative (`accessibilityText?: never`); semantic static content uses `kind: 'text'`.

Render:

- actionable: outer RNGH Pressable with button semantics and derived/explicit label;
- control: plain View, no outer accessibility element, control node owns semantics;
- static: plain View with no outer merged a11y node; title/desc/text-extra remain natural visible Text, while display extra is decorative;
- arrow only inside actionable branch.

Delete `extraHasInteractiveNode` and `renderSlot` runtime type guessing.

- [ ] **Step 6: Verify, document, and commit**

```bash
yarn test __tests__/components/ui/Cell/content.test.ts
yarn typecheck
yarn prepare
yarn lint src/components/ui/Cell __tests__/components/ui/Cell type-tests/public-api.tsx
```

Update Cell/Form examples and API table, then:

```bash
git add src/components/ui/Cell src/components/ui/index.ts __tests__/components/ui/Cell type-tests/public-api.tsx website/docs/components/cell.mdx website/docs/components/form.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "feat: model cell content and actions explicitly"
```

---

### Task 7: Normalize Stepper actions and give every node a real 44pt frame

**Files:**

- Create: `src/components/ui/Stepper/normalizeStepper.ts`
- Create: `__tests__/components/ui/Stepper/normalizeStepper.test.ts`
- Modify: `src/components/ui/Stepper/types.ts`
- Modify: `src/components/ui/Stepper/Stepper.tsx`
- Modify: `src/components/ui/Stepper/styles.ts`
- Modify: `type-tests/public-api.tsx`
- Modify: `website/docs/components/stepper.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `fixed.hitTarget`.
- Produces:
  - required `StepperProps.accessibilityLabel: string`
  - `normalizeStepper(input): NormalizedStepper`
  - contextual increment/decrement action data.

- [ ] **Step 1: Add pure boundary tests**

```ts
test('min > max 折叠为零范围且不暴露 action', () => {
  expect(
    normalizeStepper({ value: 5, min: 10, max: 0, step: 1 })
  ).toMatchObject({
    safeMin: 10,
    safeMax: 10,
    safeValue: 10,
    rangeDisabled: true,
    accessibilityActions: [],
  });
});

test('到 min 只保留 increment，到 max 只保留 decrement', () => {
  expect(
    normalizeStepper({ value: 0, min: 0, max: 2, step: 1 }).accessibilityActions
  ).toEqual([{ name: 'increment', label: '增加' }]);
  expect(
    normalizeStepper({ value: 2, min: 0, max: 2, step: 1 }).accessibilityActions
  ).toEqual([{ name: 'decrement', label: '减少' }]);
});
```

Cover `NaN`, infinities, invalid step and external disabled.

- [ ] **Step 2: Add the type failure**

Extend the root import with `Stepper`.

```tsx
// @ts-expect-error adjustable 必须有上下文名称
<Stepper value={1} onChange={noop} />;
<Stepper value={1} onChange={noop} accessibilityLabel="商品数量" />;
```

- [ ] **Step 3: Run and confirm failures**

```bash
yarn test __tests__/components/ui/Stepper/normalizeStepper.test.ts
yarn typecheck
```

- [ ] **Step 4: Implement normalization**

Return:

```ts
export type NormalizedStepper = {
  safeMin: number;
  safeMax: number;
  safeStep: number;
  safeValue: number;
  rangeDisabled: boolean;
  canDecrement: boolean;
  canIncrement: boolean;
  accessibilityActions: Array<{
    name: 'increment' | 'decrement';
    label: '增加' | '减少';
  }>;
};
```

Safe min defaults 0; safe max defaults/collapses to safe min when invalid or lower; safe step defaults 1; NaN value uses min and infinities clamp. `rangeDisabled = disabled || safeMin === safeMax`.

- [ ] **Step 5: Rebuild the three frames**

Each left/right Pressable is exactly `fixed.hitTarget × fixed.hitTarget`, with the existing `dims.btn × dims.h` visual cell nested and edge-aligned toward the center. The central adjustable View has `minWidth/minHeight: fixed.hitTarget`; its nested visual value cell retains the current `dims.w × dims.h`.

Labels are:

```ts
`${accessibilityLabel}，减少``${accessibilityLabel}，增加`;
```

When `rangeDisabled`, omit both `accessibilityActions` and `onAccessibilityAction`. At a boundary expose only the valid action. Invalid side buttons pass no handler.

- [ ] **Step 6: Verify, document, and commit**

```bash
yarn test __tests__/components/ui/Stepper/normalizeStepper.test.ts
yarn typecheck
yarn prepare
yarn lint src/components/ui/Stepper __tests__/components/ui/Stepper type-tests/public-api.tsx
```

Update the API table and add measured 44pt/zero-range cases to the harness.

```bash
git add src/components/ui/Stepper __tests__/components/ui/Stepper type-tests/public-api.tsx website/docs/components/stepper.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "feat: align stepper actions and hit targets"
```

---

### Task 8: Separate Carousel display slides from actions

**Files:**

- Create: `src/components/ui/Carousel/behavior.ts`
- Create: `__tests__/components/ui/Carousel/behavior.test.ts`
- Modify: `src/components/ui/Carousel/types.ts`
- Modify: `src/components/ui/Carousel/Carousel.tsx`
- Modify: `src/components/ui/Carousel/styles.ts`
- Modify: `type-tests/public-api.tsx`
- Modify: `website/docs/components/carousel.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `usePrefersReducedMotion`, `A11Y_HIDDEN_PROPS`.
- Produces: strict actionable/display `CarouselProps<T>`, `effectiveCarouselAutoplay`, `shouldRenderCarouselPagination`.

- [ ] **Step 1: Add pure behavior tests**

```ts
expect(effectiveCarouselAutoplay(true, false)).toBe(true);
expect(effectiveCarouselAutoplay(true, true)).toBe(false);
expect(shouldRenderCarouselPagination(true, 1)).toBe(false);
expect(shouldRenderCarouselPagination(true, 2)).toBe(true);
```

- [ ] **Step 2: Add type fixtures**

Extend the root import with `Carousel` and `type CarouselProps`, then create concrete generic fixtures:

```tsx
type CarouselItem = { id: string; label: string };
const items: CarouselItem[] = [{ id: 'one', label: '第一项' }];
const renderItem: CarouselProps<CarouselItem>['renderItem'] = ({ item }) => (
  <Text>{item.label}</Text>
);
```

Add the calls:

```tsx
<Carousel data={items} renderItem={renderItem} height={120} />;
<Carousel
  data={items}
  renderItem={renderItem}
  height={120}
  onPressItem={noop}
  getAccessibilityLabel={(item) => item.label}
/>;
// @ts-expect-error actionable slide 必须有业务名称
<Carousel
  data={items}
  renderItem={renderItem}
  height={120}
  onPressItem={noop}
/>;
// @ts-expect-error display slide 不能单独提供 action label resolver
<Carousel
  data={items}
  renderItem={renderItem}
  height={120}
  getAccessibilityLabel={() => 'x'}
/>;
```

- [ ] **Step 3: Run failures**

```bash
yarn test __tests__/components/ui/Carousel/behavior.test.ts
yarn typecheck
```

- [ ] **Step 4: Define the union and conditional renderer**

```ts
type CarouselAction<T> = {
  onPressItem: (item: T, index: number) => void;
  getAccessibilityLabel: (item: T, index: number) => string;
};
type CarouselDisplay = {
  onPressItem?: never;
  getAccessibilityLabel?: never;
};
export type CarouselProps<T> = CarouselBaseProps<T> &
  (CarouselAction<T> | CarouselDisplay);
```

If actionable, render RN core `Pressable` with button role and `${businessLabel}，第 ${index + 1} 项，共 ${data.length} 项`; if display, render a plain RN View. RN Pressable remains the deliberate gesture-conflict exception inside the third-party carousel.

Compute `effectiveAutoplay = autoplay === true && !reducedMotion`. Render Pagination only for `showIndicator && data.length > 1`; only then reserve bottom height. Wrap third-party Pagination in a local View carrying `A11Y_HIDDEN_PROPS`; do not pass those props to Pagination.

- [ ] **Step 5: Verify, document, and commit**

```bash
yarn test __tests__/components/ui/Carousel/behavior.test.ts
yarn typecheck
yarn prepare
yarn lint src/components/ui/Carousel __tests__/components/ui/Carousel type-tests/public-api.tsx
```

Document display/action branches, caller pause responsibility, reduced-motion autoplay and single-page layout. Add display/action/single-page/reduced cases to the harness.

```bash
git add src/components/ui/Carousel __tests__/components/ui/Carousel type-tests/public-api.tsx website/docs/components/carousel.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "feat: separate carousel display and action semantics"
```

---

### Task 9: Finish display semantics for Logo, Grid, DrawerHeader, and VersionPill

**Files:**

- Create: `src/components/ui/Grid/accessibility.ts`
- Create: `__tests__/components/ui/Grid/accessibility.test.ts`
- Create: `src/components/business/VersionPill/content.ts`
- Create: `__tests__/components/business/VersionPill/content.test.ts`
- Modify: `src/components/ui/Logo/types.ts`
- Modify: `src/components/ui/Logo/Logo.tsx`
- Modify: `src/components/ui/Grid/types.ts`
- Modify: `src/components/ui/Grid/Grid.tsx`
- Modify: `src/components/ui/DrawerHeader/DrawerHeader.tsx`
- Modify: `src/components/business/VersionPill/types.ts`
- Modify: `src/components/business/VersionPill/VersionPill.tsx`
- Modify: `src/components/business/VersionPill/styles.ts`
- Modify: `src/components/business/VersionPill/index.ts`
- Modify: `src/components/business/index.ts`
- Modify: `src/components/ui/index.ts`
- Modify: `type-tests/public-api.tsx`
- Modify: `website/docs/components/logo.mdx`
- Modify: `website/docs/components/grid.mdx`
- Modify: `website/docs/components/version-pill.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `A11Y_HIDDEN_PROPS`; image retry identity is implemented later by Theme plan.
- Produces:
  - `LogoProps.accessibilityLabel?: string`
  - `GridItem.accessibilityLabel?: string`
  - public `VersionStatus { label: string; color?: string }`.

- [ ] **Step 1: Add pure name/status tests**

```ts
test('Grid 默认 label 保留 badge 0', () => {
  expect(gridItemAccessibilityLabel({ label: '消息', badge: 0 })).toBe(
    '消息，0'
  );
});

test('Version status 默认正常，caller 无 color 使用中性色', () => {
  expect(resolveVersionStatus(undefined, colors)).toEqual({
    label: '正常',
    color: colors.success,
  });
  expect(resolveVersionStatus({ label: '测试中' }, colors)).toEqual({
    label: '测试中',
    color: colors.foregroundMuted,
  });
});

test('组合名称含 version/build/status', () => {
  expect(
    buildVersionPillLabel({
      version: '2.0.0',
      build: '12',
      statusLabel: '测试中',
      versionPrefix: '版本 ',
      buildPrefix: 'build ',
    })
  ).toBe('版本 2.0.0，build 12，测试中');
});
```

- [ ] **Step 2: Add breaking type fixtures**

Extend the root import with `Logo` and `VersionPill`, then add `const logoSource = { uri: 'https://example.test/logo.png' } as const;`.

```tsx
<Logo source={logoSource} accessibilityLabel="Unif" />;
<Logo source={logoSource} />;
// @ts-expect-error label alias removed
<Logo source={logoSource} label="Unif" />;
<VersionPill version="1.0.0" status={{ label: '测试中' }} />;
// @ts-expect-error color-only status removed
<VersionPill version="1.0.0" statusColor="red" />;
```

- [ ] **Step 3: Run failures**

```bash
yarn test __tests__/components/ui/Grid/accessibility.test.ts __tests__/components/business/VersionPill/content.test.ts
yarn typecheck
```

- [ ] **Step 4: Implement Logo and Drawer hidden behavior**

Trim Logo’s `accessibilityLabel`. A non-empty value sets `accessible`, role `image`, and that label. Missing/blank uses `A11Y_HIDDEN_PROPS`; blank logs once in a dev effect and still behaves as decoration. Remove `label` entirely.

Put `A11Y_HIDDEN_PROPS` on DrawerHeader’s entire avatar container so both Image and fallback initial are decorative beside the visible name/subtitle.

- [ ] **Step 5: Implement Grid naming**

`gridItemAccessibilityLabel(item)` returns explicit non-empty override, otherwise `label` plus badge whenever `badge != null`, including 0. Hide the badge visual subtree so it does not create duplicate focus. Action semantics remain conditional on Grid-level `onPress`.

- [ ] **Step 6: Implement visible VersionStatus**

```ts
export type VersionStatus = {
  label: string;
  color?: string;
};
```

Default is `{ label: '正常', color: colors.success }`. A caller-provided status without color uses `colors.foregroundMuted`. Render the label visibly beside the dot, hide individual children, and make the outer accessible label include version, optional build and status. Export `VersionStatus` from component, business and root barrels.

- [ ] **Step 7: Verify, update docs/harness, and commit**

```bash
yarn test __tests__/components/ui/Grid/accessibility.test.ts __tests__/components/business/VersionPill/content.test.ts
yarn typecheck
yarn prepare
yarn lint src/components/ui/Logo src/components/ui/Grid src/components/ui/DrawerHeader src/components/business/VersionPill __tests__/components/ui/Grid __tests__/components/business/VersionPill type-tests/public-api.tsx
```

Update docs and add decorated/named Logo, badge 0, hidden Drawer avatar and visible VersionPill status cases.

```bash
git add src/components/ui/Logo src/components/ui/Grid src/components/ui/DrawerHeader src/components/business/VersionPill src/components/business/index.ts src/components/ui/index.ts __tests__/components/ui/Grid __tests__/components/business/VersionPill type-tests/public-api.tsx website/docs/components/logo.mdx website/docs/components/grid.mdx website/docs/components/version-pill.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "feat: make display status semantics explicit"
```

---

### Task 10: Audit every callsite and freeze the public type surface

**Files:**

- Modify: `type-tests/public-api.tsx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`
- Modify if the final scan finds a stale callsite: `website/docs/components/text-field.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/input.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/textarea.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/form.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/search.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/password-input.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/button.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/icon-button.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/navbar.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/confirm.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/toast.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/checkbox.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/radio.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/switch.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/cell.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/stepper.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/carousel.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/logo.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/grid.mdx`
- Modify if the final scan finds a stale callsite: `website/docs/components/version-pill.mdx`
- Modify: `website/src/pages/index.tsx` only when the final scan finds stale displayed code

**Interfaces:**

- Consumes: every public type produced by Tasks 2–9.
- Produces: one compile fixture proving all legal/illegal combinations and one manual screen covering this plan’s native/Web structural cases.

- [ ] **Step 1: Complete the positive and negative compile matrix**

Ensure `type-tests/public-api.tsx` contains at least one valid and one `@ts-expect-error` call for:

- Input/Textarea/Search controlled vs uncontrolled;
- removed TextInput aliases and reserved container style;
- `TextFieldHandle.clear()` rejection;
- PasswordInput top-level props;
- Button/IconButton required handlers;
- NavBar action/display;
- Checkbox/Radio/Switch names;
- Cell three branches;
- Stepper name;
- Carousel action/display;
- Logo and VersionPill renamed props.

Use real concrete values and callbacks; no empty declarations whose type cannot exercise JSX overloads.

- [ ] **Step 2: Run stale-callsite scans**

```bash
rg -n "inputProps=|statusColor=|<Logo[^>]*\\blabel=|NavBarSlotConfig|ref\\.current\\?\\.(clear|setNativeProps)|clearButtonMode=|readOnly=|<Button(?![^>]*onPress)|<IconButton(?![^>]*onPress)" src website type-tests --pcre2
```

Expected: no matches except explanatory prose explicitly showing removed APIs inside fenced migration examples.

- [ ] **Step 3: Compile every consumer surface**

```bash
yarn typecheck
yarn prepare
yarn workspace @unif/react-native-design-website typecheck
node website/scripts/build-llms.test.js
```

Expected: all pass. Do not update generated LLM bundle in this plan; the final Website plan performs transactional generation after all four plans’ docs are final.

- [ ] **Step 4: Generate and run the RN 0.86.2 harness**

```bash
yarn create:runtime-harness
```

Inside the printed path:

```bash
yarn android
yarn ios
```

Exercise every Input plan row. Capture screenshots/video/log paths for the final verification matrix, but do not yet create rows marked PASS without a real device/simulator result.

- [ ] **Step 5: Commit only actual audit fixes**

If Step 2 or 3 required edits:

```bash
git add type-tests/public-api.tsx manual-tests/runtime-api/RuntimeApiScreen.tsx website/docs/components/text-field.mdx website/docs/components/input.mdx website/docs/components/textarea.mdx website/docs/components/form.mdx website/docs/components/search.mdx website/docs/components/password-input.mdx website/docs/components/button.mdx website/docs/components/icon-button.mdx website/docs/components/navbar.mdx website/docs/components/confirm.mdx website/docs/components/toast.mdx website/docs/components/checkbox.mdx website/docs/components/radio.mdx website/docs/components/switch.mdx website/docs/components/cell.mdx website/docs/components/stepper.mdx website/docs/components/carousel.mdx website/docs/components/logo.mdx website/docs/components/grid.mdx website/docs/components/version-pill.mdx website/src/pages/index.tsx
git diff --cached --name-only
git commit -m "test: cover strict interaction api contracts"
```

If no files changed, do not create an empty commit.

---

## Plan Verification Gate

- [ ] Run:

```bash
yarn test __tests__/components/ui/TextField/valueState.test.ts __tests__/components/ui/TextField/normalize.test.ts __tests__/components/ui/Cell/content.test.ts __tests__/components/ui/Stepper/normalizeStepper.test.ts __tests__/components/ui/Carousel/behavior.test.ts __tests__/components/ui/Grid/accessibility.test.ts __tests__/components/business/VersionPill/content.test.ts
yarn typecheck
yarn lint
yarn prepare
yarn workspace @unif/react-native-design-website typecheck
```

- [ ] Confirm removed API names do not leak from declarations:

```bash
rg -n "NavBarSlotConfig|statusColor|inputProps|TextInputRef|clearButtonMode|readOnly" lib/typescript/src/index.d.ts lib/typescript/src/components
```

Expected: no removed public contract matches.

- [ ] Inspect `/Users/liulijun/tongyi/design/skills/skills/design/` and record affected manual guidance: strict TextField modes/handle, explicit Button actions, accessible-name requirements, Cell branches, Stepper/Carousel behavior, Logo/Grid/VersionPill names. Do not use a completed Skill-sync status before the final plan runs that repository’s checks.

- [ ] Verify commit scope:

```bash
git status --short
git log --oneline --max-count=10
```

Expected: `AGENTS.md`, `CLAUDE.md`, `example/` and the external Skill repository never appear in this plan’s staged paths.
