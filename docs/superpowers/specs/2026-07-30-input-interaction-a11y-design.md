# Input、交互与无障碍设计

> 日期：2026-07-30
>
> 父设计：[全量整改总览](./2026-07-30-runtime-api-full-remediation-design.md)
>
> 状态：设计已确认，待书面审阅

## 1. 范围

本专项收紧输入和操作组件的公共契约，消除双数据源、隐式交互和不完整的无障碍语义，并让本轮确认存在问题的输入 slot、Switch 和 Stepper 拥有真实至少 44pt 的命中区域。

允许直接删除旧 prop；不提供兼容 alias。

## 2. TextFieldBase / Input / Textarea

### 2.1 严格受控联合

Input 和 Textarea 共用以下值契约，并分别与自己的布局 props 组合：

```ts
type ControlledTextValueProps = {
  value: string;
  onChangeText: (value: string) => void;
  defaultValue?: never;
};

type UncontrolledTextValueProps = {
  value?: never;
  defaultValue?: string;
  onChangeText?: (value: string) => void;
};

type TextFieldValueProps =
  | ControlledTextValueProps
  | UncontrolledTextValueProps;
```

- `InputProps` / `TextareaProps` 必须从继承的 `TextInputProps` 中先 omit `value`、`defaultValue` 和 `onChangeText`，再与该联合组合。
- 禁止同时传 `value` 和 `defaultValue`；受控模式必须提供更新入口。
- 由于未启用 `exactOptionalPropertyTypes`，显式 `value={undefined}` 与未提供 `value` 一样进入非受控分支。
- `TextFieldValueProps` 仅作为组件类型实现的共享定义，不新增根 barrel 公共类型；消费者以 `InputProps` / `TextareaProps` 为准。
- 为避免 RN 0.86 中优先级更高的 alias 或原生行为绕过内部契约，Input/Textarea 还从 `TextInputProps` omit `'aria-disabled'`、`readOnly`、`role`、`enterKeyHint` 和 `clearTextOnFocus`。公开 API 分别只保留 `accessibilityState`、`editable` / `disabled`、`accessibilityRole` 和 `returnKeyType` 作为单一入口；focus 不能隐式清空文本。
- 只读输入使用 `editable={false}`；不再同时支持等价但 precedence 不同的 `readOnly`。

### 2.2 受控值与内部 state

`TextFieldBase` 显式接收 `value`、`defaultValue`、`onChangeText`，但底层 `TextInput` 始终由组件提供 resolved `value`：

- 受控模式直接显示 `value`。
- 非受控模式只在首次挂载时从 `defaultValue` 初始化内部 state，后续把该 state 作为底层 `value`；`defaultValue` 不再继续传给原生 TextInput。
- 用户输入先更新非受控 state，再调用 caller `onChangeText`。受控模式不写内部 state。
- mode 以首次 render 的 `value !== undefined` 锁定；由于未启用 `exactOptionalPropertyTypes`，显式 `value={undefined}` 视为未提供。后续切换 controlled/uncontrolled 属于开发错误，告警并保持初始 mode。
- 初始为 controlled 时保存 `lastValidControlledValueRef`；后续非法传入 `value={undefined}` 时继续显示最后一个 string 值，不把 `undefined` 传给底层，也不切成非受控。恢复 string 后更新该 ref。
- 初始为 uncontrolled 时，后续出现的 string `value` 被忽略，继续使用内部 state；`defaultValue` 的后续变化同样不重置 state。
- 非类型安全调用在 controlled 模式丢失 `onChangeText` 时，输入回调安全 no-op 并在开发环境告警，不能临时写入内部 state。
- filled/error/focus 视觉状态读取同一个 resolved value，不维护第二份文本 mirror。

Input、Textarea、Search 和 PasswordInput 不再公开完整原生 `TextInput` ref，统一只暴露：

```ts
type TextFieldHandle = {
  focus: () => void;
  blur: () => void;
};
```

