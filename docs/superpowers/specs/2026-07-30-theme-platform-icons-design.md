# Theme、平台、资源与 Icons 设计

> 日期：2026-07-30
>
> 父设计：[全量整改总览](./2026-07-30-runtime-api-full-remediation-design.md)
>
> 状态：设计已确认，待书面审阅

## 1. 范围

本专项处理：

- Theme `fontScale` 的校验与完整应用。
- ThemeContext 缺 Provider 的真实诊断路径。
- 图片 source 的稳定语义 identity。
- Reveal、Spinner、Thumbnail 的 Web/native 容器和 style 语义。
- SVG ID 消毒。
- Icon SVG 构建校验与 Website IconCatalog 数据完整性。

## 2. Font scale

### 2.1 纯函数与 hook

新增：

```ts
normalizeFontScale(value: unknown): number
scaleFontMetric(value: number, fontScale: number): number
useFontScale(): number
```

契约：

- `normalizeFontScale` 仅接受有限正数；`NaN`、`Infinity`、`0` 和负数回退为 `1`。
- 不设置最大值，不擅自限制系统或 caller 的无障碍字号偏好。
- `scaleFontMetric` 返回 `value * normalizeFontScale(fontScale)`；不额外调用 `r()`、`rf()` 或增加另一层取整，确保静态和动态 typography 使用同一规则。
- `useFontScale` 从 ThemeContext 返回已经归一化的稳定值。
- 开发环境警告由 ThemeProvider 使用 `createLogger` 负责，纯函数无副作用。
- 三个新增入口都由 `src/theme/index.ts` 导出，并经根 barrel 公开；动态组件不得用深路径导入私有实现。

### 2.2 ThemeProvider 与缺省 Context

- ThemeProvider 在构造 context value 前归一化 `fontScale`。
- ThemeProvider 的 memo 依赖归一化后的值，不依赖原始非法值。
- 非法值只在开发环境通过 effect + 去重 logger 告警，避免在 React concurrent render 阶段产生副作用；运行时使用 `1`。
- ThemeContext 默认值改为 `undefined`。
- `ThemeContext` 从 `src/theme/index.ts` 公共 barrel 移除，只允许 ThemeProvider/useTheme 内部引用；`ThemeContextValue` 类型可继续公开。
- `useTheme` 在缺 Provider 时通过 effect 于开发环境告警，并返回稳定的 light fallback；生产环境同样返回 fallback，但不记录日志。
- fallback 对象在模块级创建，不能在每次 hook 调用时生成新引用。
- `useFontScale` 和 `useThemedStyles` 在消费 context 值时仍调用 `normalizeFontScale` 防御非法运行时输入，不把正确性只建立在 TypeScript 上。

### 2.3 缩放一次且只缩文字

`useThemedStyles` 和 render 期动态 typography 必须共用 `scaleFontMetric`：

- maker 中的 `fontSize`、`lineHeight`、`letterSpacing` 由 `useThemedStyles` 统一处理。
- size/variant 在 render 期动态计算出的上述字段显式调用 helper。
- 已由 maker 缩放的值不得再次缩放。
- Icon、Spinner、padding、gap、width/height、borderRadius 和 `fixed.hitTarget` 等不缩放。

实施时对 `src/` 全量搜索文字 metric，并记录以下已知映射：

- Button 文本、Avatar label、Segmented 文本、Stepper value、Tag 文本在 render 期缩放动态 metric。
- Button/IconButton 从同一 `sizing.fs` 派生的 Icon size 不缩放。
- AvatarWithRing 的动态 factory 只缩放 `fontSize` / `letterSpacing`；删除 `{ lineHeight: inner }` 几何居中 hack，继续由 `avatarCore` flex 居中，避免 fontScale 把 lineHeight 放大到头像外。
- maker 内静态 metric 只由 `useThemedStyles` 缩放。

同时处理全仓检索发现的其他静态或 inline typography，审计结果不能只限于已知列表。

### 2.4 Reduced motion 信号

