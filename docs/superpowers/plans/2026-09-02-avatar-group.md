# AvatarGroup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `@unif/react-native-design` 增加支持 circle/square、重叠排列、`max` 溢出和可选溢出操作的 `AvatarGroup`,并让 `Avatar` 共用同一形态契约。

**Architecture:** `Avatar` 通过纯圆角 resolver 扩展 shape；`AvatarGroup` 以严格 items API 编排真实 `Avatar`,由纯 normalization/layout 函数决定溢出与几何。组件只持有主题、a11y 和 Pressable 接线,业务弹层仍由消费者负责。

**Tech Stack:** React 19、React Native 0.86、TypeScript 6、RNGH Pressable、Jest、React Native Testing Library、Docusaurus。

**Spec:** `docs/superpowers/specs/2026-09-02-avatar-group-design.md`

## Global Constraints

- `AvatarShape` 只能是 `'circle' | 'square'`,默认 `circle`,现有 Avatar 调用视觉不变。
- `max` 包含溢出位；7 人且 `max={5}` 必须渲染 4 个真实头像和 `+3`。
- 非有限数、小数或小于 2 的 `max` 按未设置处理；只在开发环境去重诊断。
- AvatarGroup 不接收任意 children、每项独立 shape/size/style/onPress、业务弹层或自定义 overlap。
- 交互溢出只用 RNGH Pressable；静态溢出没有 button role 或 handler。
- 主题色只读角色 token；不新增依赖、token、Host、native 配置或动画。
- library 修改只发生在 `feat/avatar-group`;skills 同步按用户授权在独立 worktree 的 `main` 提交。

---

### Task 1: Avatar shape 公共契约

**Files:**
- Modify: `src/components/ui/Avatar/types.ts`
- Modify: `src/components/ui/Avatar/styles.ts`
- Modify: `src/components/ui/Avatar/Avatar.tsx`
- Modify: `src/components/ui/Avatar/index.ts`
- Create: `__tests__/components/ui/Avatar/styles.test.ts`
- Create: `__tests__/components/ui/Avatar/Avatar.test.tsx`
- Modify: `type-tests/public-api.tsx`

**Interfaces:**
- Consumes: `AvatarSize`, `avatar`, `radius`。
- Produces: `AvatarShape`, `shape?: AvatarShape`, `resolveAvatarBorderRadius(size, shape)`。

- [ ] **Step 1: 写 shape resolver 失败测试**

```ts
expect(resolveAvatarBorderRadius('md', 'circle')).toBe(avatar.md / 2);
expect(resolveAvatarBorderRadius('xs', 'square')).toBe(radius.xs);
expect(resolveAvatarBorderRadius('lg', 'square')).toBe(radius.sm);
expect(resolveAvatarBorderRadius('xl', 'square')).toBe(radius.md);
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `yarn test __tests__/components/ui/Avatar/styles.test.ts --runInBand`

Expected: FAIL,因为 `resolveAvatarBorderRadius` 尚未导出。

- [ ] **Step 3: 实现最小 shape contract**

```ts
export type AvatarShape = 'circle' | 'square';

export function resolveAvatarBorderRadius(
  size: AvatarSize,
  shape: AvatarShape
): number {
  if (shape === 'circle') return sizingFor(size).box / 2;
  if (size === 'xs' || size === 'sm') return radius.xs;
  if (size === 'xl') return radius.md;
  return radius.sm;
}
```

`Avatar` 解构 `shape = 'circle'`,并以 resolver 的值替换 `dims.box / 2`。

- [ ] **Step 4: 写 Avatar 默认形态回归测试并确认 GREEN**

```tsx
const defaultAvatar = Avatar({ label: '王' });
expect(defaultAvatar.props.style).toContainEqual({
  width: avatar.md,
  height: avatar.md,
  borderRadius: avatar.md / 2,
  backgroundColor: 'neutral-bg',
});

