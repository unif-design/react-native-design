---
sidebar_position: 5
title: 图标
description: '手绘 24×24 描边 SVG 图标系统 —— 统一绘制规则、IconName 字面量联合类型自动补全；<Icon> 刻意对屏幕阅读器隐藏，语义由承载它的可交互父组件提供。'
---

# 图标

手绘 24×24 描边 SVG。所有图标遵守同一组绘制规则。**无 icon font、无 Unicode 承载 UI、无装饰 emoji。**

目录以 `ICON_NAMES` 为完整源清单：手工语义类别按顺序展示，任何尚未归类的合法图标自动进入末尾“未分类”。顶部搜索框 `⌘K` 聚焦，点击 cell 复制图标语义名。

<IconCatalog />

## 在 RN 中使用

```tsx
import { Icon } from '@unif/react-native-design';
import { useColors } from '@unif/react-native-design';

function Demo() {
  const c = useColors();
  return (
    <>
      <Icon name="send" size={20} />
      <Icon name="check" size={18} color={c.success} />
      <Icon name="close" size={14} color={c.foregroundSubtle} strokeWidth={2} />
    </>
  );
}
```

`name` 是 TypeScript 字面量联合类型——所有图标名都有自动补全；`IconName` 由 `src/icons/data.ts` 生成（该文件 **AUTO-GENERATED，请勿手改**）。

### `<Icon>` props

来源：`src/components/ui/Icon/types.ts`、`Icon.tsx`。

| Prop          | Type                    | 默认                                | 说明                                               |
| ------------- | ----------------------- | ----------------------------------- | -------------------------------------------------- |
| `name`        | `IconName`              | —                                   | 图标语义名（字面量联合类型，自动补全）             |
| `size`        | `number?`               | `r(18)`（随设备宽度缩放）           | 宽高（正方形）；传入值应已经过 `r()` 缩放          |
| `color`       | `string?`               | `c.foregroundMuted`                 | 传给 SVG `stroke`（及 `fill="currentColor"` 元素） |
| `strokeWidth` | `number?`               | 每图标自带值（当前源统一为 `1.75`） | 覆盖描边宽度                                       |
| `style`       | `StyleProp<ViewStyle>?` | —                                   | 外层 `<View>` 样式                                 |
| `testID`      | `string?`               | —                                   | E2E / 测试定位（挂在外层 `<View>`）                |

> 未知 `name` 不抛错：打 `warn` 并渲染一个等尺寸空 `<View>` 占位（同样对 SR 隐藏）。

## 绘制规则

每个新图标必须满足：

| 属性              | 值                                                                             |
| ----------------- | ------------------------------------------------------------------------------ |
| `xmlns`           | `http://www.w3.org/2000/svg`                                                   |
| `viewBox`         | `0 0 24 24`                                                                    |
| `fill`            | `none`                                                                         |
| `stroke`          | `currentColor`                                                                 |
| `stroke-width`    | `1.75`                                                                         |
| `stroke-linecap`  | `round`                                                                        |
| `stroke-linejoin` | `round`                                                                        |
| `color`           | `<Icon>` 的 `color` prop → `stroke`，默认 `c.foregroundMuted`（不传 color 时） |
| 组件默认 `size`   | `r(18)`（随设备宽度缩放）；调用方传值应包 `r()`，如 `size={r(20)}`             |

根节点必须精确包含表中的六个绘制属性。`svg` 的直接叶子只允许 `path`、`rect`、`circle`，shape 不得嵌套；属性必须使用双引号并落在对应元素的 allowlist 内。实心图元使用元素级 `fill="currentColor" stroke="none"`，透明度只能是 `[0, 1]` 内的有限数值；禁止硬编码颜色、未知标签和未知属性。

## 添加新图标

1. 在 `src/icons/svg/<name>.svg` 加新文件，遵守上面的完整文档、结构与属性规则
2. 运行 `node scripts/build-icons.js`。脚本会先移除注释，再用全标签 stack scanner 收集所有结构、属性和数值错误；任一错误存在时都不会写 `src/icons/data.ts`。**不要手改 `data.ts`** —— 它是生成产物（`{ strokeWidth, elements }`）
3. 运行 `yarn check:icons`。该命令在两个独立临时目录调用真实生成器，并逐字节比较两份临时结果与已提交的 `src/icons/data.ts`；它不会改工作区
4. 文档站走的 `website/src/components/iconsCatalog.ts` 是从 `@unif/react-native-design` barrel re-export 的薄壳（`ICONS` / `ICON_NAMES` / `IconName`），自动同步，无需再生成
5. `IconName` TypeScript 字面量类型自动包含新名字，IDE 立即给出补全
6. 若新图标属于某个语义类别，把它加进 `website/src/components/IconCatalog.tsx` 的 `MANUAL_CATEGORIES` 对应组；未手工归类时仍会自动显示在“未分类”。分类中出现未知名或重复名会让 Website build 立即失败

## 实现细节

`src/components/ui/Icon/Icon.tsx` 用 `react-native-svg` 渲染——`<Svg>` + `<Path>` / `<Circle>` / `<Rect>`，路径数据来自 `src/icons/data.ts`。`color` prop 传给 `stroke`，`strokeWidth` 走每图标默认值或可覆盖。

Website 的总数直接取 `ICON_NAMES.length`，搜索遍历完整计算分类。预览渲染会把每个 shape 的 `fill`、`stroke`、`opacity` 原样映射到 SVG，确保实心图元和半透明笔画与 RN `<Icon>` 一致。

```tsx
// 摘录
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ICONS } from '@unif/react-native-design';

<Svg width={size} height={size} viewBox="0 0 24 24"
     fill="none" stroke={color}
     strokeWidth={def.strokeWidth}
     strokeLinecap="round" strokeLinejoin="round">
  {def.elements.map((el, i) => /* path/circle/rect */)}
</Svg>
```

## 无障碍（a11y）

来源：`src/components/ui/Icon/Icon.tsx`、`types.ts`。

`<Icon>` 是纯视觉图元，**源码刻意把它对 SR 隐藏**：外层 `<View>`（正常路径与未知图标 fallback 路径都）显式设 `accessibilityElementsHidden` + `importantForAccessibility="no-hide-descendants"`。它**不**设 `accessibilityRole` / `accessibilityLabel`，也没有可传的 a11y prop（仅 `name` / `size` / `color` / `strokeWidth` / `style` / `testID`）。

这是有意为之：图标的语义应由**承载它的可交互父组件**提供朗读文案 —— 如 [IconButton](icon-button.md) 的必填 `accessibilityLabel`、[Button](button.md) 的 `label`。独立装饰用 `<Icon>` 即可，无需也不应给它单独挂 a11y。

## 头像

头像不是图标，是实体。所有头像都是**单字符 monogram**（`我` / `AI` / 客户首字母）放在彩色圆盘上。**绝不**在头像里放图片或多于 1 个字符。

详见 [Avatar 组件](avatar.md)。