实现通过内部 native ref 和 `useImperativeHandle` 转发这两个不改变文本的操作；`clear()`、`setNativeProps()` 等可绕过 state machine 的入口不在类型或公开 handle 中。`TextFieldHandle` 随 Input/Textarea 组件类型从 UI barrel 和根 barrel 导出，供表单聚焦使用。

### 2.3 prop precedence

- `placeholderTextColor` 使用 `callerValue ?? themeDefault`，caller 显式值优先。
- 定义 `effectiveEditable = disabled !== true && editable !== false`；底层 TextInput 始终接收 `editable={effectiveEditable}`，Search 清除、Password eye 和所有 slot action 也只使用这一值判断可操作性。
- `accessibilityState` 先保留 caller 提供的其他字段，再始终由真实行为覆盖 `disabled: !effectiveEditable`；caller 不能让可编辑输入朗读为 disabled，也不能把真实禁用改成 false。高优先级 `'aria-disabled'` 已从类型和 rest props 中排除。
- 内部默认值只能填补 caller 未提供的字段，不能用展开顺序静默覆盖 caller。

### 2.4 命中区域

leading/trailing 不再接受任意 `ReactNode` / `ReactElement`，只接受库能完整渲染和验证的配置：

```ts
type TextFieldSlot =
  | {
      kind: 'icon';
      icon: IconName;
      size?: number;
      color?: string;
    }
  | {
      kind: 'text';
      value: string | number;
    }
  | {
      kind: 'action';
      icon: IconName;
      onPress: () => void;
      accessibilityLabel: string;
      disabled?: boolean;
    };
```

- icon/text slot 由库分别渲染 Icon/Text 并从 a11y tree 隐藏，不存在嵌套 Pressable 入口；其语义应由输入的 `accessibilityLabel` / `accessibilityHint` 表达。
- icon size 仅接受有限且 `1 <= size <= 32` 的值，非法时回退 18 并在开发环境告警；所有 display 内容都限制在 slot frame 内。
- action slot 由库渲染 Pressable 和 Icon；Pressable 自身填满 44×44 frame，disabled 时移除 handler 并上报状态。
- action 的最终禁用值为 `!effectiveEditable || slot.disabled === true`；字段整体不可编辑时，caller 不能通过 slot 自身的 `disabled={false}` 恢复操作。
- Search/PasswordInput 内建动作使用同一个 action primitive，caller 不存在塞入尺寸未知嵌套 Pressable 的类型入口。

slot 和输入高度使用真实布局 frame：

- Input `height` 只接受有限且至少 44pt 的值；非法或过小值回退默认 44pt 并在开发环境告警。
- Textarea `minHeight` 默认 96；只有有限且至少 44pt 的值才有效，否则回退 96。`maxHeight` 缺省时不设上限；只有有限且不小于归一化 min 的值才有效，非法或小于 min 时回退为无上限。每个非法字段在开发环境告警。
- Search 可保留 36pt 的可见 surface，但 `TextInput` 和两侧 slot 的外层交互 frame 均为 44pt，并相对视觉 surface 居中。
- action Pressable 自身为 44×44，不依赖可能被父级 `overflow` 裁剪的正 `hitSlop`。
- `containerStyle` 使用 `StyleProp<Omit<ViewStyle, 'height' | 'minHeight' | 'maxHeight' | 'minWidth' | 'maxWidth' | 'overflow'>>`。运行时仍通过 `StyleSheet.flatten` 检查并移除这六个保留字段，以覆盖非类型安全 JS 和预注册宽类型 style；发现时开发环境告警。内部根 frame 最后应用 `minHeight` 与 `minWidth: 44`，caller 的 `width` 可以请求更宽布局，但直接 style 不能把 field frame 约束到 44 以下或裁切。
- Input/Search/Password 的组件自有 field frame 最小宽高均为 44；Textarea 的最小高度按上述规则。保证针对组件自有、未被外部 transform/祖先裁切的布局；caller 仍需为整个组件提供可用页面空间。

固定命中目标不经过 `r()` 或 fontScale。

`TextFieldSlot`、`TextFieldHandle` 和对应的 `TextFieldContainerStyle` 类型从 UI barrel 与根 barrel 公开；`TextFieldBase` 组件本身仍是内部实现，不公开。

