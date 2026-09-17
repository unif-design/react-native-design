# Design 新架构契约验证依据

适用源码基线：`99360cb7911be1ea883050d9fe740ed4212e1914` 之上的 Design 新架构实现，本地验证日期 2026-09-17。目标依据为本机架构仓的 [Design 总契约](../../unif-platform-architecture/libraries/react-native-design.md)及其八个专题；本文件记录实现与本地开发验证边界。完整 CI 与发布证据以对应 PR、Actions 和 Release 为准，不代替用户最终验收。

## 实现与公共契约

| 单元 | 实现及主要依据 | 公开契约 |
| --- | --- | --- |
| Textarea / TextField | 原生使用 Yoga 文本测量及 min/maxHeight 约束，Web 独立实测高度；表面高度包含 padding、边框，错误说明在外；支持增长、缩短、外部清空、上限滚动、宽度和字号变化。见 `src/components/ui/TextField/useMultilineLayout(.web).ts` | minHeight 默认 96、maxHeight 默认无限制；模式锁定、原值交付、原生事件、focus / blur 保留。原生保留内部滚动能力，仅溢出时实际滚动；显式 scrollEnabled 仍优先 |
| Thumbnail | `ThumbnailDimensions` 包根类型、size 对象、fallback；对象宽高为有限正数，圆角有限非负，非法对象整体回退 md；复用 keyed ImageAttempt | sm/md/lg、默认 md、source/uri 互斥、原图片生命周期保留。对象尺寸不二次缩放；使用 `ThumbnailProps['size']` 推导三档枚举的消费者须缩窄对象分支，或继续使用 ThumbnailSize |
| CircularProgress | useFontScale + scaleFontMetric 接入百分比一次；自然文字布局、居中的显式 SVG 圆环 | 参数与比例归一化不变。小圆环配大字号时外层占用可增大；不截百分号、不缩字体、不关闭标签。showLabel=false 无文字空间 |
| Avatar / AvatarGroup | Avatar/geometry.ts 提供实际共享尺寸、文字基准和圆角，styles.ts 只管样式 | 五档尺寸、形态、重叠、溢出及公开类型语义不变；不新增公共几何 API |
| Pulse / PulseDot / Skeleton | shared/pulse 提供唯一归一化与 native/Web driver；各单元 constants 独立维护默认值，诊断入口由调用方提供 | 原参数、默认视觉、usePulse API、reduced motion 与卸载释放保持；不新增导出或全局动画状态 |
| 其余公开单元 | 对照架构 units.md 的 50 个组件与现有 catalog；确认/Toast/选择控件/通用组合保留所属职责，完整原测试继续执行 | 继续一个 Design 包；无新增业务流程、上传服务、表单引擎或宿主队列 |

对 Design 源码、example、Website 及本机 Portal / ai-app-portal 的只读引用检索，没有发现现存 `ThumbnailProps['size']` 枚举派生消费者；新增类型样本明确验证对象缩窄。未登记 Chat 工程与其他未检索工程不在此结论内。

RN 0.86.3 的 iOS Fabric 在布局尺寸变化时交付内容尺寸事件，因此原生输入不以该事件回写固定 height。两端 Yoga 文本测量直接处理值、宽度与字体变化，min/max 仅约束结果；原始事件仍交给调用者。即使 min=max，也不依赖框高变化才开启滚动。这是源码及接线依据，实际设备布局仍按下方矩阵验收。

实质修改的对象结构采用 interface，联合及 SDK 派生使用 type；仅整理实际触及单元。运行期相对导入图按 native、Web 两种解析检查：253 / 265 个 TS/TSX 文件，未发现循环。该静态检查不证明所有动态加载或原生链接。ESLint 新规则的负例会拒绝 AvatarGroup 读取 Avatar/styles，正例允许 Avatar/geometry；Git 已忽略的 `ds-bundle/` 生成预览也从 lint 排除，未排除库源码。

## 依赖与检查

