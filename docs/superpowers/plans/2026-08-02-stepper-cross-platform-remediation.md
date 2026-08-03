# Stepper Cross-Platform Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 Stepper 在 Web 中央 slider、iOS adjustable 边界和宽屏 native frame 上的真实契约缺口，并为默认值、layout 与平台 a11y 建立 pure 自动化门禁。

**Architecture:** 公共 `Stepper.tsx` 只持有 raw props、单一 normalized state、frame 结构与 visual；默认值和 next-value 逻辑由 pure normalizer 统一，frame 由 pure layout resolver 统一。native/Web 差异通过同名 platform 文件下沉：native 保留 RNGH + RN accessibility actions，Web 使用 RN core Pressable + 显式 ARIA/键盘 driver。

**Tech Stack:** React Native 0.86.2、React 19.2.3、TypeScript 6 strict API、react-native-gesture-handler 3.x、react-native-web 0.21.2、Jest 30 node environment、Docusaurus Website。

## Global Constraints

- 设计权威是 `docs/superpowers/specs/2026-08-02-stepper-cross-platform-remediation-design.md`；它覆盖旧 Task 7 中“side outer 精确 44×44”和“iOS 边界隐藏无效标准方向”的不可实现字面要求。
- 不提供向后兼容：`StepperProps.accessibilityLabel: string` 继续必填，不增加 optional/no-op 分支。
- 默认值保持 `min=0`、`max=99`、`step=1`，但只能由 pure normalizer 定义一次。
- visual 保持 `r(28)` / `r(32)` / `r(40)` / `r(48)`；outer 必须至少 `fixed.hitTarget=44` 且不得小于 visual。
- 不使用 `hitSlop`、padding、overflow visual 或 visual cap 伪造真实 frame。
- native side 使用 RNGH Pressable；Web side 使用 RN core Pressable；中央 platform driver 只能消费 `NormalizedStepper`。
- iOS/Android 无效标准 adjustable 方向允许进入 JS，但必须在 `onChange` 前 capability-guarded no-op；不得再声称平台隐藏了该标准方向。
- 新 Jest 只覆盖 pure normalizer/layout/platform helper，不使用 renderer 或 snapshot。
- 只用 yarn；不修改 `example/`、`AGENTS.md`、`CLAUDE.md` 或 sibling Design Skill。
- 每个任务都核对 Website、llms 和 `/Users/liulijun/tongyi/design/skills/skills/design/`；sibling Skill 只记录最终同步目标，不在本计划越界修改。
- 自动化结果不能替代 RN 0.86.2 Inspector、VoiceOver/TalkBack、浏览器 Inspector/screen reader 的最终 verification matrix。

## File Responsibility Map

- `src/components/ui/Stepper/normalizeStepper.ts`：raw defaults、数值归一化、capability 和 next-value 的唯一 pure 入口。
- `src/components/ui/Stepper/layout.ts`：visual dims → 三个真实 outer frame 和 side alignment 的 pure resolver。
- `src/components/ui/Stepper/accessibility.types.ts`：native/Web value-node driver 的共享内部类型。
- `src/components/ui/Stepper/accessibility.ts`：native RN accessibility value/actions/handler。
- `src/components/ui/Stepper/accessibility.web.ts`：Web ARIA、tab order、Arrow/Home/End 键盘行为。
- `src/components/ui/Stepper/StepperPressable.tsx`：native RNGH Pressable。
- `src/components/ui/Stepper/StepperPressable.web.tsx`：Web RN core Pressable。
- `src/components/ui/Stepper/Stepper.tsx`：公共结构，只组合 normalized/layout/platform seam。
- `src/components/ui/Stepper/styles.ts`：不含动态尺寸的 themed chrome。
- `__tests__/components/ui/Stepper/*.test.ts`：pure defaults、next-value、layout 和平台 driver 门禁。

---

### Task 1: Make defaults and outer frames single-source

**Files:**

- Modify: `src/components/ui/Stepper/normalizeStepper.ts`
- Create: `src/components/ui/Stepper/layout.ts`
- Modify: `src/components/ui/Stepper/Stepper.tsx`
- Modify: `src/components/ui/Stepper/styles.ts`
- Modify: `__tests__/components/ui/Stepper/normalizeStepper.test.ts`
- Create: `__tests__/components/ui/Stepper/layout.test.ts`
- Modify: `docs/superpowers/specs/2026-07-30-input-interaction-a11y-design.md`
- Modify: `docs/superpowers/plans/2026-07-30-input-interaction-a11y.md`
- Modify: `website/docs/components/stepper.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`

