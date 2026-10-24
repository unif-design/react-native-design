# 原生降级控件表面局部优化

基线：Design `v1.12.0` / `a75ecca`，分支 `codex/fallback-control-surfaces`。本次仅调整 Android、旧 iOS 或减少透明度时的底色、边界与轻阴影；保留原型结构、尺寸、业务交互、iOS 原生玻璃和 Web 外观。

## 实现与消费者

- `GlassLayer/useGlassFallback` 内部共用原生支持与现有减少透明度偏好，不扩展公共 API、不新增偏好状态；Web 平台入口保持既有 CSS 玻璃处理。
- `ButtonBase` 的 IconButton glass/secondary（含确认态）降级底由 `surfaceContainerHighest` 改为 `surfaceContainerHigh`。文字按钮原规则、原生材质、Web 减少透明度表面及44pt命中区保留。fallbackColor只在材质层回退时读取，因此ButtonBase按native/Web静态选择颜色，不订阅系统偏好；实际材质变化仍由GlassLayer处理。
- `Cell/Leading` 的 flush 默认图标容器按同一条件采用中性底；原生玻璃可用时/Web保留品牌底，危险前景、自定义leading与图片头像保留。
- `TextFieldBase` 在既有外壳上增加主题 surface、空值中性细边界和 subtle 阴影；Input、PasswordInput、SmsField、default Textarea及 TextEntryContent compact共享。焦点/填写/错误边界、禁用前景与受控值保留，plain Textarea、Search与Web不加装饰。

## 验证

本机 Node `24.19.0`（`.nvmrc` 为24.13.0，未下载或改工具链配置）。

- Portal消费者发现ButtonBase不必要订阅导致初始偏好就绪时图标重绘；两条新增回归先复现预期1次、实际2次，移除父层订阅后通过，图标21尺寸及材质切换保持，未改Portal断言。
- 测试先失败：IconButton与输入新表面10项失败，52项通过；补充Cell与Web边界后3项失败，38项通过。失败均来自旧底色不符新要求。
- 定向最终4套103项通过；完整 `yarn test --maxWorkers=2 --coverage`：example门禁50套539项通过，库与example合计104套1221项通过，statements/branches/functions/lines均100%。
- 完整 `yarn lint`、`yarn typecheck`、`yarn prepare` 通过；lint保留6条已有no-shadow warning。
- llms生成器测试、Website typecheck与build通过；Website保留react-native-svg的TurboModuleRegistry导出warning。
- 现有TextEntryContent compact测试原先假定外壳恒透明，与本次降级表面规则冲突；改为原生/降级两组，保留品牌焦点及选区色，分别验证其原透明表面和新surface/中性边界。

图标重绘失败证据为 `/private/tmp/design-fallback-no-rerender-red.log`。

证据日志位于 `/private/tmp/design-fallback-{red,cell-web-red,green,lint,typecheck,test,build,llms-test,website-typecheck,website-build}.log`。

本地完整tarball用于Portal真机对照；未提交、推送或发布。设备效果、Android阴影与旧iOS实际像素、iOS26玻璃保持由主任务分别验收，自动化覆盖不代替设备结果。
