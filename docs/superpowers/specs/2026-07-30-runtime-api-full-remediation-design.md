# React Native Design 全量运行时与 API 整改设计

> 日期：2026-07-30  
> 状态：已确认方案 A（严格契约重构）  
> 目标版本：允许 breaking change  
> 范围：运行时、公共 API、a11y、跨平台、theme、icons、website、文档生成与 RNGH 3 基线
> 明确不做：CI、Turbo cache、example 工程和发布流程改造

## 1. 背景

全仓审查确认：根库现有 lint、typecheck、测试和构建均可通过，但组件实现中仍存在命令式 Host 生命周期竞态、输入组件双数据源、无障碍语义不完整、Web/native 结构分叉、动态字号缩放遗漏，以及图标和 LLM 文档生成失真等问题。

维护者选择一次性完成全部非 CI 整改，不要求保持旧 API 兼容。因此本设计不采用逐项兼容补丁，而是收紧公共契约、消除隐式推断和重复数据源，让错误用法尽量在 TypeScript 阶段失败。

## 2. 设计原则

1. **单一事实来源**：一个值只能由一个公开入口控制，禁止顶层 prop 与嵌套 props 相互覆盖。
2. **状态与身份绑定**：异步 resolver、timer 和 Host cleanup 必须检查所属 entry，不能影响后来状态。
3. **语义显式化**：交互、展示、disabled 和 accessible name 不从任意 ReactNode 猜测。
4. **跨平台同构**：Web/native 的公开容器层级、布局和 style 语义保持一致；只分叉动画实现。
5. **缩放一次且只缩文字**：fontScale 只作用于 fontSize、lineHeight、letterSpacing，不缩图标、padding、控件尺寸或命中目标。
6. **生成失败优于静默失真**：icons 和 LLM mirror 无法保真时阻断或明确报错。
7. **不为本轮引入平台级框架**：保留现有目录和组件边界，不新建通用事件总线或表单框架。

## 3. 依赖基线

- 根开发依赖和 website workspace 使用 `react-native-gesture-handler: ^3.1.0`。
- 发布 peer range 使用 `react-native-gesture-handler: >=3.0.0 <4.0.0`，明确不再支持 RNGH 2。
- 保留 `react-native-reanimated-carousel: ^5.0.0`，不替换或内建 Carousel。
- RNRC 5.0.0 当前发布 metadata 把 RNGH 上限写为 `<3.0.0`，但维护者已在本项目的 RN 0.85、Reanimated 4、Worklets 0.9 组合中验证 RNGH 3 可用；本轮以该实测兼容矩阵为准。
- 仓库安装侧使用 Yarn `packageExtensions` 把 RNRC 的 RNGH peer 修正为 `>=3.0.0 <4.0.0`，消除已验证组合的误报。发布文档同步注明该上游 metadata 例外，直到 RNRC 官方放宽范围。
- 本轮现有 Carousel v5 API 迁移属于同一工作区的前置变更，实施时保留并在其上完成 a11y 修复，不回退为 beta API。

## 4. 命令式 Host

### 4.1 Confirm

保留 `confirm(options): Promise<boolean>` 的调用形式，但重写内部状态机：

- 每个 entry 拥有单调递增 id、`settled` 标志和唯一 resolver。
- `settle(entry, result)` 必须同时满足：
  - entry 尚未 settled；
  - 当前 active entry 与传入 entry 身份一致。
- settle 顺序固定为：标记 settled → 清除 active → resolve Promise → 通知 Host 关闭。
- Host subscriber 收到 entry 时，先同步写入 `pendingRef`，再触发 React state；这样即使 state 尚未 commit 就卸载，cleanup 仍能取得 entry。
- 所有确认、取消、backdrop、系统返回和 cleanup 路径统一调用同一个 settle 函数。
- Host cleanup 只 settle 自己持有且仍 active 的 entry。
- 模块登记唯一 Host owner；第二个 Host 在所有环境都不订阅，并在开发环境明确报错，避免一条 entry 被两个 UI 同时消费。
- 没有 Host 时保持立即返回 `false` 并告警，不创建 active entry，也不制造永久 Promise。

该状态机不依赖 React render 是否完成，重复事件和迟到 cleanup 都是幂等的。

### 4.2 Toast

Toast 仍采用“新消息替换旧消息”语义：

- 模块最多保存一条 `pendingEntry`。
- 有 subscriber 时立即广播；无 subscriber 时将最新 entry 写入 pending，覆盖更早 entry。
- Host 注册后原子地取走 pending 并立即显示。
- Host 的 dismiss timer、退场动画回调继续按 entry id 清理，旧回调不能清掉新 toast。
- 多 Host 只允许第一个 owner 生效；开发环境对重复挂载告警。
- pending 不使用无限队列，避免启动阶段错误风暴在 Host 挂载后连续轰炸用户。