**Interfaces:**

- Consumes: `fixed.hitTarget`, existing `sizingFor(size)`, raw optional `min/max/step`.
- Produces:
  - `normalizeStepper({ value, min?, max?, step?, disabled? }): NormalizedStepper`
  - `nextStepperValue(normalized, direction): number | undefined`
  - `resolveStepperLayout({ h, btn, w }): ResolvedStepperLayout`

- [ ] **Step 1: Replace the fake default test with the real raw default entry**

Change the existing test that manually passes `0/99/1`:

```ts
test('缺省入口只由 normalizer 定义 0–99 / step 1', () => {
  expect(normalizeStepper({ value: 42 })).toEqual({
    safeMin: 0,
    safeMax: 99,
    safeStep: 1,
    safeValue: 42,
    rangeDisabled: false,
    canDecrement: true,
    canIncrement: true,
    accessibilityActions: [
      { name: 'increment', label: '增加' },
      { name: 'decrement', label: '减少' },
    ],
  });
});
```

Add next-value cases:

```ts
test('nextStepperValue 只返回 capability 允许的新值', () => {
  const atMin = normalizeStepper({ value: 0, min: 0, max: 2, step: 1 });
  expect(nextStepperValue(atMin, 'decrement')).toBeUndefined();
  expect(nextStepperValue(atMin, 'increment')).toBe(1);

  const wideStep = normalizeStepper({ value: 1, min: 0, max: 2, step: 8 });
  expect(nextStepperValue(wideStep, 'increment')).toBe(2);
});
```

- [ ] **Step 2: Add failing layout resolver tests**

Create `__tests__/components/ui/Stepper/layout.test.ts`:

```ts
import { describe, expect, test } from '@jest/globals';
import { resolveStepperLayout } from '../../../../src/components/ui/Stepper/layout';

describe('resolveStepperLayout', () => {
  test('narrow visual 使用真实 44pt outer', () => {
    expect(resolveStepperLayout({ h: 28, btn: 28, w: 40 })).toEqual({
      decrementFrame: { width: 44, height: 44, alignItems: 'flex-end' },
      valueFrame: { width: 44, height: 44 },
      incrementFrame: { width: 44, height: 44, alignItems: 'flex-start' },
    });
  });

  test('402pt md 保留 48pt value visual 且 side 至少 44pt', () => {
    expect(resolveStepperLayout({ h: 32, btn: 32, w: 48 })).toEqual({
      decrementFrame: { width: 44, height: 44, alignItems: 'flex-end' },
      valueFrame: { width: 48, height: 44 },
      incrementFrame: { width: 44, height: 44, alignItems: 'flex-start' },
    });
  });

  test('wide native outer 随 visual 增长且无 padding/hitSlop', () => {
    const layout = resolveStepperLayout({ h: 61, btn: 61, w: 92 });
    expect(layout).toEqual({
      decrementFrame: { width: 61, height: 61, alignItems: 'flex-end' },
      valueFrame: { width: 92, height: 61 },
      incrementFrame: { width: 61, height: 61, alignItems: 'flex-start' },
    });
    expect(JSON.stringify(layout)).not.toMatch(/padding|hitSlop/);
  });
});
```

- [ ] **Step 3: Run the focused RED gates**

Run:

```bash
yarn test __tests__/components/ui/Stepper/normalizeStepper.test.ts __tests__/components/ui/Stepper/layout.test.ts --runInBand
yarn typecheck
```

Expected:

- Jest fails because `layout.ts` and `nextStepperValue` do not exist and the current default path collapses omitted `max` to zero range.
- Typecheck fails because the test imports missing interfaces and current `StepperNormalizationInput` requires `min/max/step`.

- [ ] **Step 4: Move raw defaults and next-value math into the normalizer**

Replace `normalizeStepper.ts` with:

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

type StepperNormalizationInput = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
};

export type StepperDirection = 'increment' | 'decrement';

