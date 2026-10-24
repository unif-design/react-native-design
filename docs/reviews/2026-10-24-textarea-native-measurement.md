# iOS Textarea 独立文字测量

## 已确认问题与归属

Portal 的同一原生输入实例先真实键入并发送清空，再通过应用麦克风接收62字完整语音结果。Admin iOS16持续只有单行；Android同服务端文本可正常增高。匿名诊断 `multiline-after-native-input.json` 的末三条分别为valueLength62且editable=true、TextInput框285.6667×17.6667、原生contentSize285.6667×71。它证明值完整且原生内容尺寸正确，旧Yoga框高没有满足Textarea自动增高契约，不能把源码/单测通过当成真实布局通过。

Design Textarea拥有真实输入宽度、文字与表面内边距，因此测量修复留在本组件。Chat保留输入实例，仅以absolute+opacity隐藏录音期间的普通输入；本次不改变Chat布局、语音状态或Portal草稿。

## 测量闭环

RN0.88的RCTUITextView.contentSize取真实内容尺寸与placeholder尺寸，不按frame.height截断；但Fabric RCTTextInputComponentView只在updateLayoutMetrics内交付contentSize变化，而MountingManager只在layoutMetrics变化时调用该方法。因此它可交付正确71，却不能保证固定TextInput框后后续长短/清空仍有事件。只把事件回写height的实验已撤回，未提交。

iOS平台hook改用与TextInput同一字体、allowFontScaling、maxFontSizeMultiplier、换行策略和实际可用宽度的原生Text独立测量真实行边界；测量节点绝对定位、透明、不接收点击、不进入可访问树，不增加包装层。整段行底向上取整避免末行亚点裁剪，再按本表面的真实min/max减内边距限位。空值与末尾换行的零宽测量标记仅存在于装饰节点，不写回原输入值。

测量key包含文本、宽度与字体配置；只给装饰Text设置该React key，旧native tag事件不能交付给新签名监听器，闭包guard同时拒绝旧回调，新key不复用旧高度。真实TextInput不设key、不重挂载。重复有效测量不触发多余更新。原TextInput的value、ref、焦点/选区、原生滚动能力、onChangeText、onContentSizeChange等接线保留，原本undefined的内容事件不会因测量而变成订阅。Android自然测量和Web scrollHeight路径保持。

## 验证边界

- 初始回归5项失败、1项既有行为通过；独立测量实现后相关5套32项通过，覆盖真实71pt事件与旧单行框的区别、连续长短长/清空、末尾空行/placeholder、旧文本/宽度/字体回调、禁用、min/max、原值/选区/节点、外部内容事件与Android自然路径。
- 测量节点身份回归先1项失败、6项通过，增加仅装饰Text的稳定React key后通过；值/宽度/字体变化替换测量节点但保持原TextInput。
- 完整本地105套1228项，库与example四项coverage均100%；完整lint、typecheck与Bob构建通过，保留6条既有no-shadow warning。本地Node24.19.0。
- RNTL只证明原生事件到布局状态的接线，不能证明设备真的发出正确行测量。初始独立测量候选SHA256为`21e9011acc64e9f23c541708c0263261f9120763edcf504e397a22941eaa8e4f`；独立审查发现native旧tag事件可能调用新props监听器，补入测量节点身份隔离后，当前r2完整npm包SHA256为`614b2661e6e08cb6f23deec771e12cc7756d3f2157fc8e14c9e5ad48f55d22c2`；基于已提交视觉修复627b4a7。本文记录本地候选阶段，正式提交、完整CI和发布结果以PR182及主任务交付记录为准。
- 测量节点身份修复独立补审已通过；真实ASR、长短长/清空、字号、宽度、最大高度后滚动与焦点保持由主任务设备验证，新head完整CI另验。本地候选证据不代替设备与正式发布。