Confirm 与 Toast 各自保留独立 store。两者生命周期和排队语义不同，不抽象成泛型事件总线。

## 5. 输入组件契约

### 5.1 TextFieldBase / Input / Textarea

- TextFieldBase 显式接收 `defaultValue`、`placeholderTextColor` 和 `accessibilityState`。
- 非受控 mirror 仅在首次挂载时从 `defaultValue` 初始化，后续遵循 RN defaultValue 语义。
- `placeholderTextColor` 使用 `callerValue ?? themeDefault`。
- `accessibilityState` 先保留 caller 字段，再根据 `disabled || editable === false` 增量写入 `disabled: true`。
- leading/trailing slot 使用统一的 slot frame；交互 slot 自身拥有至少 44pt 的命中边界，不依赖会被父 View 裁剪的 hitSlop。
- Search 的 36pt 视觉高度外保留 44pt 交互 frame；Input 44pt 视觉高度无需额外扩大。
- iOS 上错误文案从空变为非空或内容变化时主动调用 `AccessibilityInfo.announceForAccessibility`；Android 保留 `accessibilityLiveRegion="polite"`，避免重复播报。

### 5.2 Search

Search 使用 controlled/uncontrolled 联合类型：

```ts
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
```

- 非受控模式由 Search 内部 state 持有当前文本，并把该 state 作为 Input value。
- 清除动作更新唯一事实来源；受控模式调用 onChangeText，非受控模式更新内部 state 并可通知 caller。
- 只有当前有值、可编辑且存在有效清除路径时才渲染清除按钮。
- 显式接收并链式调用原生 `onSubmitEditing`；便捷 `onSubmit(text)` 在其后调用。
- 清除按钮使用实际 44pt Pressable，不再依赖正 hitSlop。

### 5.3 PasswordInput

- 删除 `inputProps` 嵌套入口。
- `PasswordInputProps` 直接继承经过筛选的 Input props，并排除组件自管的 `secureTextEntry`、`leading`、`trailing`。
- `value` 和 `onChangeText` 继续作为单一受控入口。
- autofill、capitalization 等均作为顶层 props；组件只为未传值提供密码场景默认值。
- disabled 时眼睛按钮真正 disabled，带 `accessibilityState.disabled`，handler 也有守卫。
- 明文/密文切换只改变 `secureTextEntry`，不重置值或焦点。

## 6. 操作组件与严格类型

### 6.1 Button / IconButton

- `onPress` 改为必填；纯展示内容不应使用 Button。
- ButtonBase 的 `isInteractive` 同时检查 handler、disabled 和 loading。
- loading 上报 `{ disabled: true, busy: true }`。
- `block` 只设置 cross-axis stretch，不再设置 `flexGrow`。
- Confirm action row 自己显式给按钮 `flex: 1`，横向等分不再借用 block 的隐式父轴行为。

### 6.2 NavBar

- 对象形式的 left/right slot 要求 `onPress` 和 `accessibilityLabel` 必填。
- 纯展示 slot 必须传 ReactNode，不再生成无 handler 的 IconButton。

### 6.3 Checkbox / Radio / Switch

- Checkbox 和 Radio 使用联合类型，要求可见 `label` 或显式 `accessibilityLabel` 至少存在一个。
- Switch 没有内置可见 label，因此 `accessibilityLabel` 必填。
- 继续透传 checked/selected/disabled state。
- Web Switch 与 native 共用 44pt 命中区公式和 reduced-motion 处理。

### 6.4 Cell

`extra` 改为显式判别联合，而不是检查 ReactNode 类型：

```ts
type CellExtra =
  | { kind: 'text'; value: string | number | bigint }
  | { kind: 'display'; node: ReactNode }
  | { kind: 'control'; node: ReactElement };
```

- text 统一包装为 Text。
- display 不改变外层 button 的 accessible 语义。
- control 由自身承担 a11y；类型禁止同时提供外层 `onPress`，避免一行嵌套两个操作。
- 外层 actionable Cell 保留 button role、label 和 hint。

### 6.5 Stepper

- 两侧 Pressable 使用 44pt 外层交互框，内部视觉 cell 保持 28/32pt。
- 中央 adjustable 节点也拥有 44pt 可访问边界。
- disabled 或 `min === max` 时上报 disabled，并移除 accessibilityActions 与 handler。
- enabled 时中央 adjustable 和两侧按钮的行为保持一致。

### 6.6 其他 a11y 修复

