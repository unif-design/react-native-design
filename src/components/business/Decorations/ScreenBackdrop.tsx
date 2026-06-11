import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { r, useColors, useTheme, warmOrangePalette } from '../../../theme';
import { GradientWash } from './GradientWash';
import { RadialHalo } from './RadialHalo';
import type {
  GradientStop,
  ScreenBackdropHalo,
  ScreenBackdropPreset,
  ScreenBackdropProps,
} from './types';

type PresetConfig = {
  light: ReadonlyArray<GradientStop>;
  dark: ReadonlyArray<GradientStop>;
  halos: ReadonlyArray<ScreenBackdropHalo>;
};

/** 把 4 stop palette 数组 → GradientWash stops 配置(均布 offset)。
 *  数据从 theme/palettes.ts 取,组件内只负责 offset 分布。 */
function buildStops(
  palette: ReadonlyArray<string>,
  offsets: ReadonlyArray<number>
): ReadonlyArray<GradientStop> {
  return palette.map((color, i) => ({
    offset: offsets[i] ?? i / (palette.length - 1),
    color,
    opacity: 1,
  }));
}

const WARM_ORANGE_OFFSETS = [0, 0.35, 0.75, 1] as const;

/** 全屏渐变 + halo 预设表。新增 preset:加 palette token + 配 halo。 */
const PRESETS: Record<ScreenBackdropPreset, PresetConfig> = {
  /** 暖橙沉浸 —— 名片屏 / 扫码屏 / Splash 等"整屏暖色"场景。
   *  亮 / 暗 4 stop palette 来自 theme/palettes.ts;halo 3 件套(顶/底中心 + 右上)。 */
  warmOrange: {
    light: buildStops(warmOrangePalette.light, WARM_ORANGE_OFFSETS),
    dark: buildStops(warmOrangePalette.dark, WARM_ORANGE_OFFSETS),
    halos: [
      // [L-88] halo 几何走 r() 对齐缩放纪律;maxOpacity / centerX 是无单位值,不缩放。
      {
        size: r(520),
        height: r(420),
        maxOpacity: 0.22,
        top: r(-120),
        centerX: true,
      },
      {
        size: r(560),
        height: r(380),
        maxOpacity: 0.18,
        bottom: r(-160),
        centerX: true,
      },
      { size: r(220), maxOpacity: 0.16, top: r(180), right: r(-80) },
    ],
  },
};

/** 整屏沉浸渐变背景容器 —— 暗色 theme 自适配。
 *
 *  使用:
 *  ```tsx
 *  <ScreenBackdrop preset="warmOrange">
 *    <NavBar ... />
 *    <View style={styles.body}>...</View>
 *  </ScreenBackdrop>
 *  ```
 *
 *  内部布局:
 *  1. 外壳 View(flex:1 + overflow:hidden + 瞬态 c.background 底)
 *  2. GradientWash absolute fill(scheme 切换 stops)
 *  3. halo 列表 absolute 定位(可水平居中)
 *  4. children(在装饰层之上,zIndex 由渲染顺序保证)
 *
 *  自定义:`stops` 和 `halos` 都可绕过 preset。两者都不传且 preset 不传时,
 *  仅渲染 c.background 实色外壳(等价于普通 View)。 */
export function ScreenBackdrop({
  preset,
  stops,
  halos,
  children,
  style,
  testID,
}: ScreenBackdropProps): React.JSX.Element {
  const c = useColors();
  const { scheme } = useTheme();
  const { width: winW, height: winH } = useWindowDimensions();
  const isDark = scheme === 'dark';

  const cfg = preset ? PRESETS[preset] : undefined;
  const resolvedStops =
    stops ?? (cfg ? { light: cfg.light, dark: cfg.dark } : undefined);
  const resolvedHalos = halos ?? cfg?.halos ?? [];

  return (
    <View
      style={[backdropStyles.root, { backgroundColor: c.background }, style]}
      testID={testID}
    >
      {resolvedStops ? (
        <GradientWash
          height={winH}
          stops={isDark ? resolvedStops.dark : resolvedStops.light}
          style={backdropStyles.gradient}
        />
      ) : null}
      {resolvedHalos.map((h, i) => {
        const left = h.centerX ? (winW - h.size) / 2 : h.left;
        const right = h.centerX ? undefined : h.right;
        return (
          <RadialHalo
            key={`halo-${i}`}
            size={h.size}
            height={h.height}
            color={h.color ?? c.primary}
            maxOpacity={h.maxOpacity}
            // [L-60] 不传 gradientId —— 让 RadialHalo 走自己的 useSvgId(useId) 默认值。
            // 实例内同名在多 ScreenBackdrop 同挂(keep-mounted 栈、导航页)时会导致
            // web DOM SVG 的 url(#id) 命中文档首个同名渐变,造成跨实例渐变串台。
            // useId 保证每次挂载唯一,「实例内多 halo 不同 id」也由 useSvgId 前缀+'rh' 保证。
            style={[
              backdropStyles.haloAbsolute,
              { top: h.top, bottom: h.bottom, left, right },
            ]}
          />
        );
      })}
      {children}
    </View>
  );
}

const backdropStyles = StyleSheet.create({
  root: { flex: 1, position: 'relative', overflow: 'hidden' },
  gradient: { position: 'absolute', top: 0, left: 0, right: 0 },
  haloAbsolute: { position: 'absolute' },
});