### 2.5 错误播报

- Android 错误文案继续使用 `accessibilityLiveRegion="polite"`。
- iOS 仅在组件已挂载后，错误从空变为非空或非空内容发生变化时调用 `AccessibilityInfo.announceForAccessibility`。
- 首次挂载已有错误时不主动重复播报；错误清空时不播报。
- effect cleanup 防止卸载后执行延迟播报。

## 3. Search

### 3.1 严格 controlled/uncontrolled 联合

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

type ControlledSearchProps = {
  value: string;
  onChangeText: (value: string) => void;
  defaultValue?: never;
};

type UncontrolledSearchProps = {
  value?: never;
  defaultValue?: string;
  onChangeText?: (value: string) => void;
};

type SearchProps = SearchBaseProps &
  (ControlledSearchProps | UncontrolledSearchProps);
```

`disabled`、`editable`、placeholder、keyboard props、testID 等从 InputProps 保留。禁止同时传 `value` 和 `defaultValue`，受控模式必须提供 `onChangeText`；Search 自管的 slot、高度、role、return key 和 native clear 不再暴露。

### 3.2 单一事实来源

- runtime 用 `value !== undefined` 判断初始模式，不用 `'value' in props`；显式 undefined 视为非受控。与 TextFieldBase 一样，首次 mount 后不允许切换 mode。
- 受控模式的当前文本是当前 string `value`；非法变为 undefined 时使用最后一个合法 controlled value。
- 非受控模式由 Search 内部 state 持有当前文本，并把它作为下层 Input 的 `value`；`defaultValue` 仅初始化一次。
- 初始非受控后出现的 `value` 被忽略；两种非法 mode 切换都复用 TextFieldBase 的开发诊断规则。
- 输入、清除和提交都读取同一个 `currentValue`。
- 非受控输入先更新内部 state，再可选通知 caller；受控输入只通知 caller。

### 3.3 清除和提交

只有同时满足以下条件才渲染可操作清除按钮：

- 当前文本非空；
- `effectiveEditable === true`；
- 当前模式存在合法更新路径。

清除时：

- 非受控模式同步写入空字符串并通知可选 `onChangeText('')`。
- 受控模式调用必填的 `onChangeText('')`。
- `effectiveEditable === false` 时不保留 handler，也不上报可用 action。

`onSubmitEditing` 作为原生事件回调完整接收并先执行；便捷 `onSubmit(currentValue)` 随后执行。任一入口都不能吞掉另一入口。

## 4. PasswordInput

- 删除嵌套 `inputProps`。
- `PasswordInputProps` 精确定义为：

```ts
type PasswordInputProps = Omit<
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

- 删除由组件自管或与受控入口冲突的全部字段，尤其不能泄漏 `defaultValue`。
- `value` / `onChangeText` 继续作为唯一受控入口；autofill、`autoCapitalize` 等均使用顶层 prop。
- 密码场景默认值只在 caller 未提供时填补。
- disabled 或 `editable === false` 时，显示/隐藏密码按钮自身 disabled，设置 `accessibilityState.disabled`，并移除/守卫 handler。
- 切换可见性只改变 `secureTextEntry`，不重置文本或主动改变焦点。

## 5. Button、IconButton 与 ButtonBase

- `ButtonProps.onPress` 和 `IconButtonProps.onPress` 改为必填。
- 内部 `ButtonBase` 的 handler 同样为必填；纯展示内容不使用 button primitive。
- `loading` 时组件不可操作，并上报：

```ts
accessibilityState={{ disabled: true, busy: true }}
```

- Button/IconButton 可选接收 `accessibilityState?: Omit<AccessibilityState, 'disabled' | 'busy'>`；ButtonBase 先合并这些非冲突字段，再由真实状态统一覆盖 `disabled: disabled || loading` 和 `busy: loading`。
- `disabled` 或 `loading` 时 Pressable 不保留有效 handler。
- `block` 只提供 cross-axis `alignSelf: 'stretch'`，删除 `flexGrow`。
- Confirm 横向 action row 自己显式给每个按钮 `flex: 1`，不借用 `block` 改变父轴布局。