export function normalizeStepper({
  value,
  min = 0,
  max = 99,
  step = 1,
  disabled = false,
}: StepperNormalizationInput): NormalizedStepper {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max >= safeMin ? max : safeMin;
  const safeStep = Number.isFinite(step) && step > 0 ? step : 1;
  const safeValue = Number.isNaN(value)
    ? safeMin
    : Math.min(safeMax, Math.max(safeMin, value));
  const rangeDisabled = disabled || safeMin === safeMax;
  const canDecrement = !rangeDisabled && safeValue > safeMin;
  const canIncrement = !rangeDisabled && safeValue < safeMax;
  const accessibilityActions: NormalizedStepper['accessibilityActions'] = [];

  if (canIncrement) {
    accessibilityActions.push({ name: 'increment', label: '增加' });
  }
  if (canDecrement) {
    accessibilityActions.push({ name: 'decrement', label: '减少' });
  }

  return {
    safeMin,
    safeMax,
    safeStep,
    safeValue,
    rangeDisabled,
    canDecrement,
    canIncrement,
    accessibilityActions,
  };
}

export function nextStepperValue(
  normalized: NormalizedStepper,
  direction: StepperDirection
): number | undefined {
  if (direction === 'increment') {
    return normalized.canIncrement
      ? Math.min(
          normalized.safeMax,
          normalized.safeValue + normalized.safeStep
        )
      : undefined;
  }
  return normalized.canDecrement
    ? Math.max(
        normalized.safeMin,
        normalized.safeValue - normalized.safeStep
      )
    : undefined;
}
```

`Stepper.tsx` must stop destructuring `min=0/max=99/step=1`; pass raw optional values to `normalizeStepper`. Warning conditions become:

```ts
if (step !== undefined && safeStep !== step) {
  const k = `step:${step}`;
  if (!_warned.has(k)) {
    _warned.add(k);
    log.warn(`step 必须是有限正数，传入 ${step}，已 fallback 为 ${safeStep}`);
  }
}
if (
  min !== undefined &&
  max !== undefined &&
  Number.isFinite(min) &&
  Number.isFinite(max) &&
  min > max
) {
  const k = `minmax:${min}:${max}`;
  if (!_warned.has(k)) {
    _warned.add(k);
    log.warn(
      `min(${min}) 不能大于 max(${max})，已折叠为 ${safeMin} 的零范围`
    );
  }
}
```

- [ ] **Step 5: Implement the pure frame resolver**

Create `src/components/ui/Stepper/layout.ts`:

```ts
import { fixed } from '../../../theme';

export type ResolvedStepperLayout = {
  decrementFrame: {
    width: number;
    height: number;
    alignItems: 'flex-end';
  };
  valueFrame: { width: number; height: number };
  incrementFrame: {
    width: number;
    height: number;
    alignItems: 'flex-start';
  };
};

export function resolveStepperLayout({
  h,
  btn,
  w,
}: {
  h: number;
  btn: number;
  w: number;
}): ResolvedStepperLayout {
  const sideWidth = Math.max(fixed.hitTarget, btn);
  const outerHeight = Math.max(fixed.hitTarget, h);
  return {
    decrementFrame: {
      width: sideWidth,
      height: outerHeight,
      alignItems: 'flex-end',
    },
    valueFrame: {
      width: Math.max(fixed.hitTarget, w),
      height: outerHeight,
    },
    incrementFrame: {
      width: sideWidth,
      height: outerHeight,
      alignItems: 'flex-start',
    },
  };
}
```

- [ ] **Step 6: Wire the resolver into the existing structure**

In `Stepper.tsx`:

```ts
const layout = resolveStepperLayout(dims);
const decrementValue = nextStepperValue(normalized, 'decrement');
const incrementValue = nextStepperValue(normalized, 'increment');
```

Use `layout.decrementFrame`, `layout.valueFrame`, and
`layout.incrementFrame` on the three outer nodes. Side `onPress` is present only when its
next value is defined:

```tsx
<Pressable
  onPress={
    decrementValue === undefined ? undefined : () => onChange(decrementValue)
  }
  style={({ pressed }) => [
    styles.actionFrame,
    layout.decrementFrame,
    {
      opacity: !canDecrement ? 0.4 : pressed ? pressedOpacity : 1,
    },
  ]}
>
  {/* Existing local visual View remains dims.btn × dims.h. */}
</Pressable>