const squareAvatar = Avatar({ label: '王', shape: 'square', size: 'lg' });
expect(squareAvatar.props.style).toContainEqual(
  expect.objectContaining({ borderRadius: radius.sm })
);
```

测试以真实 `Avatar` 函数为对象,只 mock RN host、theme hook、source resolver 和 ImageAttempt 外部边界。

- [ ] **Step 5: 补公共类型 fixture 并确认 GREEN**

```tsx
const avatarShape: AvatarShape = 'square';
<Avatar label="王" shape={avatarShape} />;
// @ts-expect-error Avatar 只接受 circle/square
<Avatar label="王" shape="rounded" />;
```

Run: `yarn test __tests__/components/ui/Avatar --runInBand && yarn typecheck`

- [ ] **Step 6: 提交 Avatar shape**

```sh
git add src/components/ui/Avatar __tests__/components/ui/Avatar type-tests/public-api.tsx
git commit -m "feat: 为 Avatar 增加双形态"
```

---

### Task 2: AvatarGroup normalization、layout 与 runtime

**Files:**
- Create: `src/components/ui/AvatarGroup/types.ts`
- Create: `src/components/ui/AvatarGroup/normalize.ts`
- Create: `src/components/ui/AvatarGroup/layout.ts`
- Create: `src/components/ui/AvatarGroup/styles.ts`
- Create: `src/components/ui/AvatarGroup/AvatarGroup.tsx`
- Create: `src/components/ui/AvatarGroup/index.ts`
- Create: `__tests__/components/ui/AvatarGroup/normalize.test.ts`
- Create: `__tests__/components/ui/AvatarGroup/layout.test.ts`
- Create: `__tests__/components/ui/AvatarGroup/AvatarGroup.test.tsx`
- Modify: `src/components/ui/index.ts`
- Modify: `type-tests/public-api.tsx`

**Interfaces:**
- Consumes: `Avatar`, `AvatarSize`, `AvatarShape`, `AvatarVariant`, `createLogger`, `childTestID`, `normalizeNonBlankText`, theme tokens。
- Produces: `AvatarGroup`, `AvatarGroupItem`, `AvatarGroupProps`, `normalizeAvatarGroup(items, max)`, `resolveAvatarGroupLayout(size)`。

- [ ] **Step 1: 写 normalization 失败测试**

```ts
expect(normalizeAvatarGroup(items, undefined)).toMatchObject({
  visibleItems: items,
  overflowCount: 0,
  invalidMax: false,
});
expect(normalizeAvatarGroup(items, 5)).toMatchObject({
  visibleItems: items.slice(0, 4),
  overflowCount: 3,
  invalidMax: false,
});
for (const max of [Number.NaN, Number.POSITIVE_INFINITY, 1.5, 1, 0, -1]) {
  expect(normalizeAvatarGroup(items, max)).toMatchObject({
    visibleItems: items,
    overflowCount: 0,
    invalidMax: true,
  });
}
```

- [ ] **Step 2: 运行 normalization 测试并确认 RED**

Run: `yarn test __tests__/components/ui/AvatarGroup/normalize.test.ts --runInBand`

Expected: FAIL,因为模块不存在。

- [ ] **Step 3: 实现唯一计数入口**

```ts
const validMax =
  max === undefined ||
  (typeof max === 'number' && Number.isFinite(max) && Number.isInteger(max) && max >= 2);
const overflowCount =
  validMax && max !== undefined && items.length > max
    ? items.length - (max - 1)
    : 0;
const visibleItems = overflowCount === 0 ? items : items.slice(0, max - 1);
```

- [ ] **Step 4: 写五档 layout 失败测试**

```ts
expect(resolveAvatarGroupLayout('xs')).toMatchObject({ overlap: space['1'], borderWidth: r(1) });
expect(resolveAvatarGroupLayout('md')).toMatchObject({ overlap: space['3'], borderWidth: r(1) });
expect(resolveAvatarGroupLayout('xl')).toMatchObject({ overlap: space['6'], borderWidth: r(2) });
expect(resolveAvatarGroupLayout('xs').hitSlop).toEqual({ top: 13, right: 13, bottom: 13, left: 13 });
```

- [ ] **Step 5: 运行 layout 测试并确认 RED,再实现映射**

Run: `yarn test __tests__/components/ui/AvatarGroup/layout.test.ts --runInBand`

Implementation uses `avatar`, `space`, `r` and `fixed.hitTarget`;hitSlop 每边为 `Math.max(0, (fixed.hitTarget - box) / 2)`。

- [ ] **Step 6: 写 runtime 失败测试**

```tsx
const root = render(<AvatarGroup items={items} max={5} shape="square" />);
expect(root.getByText('+3')).toBeOnTheScreen();
expect(root.getByLabelText('还有 3 位成员')).not.toHaveAccessibilityState({ disabled: true });

const onOverflowPress = jest.fn();
render(<AvatarGroup items={items} max={5} onOverflowPress={onOverflowPress} />);
fireEvent.press(screen.getByRole('button', { name: '查看其余 3 位成员' }));
expect(onOverflowPress).toHaveBeenCalledTimes(1);
```

同文件再用以下可观察结果覆盖边界：

```tsx
const empty = render(<AvatarGroup items={[]} />);
expect(empty.toJSON()).toBeNull();