## 6. NavBar

交互 action 与纯展示 slot 分离：

```ts
type NavBarAction = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
};

type NavBarSlot = NavBarAction | ReactNode;
```

- 对象形式始终表示真实操作，三个字段全部必填。
- 纯展示内容直接传 `ReactNode`，不包装成没有 handler 的 `IconButton`。
- action 的 disabled 等后续能力只能通过显式类型扩展，不根据字段缺失推断。

## 7. Checkbox、Radio 与 Switch

### 7.1 accessible name

Checkbox 和 Radio 使用命名联合：

- 有可见 `label` 时，`accessibilityLabel` 可选并可覆盖朗读名称。
- 无可见 `label` 时，`accessibilityLabel` 必填。

Switch 不内置可见 label，因此 `accessibilityLabel` 必填。

`Radio.Group` 自身为 composite radiogroup，新增必填 `accessibilityLabel: string`；多个组不能只依赖组外相邻文字猜测名称。

### 7.2 state、命中区和 reduced motion

- Checkbox、Radio 和 Switch 分别按真实值上报 `checked` 与 `disabled`。
- disabled 时移除 handler。
- Web 和 native Switch 共用至少 44pt 的真实外层 Pressable，视觉轨道继续居中显示。
- Switch 动画遵循 reduced-motion：启用减少动态效果时直接切换到目标状态，不播放过渡。

## 8. Cell

Cell 的文本与 slot 契约整体收紧：

```ts
type CellTextValue = string | number | bigint;

type CellLeading = IconName | { kind: 'display'; node: ReactElement };
```

- `title` 改为必填 `CellTextValue`，`desc` 改为可选 `CellTextValue`。三种 primitive 都转换为字符串并包装在 Text 中，不再允许任意 `ReactNode`。
- `leading` 只接受 `IconName` 或显式的非交互 `display` element；不再把任意 primitive/ReactNode 直接放进 View。
- 当前没有真实消费需要可交互的 title、desc 或 leading；未来如需增加，必须设计新的显式 slot，而不是重新放宽为任意 `ReactNode`。

`extra` 不再接收任意值并在运行时猜测用途：

```ts
type CellExtra =
  | { kind: 'text'; value: string | number | bigint }
  | {
      kind: 'display';
      node: ReactElement;
      accessibilityText?: string;
    }
  | { kind: 'control'; node: ReactElement };

type ActionableCellExtra = Exclude<CellExtra, { kind: 'control' }>;
type StaticCellExtra =
  | Extract<CellExtra, { kind: 'text' }>
  | {
      kind: 'display';
      node: ReactElement;
      accessibilityText?: never;
    };
```

渲染规则：

- `text` 一律包装成库内 Text，避免 number/bigint 成为 View 的裸 child。
- `display.node` 只允许 `ReactElement`，不能用 primitive、Iterable 或 Promise 绕过 text 分支。公开 `CellExtra` 保留完整三分联合，但 `accessibilityText` 只允许 actionable display 使用，并由外层 action 合并朗读。
- static display 精确声明 `accessibilityText?: never`，始终是装饰内容；静态行需要表达语义的可见内容必须使用 `kind: 'text'`，由本地 Text 自然朗读。
- `control` 由传入元素自己承担交互和 a11y。

Cell Props 使用三分联合：

1. actionable：`onPress` 必填，可使用 `arrow`、`disabled`、`accessibilityHint`，`extra` 只允许 `text` / `display`。
2. control：`extra.kind === 'control'`，并令 `onPress`、`arrow`、`disabled`、`accessibilityLabel`、`accessibilityHint` 为 `never`。
3. static：没有 `onPress`，同样禁止 `arrow`、`disabled`、`accessibilityLabel` 和 action hint，`extra` 只允许 `text` / 不带 `accessibilityText` 的装饰 `display`。

这使 `arrow: true` 必然对应真实外层操作，也禁止通过 title、desc、leading 或 extra 合法声明嵌套 control。`display` 的契约明确要求内容非交互；caller 若把交互元素谎报为 display 属于类型语义违约。

