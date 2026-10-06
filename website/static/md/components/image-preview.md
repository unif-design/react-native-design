---
title: ImagePreview 图片预览
description: 按稳定身份预览图片，交付切换和删除请求。
---

<!-- Generated from @unif/react-native-design@0.34.0; edit source documentation. -->

# ImagePreview 图片预览

展示图片、序号和可选删除入口。宿主提供有界图片尺寸、图片集合和关闭方式；文件持有、删除确认与真实删除由应用负责。

```tsx
const ImagePreviewDemo = () => {
  const original = [
    {
      id: 'first',
      source: { uri: '/react-native-design/img/logo.png' },
      label: '第一张示例',
    },
    {
      id: 'second',
      source: { uri: '/react-native-design/img/logo.png' },
      label: '相同来源的第二张',
      canDelete: true,
    },
    { id: 'missing' },
  ];
  const [items, setItems] = useState(original);
  const [width, setWidth] = useState(240);
  const [result, setResult] = useState('左右滑动，或按按钮定位');
  const ref = useRef(null);
  return (
    <>
      <View
        style={{ gap: 12 }}
        onLayout={(event) =>
          setWidth(Math.min(420, event.nativeEvent.layout.width))
        }
      >
        <ImagePreview
          ref={ref}
          items={items}
          width={Math.max(1, width)}
          height={220}
          initialId="second"
          onCurrentChange={(item) => setResult(`当前：${item.id}`)}
          onRequestDelete={(item) => {
            setItems((current) =>
              current.filter((image) => image.id !== item.id)
            );
            setResult(`移除请求：${item.id}`);
          }}
        />
        <Button
          label="定位第一张"
          onPress={() => ref.current?.scrollTo('first')}
        />
        <Button
          label="恢复示例"
          variant="outline"
          onPress={() => setItems(original)}
        />
        <span className="demo-label">{result}</span>
      </View>
    </>
  );
};
```

## 用法

```tsx
import { ImagePreview } from '@unif/react-native-design';

<ImagePreview
  items={images}
  width={availableWidth}
  height={280}
  initialId={selectedId}
  onCurrentChange={(item) => setSelectedId(item.id)}
  onRequestDelete={(item) => requestDelete(item)}
/>;
```

## API

类型由 `ImagePreviewProps`、`ImagePreviewItem` 和 `ImagePreviewHandle` 导出。

| 参数               | 类型                                         | 默认值 | 说明                                                              |
| ------------------ | -------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `items`            | `readonly ImagePreviewItem[]`                | 必填   | 稳定且唯一的 `id`，`source?`、`label?`、`canDelete?`、`deleting?` |
| `width` / `height` | `number`                                     | 必填   | 宿主实际可用图片区域，正有限布局尺寸                              |
| `initialId`        | `string`                                     | 第一项 | 首次非空集合中定位，后续按当前 id 保持                            |
| `onCurrentChange`  | `(item: Readonly<ImagePreviewItem>) => void` | —      | 有效当前身份变化时交付一次                                        |
| `onRequestDelete`  | `(item: Readonly<ImagePreviewItem>) => void` | —      | 点击时的原项；不改集合                                            |
| `style` / `testID` | `StyleProp<ViewStyle>` / `string`            | —      | 外层布局与定位                                                    |

`canDelete`、`deleting` 默认 false。提供删除回调且当前项允许删除时显示入口；删除中禁止重复点击。集合为空不显示图片或操作，不合成空项回调。

ref 提供 `scrollTo(id: string, animated = true): void` 和 `getCurrent(): Readonly<ImagePreviewItem> | undefined`。未知 id 不改变当前项；动画完成前仍读取上一已落位项。重入、集合身份变化和卸载后隔离旧动画回调。

同 URL 的不同 id 保持独立。当前项移除后取原位置后继，无后继取前一项。缺少来源或加载失败显示占位；只影响本次显示，不移除记录。图片采用 contain，序号与操作位于图片裁切区外。

## 组合与验证

使用既有 GestureHandlerRootView、ThemeProvider 及轮播运行依赖。主题与应用字号影响文字，图片尺寸保持调用方给定值。实际原生展厅位于 `example` 的「媒体展示」。组件测试覆盖身份、集合变更、ref、旧回调与删除目标；真实手势、设备图片加载与文件生命周期由宿主另验。
