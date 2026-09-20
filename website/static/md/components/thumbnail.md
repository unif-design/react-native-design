---
sidebar_position: 24
title: Thumbnail 缩略图
description: '展示缩略图，支持尺寸、加载及失败占位。'
---

<!-- Generated from @unif/react-native-design@0.32.2; edit source documentation. -->

# Thumbnail 缩略图

列表 / 卡片右侧、chat 行内、Detail 头图通用的小型预览图。保留 `sm / md / lg` 三档尺寸，也支持显式矩形尺寸。visual frame 始终存在并使用 `c.surfaceContainer` 占位；source 非法、图片 pending 或加载失败都不会让布局消失。

| Size       | 尺寸   | 用法                             |
| ---------- | ------ | -------------------------------- |
| `sm`       | 64×40  | chat 行内、列表二级缩略          |
| `md`(默认) | 113×67 | `NewsList` / `NewsArea` 公告右侧 |
| `lg`       | 160×96 | 详情页 hero 小图、卡片头图       |

表中尺寸是 402pt 设计基准值；native 按当前 window 短边经过 `r()` 缩放并对齐设备像素，Web 保持这些基准值。

## 代码演示 {#实时预览}

```tsx
const IMG = 'https://picsum.photos/id/1067/320/200';

const IMAGE_A =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76"><rect width="76" height="76" fill="steelblue"/><text x="28" y="45" fill="white">A</text></svg>'
  );

const IMAGE_B =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="76" height="76"><rect width="76" height="76" fill="seagreen"/><text x="28" y="45" fill="white">B</text></svg>'
  );

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

## 显式尺寸与失败占位

```tsx
const ThumbnailDimensionsDemo = () => {
  const [uri, setUri] = useState(IMAGE_A);
  const [large, setLarge] = useState(false);
  return (
    <>
      <View style={{ gap: 16 }}>
        <Thumbnail
          uri={uri}
          size={{ width: large ? 120 : 76, height: 76, borderRadius: 8 }}
          selected
          fallback={<Icon name="file" />}
          accessibilityLabel="附件图像框"
          testID="thumbnail-dimensions-demo"
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Button label="图片 A" onPress={() => setUri(IMAGE_A)} />
          <Button label="图片 B" onPress={() => setUri(IMAGE_B)} />
          <Button
            label="图片失败"
            onPress={() => setUri('data:image/png;base64,invalid')}
          />
          <Button label="切换图像框" onPress={() => setLarge(!large)} />
        </View>
      </View>
    </>
  );
};
```

```tsx
import {
  Thumbnail,
  Icon,
  type ThumbnailDimensions,
} from '@unif/react-native-design';
const dimensions: Readonly<ThumbnailDimensions> = {
  width: 76,
  height: 76,
  borderRadius: 8,
};
<Thumbnail
  source={{ uri: imageUri }}
  size={dimensions}
  fallback={<Icon name="file" />}