actionable Cell 默认 accessible name 由 `title`、非空 `desc`、`extra.kind === 'text'` 的值或 actionable display 的非空 `accessibilityText` 依次组合；显式 `accessibilityLabel` 可覆盖。control Cell 不创建外层 button 语义，交互和 accessible name 由 control 自身承担。static Cell 保持普通 View，不创建用于合并名称的外层 a11y node；`title`、`desc` 与 text extra 继续作为可见 Text 自然朗读，static display 则保持装饰语义。

## 9. Stepper

- 左右 Pressable 使用 44×44 外层交互框，内部视觉 cell 保持现有 28/32pt。
- 中央 adjustable 节点也拥有至少 44pt 的实际边界。
- `StepperProps.accessibilityLabel: string` 改为必填，作为中央 adjustable 的名称；左右按钮分别组合为“`${label}，减少` / `${label}，增加`”，避免页面上多个 Stepper 都只读“增加/减少”。
- 整体 disabled 或归一化后的 `safeMin === safeMax` 时，上报 disabled，删除 `accessibilityActions` 和 `onAccessibilityAction`；这同时覆盖原始 `min > max`、非有限边界等最终折叠为零范围的情况。
- 到达 `min` 时只暴露仍有效的 increment action；到达 `max` 时只暴露 decrement action。
- 两侧按钮在边界处同步 disabled 并移除 handler，不能出现视觉 disabled 但 a11y action 仍可触发的状态。

## 10. 其他组件

### 10.1 Carousel Pagination

- item renderer 只有在 `onPressItem` 存在时使用 Pressable；纯展示 slide 使用 View，不挂 no-op handler，也不进入 button/focus 语义。
- Carousel Props 使用联合：actionable 分支同时要求 `onPressItem` 和 `getAccessibilityLabel(item, index): string`；display 分支令两者均为 `never`。泛型 item 无法自动推导业务名称，因此 actionable slide 不接受只有序号的退化 label。
- reduced motion 开启时 `effectiveAutoplay=false`，即使 caller 传了 autoplay 也不自动轮播。native/web 共用可真实读取系统设置的 hook。
- `autoplay` 继续是 caller 控制的暂停入口；文档要求持续 autoplay 的业务提供外部暂停/继续控件。本组件不自动 live-announce 每次翻页，避免每 3 秒打断屏幕阅读器；actionable slide 的名称包含调用方语义和当前序号。
- 用库内本地 View 包裹第三方 Pagination，并在该 View 上设置隐藏无障碍树所需属性，不向第三方组件传未知 props。
- `data.length <= 1` 时不渲染 Pagination，也不保留 pagination 容器高度。
- 多页时才保留现有布局空间。

### 10.2 Logo

- 删除默认 `"Logo"`。
- 删除旧 `label` prop，重命名为 `accessibilityLabel`，不保留 alias。
- caller 未提供 `accessibilityLabel` 时视为装饰，设置 `accessible={false}`、iOS `accessibilityElementsHidden`、Android `importantForAccessibility="no-hide-descendants"` 和 Web `aria-hidden`。
- trim 后非空的 label 才视为已提供，并设置 `accessible`、`accessibilityRole="image"` 和该 label；空白字符串在开发环境告警并按装饰模式处理。

### 10.3 Grid

- item 支持显式 `accessibilityLabel` override。
- 默认 label 合并标题与 badge；数值 `0` 也属于有效 badge，不能因 truthy 判断丢失。
- badge 只读作附加信息，不额外创建重复焦点。

### 10.4 DrawerHeader

- 头像位于相邻姓名/账号组合内时视为装饰，从 a11y tree 隐藏，避免同一个人名被朗读两次。
- 隐藏属性落在包住 Image 与首字母 fallback 的整个头像容器，使用与 Logo 相同的跨平台组合，不能只隐藏 Image。
- 图片 source retry 的语义身份由 Theme/平台专项统一实现。

### 10.5 VersionPill

