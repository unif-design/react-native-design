---
sidebar_position: 3
title: GlassLayer 玻璃层
description: '随主题渲染玻璃材质，并提供明确的平台降级。'
---

<!-- Generated from @unif/react-native-design; edit source documentation. -->

# GlassLayer 玻璃层

为已有内容提供装饰玻璃背景。组件读取当前主题，不接管内容、交互或布局。

Android、旧 iOS 或原生支持标记为假时，采用 `fallbackColor` 或主题 `surface` 实色分组，不叠加渐变和额外描边。开启减少透明度或 iOS 偏好尚未读回时也采用此实色背景。`secondary` Button 与 IconButton（含确认状态）使用 `surfaceContainerHigh`，独立输入表面使用 `surface`，与原有边线、阴影共同保留层次；缺少 CSS 模糊的 Web 继续使用主题半透明渐变。

不支持原生玻璃的 iOS／Android 在浅色主题下采用柔雾白表面；页面、控件和既有背景装饰只调整颜色，图标、布局、圆角、阴影及交互保持。原生玻璃可用的 iOS、Web 和深色主题保留原配色。消费者通过 `useColors` 读取当前主题，自定义 `fallbackColor` 保留原值。

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

IconButton、交互 Chip、Search、secondary Button、导航和数值控件直接采用默认系统材质；状态与事件仍由调用方维护。

材质适配由库完成，场景仍可明确选择外观：Button 默认 primary、Card 默认正文实色；IconButton 默认玻璃／实色自动切换，primary／danger／outline 保持实色，ghost／neutral 保持透明。普通使用无需传玻璃参数，也不在页面里判断 iOS 版本。自定义底色与图标色的实色组合见 [IconButton](icon-button.md)；明确的实色外观不会被平台能力改成玻璃。

```tsx
  <DefaultGlassControlsDemo />
```

```tsx
  <LiquidGlassDemo />
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

| 参数            | 类型                   | 默认值                    | 说明                                                        |
| --------------- | ---------------------- | ------------------------- | ----------------------------------------------------------- |
| `effect`        | `'clear' \| 'regular'` | `'regular'`               | `clear` 更通透，`regular` 使用标准材质                      |
| `tintColor`     | `ColorValue`           | 原生不额外染色            | 支持时的材质染色；实色降级使用 fallbackColor 或主题 surface |
| `fallbackColor` | `ColorValue`           | 主题 `surface`            | Android、旧 iOS、减少透明度或 iOS 偏好读取前使用的清晰底色  |
| `colorScheme`   | `'light' \| 'dark'`    | 继承主题                  | 固定白色前景的相机控件使用 dark                             |
| `style`         | `StyleProp<ViewStyle>` | `StyleSheet.absoluteFill` | 布局、定位和圆角；材质颜色使用 `tintColor`                  |
| `testID`        | `string`               | —                         | 测试定位                                                    |

原生默认不设置 `tintColor`，让系统从背后内容生成玻璃材质，不额外叠加白色或黑色底。Web 仅作 CSS 近似：clear 使用轻薄的 `c.tabBarGlassTint`，regular 使用 `c.glassSurface`。默认随主题更新，也可通过 `colorScheme` 选择固定外观；这不会改变相邻文字颜色。

## 平台与接入

| 平台                           | 实现                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| iOS 26+ 且原生支持标记为真     | `@callstack/liquid-glass` 的 `LiquidGlassView`，使用 `clear/regular` 原生材质与 `tintColor` |
| 旧 iOS 或 iOS 原生支持标记为假 | `fallbackColor` 或主题 `surface` 实色分组，无额外渐变或描边                                 |
| Android                        | 与旧 iOS 相同的主题实色分组，不提供原生折射或背景模糊                                       |
| Web                            | CSS `backdrop-filter` 与主题背景；`clear/regular` 分别使用 10/40px 的近似值                 |

安装 `@callstack/liquid-glass`（本库 peer 范围 `>=0.8.2 <0.9.0`），iOS 执行 `bundle exec pod install` 并重新构建。上游要求 RN 0.80+、Xcode 26+；本库的 RN 要求仍以根 `package.json` 为准。应用最低 iOS 版本取所采用 RN 和原生依赖的要求；玻璃能力的 iOS 26 门槛另行判断，支持范围内的旧 iOS 使用主题实色分组。Expo Go 不支持此原生模块，Expo 工程需开发构建。见 [上游安装与 API](https://github.com/callstack/liquid-glass#documentation)。

是否支持原生玻璃由上游 `isLiquidGlassSupported` 判定，包括系统 API 和宿主设计兼容设置。Web 像素值属于内部近似参数，不表示原生玻璃的模糊半径，也不作为公共主题 token。

## 无障碍与布局

玻璃层不拦截触摸，隐藏自身无障碍子树，内容语义由其旁边的真实内容提供。材质更新不播放动画。原生监听减少透明度偏好，Web 监听 `prefers-reduced-transparency`；开启时使用 `fallbackColor` 或实色 `surface`。Web 无 `backdrop-filter` 支持时使用相同主题渐变。原生系统偏好由应用根部稳定的 ThemeProvider 统一读取和订阅。首次查询尚未返回时先使用实色；之后新导航、新按钮和弹层直接使用已知状态，嵌套 ThemeProvider 也继承该系统偏好，不再重复从实色切换为玻璃。独立使用且没有主题宿主的 GlassLayer 仍自行读取和监听系统偏好。迟到查询不会覆盖新的偏好事件。

父容器应限定尺寸并提供相对定位。圆角通过 `style` 传给玻璃层；父容器负责内容裁切，外层按需承载阴影。组件只提供背景，不接受 `children`。

原生玻璃层及其祖先不要设置小于 1 的 opacity。按压、禁用和淡入淡出只淡化前景内容，避免 UIKit 原生效果消失；整个表面仍可做位移。见 [UIVisualEffectView 的 alpha 约束](https://developer.apple.com/documentation/uikit/uivisualeffectview/)。

Android 与旧 iOS 的卡片、输入框、按钮、菜单与提示共享实色降级，调用方可用 `fallbackColor` 表达内容表面、输入表面或图标底色，不必复制平台判断。`clear` 与 `regular` 在实色降级时不改变透明度。无 CSS 模糊的 Web 渐变继续复用既有实现。装饰层只裁切自身，不裁切调用方内容或浮动菜单。
