import { Platform, StyleSheet } from 'react-native';
import { r, rf } from './scale';

export const fontMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const type = {
  display: rf(22),
  h1: rf(18),
  h2: rf(17),
  h3: rf(15),
  body: rf(15),
  sm: rf(14),
  xs: rf(13),
  xxs: rf(12),
  micro: rf(11),
  nano: rf(10), // TabBar/Grid 角标/小标签 10pt
  // ── 半档微调(0.5 step,加于"近似 token + delta"反模式收敛) ──
  /** micro(11)与 xxs(12)之间:VersionPill / Splash / carousel 副标题。 */
  microPlus: rf(11.5),
  /** xs(13)与 sm(14)之间:Privacy 长文阅读字号。 */
  xsPlus: rf(13.5),
  /** sm(14)与 body/h3(15)之间:dashboard card 标题"小一档 semi"惯例
   *  (NewsArea / AssistantCard / ApplicationArea 共用)。 */
  smPlus: rf(14.5),
  /** Hero 区主标题档(一级 brand hero,带 Logo,Login 屏)。 */
  heroLg: rf(26),
  /** Hero 区中等档(独立屏 + NavBar 的二级 hero)。 */
  heroMd: rf(22),
  /** Hero 区小档(承接式 hero,Group 选组/选角色子区)。 */
  heroSm: rf(18),
} as const;

export const fw = {
  regular: '400',
  medium: '500',
  semi: '600',
  bold: '700',
  heavy: '800',
} as const;

export const space = {
  'px': r(1),
  '1': r(4),
  '2': r(6),
  '3': r(8),
  '4': r(10),
  '5': r(12),
  '6': r(14),
  '7': r(16),
  '8': r(20),
  '9': r(24),
  '10': r(32),
} as const;

export const radius = {
  'xs': r(4), // Radio/Checkbox 内圈 4pt
  'sm': r(6),
  'md': r(8),
  'lg': r(10),
  'xl': r(12),
  '2xl': r(14),
  '3xl': r(18),
  'pill': 999, // big-enough sentinel,不缩放
} as const;

/** 头像容器尺寸阶梯:xs=18 列表 / sm=28 二级 / md=32 默认 / lg=40 卡片 / xl=56 hero。 */
export const avatar = {
  xs: r(18),
  sm: r(28),
  md: r(32),
  lg: r(40),
  xl: r(56),
} as const;

/** 图标盒尺寸阶梯(IconBox / 浅色 bg + 中心 icon)。
 *  icon['2xl'] 与 avatar.xl 同值但语义不同(图标 vs 头像),业务按语义选不要混用。 */
export const icon = {
  'xs': r(18),
  'sm': r(22),
  'md': r(26),
  'lg': r(30),
  'xl': r(36),
  '2xl': r(56),
} as const;

/** 控件高度阶梯(Button / Stepper / Input / Segmented 通用)。
 *  lg 44 数值与 fixed.hitTarget 一致,但 lg 是 scaled / hitTarget 是物理常量,语义不同
 *  不要合用。 */
export const control = {
  sm: r(28),
  md: r(36),
  lg: r(44),
} as const;

/** 散尺寸 —— 未归到 avatar/icon/control 阶梯的单点常量。 */
export const dim = {
  /** 发送按钮 32px —— 主送出/发送按钮专用,与 avatar.md 同值 */
  sendBtn: r(32),
} as const;

/** 物理常量表 —— **不**参与缩放,在任何设备上保持同一物理尺寸。
 *  iOS HIG 要求触控目标 ≥44pt 物理。 */
export const fixed = {
  hitTarget: 44,
  navbarH: 44,
  tabbarH: 50,
  hairline: StyleSheet.hairlineWidth,
} as const;

export const motion = {
  fast: 150,
  base: 200,
  slow: 300,
  pulse: 1600,
} as const;

/** 按压态透明度 —— Pressable pressed 时 opacity 的共享常量。
 *  ButtonBase、Chip、Cell、Grid、EntryCard、Tabs、Segmented、TabBar 等
 *  凡需要「按压反馈」的组件统一引用此值,避免散落多处手写 0.7 后不同步。 */
export const pressedOpacity = 0.7;
