# AvatarGroup 头像组设计规格

**状态：** 已批准，尚未实现

**批准日期：** 2026-09-02

**选择：** 独立 `AvatarGroup` + 类型化 `items` + circle/square + `max` 包含溢出位 +
可选溢出事件

## 1. 目标

在 `src/components/ui` 新增无业务上下文的 `AvatarGroup`。它复用现有 `Avatar` 展示有序成员，
通过负向间距形成重叠头像组；超过视觉上限时，把最后一个视觉位替换为 `+N`。

同时为 `Avatar` 与 `AvatarGroup` 提供一致的 `shape="circle" | "square"`。默认值继续是
`circle`，因此现有消费者不改代码时视觉不变；`square` 为带 token 圆角的方形，不是直角矩形。

组件只负责头像组布局、溢出计数、主题视觉和可访问语义。点击 `+N` 后展示弹层、抽屉或跳转页面
由消费者决定，组件不依赖 navigation、store、Modal、Confirm 或 Toast Host。

## 2. 公共 API

```ts
export type AvatarShape = 'circle' | 'square';

// AvatarProps 新增；默认 circle。
shape?: AvatarShape;

export type AvatarGroupItem = {
  /** 列表内唯一且稳定的身份键。 */
  key: string;
  /** 传给 Avatar 的可见回退字符与 accessible name。 */
  label: string;
  source?: ImageSourcePropType;
  variant?: AvatarVariant;
};

type SharedAvatarGroupProps = {
  items: readonly AvatarGroupItem[];
  /** 所有成员共用一档尺寸，默认 md。 */
  size?: AvatarSize;
  /** 所有真实头像与溢出位共用一种形态，默认 circle。 */
  shape?: AvatarShape;
  /** 最大视觉位数量，必须是大于等于 2 的整数；最后一位计入上限。 */
  max?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type StaticOverflowProps = {
  onOverflowPress?: never;
  overflowAccessibilityLabel?: never;
  overflowAccessibilityHint?: never;
};

type ActionableOverflowProps = {
  onOverflowPress: () => void;
  /** 默认按实际数量生成“查看其余 N 位成员”。 */
  overflowAccessibilityLabel?: string;
  /** 由消费者描述打开弹层、抽屉或跳转等结果。 */
  overflowAccessibilityHint?: string;
};

export type AvatarGroupProps = SharedAvatarGroupProps &
  (StaticOverflowProps | ActionableOverflowProps);
```

使用示例：

```tsx
<AvatarGroup
  items={members}
  size="lg"
  shape="square"
  max={5}
  onOverflowPress={openMemberList}
  overflowAccessibilityHint="打开全部项目成员"
/>
```

不提供以下入口：

- `Avatar.Group` 静态成员；
- 任意 `children`；
- 每个头像独立的 `size`、`shape`、`style` 或 `onPress`；
- 可自定义重叠距离；
- 内置 Popover、Modal 或成员列表。

## 3. 布局与视觉

`AvatarGroup` 保留 `items` 的输入顺序。后一个头像覆盖前一个头像的尾部，使用逻辑方向
`marginStart` 适配 RTL，不使用绝对定位重排内容。视觉位按逻辑顺序递增 `zIndex`，保证后项
稳定覆盖前项，同时不改变 DOM / React Native 读屏顺序。

`Avatar` 的形态由同一个 pure resolver 计算：

| shape | 圆角规则 |
| --- | --- |
| `circle` | `box / 2`，保持当前圆形行为 |
| `square` + `xs/sm` | `radius.xs` |
| `square` + `md/lg` | `radius.sm` |
| `square` + `xl` | `radius.md` |

尺寸与重叠距离固定映射到现有 token：

| size | 头像直径 | 重叠距离 | 分隔边宽 |
| --- | ---: | ---: | ---: |
| `xs` | `avatar.xs` | `space.1` | `r(1)` |
| `sm` | `avatar.sm` | `space.2` | `r(1)` |
| `md` | `avatar.md` | `space.3` | `r(1)` |
| `lg` | `avatar.lg` | `space.4` | `r(2)` |
| `xl` | `avatar.xl` | `space.6` | `r(2)` |

真实成员继续由 `Avatar` 渲染，`AvatarGroup.shape` 统一传给每个真实成员。头像外缘使用
`c.surface` 分隔重叠形状，保证亮色、暗色和图片头像的边界都可辨认。`+N` 是组件内部的
同尺寸节点，使用相同 shape 和 `soft` 对应的 `c.primaryContainer` / `c.primary`，不伪装成
真实 `AvatarGroupItem`。

`styles` maker 位于模块顶层；主题颜色只从 `useColors()` 读取，不新增颜色 token、阴影或动画。

## 4. 溢出规则