根及 example 实际安装 React 19.2.3、RN 0.86.3、Reanimated 4.6.0、Worklets 0.12.1；Website React 19.2.8 来自原锁定范围。运行依赖、peer 和原生锁定契约未变；example 显式声明已采用的 @types/node 25.9.1，并同步 manifest / Yarn 锁文件，Jest 使用正式 Node 类型。根、example、Website 统一采用 react-native-strict-api 类型入口。已有 Carousel 5 / RNGH 3 三项窄例外由 check:runtime-peers 精确确认；ESLint peer warning 保留，没有全局 override 或忽略机制。

本地只运行格式、Lint、类型、静态契约与串行定向测试。全量 Jest、包含全量 Jest 的 showcase 验收脚本、库/Website/example 构建与打包由 CI 执行；下表不把先前版本的构建结果用于当前源码的完整验收。

| 当前检查 | 实际结果与限制 |
| --- | --- |
| 根 / example / Website typecheck | 三者通过；公开尺寸分支、派生 size 缩窄、输入 ref 与非法调用反例均纳入检查。三处采用同一当前 SDK 类型入口，固有尺寸直接使用 SDK 类型，不保留强转或旧类型入口适配 |
| 根定向 Jest（--runInBand） | TextField 归一化与值状态 2 suites / 73 tests，以及 Pulse / CircularProgress 2 suites / 20 tests 通过；其余触及单元已有定向回归 |
| example 定向 Jest（test:focused、--runInBand） | DesignContracts / FormsScene 2 suites / 20 tests 通过，覆盖原生自然测量约束、原文与外部替换、清空和事件交付；另有 Feedback / PulseContracts 定向回归，含相同参数重渲染不重启动效 |
| 临时消费者 Pulse 定向测试 | 在没有相邻库实现文件的目录中，通过包根定位真实库模块；2 tests 通过，覆盖默认、参数更新、reduced motion 与释放 |
| Lint / 格式 / diff | 根及 example Lint 与 git diff --check 通过；既有 warning 保留，未为通过检查修改业务代码 |
| showcase 静态契约 | 直接调用现有 verifyExampleShowcase() 通过：50 个公开组件、真实消费、场景/Host、资料、CI/Turbo 配置。此入口不执行 Jest，不能代表完整门禁通过 |
| 完整 showcase 门禁 | 由 CI 执行。临时消费者从真实包入口定位模块，执行文件数严格为 17、owner 数为 9，完整执行集合须通过门禁证明 |
| 配置 / runtime peers / icons / Jest 发布入口 | 检查通过；运行依赖、生成图标和发布入口契约保持不变 |
| Website/llms | 从 MDX 源重新生成，生成器测试通过；最新完整 Website 构建留 CI |
| 全量 Jest、库/原生构建与 JS bundle | 本地不执行；完整结果须核对对应提交的 CI，不以定向通过代替完整结果 |

关键回归覆盖 Textarea 自然布局约束与大字号、Thumbnail 对象尺寸与占位，以及真实 Provider 下的进度字号。Textarea 测试检查不锁定原生 height、min=max 仍可滚动、外部替换与清空保留实例；RNTL 合成 contentSize / error / focus 只证明事件交接，不模拟原生布局通过。PulseContracts 测真实 Web timer driver，并仅替代平台 reduced-motion 事实，不证明 native worklet。

## 真实 Web 布局

Textarea、Thumbnail 与 Pulse 使用本地 Website 的真实公开组件；CircularProgress 的最新纵向布局使用轻量 RNW 渲染检查。浏览器为 Codex 应用内浏览器，具体替身边界在表中注明。示例控制区不随局部字号变化。

