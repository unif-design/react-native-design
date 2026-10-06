---
sidebar_position: 3
title: GlassLayer 玻璃层
description: '随主题渲染玻璃材质，并提供明确的平台降级。'
---

<!-- Generated from @unif/react-native-design@0.35.0; edit source documentation. -->

# GlassLayer 玻璃层

为已有内容提供装饰玻璃背景。组件读取当前主题，不接管内容、交互或布局。

## 代码演示 {#实时预览}

网页预览使用 CSS 近似效果；原生 Liquid Glass 的折射、轮廓和系统材质需在 iOS 设备上验证。

```tsx
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {['clear', 'regular'].map((effect) => (
      <div key={effect}>
        <span className="demo-label">
          {effect === 'clear' ? 'clear · 通透玻璃' : 'regular · 标准玻璃'}
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            height: 80,
            marginTop: 8,
            background: 'linear-gradient(135deg, #F49443, #EB6E00)',
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <GlassLayer effect={effect} style={{ borderRadius: 14 }} />
          <View
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              style={{
                color: 'var(--ifm-color-emphasis-800)',
                fontWeight: '600',
              }}
            >
              {effect}
            </Text>
          </View>
        </div>
      </div>
    ))}
  </div>
```

## 用法

```tsx
import { GlassLayer, radius } from '@unif/react-native-design';
import { View, Text } from 'react-native';

<View
  style={{
    position: 'relative',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  }}
>
  <GlassLayer effect="clear" style={{ borderRadius: radius['2xl'] }} />
  <Text>内容由调用方提供</Text>
</View>;

<GlassLayer effect="regular" tintColor="rgba(255,255,255,0.3)" />;
```

## API

| 参数        | 类型                   | 默认值                    | 说明                                       |
| ----------- | ---------------------- | ------------------------- | ------------------------------------------ |
| `effect`    | `'clear' \| 'regular'` | `'regular'`               | `clear` 更通透，`regular` 使用标准材质     |
| `tintColor` | `ColorValue`           | 随主题和材质推导          | 原生材质染色；降级及 Web 时作为背景色      |
| `style`     | `StyleProp<ViewStyle>` | `StyleSheet.absoluteFill` | 布局、定位和圆角；材质颜色使用 `tintColor` |
| `testID`    | `string`               | —                         | 测试定位                                   |

`clear` 默认使用 `c.glassTintLight`，`regular` 默认使用 `c.sheetBackdrop`，颜色由当前 `ThemeProvider` 提供。原生 `colorScheme` 同步当前主题；组件不提供独立主题状态。

## 平台与接入

| 平台                               | 实现                                                                                        |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| iOS 26+ 且原生支持标记为真         | `@callstack/liquid-glass` 的 `LiquidGlassView`，使用 `clear/regular` 原生材质与 `tintColor` |
| 旧 iOS、Android 或原生支持标记为假 | 半透明主题背景，不提供背景模糊                                                              |
| Web                                | CSS `backdrop-filter` 与主题背景；`clear/regular` 分别使用 10/40px 的近似值                 |

安装 `@callstack/liquid-glass`（本库 peer 范围 `>=0.8.2 <0.9.0`），iOS 执行 `bundle exec pod install` 并重新构建。上游要求 RN 0.80+、Xcode 26+；本库的 RN 要求仍以根 `package.json` 为准。当前 RN 0.86.3 的最低 iOS 版本为 15.1；玻璃能力的 iOS 26 门槛与应用最低版本是两件事，支持范围内的旧 iOS 使用半透明背景。Expo Go 不支持此原生模块，Expo 工程需开发构建。见 [上游安装与 API](https://github.com/callstack/liquid-glass#documentation)。

是否支持原生玻璃由上游 `isLiquidGlassSupported` 判定，包括系统 API 和宿主设计兼容设置。Web 像素值属于内部近似参数，不表示原生玻璃的模糊半径，也不作为公共主题 token。

## 无障碍与布局

玻璃层不拦截触摸，隐藏自身无障碍子树，内容语义由其旁边的真实内容提供。材质更新不播放动画；原生系统材质的无障碍外观仍需设备验证。

父容器应限定尺寸并提供相对定位。圆角通过 `style` 传给玻璃层；父容器负责内容裁切，外层按需承载阴影。组件只提供背景，不接受 `children`。