删除只表达颜色的 `statusColor`，改为：

```ts
type VersionStatus = {
  label: string;
  color?: string;
};

type VersionPillProps = {
  version: string;
  build?: string;
  status?: VersionStatus;
  versionPrefix?: string;
  buildPrefix?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};
```

- 默认状态为 `{ label: '正常', color: colors.success }`。
- caller 提供 status 但省略 color 时使用中性 `colors.foregroundMuted`，不能让“异常”等任意 label 自动搭配 success 绿色。
- `status.label` 在圆点旁可见渲染，同时进入外层组合名称；状态不再只靠颜色向任何用户表达。
- 外层合并后的 accessibility label 包含版本、build（存在时）和状态。
- `VersionStatus` 从组件、business barrel 和根 barrel 导出。

### 10.6 跨平台隐藏契约

Carousel Pagination、装饰 Logo 和 Drawer 头像都使用共享的跨平台隐藏组合：

- `accessible={false}`；
- iOS `accessibilityElementsHidden`；
- Android `importantForAccessibility="no-hide-descendants"`；
- Web/RN 新属性 `aria-hidden`。

属性落在本地 View/Image 上，不透传给未知第三方组件。

## 11. 测试与验收

本专项主要依靠严格类型、lint、typecheck 和 Website 示例编译验证。新增 `type-tests/public-api.tsx`，由根 `tsc` 执行其中的 `@ts-expect-error` fixture，证明 Input/Textarea/Search 模式、PasswordInput、被删除的 TextInput alias/保留 style 字段、任意 ReactElement slot、命名联合、Cell 三分联合、Carousel 分支及 `TextFieldHandle.clear()` 等非法组合会被拒绝，不引入新 type-test runner。该目录故意不放在 `__tests__/`，避免 Jest 把 compile-only fixture 当作运行时 test suite；仍由现有 tsconfig 默认 include 覆盖。

纯函数测试覆盖输入高度归一化、Search mode/update、Stepper safe range/actions、44pt frame 和默认 accessible label。iOS announce、reduced motion、tree hiding 及实际 frame 使用总览定义的 `yarn create:runtime-harness` 临时 RN app 和 Website 页面执行，并在 checked-in 的 `docs/superpowers/verification/2026-07-30-runtime-api-remediation.md` 记录 native/Web 人工验收；不新增组件 snapshot 或 renderer。矩阵每行固定包含 case id、平台/OS 与 RN 版本、构建或设备、前置设置、操作步骤、预期、实际、证据路径/链接和 `PASS|FAIL|BLOCKED`；最终完成要求本专项必需行全部 `PASS`，不能用空白、`TODO` 或文字推断代替执行。

验收标准：

- Search 的受控和非受控调用在 TypeScript 中互斥，清除动作始终更新唯一事实来源。
- Input/Textarea 的受控和非受控调用同样互斥；公开 ref 只能 focus/blur，不能绕过 state 清空或原地改写文本。
- PasswordInput 不再存在嵌套 prop 覆盖顶层控制的路径。
- 所有 Button/IconButton 调用点都提供 handler，loading 同时报告 busy 和 disabled。
- 本轮确认存在问题的输入 slot、Switch 和 Stepper 由真实布局提供至少 44pt 命中区。
- 所有操作具备可访问名称，disabled 状态不存在仍可调用的 handler/action。
- Cell 的 title/desc/leading 不再把 primitive 裸放进 View，也不接受隐式交互节点；arrow、disabled、hint、外层 action 与 control extra 的组合由联合类型约束。
- 单页 Carousel 不产生隐藏 Pagination 的空白高度。
- 纯展示 Carousel item 不生成 Pressable，reduced motion 下 autoplay 停止。
- Stepper 和 Radio.Group 拥有上下文名称，归一化零范围不暴露 action。
- Logo/Drawer/Pagination 的隐藏属性在 native/Web 一致，VersionPill 状态文字可见且可朗读。
- 每项 breaking API 的仓内调用点、对应 Website MDX 和 type fixture 与实现同一原子提交完成；最终 Website 专项再执行全量一致性审计。