<View style={[styles.valueFrame, layout.valueFrame]}>
  {/* Existing local visual View remains dims.w × dims.h. */}
</View>

<Pressable
  onPress={
    incrementValue === undefined ? undefined : () => onChange(incrementValue)
  }
  style={({ pressed }) => [
    styles.actionFrame,
    layout.incrementFrame,
    {
      opacity: !canIncrement ? 0.4 : pressed ? pressedOpacity : 1,
    },
  ]}
>
  {/* Existing local visual View remains dims.btn × dims.h. */}
</Pressable>
```

Remove fixed `width/height/minWidth/minHeight` and side alignment from themed styles.
The resulting frame styles are:

```ts
actionFrame: {
  justifyContent: 'center',
},
valueFrame: {
  alignItems: 'center',
  justifyContent: 'center',
},
```

Do not add padding, `hitSlop`, overflow or visual caps.

- [ ] **Step 7: Run focused GREEN and source verification**

Run:

```bash
yarn test __tests__/components/ui/Stepper/normalizeStepper.test.ts __tests__/components/ui/Stepper/layout.test.ts --runInBand
yarn typecheck
yarn lint src/components/ui/Stepper __tests__/components/ui/Stepper
rg -n "hitSlop|paddingVertical|width: fixed\\.hitTarget|height: fixed\\.hitTarget" src/components/ui/Stepper
```

Expected: focused tests and typecheck/lint pass; final `rg` finds no frame workaround.

- [ ] **Step 8: Correct the frame contract and measurement text**

Update the original input/a11y spec and Task 7 plan so that:

- every outer is **at least** `fixed.hitTarget`;
- side/value outer grow with unbounded visual;
- sm is `r(28)`, not a physical 28 constant;
- exact-44 expectations are limited to cases where the visual is `<=44`.

Update Website and manual wording with these exact formulas:

```text
side outer = max(44, visual button width) × max(44, visual height)
value outer = max(44, visual value width) × max(44, visual height)
sm visual = r(28)×r(28) / r(40)×r(28) / r(28)×r(28)
```

State that only Web / 402pt RN harness yields base 28/32/40/48 values. Do not claim
real Inspector PASS.

- [ ] **Step 9: Verify docs/build and commit Task 1**

Run:

```bash
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build:llms
NO_UPDATE_NOTIFIER=1 yarn workspace @unif/react-native-design-website build
yarn prepare
git diff --check
```

Inspect `website/static/md/components/stepper.md` and `website/build/llms-full.txt` for
`r(28)` and “至少 44pt”; confirm obsolete “sm 固定 28” / “side 精确 44” wording is gone.

Commit:

```bash
git add src/components/ui/Stepper __tests__/components/ui/Stepper docs/superpowers/specs/2026-07-30-input-interaction-a11y-design.md docs/superpowers/plans/2026-07-30-input-interaction-a11y.md website/docs/components/stepper.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "fix: keep stepper frames around scaled visuals"
```

---

### Task 2: Add native/Web accessibility drivers and close the Task 7 review

**Files:**

- Create: `src/components/ui/Stepper/accessibility.types.ts`
- Create: `src/components/ui/Stepper/accessibility.ts`
- Create: `src/components/ui/Stepper/accessibility.web.ts`
- Create: `src/components/ui/Stepper/StepperPressable.tsx`
- Create: `src/components/ui/Stepper/StepperPressable.web.tsx`
- Modify: `src/components/ui/Stepper/Stepper.tsx`
- Create: `__tests__/components/ui/Stepper/accessibility.test.ts`
- Create: `__tests__/components/ui/Stepper/accessibility.web.test.ts`
- Modify: `docs/superpowers/specs/2026-07-30-input-interaction-a11y-design.md`
- Modify: `docs/superpowers/plans/2026-07-30-input-interaction-a11y.md`
- Modify: `website/docs/components/stepper.mdx`
- Modify: `manual-tests/runtime-api/RuntimeApiScreen.tsx`
- Modify: `.superpowers/sdd/2026-07-30-input-interaction-a11y/task-7-report.md`
- Modify: `.superpowers/sdd/2026-07-30-input-interaction-a11y/progress.md`

**Interfaces:**

- Consumes: Task 1 `NormalizedStepper` and `nextStepperValue`.
- Produces:
  - `getStepperValueAccessibilityProps(input): StepperValueAccessibilityProps`
  - Web `resolveStepperWebKey(key, normalized): StepperWebKeyResult`
  - platform-resolved `StepperPressable`

- [ ] **Step 1: Write failing native driver tests**

Create `__tests__/components/ui/Stepper/accessibility.test.ts`:

```ts
import { describe, expect, jest, test } from '@jest/globals';
import { getStepperValueAccessibilityProps } from '../../../../src/components/ui/Stepper/accessibility';
import { normalizeStepper } from '../../../../src/components/ui/Stepper/normalizeStepper';