| 样本 | 观察结果（CSS 布局单位） |
| --- | --- |
| Textarea 初次挂载长文 | 构建后静态页首次显示五段、140 字长文，输入高 123 / 表面高 145，scrollHeight=123，完整显示；未经过先输入再触发测量 |
| Textarea 空值 → 长文 → 短文 → 外部清空 | 表面高 44 → 120 → 44 → 44；长文 scrollHeight=270、输入高=98，内部滚动启用 |
| 同一 40 字内容，宽度变化 | 输入宽 429 → 154；表面高 64 → 106，值长度不变 |
| 同一窄框，fontScale 1 → 2 | 字号 15 → 30，表面高封顶 120，scrollHeight=336；取消上限后表面高 358 |
| focus / newline / blur | 公开 ref 聚焦与失焦生效；真实 Enter 增加换行，保持聚焦，内容高随之增大 |
| Thumbnail 解码与失败 | 76×76、圆角 8、2px 选择环；真实无效图像显示 Icon fallback。失败态改宽 120 保留占位；切 B 再 A 均成功显示图像 |
| Pulse Web 动效 | 构建后页面的 6px 圆点使用 opacity 0.7s CSS transition，两个时间点实际 opacity 约 0.771 / 0.514；显式 500 / 800ms 样本各自保留节奏。真实系统 reduced motion 未切换 |
| CircularProgress | 240 宽纵向容器中，无标签为 16×16；正常/3 倍字号的 100% 外层宽约 28.75/79.85、高 16/35.5，SVG 保持 16、描边 2。使用真实组件源码与 RNW View/Text，主题/SVG 做边界适配。完整 Website 样例另验证 0%、42%、100% 未截断 |

可复验入口：Website Textarea / Thumbnail / Loading 页面。持久 example 的 forms / media / feedback 场景提供对应公开消费样例，不实现第二套 Composer。

## 尚需完成的验证

| 项目 | 原因、影响与下一步 |
| --- | --- |
| iOS / Android 实际布局与键盘 | 当前会话没有原生 UI 控制工具，未完成模拟器/真机输入、中文 IME 中间态、系统字号、旋转、内部滚动及真实图片切换；需在设备交互环境完成，不能由双端构建或 RNTL 替代 |
| 真实系统动效与无障碍 | VoiceOver、TalkBack、系统 reduced motion、native worklet 的运行与释放仍待实际平台验证 |
| Chat / Portal 接入 | 本机架构资料尚未登记可接入的独立 Chat 工程；使用库内最小消费示例验证。Composer 主聊天/抽屉键盘、Attachments 横向手势/嵌套动作、真实上传状态投影仍待跨库验收 |
| 消费技能资料 | 已核对安装的 design Skill：完整组件 API 指向 Website/llms。当前任务仅修改 Design 仓库，未修改或发布其他仓库中的 Skill；新 Thumbnail 参数应随后续消费接入采用本仓文档 |
| 维护成本 | 未做优化前后相同任务的冷/暖耗时对照，不宣称本次已降低维护成本 |

独立只读审查覆盖核心实现和目标契约；统一的 strict-api 类型入口经三套实际 typecheck 验证，不存在旧类型适配层。审查不代替平台和 CI 验证。

## 架构 STATUS 回填依据

- **公开单元、主题与工程组织**：实现可登记为本次触及单元已落实；50 个组件索引一致，新增包根类型仅 ThumbnailDimensions。主题基础和未触及单元沿用现有实现，不宣称全库重排。
- **输入组件与 Composer 组合**：Design 端输入实现、类型/交互与上述 Web 样本已验证；原生布局、键盘和真实 Composer 仍待验。
- **媒体与 Thumbnail 公开扩展**：目标 API、非法输入、图片实例及 Web 解码/切换已验证；原生及 Chat Attachments 待验。
- **进度字体与反馈动效**：单次应用字体缩放、自然布局、头像几何与共享驱动已落实；Jest 与 Web 范围可登记，系统偏好及 native worklet 待验。
- **交互、通用组合与 UI 宿主**：保留既有实现与事件责任，相关既有定向回归通过；完整回归以 CI 为准，不把这项回归写成新的业务能力。

开发验收的本地依据为“类型、静态契约、定向交互与所列 Web 样本已核对”；完整门禁须补充同一提交的 CI 结果，发布须补充版本与 registry 证据。上述各项最终验收均待用户完成；本地代码与验证证据不代表已发布或已跨库接入。
