// Role-based color tokens —— role 名固定,亮/暗主题切的是 role 指向哪个 hex。

/** 品牌橙 hex —— 跨文件(colors 亮/暗 primary、glassActiveFg、avatarGradient、shadow BRAND)
 *  共用同一来源,改品牌色只改这一处。 */
export const BRAND_ORANGE = '#EB6E00';

export const lightColors = {
  // Brand
  primary: BRAND_ORANGE,
  primaryPressed: '#D06200',
  primaryContainer: '#FFF5EB',
  primaryContainerSubtle: '#FFF8F0',
  /** 品牌橙 10% alpha 浅底 —— icon tile 等屏内重复浅橙铺色。 */
  brandTint10: 'rgba(235,110,0,0.10)',
  /** 品牌橙 14% alpha —— Me 屏角色徽章。 */
  brandTint14: 'rgba(235,110,0,0.14)',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: 'rgba(255,255,255,0.85)',

  // Semantic
  success: '#52C41A',
  successContainer: '#F0FFF0',
  onSuccess: '#FFFFFF',
  error: '#F4511E',
  errorContainer: '#FFF5F5',
  onError: '#FFFFFF',
  info: '#3775F6',
  infoContainer: '#F0F5FF',
  onInfo: '#FFFFFF',

  // Surface (5-layer)
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceContainer: '#F5F5F5',
  surfaceContainerHigh: '#F0F0F0',
  surfaceContainerHighest: '#E0E0E0',

  // Foreground
  foreground: '#333333',
  foregroundMuted: '#666666',
  foregroundSubtle: '#999999',
  onSurface: '#333333',
  onSurfaceMuted: '#666666',

  // Outline
  outline: '#EDEDED',
  outlineVariant: '#E8E8E8',
  outlineFaint: '#F5F5F5',

  // Inverse
  inverseSurface: '#1C1C1E',
  inverseOnSurface: '#FFFFFF',

  // Misc
  /** 亮色 0.5:标准遮挡强度,背景内容隐退但保留可感知轮廓,符合 iOS/MD 规范建议。 */
  scrim: 'rgba(0,0,0,0.5)',
  /** Sheet backdrop —— sheet 之下浅灰 tint,合规态高对比度让 sheet 焦点突出。
   *  跟通用 scrim(黑半透"普通遮挡")区分:这是"焦点引导"。 */
  sheetBackdrop: 'rgba(245,245,247,0.72)',
  /** 玻璃感浅色 tint —— BlurView 之上的 0.55 白纱(数据条 / scanBtn)。 */
  glassTintLight: 'rgba(255,255,255,0.55)',
  /** 玻璃容器内部分隔线 —— 暗色翻成对应低透白,保证暗底可见。 */
  glassSeparator: 'rgba(0,0,0,0.08)',
  /** 浮动玻璃胶囊外区 tint(TabBar 滚动玻璃门)。
   *  数值配合 blur.strong(blurAmount=40) 让"玻璃门外区滚动内容透过模糊显示"达成。
   *  跟 glassTintLight 区分:此 token 给"玻璃门外区"语义。 */
  glassSurface: 'rgba(255,255,255,0.20)',
  /** TabBar 玻璃门 tint —— 跟 glassSurface 区分,真机实测 0.20 太厚看不清滚动内容,
   *  TabBar 场景配合 blur.soft(blurAmount=10) 主导,语义不同不可复用同一个 alpha。 */
  tabBarGlassTint: 'rgba(255,255,255,0.10)',
  /** 玻璃胶囊边框(亮 0.18 / 暗 0.14 白透)。 */
  glassBorder: 'rgba(255,255,255,0.18)',
  /** 玻璃胶囊顶部内高光(亮 0.28 / 暗 0.24 白透)。 */
  glassHighlight: 'rgba(255,255,255,0.28)',
  /** GlassStats 顶部 inset 高光线 —— 比 glassHighlight 更强,
   *  弥补 RN BlurView backdrop 比 web 弱 + 让数据条"顶部凸起"。 */
  glassStatsHighlight: 'rgba(255,255,255,0.65)',
  /** 玻璃胶囊 active 段文字 / icon 色。亮色同 primary;暗色 #FFB068
   *  更浅一档的橙,在半透深灰玻璃上分量更轻。 */
  glassActiveFg: BRAND_ORANGE,
  /** 品牌橙 active 容器底 —— TabBar active 段比 brandTint10 多 2% 视觉权重。 */
  brandTint12: 'rgba(235,110,0,0.12)',

  // Icon faint —— 跨屏"再淡一档"的灰阶图标色;暗色翻反相白 alpha 保暗底可见
  /** Input leading/trailing icon 默认色(placeholder 风格)。 */
  iconFaint40: 'rgba(0,0,0,0.40)',
  /** 列表箭头 / 副 chevron。 */
  iconFaint30: 'rgba(0,0,0,0.30)',
  /** 空状态 / placeholder 屏巨型图标。 */
  iconFaint25: 'rgba(0,0,0,0.25)',

  /** 头像白色 ring —— Me 屏 avatar 圆环。跟 onPrimaryMuted(品牌底次主文字)区分。 */
  avatarRing: 'rgba(255,255,255,0.6)',
  /** Me 屏 QR / 扫码按钮背景 —— scanBtn 要在 hero 上"凸起被看到"。 */
  qrBg: 'rgba(255,255,255,0.55)',

  // Hero gradient stops —— Me 屏顶部暖橙 → 浅黄 → background 三段渐变。
  // 历史驻留:渐变序列按约定应进 palettes.ts,但 heroGradient 驻 ColorTokens 可随主题
  // 自动切换(消费方无需手动 scheme 分支);迁 palettes 会让消费方须手写 scheme 判断,
  // 属人体工程学回退。新渐变序列一律进 palettes.ts,不要往 colors.ts 追加。
  /** Hero 渐变第 1 段:暖橙起色。 */
  heroGradient0: '#FFE3C8',
  /** Hero 渐变第 2 段(0.55 offset):浅黄过渡。 */
  heroGradient1: '#FFF0DD',
  /** Hero 渐变第 3 段:接 background。亮色 = background hex,暗色 = 深暖灰收到 background。 */
  heroGradient2: '#F5F5F5',

  /** 玻璃身份胶囊背景 —— ProfileCard 玻璃 pill 浮在 warmOrange 背景上。
   *  亮色半透浓白(暖橙背景);暗色半透薄白晕(深背景)。 */
  glassPillBg: 'rgba(255,255,255,0.72)',
  /** 玻璃身份胶囊边框 —— 高光描边,衬出玻璃质感。 */
  glassPillBorder: 'rgba(255,255,255,0.9)',
} as const;

