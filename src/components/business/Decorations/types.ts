import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * Gradient stop —— 设定渐变停止点的颜色和透明度。
 * - offset: 0~1,沿 gradient 轴的归一化位置
 * - color: 任意有效颜色字符串(hex / rgb / rgba / hsl ...)
 * - opacity: 可选,0~1,不设等价 1
 *
 * SVG `<Stop>` 接 stopOpacity,opacity 单独透传(不要合到 rgba 字符串里),
 * 这样 color 接受任意格式。
 */
export type GradientStop = {
  offset: number;
  color: string;
  opacity?: number;
};

/** 简单单色模式:顶部 fromOpacity → 底部 toOpacity */
type GradientWashSimple = {
  height: number;
  /** 单色 wash 的颜色 */
  color: string;
  /** 顶部透明度,默认 0.1 */
  fromOpacity?: number;
  /** 底部透明度,默认 0 */
  toOpacity?: number;
  stops?: never;
  style?: StyleProp<ViewStyle>;
  gradientId?: string;
};

/** 多 stop 自定义模式 */
type GradientWashCustom = {
  height: number;
  stops: ReadonlyArray<GradientStop>;
  color?: never;
  fromOpacity?: never;
  toOpacity?: never;
  style?: StyleProp<ViewStyle>;
  gradientId?: string;
};

export type GradientWashProps = GradientWashSimple | GradientWashCustom;

export type RadialHaloProps = {
  /** halo 宽度(圆模式即直径)。 */
  size: number;
  /** 椭圆高度,不传则 = size(圆模式)。 */
  height?: number;
  /** 中心颜色 —— 透明度从 maxOpacity 或 stops 控制。 */
  color: string;
  /** 简化用法:中心最大透明度,默认 0.16。组件自动生成
   *  `[{0, maxOpacity}, {0.65, 0}, {1, 0}]` 标准 3 stop。传了 stops 时本字段忽略。 */
  maxOpacity?: number;
  /** 完全自定义透明度分布(覆盖 maxOpacity)。 */
  stops?: ReadonlyArray<{ offset: number; opacity: number }>;
  /** 容器附加样式(position absolute / top / left 等定位)。 */
  style?: StyleProp<ViewStyle>;
  /** SVG 内 gradient id —— 同屏多 halo 必须不同 id。 */
  gradientId?: string;
};

/** ScreenBackdrop 预设名 —— 全屏沉浸式渐变背景。
 *  - `warmOrange`:暖橙(亮:#FFE3C8→#FBD9B6 / 暗:#1F1208→#0A0A0A)+
 *    顶/底中心 + 右上 3 个橙色 halo。名片屏 / 扫码屏 / Splash 通用。 */
export type ScreenBackdropPreset = 'warmOrange';

/** ScreenBackdrop 装饰 halo 配置 —— absolute 定位 + 可选水平居中。 */
export type ScreenBackdropHalo = {
  /** halo 宽度 */
  size: number;
  /** 椭圆高度,不传 = size */
  height?: number;
  /** halo 颜色,不传默认 c.primary */
  color?: string;
  /** 最大透明度,默认 0.16(RadialHalo 默认) */
  maxOpacity?: number;
  /** 定位偏移 */
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  /** true 时按 (screenWidth - size)/2 水平居中,覆盖 left/right */
  centerX?: boolean;
};

export type ScreenBackdropProps = {
  /** 内置预设。preset 提供的 stops/halos 可被自定义 stops/halos 覆盖。 */
  preset?: ScreenBackdropPreset;
  /** 自定义全屏渐变 stops(scheme-aware)。覆盖 preset。
   *  注:GradientStop[].opacity 不传默认 1。 */
  stops?: {
    light: ReadonlyArray<GradientStop>;
    dark: ReadonlyArray<GradientStop>;
  };
  /** 自定义 halo 列表。覆盖 preset。 */
  halos?: ReadonlyArray<ScreenBackdropHalo>;
  /** 内容层(在装饰层之上) */
  children?: ReactNode;
  /** 外层附加样式 */
  style?: StyleProp<ViewStyle>;
};