describe('native Stepper accessibility driver', () => {
  test('min custom actions only list increment while invalid standard direction no-ops', () => {
    const onChange = jest.fn();
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 0, min: 0, max: 2 }),
      onChange,
    });

    expect(props.accessibilityActions).toEqual([
      { name: 'increment', label: '增加' },
    ]);
    props.onAccessibilityAction?.({
      nativeEvent: { actionName: 'decrement' },
    } as never);
    expect(onChange).not.toHaveBeenCalled();

    props.onAccessibilityAction?.({
      nativeEvent: { actionName: 'increment' },
    } as never);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  test('zero range exposes value/state but omits actions and handler', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 5, min: 10, max: 0 }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      accessibilityState: { disabled: true },
      accessibilityValue: { min: 10, max: 10, now: 10 },
    });
    expect(props).not.toHaveProperty('accessibilityActions');
    expect(props).not.toHaveProperty('onAccessibilityAction');
  });

  test('external disabled also omits actions and handler', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({
        value: 1,
        min: 0,
        max: 2,
        disabled: true,
      }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      accessibilityState: { disabled: true },
      accessibilityValue: { min: 0, max: 2, now: 1 },
    });
    expect(props).not.toHaveProperty('accessibilityActions');
    expect(props).not.toHaveProperty('onAccessibilityAction');
  });
});
```

- [ ] **Step 2: Write failing Web ARIA/keyboard tests**

Create `__tests__/components/ui/Stepper/accessibility.web.test.ts`:

```ts
import { describe, expect, jest, test } from '@jest/globals';
import {
  getStepperValueAccessibilityProps,
  resolveStepperWebKey,
} from '../../../../src/components/ui/Stepper/accessibility.web';
import { normalizeStepper } from '../../../../src/components/ui/Stepper/normalizeStepper';

describe('Web Stepper accessibility driver', () => {
  test('maps normalized range to ARIA and tab order', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 1, min: 0, max: 2 }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      'aria-disabled': false,
      'aria-valuemin': 0,
      'aria-valuemax': 2,
      'aria-valuenow': 1,
      tabIndex: 0,
    });
    expect(props.onKeyDown).toBeDefined();
  });

  test('maps every Arrow/Home/End key to the normalized capability', () => {
    const middle = normalizeStepper({ value: 1, min: 0, max: 2 });
    expect(
      ['ArrowUp', 'ArrowRight'].map((key) =>
        resolveStepperWebKey(key, middle)
      )
    ).toEqual([
      { handled: true, nextValue: 2 },
      { handled: true, nextValue: 2 },
    ]);
    expect(
      ['ArrowDown', 'ArrowLeft'].map((key) =>
        resolveStepperWebKey(key, middle)
      )
    ).toEqual([
      { handled: true, nextValue: 0 },
      { handled: true, nextValue: 0 },
    ]);
    expect(resolveStepperWebKey('Home', middle)).toEqual({
      handled: true,
      nextValue: 0,
    });
    expect(resolveStepperWebKey('End', middle)).toEqual({
      handled: true,
      nextValue: 2,
    });
    expect(resolveStepperWebKey('Escape', middle)).toEqual({
      handled: false,
    });
  });

  test('recognized boundary keys are handled but invalid directions have no next value', () => {
    const atMax = normalizeStepper({ value: 2, min: 0, max: 2 });
    expect(resolveStepperWebKey('ArrowRight', atMax)).toEqual({
      handled: true,
    });
    expect(resolveStepperWebKey('Home', atMax)).toEqual({
      handled: true,
      nextValue: 0,
    });
    expect(resolveStepperWebKey('Escape', atMax)).toEqual({
      handled: false,
    });
  });

  test('keyboard handler prevents recognized defaults and only emits real changes', () => {
    const onChange = jest.fn();
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 2, min: 0, max: 2 }),
      onChange,
    });
    const preventDefault = jest.fn();

    props.onKeyDown?.({
      nativeEvent: { key: 'ArrowRight' },
      preventDefault,
    } as never);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();

    props.onKeyDown?.({
      nativeEvent: { key: 'Home' },
      preventDefault,
    } as never);
    expect(onChange).toHaveBeenCalledWith(0);
  });

  test('zero range is aria-disabled, leaves tab order and has no key handler', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({ value: 5, min: 10, max: 0 }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      'aria-disabled': true,
      'aria-valuemin': 10,
      'aria-valuemax': 10,
      'aria-valuenow': 10,
      tabIndex: -1,
    });
    expect(props).not.toHaveProperty('onKeyDown');
  });

  test('external disabled keeps its range but omits the key handler', () => {
    const props = getStepperValueAccessibilityProps({
      normalized: normalizeStepper({
        value: 1,
        min: 0,
        max: 2,
        disabled: true,
      }),
      onChange: jest.fn(),
    });
    expect(props).toMatchObject({
      'aria-disabled': true,
      'aria-valuemin': 0,
      'aria-valuemax': 2,
      'aria-valuenow': 1,
      tabIndex: -1,
    });
    expect(props).not.toHaveProperty('onKeyDown');
  });
});
```

- [ ] **Step 3: Run the platform RED gates**

Run:

```bash
yarn test __tests__/components/ui/Stepper/accessibility.test.ts __tests__/components/ui/Stepper/accessibility.web.test.ts --runInBand
yarn typecheck
```

Expected: both modules/types are missing and typecheck fails on the new imports.

- [ ] **Step 4: Define the shared internal driver contract**

Create `src/components/ui/Stepper/accessibility.types.ts`:

```ts
import type { ViewProps } from 'react-native';
import type { NormalizedStepper } from './normalizeStepper';

