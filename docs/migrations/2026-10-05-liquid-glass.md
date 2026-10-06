# 玻璃材质迁移

本次以 0.34.0 为基线直接升级公开 API，不保留旧接口或兼容别名。版本号由 PR 合并后的 Release 工作流生成，实际发布结果以 CI、GitHub Release 和 npm 记录为准。

| 迁移前                          | 当前源码                                          |
| ------------------------------- | ------------------------------------------------- |
| `BlurLayer` / `BlurLayerProps`  | `GlassLayer` / `GlassLayerProps` / `GlassEffect`  |
| `intensity="soft"` / `"strong"` | `effect="clear"` / `"regular"`；默认 `regular`    |
| `tint`                          | `tintColor`，采用 React Native `ColorValue`       |
| 公开 `blur` / `BlurIntensity`   | 移除；Web 近似参数留在组件内部                    |
| 原生模糊加 tint                 | iOS 26+ 原生 Liquid Glass；不支持时半透明主题背景 |

底层采用已核实的 `@callstack/liquid-glass@0.8.2` 公开 API。peer 范围限定为 `>=0.8.2 <0.9.0`；根库、example 与 website 使用同一精确版本。Web 保留原有 CSS 近似效果；不提供独立原生模糊能力。

`GlassStats` 使用 `clear` 并向玻璃层传入自身圆角。Feedback 展示 `clear/regular`、自定义 `tintColor` 与主题切换；Foundation 不再展示已移除的 blur token。示例目录、状态记录和校验脚本与公开入口同步。

Jest preset 替换原生 Liquid Glass 边界，默认使用不支持标记。测试分别覆盖支持与降级、主题、tint、布局和真实消费者；这些替身不能证明原生视觉效果。iOS 需 Xcode 26+、重新安装 Pods 和构建；Expo Go 不支持此模块。当前组件契约见 [GlassLayer 文档](../../website/docs/components/glass-layer.mdx)。

本次变更通过独立分支和 PR 交付，由 CI 发布。Portal 与其他外部消费者在采用新版时需要直接调整导入、props 和原生依赖；Portal 消费升级另行处理。历史 spec、plan 与 review 保留当时的问题依据；当前玻璃契约以本记录及组件源码、文档为准。

## 验证记录（2026-10-05）

本地使用 Node 22.23.3、RN 0.86.3、Xcode 27 / iPhoneSimulator SDK 27。实际结果：

| 验证                                   | 结果                                                                                     |
| -------------------------------------- | ---------------------------------------------------------------------------------------- |
| 根库与 example 类型检查                | 通过，包括新 API 合法调用及旧参数拒绝                                                    |
| 根库与 example Lint                    | 0 错误；原有 shadow 命名警告分别 6 / 1 项                                                |
| 库完整测试                             | 54 套，658 个测试通过                                                                    |
| example 正式完整测试                   | 24 套，188 个测试通过，9 个受治理场景与执行集合门禁完成                                  |
| 脚本门禁测试                           | 101 个通过，含 Jest 入口、依赖和展示契约                                                 |
| config、icons、runtime peers、展示契约 | 通过；RNRC / RNGH 既有 peer 例外仍被原检查识别                                           |
| Yarn immutable 安装                    | 通过；保留既有 ESLint / RNGH peer 警告                                                   |
| Bob 构建与打包消费面检查               | 通过；包含新 native/Web 模块及声明，无旧组件文件、旧 token 文件或旧依赖引用              |
| Website 构建与 llms 生成契约           | 通过；生成页面版本同步当前 0.34.0 源码                                                   |
| 浏览器真实预览                         | 1280 / 390px、light / dark；两档 CSS、3 个 GlassStats 预览、无页面运行错误与页面横向溢出 |
| Android 原生构建                       | `yarn example build:android` 通过（arm64-v8a）                                           |
| iOS 原生构建                           | Xcode 27 默认 Debug 模拟器构建通过，无部署版本或签名覆盖参数；远端 CI 未执行             |

RN 0.86.3 和 example 主 target 的最低 iOS 版本都是 15.1；12.4 来自 RNSVG Podspec 创建的资源 bundle target。Xcode 27 将这个旧配置判为构建错误。现已在 example 的 Podfile `post_install` 中，只将低于 `min_ios_version_supported` 的资源 bundle 提升到 RN 要求，保留已经更高的版本。

重新安装后，RNSVG library 与 RNSVGFilters bundle 的 Debug / Release 都为 15.1；检查器同时解析 app、Pods 的 target、项目和 xcconfig 继承值。以下默认构建通过，仅增加日志和产物目录参数，不再覆盖部署版本或签名设置：

```sh
yarn example build:ios --verbose --buildFolder /tmp/unif-glass-ios-build
```

在 example 目录执行 `bundle exec ruby ios/check-deployment-targets.rb` 可复查最低版本；检查器对低于 RN 要求或无法解析的配置返回非零退出码。

RN Core 的远程下载长时间停滞，安装时在临时下载适配中复用同一官方归档，SHA1 与官方响应一致；最终恢复默认 Podspec 下载 URL、构建阶段与原 RN Core 锁文件校验值。锁文件保留 LiquidGlass 替换旧 blur Pod 以及上述 Podfile 修正的校验值变化。

本机 Ruby 3.3 无法采用锁中要求 Ruby `<3.2` 的 CFPropertyList 3.0.9，CocoaPods 验证使用临时 Gemfile 的 3.0.8；工程 Gemfile.lock 保持原样。此工具环境差异如实保留，未宣称远端 CI 已通过。

未执行：iOS 26+ 与旧 iOS、Android 的设备视觉、真实读屏与系统减少透明度验收，以及 Portal 消费新版的联调。Jest 降级覆盖与原生编译不能代替这些设备结果。
