# @unif/react-native-design

Unif 的 React Native 设计系统，提供基础组件、主题、字体、图标和通用 UI 组合。

[文档站](https://unif-design.github.io/react-native-design/) · [npm](https://www.npmjs.com/package/@unif/react-native-design) · [组件展厅](example/README.md)

## 安装

```sh
yarn add @unif/react-native-design
```

按[接入指南](website/docs/getting-started.md)安装 peer 依赖并完成原生与 Worklets 配置。支持范围见 [package.json](package.json)，本库面向 React Native 新架构。

## 快速开始

应用根接入主题、手势和安全区，再从包根导入组件：

```tsx
import { Button, ThemeProvider } from '@unif/react-native-design';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Button label="保存" onPress={() => {}} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

需要 Toast 或 Confirm 时再接入对应 Host。组件继承主题与应用字号；主题 API、组件参数和宿主配置见文档站。

## 按需阅读

| 想做什么             | 入口                                            |
| -------------------- | ----------------------------------------------- |
| 查组件与 API         | [组件索引](website/docs/components/overview.md) |
| 运行展厅             | [example](example/README.md)                    |
| 验证场景与平台行为   | [展厅指南](example/GUIDE.md)                    |
| 在应用里编写测试     | [测试接入](website/docs/testing.md)             |
| 修改库或了解目标架构 | [开发资料](docs/DEVELOPMENT.md)                 |

[AI 文档索引](https://unif-design.github.io/react-native-design/llms.txt) · [研发技能](https://github.com/unif-skill/unif-portal-dev-skills) · [MIT 许可](LICENSE)