export type StepperAccessibilityInput = {
  normalized: NormalizedStepper;
  onChange: (value: number) => void;
};

export type StepperValueAccessibilityProps = {
  accessibilityState?: ViewProps['accessibilityState'];
  accessibilityValue?: ViewProps['accessibilityValue'];
  accessibilityActions?: ViewProps['accessibilityActions'];
  onAccessibilityAction?: ViewProps['onAccessibilityAction'];
  'aria-disabled'?: ViewProps['aria-disabled'];
  'aria-valuemin'?: ViewProps['aria-valuemin'];
  'aria-valuemax'?: ViewProps['aria-valuemax'];
  'aria-valuenow'?: ViewProps['aria-valuenow'];
  tabIndex?: ViewProps['tabIndex'];
  onKeyDown?: ViewProps['onKeyDown'];
};
```

These types remain internal and must not enter `src/components/ui/index.ts` or the package root barrel.

- [ ] **Step 5: Implement the native driver**

Create `src/components/ui/Stepper/accessibility.ts`:

```ts
import { nextStepperValue } from './normalizeStepper';
import type {
  StepperAccessibilityInput,
  StepperValueAccessibilityProps,
} from './accessibility.types';

export function getStepperValueAccessibilityProps({
  normalized,
  onChange,
}: StepperAccessibilityInput): StepperValueAccessibilityProps {
  const base = {
    accessibilityState: { disabled: normalized.rangeDisabled },
    accessibilityValue: {
      min: normalized.safeMin,
      max: normalized.safeMax,
      now: normalized.safeValue,
    },
  };

  if (normalized.rangeDisabled) return base;

  return {
    ...base,
    accessibilityActions: normalized.accessibilityActions,
    onAccessibilityAction: (event) => {
      const name = event.nativeEvent.actionName;
      if (name !== 'increment' && name !== 'decrement') return;
      const nextValue = nextStepperValue(normalized, name);
      if (nextValue !== undefined) onChange(nextValue);
    },
  };
}
```

Do not inspect `accessibilityActions` to authorize a standard direction; authorization is exclusively
`nextStepperValue(normalized, direction)`.

- [ ] **Step 6: Implement the Web ARIA/keyboard driver**

Create `src/components/ui/Stepper/accessibility.web.ts`:

```ts
import { nextStepperValue } from './normalizeStepper';
import type {
  StepperAccessibilityInput,
  StepperValueAccessibilityProps,
} from './accessibility.types';
import type {
  NormalizedStepper,
  StepperDirection,
} from './normalizeStepper';