本节实现顺序提前到“依赖与 Runtime 状态”专项：先完成 Reanimated/Worklets 升级，再让 `usePrefersReducedMotion.ts` 在 native 委托 Reanimated `useReducedMotion()`；Web 继续使用 `matchMedia` 兄弟实现。该前置通过局部 typecheck/测试后，Pulse、Switch、Carousel 和 Reveal 才能依次消费，不能各自假设 native 动画会自动处理。Theme 专项保留对全部消费者、公共导出和文档的一致性复核，不重复实现第二套 hook。

## 3. 图片 source identity

新增纯函数：

```ts
imageSourceKey(source: ImageSourcePropType | undefined): string
```

生成规则：

- 本地 asset number 使用带类型前缀的数值 key。
- 远端 source object 使用递归 canonical serialization；对象键排序，数组保留顺序。
- `uri`、`headers`、尺寸、scale、cache 等实际 source 字段都参与 identity。
- headers 不受调用方对象键插入顺序影响。
- primitive 使用类型前缀，避免字符串 `"1"` 与数字 `1` 冲突。
- `undefined`、空数组和空对象保持彼此可区分。
- 不使用对象引用、随机数或 render 次数。
- 组件先执行 source 运行时校验，再为合法 source 生成 key；canonical serializer 对循环引用、函数、symbol、bigint 和非有限数等非类型安全输入返回确定性的 invalid 结果而不抛错，invalid source 直接走 fallback，不挂载 Image。

Avatar 和 DrawerHeader 不在父组件保存跨 source 共用的 `imageFailed` / `failedSourceKey`。改为私有的 image-attempt 子组件：

- `ImageAttempt` 必须是模块级私有组件或独立私有模块导出，组件类型引用在父组件 render 之间稳定；禁止在 Avatar/DrawerHeader 函数组件内部定义它。
- 父组件计算 `currentSourceKey`，以该 key 渲染 `<ImageAttempt key={currentSourceKey} ... />`。
- `ImageAttempt` 的失败 boolean 只属于本次挂载实例；source key 变化会在同一次 reconciliation 中卸载旧实例并挂载新实例，不等待 effect 清状态。
- 等价 URI/headers 的新对象引用得到同一个 key，不重挂载，也不因引用变化重试。
- URI、headers、本地 asset 或数组内容真正变化时得到新 key并重挂载。
- `A₁ → B → A₂` 时，即使 A₁ 的 `onError` 在 A₂ 挂载后才到达，它持有的仍是已卸载 A₁ 实例的 state setter，不能写入 A₂；不能只用字符串 key 在父级共享 state 中比较，因为那会产生 ABA。
- `ImageAttempt` 不向父级回写失败状态；旧 attempt cleanup/onError 不存在可修改当前 attempt 的共享入口。

## 4. Reveal.web

Web 版本恢复与 native 一致的单层公开容器：

- caller `style`、布局属性、testID 和 children 都落在同一个 View。
- 使用 `StyleSheet.flatten(style)?.opacity` 取得 caller 目标 opacity；合法数字目标为 caller 值，否则为 `1`，动画从 `0` 到该目标，不能用固定 `1` 覆盖 caller opacity。
- View 使用 `[style, animatedWebStyle]`，animated style 最后写入当前插值 opacity；完成时等于 caller 目标值。
- RNW 的 transition 使用 `transitionProperty`、`transitionDuration`、`transitionTimingFunction` 字段并在 Web 文件内做窄类型适配，不再使用额外 DOM div 或不受 RNW 保证的 shorthand。
- 初始不可见状态 commit 后，通过两个 `requestAnimationFrame` 进入目标 opacity，确保浏览器建立 transition 起点。
- effect cleanup 取消两个 RAF；旧回调不能修改新一轮状态。
- reduced motion 时立即显示，不注册 RAF 或 transition。

## 5. Spinner

native 和 Web 都使用两层结构：

1. 外层先应用默认 `safeSize × safeSize`，再应用 caller style，最后应用保留的 `alignItems: 'center'`、`justifyContent: 'center'`；它承载 margin/flex/position、caller transform、testID 和 a11y 隐藏。caller 显式 width/height/flex 可扩大容器，但 `alignItems` / `justifyContent` 属于内部保留字段，即使出现在 style 中也不能改变视觉环居中。
2. 内层始终为 `safeSize × safeSize`，居中承载视觉环和 rotate animation，不被外层 stretch 改变。