/>;
```

width / height 必须为有限正数，borderRadius 可省略（沿用 md 圆角）或为有限非负数。对象值按实际 RN 布局单位使用，库内不再调用 r；需要设备缩放时由调用方提前计算。非法对象整体回退 md，并仅诊断字段名，不输出对象或图片地址。

fallback 是可选 ReactNode，在无有效 source 或当前图片失败时居中显示并裁切于图像框，选中环保持在上方；未提供时保持原占位表面，加载中不显示失败内容。改变尺寸或 fallback 不重建同一 source 的图片尝试。Thumbnail 不改变附件上传状态、不触发预览或移除操作。

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

| 参数                 | 类型                                             | 默认值                 | 说明                                                                          |
| -------------------- | ------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------- |
| `uri`                | `string`                                         | 与 `source` 严格二选一 | 远程 URL；运行时 trim 后必须非空                                              |
| `source`             | `ImageSourcePropType`                            | 与 `uri` 严格二选一    | 本地 asset、URI object 或 URI candidate 数组；Web 明确使用数组首项            |
| `size`               | `ThumbnailSize \| Readonly<ThumbnailDimensions>` | `'md'`                 | 三档或显式图像框                                                              |
| `fallback`           | `ReactNode`                                      | —                      | 无有效 source 或当前图片失败时的内容                                          |
| `selected`           | `boolean`                                        | `false`                | frame 内始终存在的 ring 是否切为 2pt 品牌色                                   |
| `resizeMode`         | RN `ImageProps['resizeMode']`                    | `'cover'`              | `cover / contain / stretch / center / repeat / none`                          |
| `containerStyle`     | `StyleProp<ViewStyle>`                           | —                      | 完整 caller layout，只落到外层 View；可用 margin/flex/position/size/transform |
| `imageStyle`         | `StyleProp<ThumbnailImageStyle>`                 | —                      | opacity/tint/transform 等表面样式；不能覆盖 frame geometry                    |
| `accessibilityLabel` | `string`                                         | —                      | trim 后非空时命名图片；缺省或空白时本地 Image 从 a11y tree 隐藏               |
| `testID`             | `string`                                         | —                      | 只落到外层 layout View                                                        |

旧 `style` prop 已删除，不保留 alias。`imageStyle` 的公开类型与 runtime sanitizer 都剔除 `position`、四向 inset、`width` / `height` 及 min/max 尺寸；sanitizer 先执行 `StyleSheet.flatten`，所以宽类型 JS、registered style 和 style array 也不能改写 visual frame。caller `imageStyle` 先应用，库的 absolute-fill geometry 后应用。

### 稳定结构与 source

Thumbnail 始终渲染相同的两层 View：外层承载 `containerStyle` / `testID`，内层 visual frame 承载固定 size、圆角、裁切、placeholder、图片和 ring。ring 是 `pointerEvents="none"` 的 absolute overlay，未选时透明、选中时品牌色；两态都保持相同 frame 尺寸，不再用 border + padding 扩大布局。

合法 source 使用与 Avatar 相同的 immutable semantic snapshot 和 keyed image attempt。native 保留 URI candidate 数组，Web 使用首个 candidate；source 真实变化才创建新 attempt。source 非法或加载失败时只移除图片尝试，visual frame、placeholder 和 ring 继续存在。普通 JS 绕过类型传入缺失/同时存在的 `uri` + `source`、空白 URI、非法 source 或保留 image geometry 时，组件在 dev effect 诊断并失败关闭，生产环境静默，不会返回 `null`。

## 无障碍（a11y）

来源：`src/components/ui/Thumbnail/Thumbnail.tsx`、`types.ts`。

Thumbnail 的公开结构是 outer layout View + inner visual frame；图片与 ring 都由库内本地节点承载，a11y 走“可选描述”模型：

- 非空 `accessibilityLabel` 让图片以 image role 暴露；缺省或空白时，完整隐藏属性只落到本地 Image，不让装饰图打扰 screen reader。
- ring 始终使用本地 View，并通过完整隐藏属性移出 a11y tree；`selected` 只表达视觉，不上报 selected state。选中语义仍由可交互父级（如 picker 单元）提供。
- 未传 fallback 时，source 非法或加载失败只显示非 accessible placeholder frame；自定义 fallback 遵循图片的可选名称与装饰隐藏语义。

```tsx
// 内容图：给 accessibilityLabel 才会被 SR 读到
<Thumbnail uri={item.coverUrl} accessibilityLabel="客户门店照片" />
// 纯装饰缩略图：省略 accessibilityLabel → 对 SR 隐藏
<Thumbnail uri={item.coverUrl} />
```

## 组合使用 {#内部使用}

可与 [Cell](cell.md) 或卡片组合，展示调用方提供的图片。

## FAQ

### 如何设置尺寸和失败占位？

列表、卡片或消息中的缩略图可复用 `Thumbnail`。尺寸阶梯不够覆盖时使用 size 对象，不通过 containerStyle 或 imageStyle 改写图像框。使用 ThumbnailProps['size'] 派生旧枚举的消费者需先缩窄对象分支，三档名称仍可使用 ThumbnailSize。