render(<AvatarGroup items={items.slice(0, 3)} shape="square" />);
expect(
  screen.UNSAFE_getAllByType(Avatar).map(({ props }) => ({
    label: props.label,
    source: props.source,
    variant: props.variant,
    shape: props.shape,
  }))
).toEqual([
  { label: '甲', source: undefined, variant: 'brand', shape: 'square' },
  { label: '乙', source: undefined, variant: 'info', shape: 'square' },
  { label: '丙', source: undefined, variant: 'soft', shape: 'square' },
]);

render(<AvatarGroup items={items} max={5} />);
expect(screen.queryByRole('button')).not.toBeOnTheScreen();
expect(screen.getByLabelText('还有 3 位成员')).toBeOnTheScreen();

render(
  <AvatarGroup
    items={items}
    max={5}
    onOverflowPress={onOverflowPress}
    overflowAccessibilityLabel="   "
  />
);
expect(
  screen.getByRole('button', { name: '查看其余 3 位成员' })
).toBeOnTheScreen();
```

非法 `max` 的诊断测试通过 `addTransport()` 收集 `scope === 'AvatarGroup'` 的 warn record,
同一非法值 rerender 两次后断言只有一条；`afterEach` 用 `removeTransport(testTransport.id)` 清理。

- [ ] **Step 7: 运行 runtime 测试并确认 RED**

Run: `yarn test __tests__/components/ui/AvatarGroup/AvatarGroup.test.tsx --runInBand`

Expected: FAIL,因为 `AvatarGroup` 尚未实现。

- [ ] **Step 8: 实现组件与严格公共类型**

```ts
export type AvatarGroupProps = SharedAvatarGroupProps &
  (StaticOverflowProps | ActionableOverflowProps);