export type StepperWebKeyResult = {
  handled: boolean;
  nextValue?: number;
};

export function resolveStepperWebKey(
  key: string,
  normalized: NormalizedStepper
): StepperWebKeyResult {
  const direction: StepperDirection | undefined =
    key === 'ArrowUp' || key === 'ArrowRight'
      ? 'increment'
      : key === 'ArrowDown' || key === 'ArrowLeft'
        ? 'decrement'
        : undefined;

  if (direction) {
    const nextValue = nextStepperValue(normalized, direction);
    return nextValue === undefined
      ? { handled: true }
      : { handled: true, nextValue };
  }
  if (key === 'Home') {
    return normalized.canDecrement
      ? { handled: true, nextValue: normalized.safeMin }
      : { handled: true };
  }
  if (key === 'End') {
    return normalized.canIncrement
      ? { handled: true, nextValue: normalized.safeMax }
      : { handled: true };
  }
  return { handled: false };
}

export function getStepperValueAccessibilityProps({
  normalized,
  onChange,
}: StepperAccessibilityInput): StepperValueAccessibilityProps {
  const base = {
    'aria-disabled': normalized.rangeDisabled,
    'aria-valuemin': normalized.safeMin,
    'aria-valuemax': normalized.safeMax,
    'aria-valuenow': normalized.safeValue,
    tabIndex: normalized.rangeDisabled ? (-1 as const) : (0 as const),
  };
  if (normalized.rangeDisabled) return base;

  return {
    ...base,
    onKeyDown: (event) => {
      const result = resolveStepperWebKey(
        event.nativeEvent.key,
        normalized
      );
      if (!result.handled) return;
      event.preventDefault();
      if (result.nextValue !== undefined) onChange(result.nextValue);
    },
  };
}
```

- [ ] **Step 7: Add the platform Pressable seam**

Create native `StepperPressable.tsx`:

```ts
export { Pressable as StepperPressable } from 'react-native-gesture-handler';
```

Create Web `StepperPressable.web.tsx`:

```ts
export { Pressable as StepperPressable } from 'react-native';
```

The Web file is required even though Website currently has a global RNGH shim; the published Stepper
must not depend on that repository-specific webpack plugin for keyboard/button semantics.

- [ ] **Step 8: Wire platform seams into the common component**

In `Stepper.tsx`:

```ts
import { getStepperValueAccessibilityProps } from './accessibility';
import { StepperPressable } from './StepperPressable';