- Carousel 用带 `importantForAccessibility` / `accessibilityElementsHidden` 的本地 View 包住第三方 Pagination，不再向第三方未知 props 下注。
- Logo 只有在 caller 提供语义 label 时进入 a11y tree；删除无信息量的默认 `"Logo"`。
- Grid item 支持显式 accessibilityLabel；默认把非空 badge 合并进朗读文案。
- DrawerHeader 的头像作为相邻姓名的装饰，从 a11y tree 隐藏，避免重复朗读。
- VersionPill 用 `status?: { color?: string; label: string }` 替代只有颜色的 `statusColor`；缺省为 `{ color: c.success, label: '正常' }`，外层 label 同时包含版本、build 和状态。

## 7. Theme 与字体缩放

### 7.1 统一缩放入口

- 新增纯函数 `scaleFontMetric(value, fontScale)` 和 hook `useFontScale()`。
- `useThemedStyles` 与所有动态 inline typography 共用同一纯函数。
- ThemeProvider 对 fontScale 做有限正数校验；非法值回退 1 并在开发环境告警，不设置人为上限。
- ThemeContext 的缺省值改为 `undefined`，让缺 Provider 告警条件真实可达；运行时仍返回稳定 light fallback。

### 7.2 全量审计规则

- maker 中的 fontSize、lineHeight、letterSpacing 继续由 useThemedStyles 统一缩放。
- render 期由 size variant 计算出的字号显式调用 scaleFontMetric。
- 已经位于 maker 中的数值不得再次缩放。
- Icon size、spinner size、padding、高度、圆角、hit target 均不随 fontScale 改变。
- 覆盖 Button、Avatar、Segmented、Stepper、Tag、AvatarWithRing 及全仓检索发现的其他 inline/static typography。

## 8. 布局、资源和 Web/native 同构

### 8.1 Reveal

- Web 版本恢复单层 View，使 caller 的 flexDirection、gap、alignItems 和子项 flex 与 native 相同。
- opacity/transition 直接施加到该 View；双 requestAnimationFrame 保证 commit 后产生 transition 起点。
- reduced motion 时立即显示。

### 8.2 Spinner

- 外层 View 承载 caller style、布局 transform、testID 和 a11y 隐藏。
- 内层固定视觉环承载 rotate 动画。
- native Reanimated 与 Web CSS animation 都只写内层 transform，因此不会覆盖 caller 的 scale/translate。

### 8.3 图片失败状态

- 新增纯函数 `imageSourceKey(source)`，根据本地 asset id 或远端 source 的可序列化内容生成语义 key。
- Avatar 和 DrawerHeader 只在语义 key 变化时重置 imageFailed。
- 同 URI 的新对象引用不会重复请求；URI、headers 或本地 asset 真正变化时会重试。

### 8.4 Thumbnail

- 始终渲染稳定根容器。
- `containerStyle` 负责 margin、position 和外部布局。
- `imageStyle` 负责图片本身。
- selected ring 位于内部，不改变两个 style prop 的语义。

### 8.5 SVG id

- `useSvgId` 同时消毒 prefix、override 和 React useId 后缀。
- 结果保证以合法字符开头且只包含安全字符；空结果使用稳定前缀回退。

## 9. Icons

### 9.1 build-icons

生成前必须验证：

- 根 stroke-width 是有限正数。
- path 的 d 非空。
- rect 的 width/height 必填、有限且大于 0；x/y/rx 有值时必须有限，rx 不得为负。
- circle 的 cx/cy/r 必填且有限，r 大于 0。
- opacity 必须位于 `[0, 1]`。
- fill 只允许脚本能保真的 `currentColor`、`none` 或缺省；硬编码颜色直接报错。
- 仍然拒绝不支持元素、单引号属性和非 24×24 viewBox。

任何 error 都不生成 data.ts。现有 warn 只保留给不会破坏数据但值得提示的规范偏差。

### 9.2 IconCatalog

- 删除不存在的 rect `ry`。
- DOM renderer 与 native Icon 一致转发 fill、opacity 和 stroke。
- 分类数据以 `ICON_NAMES` 为完整集合，硬编码分类之外自动进入“未分类”，总数和搜索遍历完整集合。
- 增加纯函数完整性检查，重复分类或未知名称报错。

## 10. LLM 文档与网站

### 10.1 链接

- `llms.txt` 内页面链接使用相对 `md/...`，全文链接使用 `llms-full.txt`。
- 这样输出既可部署在 `/`，也可部署在任意 Docusaurus baseUrl。
- 文档正文中的站内 `/docs/...` 链接同步改写为相对或 baseUrl-safe 形式。

### 10.2 LiveDemo 提取

