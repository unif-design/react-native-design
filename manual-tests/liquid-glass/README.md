# Liquid Glass 原生截图场景

本目录只用于已授权的模拟器验证，不进入示例 App 路由，不修改生产组件。场景从 `@unif/react-native-design` 包根消费真实组件；SDK 支持标记取自 `@callstack/liquid-glass`，减少透明度取自 RN `AccessibilityInfo`。

## 场景与交互

通过 app 启动参数 `-glassScene <scene> -glassScheme light|dark` 选择画面。

| scene                  | 验证内容                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| controls               | 默认交互 Chip、Search、secondary Button、Stepper、Switch；禁用和忙碌保护、真实输入与切换 |
| navigation             | 默认 NavBar、Tabs、EntryCard、VersionPill 与浮动 Carousel 页码                           |
| sheet                  | 内容实色与头尾系统材质、页脚真实动作                                                     |
| overview               | glass Button、IconButton、Segmented、TabBar；点击和受控选择结果                          |
| menu-top / menu-bottom | 上／下箭头浮菜单；实际点击“删除聊天”进入单一“删除”确认                                   |
| text                   | compact TextEntry，取消交付                                                              |
| toast                  | 真实 ToastHost 的居中成功提示                                                            |
| toast-lifecycle        | 默认 3 秒时长；真实点击触发首次、显示期间替换、退场后重新挂载提示                        |
| confirm                | 真实 ConfirmHost 的删除确认与取消交付                                                    |
| image                  | ImagePreview 的双图计数；图片是本地 1px PNG 测试资源                                     |

画面背景使用固定色块，供观察材质取样、箭头接缝及减少透明度后的实色。它不是产品页面或图片质量示例。

## 独立构建与运行

1. 从 `example/` 的 Release 原生宿主创建系统临时副本。保持相同 RN 和原生依赖版本，使用独立 DerivedData，bundle ID 为 `unif.design.glassvalidation`。不得覆盖正在使用的 App、设备或 Metro。
   iOS 27 要求 Scene 生命周期；本目录 `AppDelegate.swift` 是临时宿主模板。采用它时，临时 `Info.plist` 的 `UIApplicationSceneManifest` 应关闭多窗口，并为 `UIWindowSceneSessionRoleApplication` 配置 `UISceneConfigurationName=Glass Validation`、`UISceneDelegateClassName=$(PRODUCT_MODULE_NAME).GlassSceneDelegate`。不要借验证直接修改仓库的生产 example 宿主。
2. 在本仓 `example/` 目录打离线 JS 包，不启动 Metro：

   ```sh
   node ../node_modules/react-native/cli.js bundle \
     --platform ios --dev false \
     --entry-file ../manual-tests/liquid-glass/index.js \
     --config metro.config.js \
     --bundle-output "$GLASS_OUTPUT/main.jsbundle" \
     --assets-dest "$GLASS_OUTPUT/bundle-assets"
   ```

3. 临时 Xcode 工程以 `Release`、目标模拟器架构和 `SKIP_BUNDLING=1` 构建。将上一步 `main.jsbundle` 和实际生成的 assets 放入产出的 app，再安装到本次独立模拟器。记录源码修订、JS SHA-256、SDK/runtime、实际支持标记及偏好读数。
4. 使用已安装的 CocoaPods bundle 运行 `create-ui-runner.rb <全新临时目录>`，生成独立 UI 测试工程；构建并在同一模拟器运行 `LiquidGlassScreenshots`。测试通过原生点击进入菜单确认，不注入组件内部状态。截图作为 XCTest attachments 保留，可通过 `xcrun xcresulttool export attachments` 导出。

`testSettingsNavigation` 只预检系统开关位置。`testNativeMaterials` 覆盖浅／深两套画面及点击结果。`testReducedTransparency` 在模拟器 Settings 中切换真实 Reduce Transparency 开关，确认场景读数为 `支持:true / 减少透明度:true` 后截图，并在测试退出时恢复原偏好；执行后仍应核对恢复结果。运行时关闭并行测试，`-collect-test-diagnostics never` 可跳过失败后的冗长 sysdiagnose 收集，手动添加的截图附件仍保留。

`testMenuThemeOverride` 要求系统外观为 light，定向检查组件强制浅／深主题时的上下箭头和单删除确认，避免把“应用深色”与“系统深色”当成同一个条件。

`testButtonMaterialStates` 检查点击前后、禁用和忙碌状态，并通过实际触摸确认不可用操作不交付；`testToastMaterial` 单独保留浅／深原生 Toast 图。`testFocusedReducedMaterials` 用于菜单与 Toast 变更后的实色降级复验，继续操作真实系统开关并恢复原值。

`testToastMaterialLifecycle` 在浅／深主题下点击三次：首次、3 秒内替换、退场卸载后的重新显示，分别保存提示与空闲截图。测试断言文本与卸载时序，玻璃背景是否完整仍须人工核对截图；不以文字出现代替材质验收。

`testCompleteControls` 逐项点击新增的默认材质控件，并清除、输入和提交搜索值；`testCompleteReducedMaterials` 对新场景切换真实减少透明度设置再恢复。浅深主题下必须检查小尺寸 Switch 滑块和禁用前景是否仍可辨识。

## 当前平台边界

Xcode 27 + iOS 27 下，SDK 明确忽略 `UIDesignRequiresCompatibility`（`DTPlatformVersion >= 27`），该开关不能用于证明“不支持原生玻璃”。不伪造 SDK 元数据或支持标记。本场景的减少透明度截图证明的是无障碍实色降级，不能记为旧 iOS／Android 验收。

构建成功、UI 测试断言和人工看图分别记录；箭头未被裁切、融合接缝及文字对比需要检查实际截图，不能仅凭测试退出码判定。
