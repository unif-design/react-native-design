---
sidebar_position: 5
title: BorderBeam 边框流光
description: '沿内容边缘循环移动的渐变尾迹流光，可用于图片处理等短时忙碌状态；native 使用 Reanimated，Web 使用 CSS keyframes。'
---

# BorderBeam 边框流光

`BorderBeam` 在既有内容外围叠加一段沿边缘循环移动的渐变尾迹流光。流光由同相位、不同长度与透明度的描边叠加而成，前端更亮、尾部渐隐。它只负责视觉反馈，不改变内容布局，也不承载加载、错误、焦点或选中语义。

## 实时预览

```tsx
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
    <BorderBeam
      style={{ padding: 18, borderRadius: 12, backgroundColor: '#F5F5F5' }}
    >
      <span>默认流光</span>
    </BorderBeam>
    <BorderBeam
      color="#52C41A"
      duration={1800}
      lineWidth={3}
      size={56}
      borderRadius={16}
      style={{ padding: 18, borderRadius: 16, backgroundColor: '#F5F5F5' }}
    >
      <span>图片处理中</span>
    </BorderBeam>
    <BorderBeam
      active={false}
      style={{ padding: 18, borderRadius: 12, backgroundColor: '#F5F5F5' }}
    >
      <span>已停用</span>
    </BorderBeam>
  </div>
```

## 用法

```tsx
import { BorderBeam, radius, useColors } from '@unif/react-native-design';
import { Text, View } from 'react-native';

function ProcessingImage() {
  const c = useColors();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="图片识别中"
      accessibilityState={{ busy: true }}
    >
      <BorderBeam
        active
        color={c.primary}
        duration={1800}
        lineWidth={3}
        size={56}
        borderRadius={radius.lg}
      >
        <Text>图片识别中</Text>
      </BorderBeam>
    </View>
  );
}
```

## API

| Prop           | Type                    | 默认        | 说明                                             |
| -------------- | ----------------------- | ----------- | ------------------------------------------------ |
| `children`     | `ReactNode`             | 必填        | 被流光包围的原内容                               |
| `active`       | `boolean?`              | `true`      | 是否显示并运行流光                               |
| `color`        | `string?`               | `c.primary` | 流光颜色                                         |
| `duration`     | `number?`               | `2400`      | 绕边一周时长，单位毫秒；收敛到 `300..60000`      |
| `lineWidth`    | `number?`               | `2`         | 描边宽度；收敛到 `0.5..8`                        |
| `size`         | `number?`               | `40`        | 流光段长度；收敛到 `8..1000`，且不会超过实际周长 |
| `borderRadius` | `number?`               | `radius.md` | 流光路径圆角；收敛到 `0..1000` 并受当前布局约束  |
| `style`        | `StyleProp<ViewStyle>?` | —           | 外层布局样式                                     |
| `testID`       | `string?`               | —           | E2E / 测试定位                                   |

## 动效与平台

- native 由 Reanimated worklet 在 UI 线程持续更新 SVG `strokeDashoffset`。
- Web 由静态 CSS keyframes 驱动，JS 只在布局或 props 变化时更新路径长度和时长。
- 两端使用相同的四层渐变尾迹，不额外占用内容布局空间。
- 系统开启“减少动态效果”时，流光会隐藏，原内容保持显示。

## 无障碍与使用边界

流光层本身对辅助技术隐藏，且 `pointerEvents="none"`，不会拦截子内容操作。业务必须在外层提供实际状态语义，例如 `accessibilityState={{ busy: true }}` 和可理解的状态文字。

不要用 `BorderBeam` 代替错误红框、焦点描边、选择态或进度百分比；这些状态需要独立、稳定的视觉与无障碍表达。处理完成后应设置 `active={false}` 或移除组件。

来源：`src/components/ui/BorderBeam/`。