Reanimated style 或 CSS animation 只写内层 `transform: rotate(...)`。caller 的 scale/translate 不会被旋转覆盖，旋转也不会因 caller style 顺序丢失。

两平台公开 style 语义和 DOM/View 层次职责一致。

## 6. Thumbnail

Thumbnail 的 source 改为严格二选一联合：TypeScript 保证 `uri` 或 `source` 属性恰好出现一个，但普通 `string` / `ImageSourcePropType` 无法静态证明非空和结构有效，因此仍执行运行时校验。

- `uri` 必须是 trim 后非空字符串。
- `source` 为本地 asset 时必须是有限正整数；为 object 时必须含 trim 后非空的 `uri`；为数组时必须非空且每项都是含有效 URI 的 source object。
- `''`、纯空白 URI、`{}`、`[]`、非有限 number 和其他非类型安全输入都视为缺失 source。
- 无有效 source 时在开发环境告警，但仍渲染稳定 placeholder 根节点，不返回 `null`。

Thumbnail 始终渲染稳定根容器，公开 API 改为：

- `containerStyle`：完整的外部布局 View style，可使用 margin、position、flex、width/height 和 transform；它只影响外层 layout container。
- `imageStyle`：opacity、tint 等图片表面样式；类型移除 `position`、`top`、`right`、`bottom`、`left`、`width`、`height`、`minWidth`、`minHeight`、`maxWidth` 和 `maxHeight`。

删除旧 `style`，不保留 alias。结构固定为两层：

1. 外层 layout View 始终存在，承载 `containerStyle` 和 `testID`；它的 measured size 由 caller 布局决定。
2. 内层 visual frame 始终存在，固定为 size variant 的 width/height/radius/`overflow: 'hidden'`，承载 Image、placeholder 和 ring；caller 不能通过 `containerStyle` 改变该视觉 frame。

`imageStyle` 先应用，absolute-fill geometry 后应用；运行时通过 `StyleSheet.flatten` 剔除其保留字段并于开发环境告警，覆盖非类型安全 JS/宽类型 registered style。无有效 source 时由内层 frame 背景显示 placeholder。

selected ring 作为始终存在的 absolute-fill overlay 留在**内层 visual frame**：固定 2pt border、使用与 visual frame 相同的 borderRadius，未选时 border 透明，选中时切主题色，不再通过 border+padding 扩大 6pt。overlay 不接收 pointer event。Image 由 visual frame 裁切，caller `imageStyle` 可以改变图片表面属性，但不能破坏 visual frame/ring 的圆角。

- selected 切换不改变 caller style 落点。
- 未选和已选状态拥有相同两层结构、相同 Image/visual frame 尺寸；外层 measured size 只由相同的 caller layout 决定。
- 图片圆角和 ring 不吞掉外部布局属性。

## 7. SVG ID

提取纯函数 `buildSvgId(prefix, override, reactId)`；`useSvgId` 无条件调用 React `useId()` 后委托该函数。它对 prefix、override 和 React 后缀都执行同一个 `sanitizeSvgIdPart`：

1. 将连续非法字符替换为 `-`，仅保留 `[A-Za-z0-9_.-]`。
2. 只去掉首尾的 `.` / `-`；保留合法的 `_`。
3. override 未传时，使用“消毒后的 prefix + 消毒后的 React 后缀”。
4. override 传入但消毒后为空时，同样回退到自动生成路径，不能返回会在多实例间碰撞的固定 id。
5. 组合结果若为空，先尝试 `svg-id` 与消毒后的 React 后缀，最终兜底为 `svg-id`。
6. 最终结果若不以 `[A-Za-z_]` 开头，则前置 `svg-id-`。

自动路径先过滤空 part，再用单个 `-` join，不能产生前导或双连字符。`buildSvgId` 作为测试 seam 从源模块导出，但只有 `useSvgId` 进入 public business barrel。相同输入和相同 React tree identity 必须生成相同结果。

## 8. Icon 构建器

### 8.1 fail-fast 校验

`scripts/build-icons.js` 在格式化或写入 `src/icons/data.ts` 前收集并报告所有文件问题。任一 error 都退出非零且不写文件。

