---
sidebar_position: 24
title: Thumbnail 缩略图
description: "列表 / 卡片 / chat 通用 16:9.5 小图 —— size='sm'(64×40)/'md'(113×67,默认)/'lg'(160×96),uri 或 source 严格二选一,稳定 placeholder 与 2pt selected ring,layout / image style 分层。"
---

# Thumbnail 缩略图

列表 / 卡片右侧、chat 行内、Detail 头图通用的小型预览图。固定 16:9.5 视频比,提供 `sm / md / lg` 三档尺寸。visual frame 始终存在并使用 `c.surfaceContainer` 占位；source 非法、图片 pending 或加载失败都不会让布局消失。

| Size | 尺寸 | 用法 |
|---|---|---|
| `sm` | 64×40 | chat 行内、列表二级缩略 |
| `md`(默认)| 113×67 | `NewsList` / `NewsArea` 公告右侧 |
| `lg` | 160×96 | 详情页 hero 小图、卡片头图 |

表中尺寸是 402pt 设计基准值；native 按当前 window 短边经过 `r()` 缩放并对齐设备像素，Web 保持这些基准值。

## 实时预览

下方渲染的就是 `src/components/ui/Thumbnail/Thumbnail.tsx` 本体，通过 `react-native-web` 翻译成浏览器节点。

```tsx
const IMG = 'https://picsum.photos/id/1067/320/200';

  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">三档尺寸 · sm / md / lg</span>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        <Thumbnail uri={IMG} size="sm" accessibilityLabel="示例图 sm" />
        <Thumbnail uri={IMG} size="md" accessibilityLabel="示例图 md" />
        <Thumbnail uri={IMG} size="lg" accessibilityLabel="示例图 lg" />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span className="demo-label">selected · frame 内 2pt 品牌色 ring</span>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Thumbnail uri={IMG} selected accessibilityLabel="已选中的示例图" />
      </div>
    </div>
  </div>
```

## 用法

```tsx
import { Thumbnail } from '@unif/react-native-design';

// 远程 URL —— 列表行最常见
<Thumbnail uri={item.coverUrl} />

// 自定义尺寸
<Thumbnail uri={item.coverUrl} size="lg" />

// 本地图片
<Thumbnail source={require('./fallback.png')} />

// 普通 string 无法静态证明非空；空白值在运行时显示稳定 placeholder
<Thumbnail uri={maybeEmpty} />

// 外层布局和图片表面样式分开
<Thumbnail
  uri={item.coverUrl}
  containerStyle={{ marginLeft: 8, transform: [{ scale: 0.95 }] }}
  imageStyle={{ opacity: 0.8 }}
/>
```

## API

| Prop | 类型 | 默认 | 说明 |
|---|---|---|---|
| `uri` | `string` | 与 `source` 严格二选一 | 远程 URL；运行时 trim 后必须非空 |
| `source` | `ImageSourcePropType` | 与 `uri` 严格二选一 | 本地 asset、URI object 或 URI candidate 数组；Web 明确使用数组首项 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸阶梯 |
| `selected` | `boolean` | `false` | frame 内始终存在的 ring 是否切为 2pt 品牌色 |
| `resizeMode` | RN `ImageProps['resizeMode']` | `'cover'` | `cover / contain / stretch / center / repeat / none` |
| `containerStyle` | `StyleProp<ViewStyle>` | — | 完整 caller layout，只落到外层 View；可用 margin/flex/position/size/transform |
| `imageStyle` | `StyleProp<ThumbnailImageStyle>` | — | opacity/tint/transform 等表面样式；不能覆盖 frame geometry |
| `accessibilityLabel` | `string` | — | trim 后非空时命名图片；缺省或空白时本地 Image 从 a11y tree 隐藏 |
| `testID` | `string` | — | 只落到外层 layout View |

旧 `style` prop 已删除，不保留 alias。`imageStyle` 的公开类型与 runtime sanitizer 都剔除 `position`、四向 inset、`width` / `height` 及 min/max 尺寸；sanitizer 先执行 `StyleSheet.flatten`，所以宽类型 JS、registered style 和 style array 也不能改写 visual frame。caller `imageStyle` 先应用，库的 absolute-fill geometry 后应用。

### 稳定结构与 source

Thumbnail 始终渲染相同的两层 View：外层承载 `containerStyle` / `testID`，内层 visual frame 承载固定 size、圆角、裁切、placeholder、图片和 ring。ring 是 `pointerEvents="none"` 的 absolute overlay，未选时透明、选中时品牌色；两态都保持相同 frame 尺寸，不再用 border + padding 扩大布局。

合法 source 使用与 Avatar 相同的 immutable semantic snapshot 和 keyed image attempt。native 保留 URI candidate 数组，Web 使用首个 candidate；source 真实变化才创建新 attempt。source 非法或加载失败时只移除图片尝试，visual frame、placeholder 和 ring 继续存在。普通 JS 绕过类型传入缺失/同时存在的 `uri` + `source`、空白 URI、非法 source 或保留 image geometry 时，组件在 dev effect 诊断并失败关闭，生产环境静默，不会返回 `null`。

## 无障碍（a11y）

来源：`src/components/ui/Thumbnail/Thumbnail.tsx`、`types.ts`。

Thumbnail 的公开结构是 outer layout View + inner visual frame；图片与 ring 都由库内本地节点承载，a11y 走“可选描述”模型：

- 非空 `accessibilityLabel` 让图片以 image role 暴露；缺省或空白时，完整隐藏属性只落到本地 Image，不让装饰图打扰 screen reader。
- ring 始终使用本地 View，并通过完整隐藏属性移出 a11y tree；`selected` 只表达视觉，不上报 selected state。选中语义仍由可交互父级（如 picker 单元）提供。
- source 非法或加载失败时只显示非 accessible placeholder frame，不产生无名图片节点。

```tsx
// 内容图：给 accessibilityLabel 才会被 SR 读到
<Thumbnail uri={item.coverUrl} accessibilityLabel="客户门店照片" />
// 纯装饰缩略图：省略 accessibilityLabel → 对 SR 隐藏
<Thumbnail uri={item.coverUrl} />
```

## 内部使用

- [NewsList / NewsArea](cell.md) —— `newsToCellItem` 共享 mapper 内 `extra: <Thumbnail uri={images[0]} />`,两屏渲染一致

## 设计原则

新增"列表 / 卡片右侧缩略图 / chat 内嵌图片预览"场景请直接用 `Thumbnail`,不要自画 `<Image style={{width, height, borderRadius, bg}}>`。尺寸阶梯不够覆盖时来这里加 size,不要 inline 写死。