export type ColorTokens = { [K in keyof typeof lightColors]: string };

export const darkColors: ColorTokens = {
  // Brand
  primary: BRAND_ORANGE,
  primaryPressed: '#D06200',
  primaryContainer: '#3D1F00',
  primaryContainerSubtle: '#2A1500',
  // 暗底用纯品牌橙 + 略高 alpha 维持视觉权重(亮 10% 在暗底几乎不可见)
  brandTint10: 'rgba(235,110,0,0.16)',
  brandTint14: 'rgba(235,110,0,0.22)',
  onPrimary: '#FFFFFF',
  onPrimaryMuted: 'rgba(255,255,255,0.85)',

  // Semantic
  success: '#52C41A',
  successContainer: '#0E2810',
  onSuccess: '#FFFFFF',
  error: '#FF6B40',
  errorContainer: '#2A1010',
  onError: '#FFFFFF',
  info: '#5A91FF',
  infoContainer: '#0F1A33',
  onInfo: '#FFFFFF',

  // Surface (5-layer, iOS HIG dark)
  background: '#0A0A0A',
  surface: '#1C1C1E',
  surfaceContainer: '#2C2C2E',
  surfaceContainerHigh: '#3A3A3C',
  surfaceContainerHighest: '#48484A',

  // Foreground
  foreground: '#FFFFFF',
  foregroundMuted: 'rgba(235,235,245,0.6)',
  foregroundSubtle: 'rgba(235,235,245,0.3)',
  onSurface: '#FFFFFF',
  onSurfaceMuted: 'rgba(235,235,245,0.6)',

  // Outline
  outline: '#3A3A3C',
  outlineVariant: '#48484A',
  outlineFaint: 'rgba(84,84,88,0.65)',

  // Inverse
  inverseSurface: '#FFFFFF',
  inverseOnSurface: '#000000',

  // Misc
  /** 暗色加深至 0.7(亮色 0.5):暗色环境底图对比度低、亮部元素更"抢眼",
   *  scrim 需更重才能有效压住背景,让前景 sheet / modal 焦点突出。 */
  scrim: 'rgba(0,0,0,0.7)',
  /** Sheet backdrop 暗色:沿用亮色同值,合规态保持浅 tint(打破暗色默认深底)让焦点
   *  聚焦在协议 sheet 上。 */
  sheetBackdrop: 'rgba(245,245,247,0.72)',
  // 暗色 0.06 白透,凸起感由 glassBar 暗色黑 0.35 shadow 补
  glassTintLight: 'rgba(255,255,255,0.06)',
  glassSeparator: 'rgba(255,255,255,0.10)',
  // 深灰半透 0.30,配合 blur.strong(blurAmount=40) 让"玻璃门"语义达成
  glassSurface: 'rgba(28,28,30,0.30)',
  // 配合 blur.soft(blurAmount=10) 让内容透过模糊带 alpha 染色
  tabBarGlassTint: 'rgba(28,28,30,0.18)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassHighlight: 'rgba(255,255,255,0.24)',
  // 暗色降至 0.10(亮色 0.65):暗色 BlurView 背景本身已深,顶部高光过强会破坏玻璃质感
  // 的"透视感"——0.10 轻轻描出上沿即足以传达"凸起"层级。
  // 注:亮色"比 glassHighlight 更强(0.65>0.28)"在暗色刻意反转(0.10<0.24),
  // 两端各自以视觉效果为准,非笔误。
  glassStatsHighlight: 'rgba(255,255,255,0.10)',
  // 浅橙,半透深灰玻璃上品牌色更亮起,视觉重量比纯品牌橙轻一档
  glassActiveFg: '#FFB068',
  // 暗色 brandTint12 与 brandTint14 同值(0.22):亮色 10/12/14 三档在暗底视觉差微弱,
  // 两档合一后对比度差异仍可感知;若后续设计需要恢复阶梯可将 brandTint12 改为 0.18-0.20。
  brandTint12: 'rgba(235,110,0,0.22)',

  // Icon faint —— 暗底反相成白色 alpha,数值跟亮色一致
  iconFaint40: 'rgba(255,255,255,0.40)',
  iconFaint30: 'rgba(255,255,255,0.30)',
  iconFaint25: 'rgba(255,255,255,0.25)',

  /** 头像白 ring 暗色:ring 改克制(几乎隐去),靠 brandAvatar 0.40 橙光晕浮起头像。 */
  avatarRing: 'rgba(255,255,255,0.10)',
  /** scanBtn 在暗 hero 上更显眼,比 glassTintLight 0.06 多一档。 */
  qrBg: 'rgba(255,255,255,0.10)',

  // Hero gradient stops —— 品牌橙 alpha 渐变。
  // react-native-svg <Stop stopColor> 支持 rgba 字符串,最终 alpha = rgba.a × stopOpacity。
  // 历史驻留(同亮色注释):新渐变序列一律进 palettes.ts。
  heroGradient0: 'rgba(235,110,0,0.18)',
  heroGradient1: 'rgba(235,110,0,0.06)',
  heroGradient2: '#0A0A0A',

  /** 玻璃身份胶囊暗色:半透薄白晕浮在深暖橙 / 深底上,比亮色弱 12 倍。 */
  glassPillBg: 'rgba(255,255,255,0.06)',
  glassPillBorder: 'rgba(255,255,255,0.12)',
};

/** 头像品牌渐变 —— 浅橙 → 主品牌橙,135° 对角线渐变。亮 / 暗共用。
 *  历史驻留:渐变序列按约定应进 palettes.ts,但亮/暗共用无需 scheme 分支且消费面稳定,
 *  迁移无收益。新渐变序列一律进 palettes.ts。 */
export const avatarGradient = ['#F49443', BRAND_ORANGE] as const;