先移除 XML comments，得到唯一 `cleanSrc`；标签校验、属性解析、shape 提取和最终生成全部只能读取 `cleanSrc`，不能在校验后又把原始 source 交给 `parseSvg`。随后扫描全部 opening/closing tag。文档必须恰好有一个根 `svg`，根内只允许 `path`、`rect`、`circle`；这三类 shape 必须都是 `svg` 的直接子节点和叶子节点，彼此不能嵌套。任何其他标签（包括 `symbol`、`marker`、`pattern`、`foreignObject`、`animate`、`title`）都失败。不能继续依赖有限 unsupported-tag 黑名单。

除现有“单引号属性、空图标、非 `0 0 24 24` viewBox、属性值不可解析”等规则外，新增：

- 根 `stroke-width` 必须存在且是有限正数。
- 根样式必须精确为 `fill="none"`、`stroke="currentColor"`、`stroke-linecap="round"`、`stroke-linejoin="round"`，与 Icon runtime 固定根语义一致；缺失或其他值都失败。
- `path d` 必须是 trim 后非空字符串。
- `rect width` / `height` 必填、有限且大于 0。
- `rect x` / `y` / `rx` 存在时必须有限，`rx >= 0`。
- `circle cx` / `cy` / `r` 必填且有限，`r > 0`。
- 所有被解析的 `opacity` 必须是 `[0, 1]` 内有限数。
- `fill` 只允许缺省、`none` 或 `currentColor`；硬编码颜色直接失败。

为避免脚本静默丢属性，对根和元素采用 allowlist：

- `svg`：`xmlns`、`viewBox`、`fill`、`stroke`、`stroke-width`、`stroke-linecap`、`stroke-linejoin`。
- `path`：`d`、`fill`、`stroke`、`opacity`。
- `rect`：`x`、`y`、`width`、`height`、`rx`、`fill`、`stroke`、`opacity`。
- `circle`：`cx`、`cy`、`r`、`fill`、`stroke`、`opacity`。

任何 allowlist 外属性都 fail-fast，包括当前未支持的 `ry`、`transform`、`style`、`fill-rule`、`clip-rule` 和 stroke dash 属性。元素 `fill` 只允许缺省、`none`、`currentColor`；元素 `stroke` 只允许缺省、`none`、`currentColor`。所有硬编码颜色及无法保真的元素级 cap/join/width 都是 error，不再只是 warning。

元素省略 fill 时等价于 runtime `none`，省略 stroke 或显式 `currentColor` 时等价于主题 stroke；纯 fill 元素必须显式 `fill="currentColor" stroke="none"`。这样每一种允许的继承形式都有唯一生成语义。

数值校验接受合法的小数和负坐标，但拒绝空字符串、单位、`NaN`、`Infinity` 和尾随垃圾字符。错误信息必须包含文件名、元素类型和字段，便于一次修完全部源文件。

当前唯一非标准根是 `src/icons/svg/stop.svg`；将其根补齐为 `fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`，子 rect 已显式 `fill="currentColor" stroke="none"`。这些字段与现有生成/runtime 语义一致，因此 `src/icons/data.ts` 保持不变。完成源文件规范化后，现有 SVG 必须全部通过新规则。

新增 `scripts/check-icons-generated.js` 与根命令 `yarn check:icons`。检查脚本创建两个独立临时目录，分别以 `BUILD_ICONS_OUT=<temp>/data.ts` 调用真实 `build-icons.js`，再逐字节比较两份临时输出与仓内 `src/icons/data.ts`；任一生成失败或 bytes 不同都输出对应 SHA-256 并退出非零，`finally` 清理临时目录，且绝不写工作区。SVG 或生成器有预期变更时先运行 `node scripts/build-icons.js` 更新正式生成物，再运行 `yarn check:icons`。

### 8.2 IconCatalog

- 删除 `rect` 不存在的 `ry` 读取/传递，修复 Website typecheck 基线错误。
- Website renderer 与 native Icon 一致转发每个 shape 的 `fill`、`opacity` 和 `stroke` 语义。
- 页面搜索和计数以 `ICON_NAMES` 为完整集合。
- 手工分类之外的合法图标自动进入“未分类”，不能从目录消失。

