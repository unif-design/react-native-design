# 系统材质全量覆盖记录

2026-10-11。用户提供的弹层、分段选择和 Chip 是效果及遗漏举例，范围为五库内所有适合系统材质的组件；不按举例截断清单。本记录按源码职责区分控制层、浮层与内容层，不将所有白色内容改成玻璃。

## 枚举依据

Design 公共 `src/index.tsx` 的两个组件 barrel 共 58 个运行值；排除 confirm、toast、usePulse、useSvgId 后，54 个可渲染组件均在下表。Radio.Group 随 Radio 核对；ThemeProvider、主题 tokens、图标数据及工具没有独立材质表面。

原生统一消费 GlassLayer 的系统 regular 默认，不额外叠加浅／深底色或 tint。Web 为 CSS 近似；无能力时采用主题半透明渐变，减少透明度时回退实色。透明度不能施加于原生玻璃或其祖先，前景淡化容器保持稳定。

## 完整组件清单

| 类别与数量              | 完整组件清单                                                 | 结论与实际依据                                                                                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 材质基础（1）           | GlassLayer                                                   | 已采用系统 regular 默认、原生默认不附加 tint；Web 为轻量近似，无能力时使用主题半透明渐变，减少透明度时使用主题实色。`src/components/ui/GlassLayer/GlassLayer.tsx`、`.web.tsx`、`useReducedTransparency.ts`。                                                                                                                          |
| 中性动作（3）           | Button、IconButton、Chip                                     | Button secondary 与 glass、IconButton 所消费的对应 ButtonBase 分支、交互 Chip 直接使用共享系统材质。primary/danger 保留语义色，纯 text/ghost/neutral 无底色动作不强造背景；静态 Chip 保留标签内容语义。依据 `Button/ButtonBase.tsx`、`Chip/Chip.tsx` 的 Pressable 与 busy/disabled 路径。                     |
| 导航与分段（4）         | NavBar、Tabs、TabBar、Segmented                              | NavBar default 与 Tabs 已直接补默认 GL；NavBar brand 保持品牌色，transparent 保持明确透明契约。TabBar/Segmented 默认 glass，Segmented 保留显式 solid。依据各目录组件、styles 和 types；不新增色彩配置。                                                                                                       |
| 搜索与数值动作（2）     | Search、Stepper                                              | Search 在 TextFieldBase 的搜索可视面补默认材质，文本状态仍由原 controller 持有。Stepper 已以单一 GL 托住原视觉条；md/sm 的至少 44pt 命中框和 xs dense 例外、min/max、adjustable 回调均不变。依据 `Search/Search.tsx`、`TextField/TextFieldBase.tsx`、`Stepper/Stepper.tsx`、`Stepper/layout.ts`。             |
| 开关（1）               | Switch                                                       | 自定义 32×20 语义轨道、16×16 共享材质滑块，保留原 Reanimated 插值、受控 onChange、checked/disabled 与 44pt 命中框。轨道与滑块分层；禁用只淡化轨道，材质祖先保持 alpha 1。依据 `Switch/Switch.tsx`、`.web.tsx`、`styles.ts`。                                                                                  |
| 浮动反馈与动作内容（4） | ToastHost、ConfirmHost、ActionMenuContent、TextEntryContent  | 已有 GL：Toast 与确认表面、ActionMenu 的 dialog/sheet/popover、TextEntry 的 compact。普通 TextEntry card 是编辑内容区域，保留实底。Toast/Confirm 原交付、owner、计时、取消和旧回调判定不因材质重建。原生效果祖先 alpha 必须为 1，淡出仅在独立前景。依据各目录渲染与 store/host 调用链。                       |
| 媒体上的浮动控制（2）   | ImagePreview、Carousel                                       | ImagePreview 计数/删除已补；图片画布不玻璃化。Carousel 此次只给既有 `overlay-bottom-right` Pagination 增加 GL 胶囊；独立 bottom 指示器、slide、onPressItem、ref/自动播放都不变。依据 `ImagePreview/ImagePreview.tsx`、`Carousel/Carousel.tsx`。                                                               |
| 底部工具区与入口（2）   | Sheet、EntryCard                                             | Sheet footer 默认 glass，正文 contentRegion 保留实底，避免父级实底覆盖 footer 背景。EntryCard 此次已默认 GL，只有文字/图标前景随按压淡化，前景 `collapsable=false`；入口 onPress 与可访问名称不变。依据 `Sheet/Sheet.tsx`、`EntryCard/EntryCard.tsx`。                                                        |
| 独立信息胶囊（2）       | GlassStats、VersionPill                                      | GlassStats 已复用 GL clear；VersionPill 此次补默认 GL，状态点及文字保持 status 语义、无新增动作。依据 `business/GlassStats/GlassStats.tsx`、`business/VersionPill/VersionPill.tsx`。                                                                                                                          |
| 正文与数据容器（7）     | Card、Cell、List、Form、FormGroup、FormRow、Grid             | 保留内容表面。Card 有媒体裁切/内容填充；Cell/List 承载正文、描述和嵌入控件；Form 系列承载标签、错误和编辑区域；Grid 承载项目内容。不能仅因有 onPress 就把整片内容变成玻璃。真实共享导航入口由 EntryCard 处理。依据各目录 render、布局与内容 props。                                                           |
| 正文输入（4）           | Input、PasswordInput、Textarea、SmsField                     | 保留清晰输入表面。它们通过 TextFieldBase 提供编辑、焦点、选区、错误及 SMS 插槽；Search 的搜索工具语义单独采用材质，不把长正文编辑、密码与验证码一并变为透明内容。依据 `Input/Input.tsx`、`PasswordInput/PasswordInput.tsx`、`Textarea/Textarea.tsx`、`SmsField/SmsField.tsx`、`TextField/TextFieldBase.tsx`。 |
| 状态图形与标签（5）     | Checkbox、Radio（含 Group）、Tag、Ribbon、StatusDot          | 保留状态形状和语义色。Checkbox/Radio 的小型选中图形、Tag/Ribbon 的状态/类别色、StatusDot 的状态点本身是内容标识，不应新增独立玻璃壳。依据各目录状态映射与 styles；玻璃不替代 selected/checked/tone。                                                                                                          |
| 头像与媒体（4）         | Avatar、AvatarGroup、AvatarWithRing、Thumbnail               | 保留图片、首字 fallback、组内数量和环形标识。AvatarGroup 的数量入口仍是头像内容的一部分，不遮盖或模糊媒体本体。依据对应组件和共享 ImageAttempt/useImageSource。                                                                                                                                               |
| 品牌内容（2）           | DrawerHeader、Logo                                           | DrawerHeader 是明确的品牌橙面板，含头像/姓名；Logo 是品牌图形。保留品牌语义，不为统一材质去色。依据 `DrawerHeader/DrawerHeader.tsx`、`styles.ts`、`Logo/Logo.tsx`。                                                                                                                                           |
| 图标与空态（2）         | Icon、Empty                                                  | Icon 是图形原子；Empty 是插图、标题和说明。它们无独立浮动操作面，不新增玻璃。依据 `Icon/Icon.tsx`、`Empty/Empty.tsx`。                                                                                                                                                                                        |
| 反馈图形与动画（6）     | CircularProgress、Spinner、Skeleton、Pulse、PulseDot、Reveal | 保留进度、占位与内容动画职责；不把环/线/点本体变成材质。Reveal 会淡入整个 children，**不可包在原生 GlassLayer 的祖先位置**；实际示例当前只包 Text，未发现其在库示例中包裹现有玻璃的调用。依据各目录渲染与 `example/src/showcases/feedback/FeedbackScene.tsx`。                                                |
| 背景装饰（3）           | GradientWash、RadialHalo、ScreenBackdrop                     | 它们生成背后可见的渐变/光晕/背景，保留其内容；不把背景本身替换成采样背景的玻璃。依据 `business/Decorations/`。                                                                                                                                                                                                |

