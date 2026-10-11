---
sidebar_position: 5
title: 图标
description: '预览常用图标，直接使用 Unif Icons 独立图标组件。'
---

<!-- Generated from @unif/react-native-design; edit source documentation. -->

# 图标

图标使用独立的 `@unif/react-native-icons` 包。每个图标都是可直接导入的 React 组件，采用 `Outlined`、`Filled` 等风格后缀。

本页保留常用预览，点击即可复制组件代码。[查看全部图标](https://unif-design.github.io/react-native-icons/#icons)请前往 Unif Icons 官网。

<IconCatalog />

## 在 RN 中使用

```sh
yarn add @unif/react-native-icons react-native-svg
```

```tsx
import {
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@unif/react-native-icons';
import { useColors } from '@unif/react-native-design';

function Demo() {
  const c = useColors();
  return (
    <>
      <SendOutlined size={20} color={c.foregroundMuted} />
      <CheckOutlined size={18} color={c.success} />
      <CloseOutlined size={14} color={c.foregroundSubtle} strokeWidth={2} />
    </>
  );
}
```

独立图标不会自动读取 Design 主题；需要跟随主题时，像上例一样显式传入 `useColors()` 提供的颜色。也可以直接传入颜色值，在不使用 Design 的项目中单独使用。

使用已有图标无需处理 SVG 文件或运行生成脚本。宿主尚未接入 `react-native-svg` 时，按 [Icons 安装指南](https://unif-design.github.io/react-native-icons/docs/getting-started)完成原生依赖接入。

## 常用属性

| 属性          | 默认值   | 说明                             |
| ------------- | -------- | -------------------------------- |
| `size`        | `24`     | 宽高，使用逻辑像素，不做隐式缩放 |
| `color`       | `'#000'` | 描边与实心图元颜色               |
| `strokeWidth` | `1.75`   | 描边宽度，纯实心图元不受影响     |
| `style`       | —        | SVG 样式                         |
| `testID`      | —        | SVG 测试标识                     |

完整属性、单图标导入和无障碍说明见 [Icons 组件 API](https://unif-design.github.io/react-native-icons/docs/api)。

## 图标维护

新增图标、绘制规则和组件生成统一参考 [Icons 维护指南](https://unif-design.github.io/react-native-icons/docs/contributing)。

## 头像

头像使用 [Avatar 组件](avatar.md)，可展示文字或图片；图标使用 Icons 的独立组件。