提取纯函数校验分类：

- 同一个 icon 出现在多个分类时报错。
- 分类包含 `ICON_NAMES` 之外名称时报错。
- 未分类是允许状态，由函数计算，不要求维护者手写重复全集。

IconCatalog 模块用该函数直接构建最终分类，重复或未知名称立即 throw，使 Website SSR/build 真实失败；不能只在测试中调用或降级为 console warning。当前基线为 `ICON_NAMES=118`、手工分类 102、自动“未分类”16，实施后以 helper 计算结果为准。

## 9. 测试

新增或扩展纯逻辑测试：

- `normalizeFontScale` 的有效值、零、负数、`NaN`、正负 `Infinity`。
- `scaleFontMetric` 的一次缩放及非法 scale fallback。
- Theme context resolver 覆盖缺 Provider、开发诊断标记、生产静默条件和同一个 fallback 引用。
- `normalizeFontScale` 另覆盖 string/null 等 unknown 输入和不设上限的超大有限正数。
- `imageSourceKey` 覆盖 object key/header 顺序、number 与 string 区分、`undefined`/`[]`/`{}` 区分、array 顺序和真实 source 变化。
- 图片 source 运行时校验覆盖空白 URI、空 object/array、非法本地 asset 和合法三种输入。
- image-attempt 人工生命周期矩阵通过总览定义的临时 native harness 及其受控图片 fixture 覆盖 `A₁ → B → A₂ → late onError(A₁)`；确认失败 state 位于 keyed 子实例而非父级共享 state。结果写入 `docs/superpowers/verification/2026-07-30-runtime-api-remediation.md`，仓库现有测试边界不为此新增 renderer。
- SVG ID 的非法开头、冒号、空值、数字开头、override 消毒为空回退自动 ID 和稳定 fallback。
- Icon path/rect/circle/opacity/fill/root stroke-width、元素/root 属性 allowlist 的有效与失败 fixture。
- 全标签扫描 fixture 至少包含 `symbol`、一个未在任何历史黑名单中的未知标签、多个根 `svg`、closing tag 不匹配、未闭合标签，以及合法 shape 彼此嵌套，防止实现退化为有限 blacklist 或把嵌套结构错误拍平。
- comment fixture 在注释内放一个形式合法的 path，验证 validator 忽略它且生成数据中也绝不出现该 shape，证明校验和 parse 共用 `cleanSrc`。
- Icon 分类的重复、未知和未分类集合。
- `yarn check:icons` 真实生成两份临时产物并与仓内 `data.ts` 做 bytes/hash 比较，证明 source、生成物与格式化结果一致且重复生成幂等；验证前后工作区 `data.ts` bytes 不变。

Icon 分类纯测试放在根 `__tests__/website/` 并由根 Jest 执行；Website 本身不新增 test runner。不新增 Reveal、Spinner 或 Thumbnail snapshot；通过 typecheck、Website build 和 checked-in 的 native/Web 人工结构矩阵验证平台容器契约。矩阵使用总览规定的字段，至少逐项记录 Reveal flex/opacity/reduced-motion、Spinner caller transform + inner rotate、Thumbnail 外层尺寸/内层裁剪与 ring，以及图片 ABA；最终完成要求这些必需行全部 `PASS`。

## 10. 验收标准

- 非法 fontScale 不再污染 context，合法无障碍 scale 不被人为 cap。
- 全仓每个文字 metric 恰好缩放一次，非文字布局不随 fontScale 改变。
- 缺 ThemeProvider 的开发告警路径真实可达且 fallback 引用稳定。
- 等价图片 source 不重复重试，语义变化会重置失败状态。
- Reveal Web 不再增加破坏 flex 的公开 wrapper。
- Spinner caller transform 与旋转动画可同时存在。
- Thumbnail selected 切换不改变 style 语义。
- 所有 SVG ID 符合安全字符和合法开头约束。
- 非法 SVG 不写生成物；合法 SVG 的生成结果幂等。
- IconCatalog 覆盖全部 `ICON_NAMES`，Website typecheck 通过。