```

真实成员按输入顺序渲染 `Avatar`;slot 样式使用 `marginStart: index === 0 ? 0 : -overlap` 与递增 `zIndex`。`+N` 复用同尺寸/shape、soft 色；存在 handler 时使用 RNGH Pressable 与 hitSlop,否则使用 View。

- [ ] **Step 9: 补 barrel 与类型 fixture,确认 GREEN**

```tsx
<AvatarGroup items={members} max={4} shape="circle" />;
<AvatarGroup items={members} max={4} onOverflowPress={noop} overflowAccessibilityHint="打开成员列表" />;
// @ts-expect-error overflow name 只能与 onOverflowPress 同时使用
<AvatarGroup items={members} overflowAccessibilityLabel="其余成员" />;
```

Run: `yarn test __tests__/components/ui/AvatarGroup __tests__/components/ui/Avatar/styles.test.ts --runInBand && yarn typecheck`

- [ ] **Step 10: 提交 AvatarGroup runtime**

```sh
git add src/components/ui/AvatarGroup src/components/ui/index.ts __tests__/components/ui/AvatarGroup type-tests/public-api.tsx
git commit -m "feat: 新增 AvatarGroup 头像组"
```

---

### Task 3: 持久 example 与 public coverage

**Files:**
- Modify: `example/src/showcases/media/MediaScene.tsx`
- Modify: `example/src/__tests__/MediaScene.test.tsx`
- Modify: `example/src/catalog/componentCatalog.ts`
- Modify: `example/src/catalog/showcaseStateContract.ts`
- Modify: `example/src/__tests__/componentCatalog.test.ts`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: public root `Avatar`, `AvatarGroup`, `AvatarShape`。
- Produces: media scene 中 circle/square、未溢出/溢出、静态/可点击的持久样例与 exact coverage witness。

- [ ] **Step 1: 先扩展 example 测试并确认 RED**

```tsx
const groups = screen.UNSAFE_getAllByType(AvatarGroup);
expect(groups.map((node) => node.props.shape)).toEqual(['circle', 'square']);
fireEvent.press(screen.getByRole('button', { name: '查看其余 3 位成员' }));
expect(screen.getByText('最新结果：AvatarGroup · 查看成员 · 展示其余 3 位成员')).toBeOnTheScreen();
```

Catalog 预期增加 `AvatarGroup`,总数从 48 改为 49,media scene exact set 加入该组件。

Run: `yarn example test MediaScene.test.tsx componentCatalog.test.ts --runInBand`

Expected: FAIL,因为 example 尚未消费新 public API。

- [ ] **Step 2: 实现 media scene 与 coverage contract**

增加 Avatar 的 circle/square 展示；增加 7 项成员数据，并渲染 circle 未超限组与 square `max={5}` 可点击组。Catalog states 精确登记 `circle/square`、`未超限/溢出`、`静态/可点击`,state contract 以 JSX props 和 interaction witness 覆盖。

- [ ] **Step 3: 更新仓库事实并确认 GREEN**

`README.md` 的 media 行加入 AvatarGroup；`AGENTS.md` 的 public runtime 数量与 media 能力同步到当前事实。

Run: `yarn verify:example-showcase && yarn example typecheck && yarn example lint && yarn example test --maxWorkers=2`

- [ ] **Step 4: 提交 example coverage**

```sh
git add example README.md AGENTS.md
git commit -m "docs: 展示 AvatarGroup 公共状态"
```

---

### Task 4: Website、llms 与 design Skill

**Files:**
- Modify: `website/docs/components/avatar.mdx`
- Create: `website/docs/components/avatar-group.mdx`
- Modify: `website/docs/components/overview.md`
- Modify: `website/docs/UNIF-DESIGN.md`
- Regenerate: `website/static/llms.txt`
- Regenerate: `website/static/llms-full.txt`
- Regenerate: `website/static/md/index.json`
- Regenerate: `website/static/md/components/avatar.md`
- Generate: `website/static/md/components/avatar-group.md`
- Modify in `/Users/liulijun/tongyi/design/.worktrees/skills-avatar-group`: `skills/design/SKILL.md`
- Modify in `/Users/liulijun/tongyi/design/.worktrees/skills-avatar-group`: `skills/design/references/components.md`

**Interfaces:**
- Consumes: 已验证 public types 与 runtime。
- Produces: 人类文档、生成的 LLM 文档和 design Skill 路由。

- [ ] **Step 1: 更新手写 Website 文档**

Avatar 页补 `shape`;AvatarGroup 新页提供两种 shape、`max` 计数、static/action 联合、a11y owner、token 和 LiveDemo；overview 与 UNIF-DESIGN 增加索引/组件事实。

- [ ] **Step 2: 生成并验证 llms**

Run: `node website/scripts/build-llms.js`

Run: `node website/scripts/build-llms.test.js`

Expected: 新增 canonical `md/components/avatar-group.md`,index/full 文档均包含 AvatarGroup。

- [ ] **Step 3: 验证 Website**

Run: `yarn workspace @unif/react-native-design-website typecheck && yarn workspace @unif/react-native-design-website build`

- [ ] **Step 4: 提交 Website 与生成物**

```sh
git add website
git commit -m "docs: 补充 AvatarGroup 使用文档"
```

- [ ] **Step 5: 在独立 skills/main worktree 同步路由并验证**

`SKILL.md` 的展示组件速查加入 `AvatarGroup`;`references/components.md` 的 Avatar 条目说明何时使用单头像与头像组。不得覆盖原工作树 `codex/design-ribbon-stepper-docs` 的未提交文件。

Run in skills worktree:

```sh
python3 scripts/format_markdown.py --fix
python3 scripts/generate_plugin_metadata.py --check
python3 -m unittest discover -s tests -v
python3 scripts/validate_repository.py
python3 scripts/validate_portal_consistency.py
python3 scripts/format_markdown.py
```

- [ ] **Step 6: 在 skills/main 形成独立提交**

```sh
git add skills/design/SKILL.md skills/design/references/components.md
git commit -m "docs: 增加 AvatarGroup 组件路由"
```

---

### Task 5: 全量回归与交付检查

**Files:**
- Review only: all task files。

**Interfaces:**
- Consumes: Tasks 1–4 的实现与文档。
- Produces: 可复核的门禁、diff 范围和两个仓库提交证据。

- [ ] **Step 1: 运行组件库完整门禁**

```sh
yarn typecheck
yarn lint
yarn test --maxWorkers=2
yarn verify:example-showcase
yarn example typecheck
yarn example lint
yarn example test --maxWorkers=2
yarn workspace @unif/react-native-design-website typecheck
node website/scripts/build-llms.test.js
yarn workspace @unif/react-native-design-website build
yarn prepare
```

- [ ] **Step 2: 检查生成物和 diff**

```sh
git diff --check
git status --short --branch
git diff main...HEAD --stat
```

- [ ] **Step 3: 按规格逐项核对**

核对 circle/square、五档 size、max 计数、非法 max、安全静态/动作联合、RTL marginStart、a11y、example exact coverage、Website/llms 和 Skill；人工 native/VoiceOver/TalkBack 项明确保留为未执行证据。