数量：21 个有材质职责的组件，33 个保留内容、状态和图形职责的组件，共 54 个。嵌在 Card 中的控件会自然采样 Card 背景；不为显示更远底图而移除正文背景。调用方自行添加的 opacity／Reveal 祖先仍受原生限制。

## 跨库落点

- Chat：card Composer、更多菜单、悬浮返回、图片删除及中央上传／处理／重试圆层；Suggestions 消费默认 Chip，Confirmation 等消费默认 secondary。Message 失败态仅淡化自有正文，外部玻璃附件与确认内容不再置于整体淡化祖先中；Process 状态及实现不在本任务改动范围。
- Camera：11 个内部材质位置，包含模式选择、侧栏、翻转、缩放、预览顶部及普通操作、录制计时、Toast、局部错误条、水印处理中提示；录制／危险语义、取景与成片保持。
- HMS Scan：工具栏、结果浮卡及失败浮层；取景、提示文字、扫描标记和整页权限／错误说明保持各自职责。
- Umeng：modal／floating 共用分享面板材质，平台行透出唯一外壳，取消消费 secondary；SDK 目标发现和分享结算不变。

各库完整内部清单同步到对应架构合约；本清单不是发布或设备验收凭据。

## 验证入口

实际组件测试位于 example，覆盖控制值、busy／disabled、清除提交、44pt命中、材质祖先、主题及系统回退；既有库测试保持各单元逻辑边界。Web 使用实际文档站与浏览器；原生场景和真实系统偏好操作在 `manual-tests/liquid-glass`，截图对应构建与源码记录独立留存。原生构建、模拟器、旧系统／Android、物理设备、npm发布与下游应用采用分别记录。
