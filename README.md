# @unif/react-native-design

Unif 设计系统 —— theme + icons + utils + components,面向 React Native 0.85 新架构(Fabric + concurrent React)。

📖 **文档站**:[unif-design.github.io/react-native-design](https://unif-design.github.io/react-native-design/)
📦 **npm**:[@unif/react-native-design](https://www.npmjs.com/package/@unif/react-native-design)

## 安装

```sh
yarn add @unif/react-native-design
```

需要在宿主工程提前安装的 peer dependencies:

```sh
yarn add react-native-svg react-native-gesture-handler react-native-reanimated \
  react-native-worklets react-native-safe-area-context \
  react-native-reanimated-carousel @gorhom/bottom-sheet @sbaiahmed1/react-native-blur
```

## 用法

在 app 根附近挂一次 `ThemeProvider`,并按需挂载命令式 host:

```tsx
import { ThemeProvider, ToastHost, ConfirmHost } from '@unif/react-native-design';

export function App() {
  return (
    <ThemeProvider>
      {/* ...你的导航 / 屏幕... */}
      <ToastHost />
      <ConfirmHost />
    </ThemeProvider>
  );
}
```

组件内通过 `useThemedStyles` 拿当前主题的 `StyleSheet`:

```tsx
import { Button, useThemedStyles, type ColorTokens } from '@unif/react-native-design';
import { View } from 'react-native';

// makeStyles 必须定义在模块顶层,不要写在组件里 inline
const makeStyles = (c: ColorTokens) => ({
  wrap: { padding: 16, backgroundColor: c.surface },
});

export function Demo() {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      <Button label="保存" onPress={() => {}} />
    </View>
  );
}
```

命令式 API:

```tsx
import { toast, confirm } from '@unif/react-native-design';

toast.success('已保存');

const ok = await confirm({
  title: '确认注销账号?',
  message: '注销后数据无法恢复',
  destructive: true,
});
```

## 包结构

- **theme** —— `ThemeProvider` / `useTheme` / `useColors` / `useShadow` / `useThemedStyles`,以及 color / shadow / type / space / radius / icon / control / motion 等 token,`r` / `rf` 尺寸 & 字号缩放
- **icons** —— `IconName` 联合类型 + `ICONS` 数据(用 `<Icon name="..." />` 渲染)
- **components/ui** —— 原子组件:Button、Card、Cell、NavBar、BottomSheet、Toast、Confirm、Input、Search、Tabs、Switch 等约 37 个
- **components/business** —— 通用业务复合组件:AvatarWithRing、Decorations、GlassStats、VersionPill(耦合 navigation / store 的组件留在消费者仓库)
- **utils** —— `createLogger(scope)` 日志器、`childTestID` 列表型组件 testID 拼接助手

## Example

`example/` 是接通本库的 RN 宿主应用:

```sh
yarn
yarn example start         # metro
yarn example ios           # 或 yarn example android
```

源码改动会通过 Metro monorepo 配置直接热更新,不需要重新构建原生。

## 贡献

- [开发流程](CONTRIBUTING.md#development-workflow)
- [提交 PR](CONTRIBUTING.md#sending-a-pull-request)
- [行为准则](CODE_OF_CONDUCT.md)

## License

MIT
