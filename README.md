# @unif/react-native-design

Unif 的 React Native 设计系统，提供基础组件、主题、字体和通用 UI 组合。图标直接使用 `@unif/react-native-icons` 的命名组件。

[文档站](https://unif-design.github.io/react-native-design/) · [npm](https://www.npmjs.com/package/@unif/react-native-design) · [组件展厅](example/README.md)

## 接入要求

仅支持 React Native 新架构（Fabric + TurboModules）。

| 依赖         | 声明支持范围       | 本仓开发／验证基线 |
| ------------ | ------------------ | ------------------ |
| React Native | `>=0.86.0`         | `0.88.0`           |
| React        | `>=19.2.3 <20.0.0` | `19.3.0`           |

声明范围来自 [package.json](package.json)；基线列表示本仓采用的验证组合，不代表范围内所有组合均已验证。其他 peer 依赖、Node.js 要求和配置见[接入指南](website/docs/getting-started.md#环境要求)。

iOS 构建需要 Xcode 26+。Expo 工程需要开发构建，Expo Go 不支持本库使用的原生玻璃模块。

## 安装

1. 安装组件库：

   ```sh
   yarn add @unif/react-native-design
   ```

2. 按[安装配置](website/docs/getting-started.md#安装依赖)安装全部 peer 依赖，完成 Worklets／Babel 和原生配置；iOS 安装 Pods 后重新构建应用。

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

组件继承主题与应用字号。需要命令式提示或确认时，再接入 [ToastHost](website/docs/components/toast.mdx) 或 [ConfirmHost](website/docs/components/confirm.mdx)。

## 按需阅读

| 想做什么             | 入口                                            |
| -------------------- | ----------------------------------------------- |
| 查组件与 API         | [组件索引](website/docs/components/overview.md) |
| 运行展厅             | [example](example/README.md)                    |
| 验证场景与平台行为   | [展厅指南](example/GUIDE.md)                    |
| 在应用里编写测试     | [测试接入](website/docs/testing.md)             |
| 修改库或了解目标架构 | [开发资料](docs/DEVELOPMENT.md)                 |

[AI 文档索引](https://unif-design.github.io/react-native-design/llms.txt) · [研发技能](https://github.com/unif-skill/unif-portal-dev-skills) · [MIT 许可](LICENSE)