- 未提供 `max`：展示全部成员，不渲染 `+N`。
- `items.length <= max`：展示全部成员。
- `items.length > max`：展示前 `max - 1` 位，再显示 `+N`。
- 例如 7 位成员且 `max={5}`：展示 4 个真实头像和 `+3`。
- 空 `items`：渲染 `null`，属于合法输入。
- `max` 不是有限整数或小于 2：开发环境用模块级 logger 去重提示，并按“未提供 max”处理；
  生产环境静默展示全部成员，不能因非法上限隐藏成员或崩溃。

图片 source 的合法性、semantic identity、加载失败与切换竞态全部交给现有 `Avatar`，
`AvatarGroup` 不复制 `ImageAttempt` 或 source normalizer。

## 5. 交互与 a11y

根容器不合并为单一 accessible 节点，真实头像继续保留各自的 `Avatar.label`。因此读屏顺序与
`items` 顺序一致，视觉重叠不改变语义顺序。

静态溢出节点：

- 不设置 button role，不挂 handler；
- accessible name 为“还有 N 位成员”。

可点击溢出节点：

- 使用 RNGH `Pressable`；
- 设置 button role；
- accessible name 默认“查看其余 N 位成员”，非空 `overflowAccessibilityLabel` 可覆盖；
- 透传 `overflowAccessibilityHint`；
- `onOverflowPress` 只在真实激活时调用一次；
- 小于 44pt 的可见圆形用 `hitSlop` 补足触控范围，不改变头像组视觉宽度；相邻真实头像本轮
  不可点击，因此扩展命中区不会与另一个 action 竞争。

消费者给出仅含空白的 `overflowAccessibilityLabel` 时回退到默认名称，并在开发环境去重提示，
不能让 action 失去 accessible name。

## 6. 内部边界

新增目录：

```text
src/components/ui/AvatarGroup/
├── AvatarGroup.tsx
├── index.ts
├── layout.ts
├── normalize.ts
├── styles.ts
└── types.ts
```

- `normalize.ts`：纯函数归一化 `max`、可见成员数和溢出数，不依赖 React。
- `layout.ts`：纯函数维护五档 overlap、border 和 hitSlop 几何。
- `AvatarGroup.tsx`：只负责编排真实 `Avatar`、溢出节点、主题与可选 Pressable。
- `types.ts`：公共 item/props 判别联合。

公共导出只通过 `src/components/ui/index.ts` 和包根 barrel；消费者不得 deep import。

## 7. 测试与文档联动

根测试至少覆盖：

1. 无 `max`、未超限、刚好等于上限和超限四条计数路径；
2. `max` 包含溢出位，7 人 / max 5 得到 4 个真实头像和 `+3`；
3. `max` 的 NaN、Infinity、小数、0、1 和负数均展示全部成员并去重诊断；
4. 五档尺寸的 overlap、border 与 hitSlop 几何；
5. `Avatar` 的 circle/square 圆角 resolver 与默认 circle 回归；
6. `items` 顺序、key、label、source、variant 及 group shape 正确传给真实 `Avatar`；
7. 静态溢出无 handler/button role，可点击溢出具名并只触发一次；
8. 空白自定义名称回退到默认 accessible name；
9. 空数组渲染 `null`，source 失败行为不在本组件重复测试。

类型测试覆盖 `AvatarShape`、Avatar/AvatarGroup 两种 shape、static/action 两个合法分支，
以及只有 label/hint、没有 handler 的非法调用。

本仓同步范围：

- `src/components/ui/index.ts` 公共导出；
- root type-tests 与 Jest；
- `example` 的 media scene、catalog、showcase state contract 与测试；
- `README.md` 的 media 展厅清单与 `AGENTS.md` 的公共 runtime 数量；
- Website 的 `avatar.mdx`、`avatar-group.mdx`、组件概览、`UNIF-DESIGN.md`、静态 Markdown
  与 llms 索引/全文生成结果。

`../skills` 是独立仓库。Design Skill 的组件速查和文档路由需要单独分支/提交同步，不混入本仓
commit；实施前必须明确取得跨仓修改授权，未完成时不得声称 Skill 已同步。

## 8. 验收

自动化至少运行本仓实际脚本中的以下受影响门禁：

```text
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
git diff --check
```

人工核对 Website/example 中 `sm`、`md`、`lg` 的未超限与超限状态，并检查亮色、暗色、RTL、
circle/square、图片成功/失败和读屏顺序。自动化不替代 VoiceOver、TalkBack 或真机触控证据。

本任务同时新增 `AvatarGroup` 公共 runtime、相关类型，并扩展 `AvatarProps`；PR 标题最低使用
`feat:`，按本仓发布链作为 minor 能力交付。

## 9. 非目标

- 不给现有 `Avatar` 增加 badge、icon、独立点击或任意 children；
- 不复刻 Ant Design 的 Tooltip/Popover 实现；
- 不让 `AvatarGroup` 读取成员业务对象、navigation 或 store；
- 不新增 dependency、颜色 token、Host 或 native 配置；
- 不顺手重构 `Avatar`、`Thumbnail`、`DrawerHeader` 或 `AvatarWithRing`。