const valueAccessibilityProps = getStepperValueAccessibilityProps({
  normalized,
  onChange,
});
```

Replace both RNGH `Pressable` elements with `StepperPressable`. Keep:

- `disabled={!canDecrement / !canIncrement}`;
- side `onPress` omitted when `nextStepperValue` is undefined;
- contextual label/hint/state;
- existing outer/visual testIDs.

Spread `valueAccessibilityProps` on the central local RN `View` after
`accessible`, role and label. Remove inline `accessibilityState`,
`accessibilityValue`, `accessibilityActions` and `onAccessibilityAction`.
No platform file may read raw `min/max/step/value/disabled`.

- [ ] **Step 9: Run focused GREEN and platform build checks**

Run:

```bash
yarn test __tests__/components/ui/Stepper/normalizeStepper.test.ts __tests__/components/ui/Stepper/layout.test.ts __tests__/components/ui/Stepper/accessibility.test.ts __tests__/components/ui/Stepper/accessibility.web.test.ts --runInBand
yarn typecheck
yarn prepare
yarn lint src/components/ui/Stepper __tests__/components/ui/Stepper type-tests/public-api.tsx manual-tests/runtime-api/RuntimeApiScreen.tsx
```

Expected: all focused tests pass; Bob emits both native and `.web.js` platform files; internal driver
types are absent from the public declaration barrel.

- [ ] **Step 10: Reconcile the approved contract and consumer documentation**

Update the original input/a11y spec and Task 7 plan with these exact facts:

- filtered `accessibilityActions` describe valid custom actions;
- native standard adjustable invalid directions may still dispatch and are capability-guarded no-op;
- Web central slider uses ARIA + Arrow/Home/End driver;
- zero range/disabled omit handlers;
- all outer frames are at least 44pt.

Update `website/docs/components/stepper.mdx`:

- replace “边界只暴露仍有效 action” with custom-action/no-op wording;
- state native side uses RNGH while Web uses RN core Pressable platform seam;
- add this rendered zero-range Stepper inside `StepperDemo`, using its existing `setA`, so Website SSR
  contains disabled slider evidence:

  ```tsx
  <Stepper
    value={10}
    onChange={setA}
    min={10}
    max={10}
    accessibilityLabel="异常范围数量"
  />
  ```

- document `r(28)` and dynamic outer formulas.

Update manual instructions:

- Web Inspector: check `role=slider`, `aria-valuemin/max/now`, disabled and tab order;
- keyboard: ArrowUp/Right, ArrowDown/Left, Home, End;
- iOS: inspect filtered custom actions separately from standard adjustable gestures;
- invalid native standard direction must leave value/unexpected counter unchanged;
- wide native outer must contain the full scaled visual.

Do not mark these manual rows PASS.

- [ ] **Step 11: Build Website/llms and assert actual SSR output**

Run:

```bash
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build:llms
NO_UPDATE_NOTIFIER=1 yarn workspace @unif/react-native-design-website build
```

Then run this one-off assertion against the actual Docusaurus SSR HTML:

```bash
yarn node -e "const fs=require('node:fs');const html=fs.readFileSync('website/build/docs/components/stepper.html','utf8');const tag=(label)=>{const match=html.match(new RegExp('<div[^>]*aria-label=\"'+label+'\"[^>]*>'));if(!match)throw new Error('missing slider '+label);return match[0]};const enabled=tag('独立商品数量');for(const part of ['role=\"slider\"','aria-valuemin=\"1\"','aria-valuemax=\"99\"','aria-valuenow=\"12\"','tabindex=\"0\"'])if(!enabled.includes(part))throw new Error('enabled slider missing '+part+': '+enabled);const disabled=tag('异常范围数量');for(const part of ['role=\"slider\"','aria-disabled=\"true\"','aria-valuemin=\"10\"','aria-valuemax=\"10\"','aria-valuenow=\"10\"','tabindex=\"-1\"'])if(!disabled.includes(part))throw new Error('disabled slider missing '+part+': '+disabled);console.log(enabled);console.log(disabled)"
```

Expected: exit 0 and two central slider opening tags containing every asserted attribute.

- [ ] **Step 12: Run final Task 2 verification**

Run:

```bash
yarn test --runInBand
yarn typecheck
yarn workspace @unif/react-native-design-website typecheck
yarn prepare
yarn lint src/components/ui/Stepper __tests__/components/ui/Stepper type-tests/public-api.tsx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --check
```

Inspect:

- `lib/module/components/ui/Stepper/` contains native and Web seams;
- public `lib/typescript/src/components/ui/Stepper/types.d.ts` still exposes only the required public
  Stepper API;
- `website/static/md/components/stepper.md` and `website/build/llms-full.txt` contain ARIA/keyboard,
  native no-op and dynamic-frame facts;
- `/Users/liulijun/tongyi/design/skills/skills/design/` follow-up targets remain accurately recorded and
  are not claimed synchronized.

- [ ] **Step 13: Update SDD evidence and commit Task 2**

Update Task 7 report/progress with:

- original 5 Important + 1 Minor findings;
- design decision and spec commit `9969d06`;
- RED/GREEN evidence for defaults/layout/native/Web drivers;
- actual SSR tags;
- final automatic gates;
- remaining RN 0.86.2 Inspector/VoiceOver/TalkBack/browser screen-reader and Design Skill gates.

Commit:

```bash
git add src/components/ui/Stepper __tests__/components/ui/Stepper docs/superpowers/specs/2026-07-30-input-interaction-a11y-design.md docs/superpowers/plans/2026-07-30-input-interaction-a11y.md website/docs/components/stepper.mdx manual-tests/runtime-api/RuntimeApiScreen.tsx
git diff --cached --name-only
git commit -m "fix: complete stepper platform accessibility"
```

After both task commits receive clean scoped reviews, the controller must generate a final review package
from `6688c0a` to the new HEAD and return it to the original Task 7 reviewer. Any Critical/Important
finding returns to the relevant original implementer; final manual gates remain open until real evidence
is written into the verification matrix.
