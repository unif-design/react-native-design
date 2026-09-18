# Design 组件展厅

通过包根 API 查看基础组件、主题和常见交互。示例消费当前工作区源码。

## 运行

从仓库根目录执行：

```sh
yarn install --immutable --mode=skip-build
yarn example start
```

iOS Pods、目标设备及构建入口见[运行与验证指南](GUIDE.md)。常规构建和完整测试由 CI 执行。

## 可以查看什么

展厅包含基础能力、操作、反馈、表单、导航、容器、媒体和复合组件八类场景；每个场景展示主要状态和交互。

在“基础能力与图标”中可切换浅色／深色及应用字号。减少动态效果跟随系统设置；组件接收当前根主题。

## 继续阅读

- [场景与验收指南](GUIDE.md)：场景索引、图片样本、主题字号和平台核对项。
- [公开组件](../website/docs/components/overview.md)：逐组件 API。
- [开发资料](../docs/DEVELOPMENT.md)：架构依据和定向验证入口。

自动化、模拟器与真机结果分别记录，展厅不预先声明任何平台已通过验收。

快速核对当前 example 配置与说明可运行 `node scripts/verify-example-showcase.mjs --check`。校验器完整回归及全量测试由 CI 按变更范围执行。