使用两阶段转换，不引入新的 MDX 框架：

1. 扫描所有 export 定义，使用现有平衡括号逻辑识别标识符，并提取定义内的 LiveDemo body。
2. 清理 import/export 壳时保存 `{ demoName -> source }` 映射；遇到 `<DemoName />` 时替换为 tsx code fence。
3. 顶层 LiveDemo 继续直接转换。
4. 名称以 `Demo` 结尾、但没有对应导出定义的自闭合 invocation 视为生成错误，而不是保留悬空标签；其他普通 MDX 组件不受影响。

测试 fixture 必须覆盖真实的 exported stateful demo、直接 LiveDemo、多 demo 和未知 invocation。

### 10.3 文档同步

- 首页示例改成当前真实 ThemeProvider 和 Button API。
- StatusDot、VersionPill 及本轮发生 breaking change 的全部组件文档同步更新。
- 文档 API 表从源码类型逐项核对，不保留旧 prop。
- 重新生成 llms.txt、llms-full.txt 和 md mirror，并检查无悬空 Demo 标签。
- 修复 `.pr_agent.toml` 的 TOML 字符串转义。

## 11. 错误处理与日志

- 所有开发期契约错误使用现有 `createLogger`，生产环境不因告警路径崩溃。
- 用户输入导致的非法数值采用安全 fallback；构建源文件错误（SVG、MDX）采用 fail-fast。
- a11y announce 仅在内容真正变化时执行。
- timer、RAF 和动画回调均保留 cleanup 与 entry/id 守卫。

## 12. 验证策略

遵循仓库规则：design 层不重复写大面积组件行为测试，优先把关键判断提取为纯函数并测试。

新增或扩展的纯逻辑测试：

- Confirm entry settle 的幂等和身份守卫。
- Toast pending drain 与 latest-wins。
- fontScale 校验与 metric 缩放。
- imageSourceKey。
- icon geometry/style 校验及分类完整性。
- LLM exported LiveDemo 提取和链接生成。

必要的组件验证以现有测试设施能稳定表达的最小范围为限，不引入新的 renderer 或测试框架。

最终执行：

```text
yarn lint
yarn typecheck
yarn test --runInBand
yarn prepare
yarn workspace @unif/react-native-design-website typecheck
yarn workspace @unif/react-native-design-website build
node website/scripts/build-llms.test.js
node scripts/build-icons.js
git diff --exit-code src/icons/data.ts
```

本轮不修改 CI、Turbo、example 或 release workflow。

## 13. 实施分区

为降低并发编辑冲突，按文件所有权分为四个工作区：

1. **状态与输入**：Confirm、Toast、TextField、Input、Textarea、Search、PasswordInput、Button。
2. **交互与跨平台**：Carousel、Cell、Checkbox、Radio、Switch、Stepper、NavBar、Logo、Grid、DrawerHeader、Reveal、Spinner、Thumbnail。
3. **Theme 与 business**：ThemeProvider、useTheme、useThemedStyles、动态 typography、Avatar、AvatarWithRing、VersionPill、useSvgId。
4. **生成与文档**：build-icons、IconCatalog、build-llms、MDX 文档和 TOML。

共享 barrel 和公共类型由主实施者最后统一合并，避免并行任务相互覆盖。

## 14. 验收标准

- Confirm 的 Promise 在所有 Host 生命周期路径均有且仅有一次 settle；旧 resolver 不影响新 entry。
- 根包与 website 使用 RNGH 3.1，发布 peer 明确要求 RNGH 3，Yarn 不再报告 RNRC/RNGH 的已知误报。
- Host 初次 effect 前发出的 toast 能在 Host 注册后显示。
- Input/Search/PasswordInput 不存在重复控制入口，controlled/uncontrolled 行为清晰。
- 所有交互组件具有 handler、accessible name、正确 state 和至少 44pt 命中区域。
- fontScale 对所有文字生效且不改变非文字布局尺寸。
- Web/native 的 Reveal、Spinner 和 Switch 保持公开语义一致。
- IconCatalog 展示并可搜索全部 ICON_NAMES，网站 typecheck 通过。
- icon generator 对无法保真的 SVG fail-fast。
- LLM mirror 无悬空 Demo invocation，所有链接在子路径部署下有效。
- 源码、文档和公开类型一致。
- 第 12 节所有验证命令通过，工作区只包含预期变更。

## 15. 非目标

- 不扩大或重写 CI paths-filter。
- 不修 Turbo native cache。
- 不修 example workspace 或 Metro bundle。
- 不引入新的状态管理、表单、MDX AST 或测试框架。
- 不做与审查发现无关的视觉重设计。
