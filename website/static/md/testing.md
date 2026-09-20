---
slug: /testing
sidebar_position: 9
title: 在宿主工程里测试
description: '通过公开 Jest preset 测试 Design 组件，并排查常见接入问题。'
---

<!-- Generated from @unif/react-native-design@0.32.2; edit source documentation. -->

# 在宿主工程里测试

Design 提供 Jest preset 和 setup，用于接入 React Native 与相关依赖的测试替身。被测 Design 组件仍使用真实实现。

## 最小接入 {#最小可用配方}

安装与项目 React／React Native 版本匹配的测试依赖：

```sh
yarn add -D jest @react-native/jest-preset @react-native/babel-preset @babel/core \
  @testing-library/react-native react-test-renderer
```

```js
// jest.config.js
module.exports = { preset: '@unif/react-native-design/jest-preset' };
```

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '@unif/react-native-design';

test('点击保存触发回调', () => {
  const onPress = jest.fn();
  render(<Button label="保存" onPress={onPress} />);
  fireEvent.press(screen.getByRole('button', { name: '保存' }));
  expect(onPress).toHaveBeenCalledTimes(1);
});
```

## 选择入口 {#入口替你做了什么}

| 入口                                    | 内容                                      | 适用情况                                          |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------- |
| `@unif/react-native-design/jest-preset` | RN preset、resolver、转换范围与 peer mock | 常规接入                                          |
| `@unif/react-native-design/jest-setup`  | peer mock                                 | 已有自定义 preset，需自行维护 resolver 和转换范围 |

实现见 [jest-preset.js](https://github.com/unif-design/react-native-design/blob/main/jest-preset.js)、[jest-resolver.js](https://github.com/unif-design/react-native-design/blob/main/jest-resolver.js) 与 [jest-setup.js](https://github.com/unif-design/react-native-design/blob/main/jest-setup.js)。它们随依赖更新维护，文档不再复制整份实现。

## 编写断言 {#怎么写断言}

优先按角色和可访问名称查询，核对事件与状态：

```tsx
const node = screen.getByRole('switch', { name: '接收通知' });
expect(node.props.accessibilityState).toMatchObject({ checked: false });
```

Checkbox／Radio／Switch 使用 `checked`；Tabs／TabBar／Segmented 使用 `selected`。命令式 Toast／Confirm 需要在测试树中挂载对应 Host 和 SafeAreaProvider；涉及定时器时使用 fake timers。

## FAQ

### 找不到 RN preset，该安装哪个包？

`@react-native/jest-preset` 由宿主作为开发依赖安装。确认包存在且版本与当前 React Native 对齐；缺少依赖与本库 preset 导出错误分别排查。

### 为什么报 Unexpected token 或原生模块未初始化？ {#每一条为什么必需}

| 现象                                                                        | 检查项                                                 |
| --------------------------------------------------------------------------- | ------------------------------------------------------ |
| `Unexpected token 'export'`／`Cannot use import statement outside a module` | 实际 Jest 配置是否采用 preset 的转换范围               |
| `loadUnpackersWithCode`／`Native part not initialized`                      | Worklets mock 与 resolver 是否被覆盖                   |
| RNGH／Reanimated 接口缺失或 cleanup 访问 `.value` 失败                      | 是否绕过了本库 setup，直接替换成另一份 Reanimated mock |
| SafeAreaProvider 子树未渲染                                                 | 是否接入 safe-area-context 的测试替身                  |
| RN 深路径无法解析                                                           | 是否覆盖了 preset 的组合 resolver                      |

### 已用了 preset，为什么仍报 useAnimatedStyle 错误？ {#babel-worklets-插件}

如果错误为 `useAnimatedStyle was used without a dependency array or Babel plugin`，检查实际转译 Design 的 Babel 配置是否包含 `react-native-worklets/plugin`。独立测试配置、测试环境分支和 node_modules 专用转换配置都需要核对；Jest preset 不替应用配置 Babel。

### 为什么 testID 查询不到装饰组件？ {#纯视觉组件要开-includehiddenelements}

Icon、Spinner、Skeleton 等装饰内容对读屏隐藏。确实需要查询其测试节点时显式包含隐藏元素：

```tsx
screen.getByTestId('save-icon', { includeHiddenElements: true });
```

### 需要挂 ThemeProvider 吗？ {#要不要包-themeprovider}

测试树宜与应用宿主保持一致。验证暗色或字号时显式传入 ThemeProvider；省略时库使用亮色 fallback 并给出开发诊断，这不代表应用主题接入已经完成。

### 如何测试 Toast 和 Confirm？ {#测-toast--confirm}

挂载对应 Host，并通过 SafeAreaProvider 提供安全区。触发、点击和定时推进放在 `act` 中，断言可见内容与实际结果；不要用真实等待代替定时器控制。

### 已有自己的 preset，如何接入？ {#不使用入口时的手工等价物}

可在 `setupFilesAfterEnv` 加入 `@unif/react-native-design/jest-setup`，再按当前 preset 源码核对 resolver 与转换范围。不要把旧版配置整份复制后长期独立维护。

### Carousel 出现 act 警告，可以直接忽略吗？

先核对异步更新、计时器及当前 Carousel／Worklets mock 组合，区分测试遗漏和依赖行为。断言通过不代表警告已解决；未处理的问题应与验证结果一起记录。

## 验证范围 {#边界}

Jest 验证调用与合成事件后的状态。真实手势、系统动效偏好、VoiceOver／TalkBack、网络图片与原生解码在相应平台验证。
