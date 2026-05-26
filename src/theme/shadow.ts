// Themed shadow tokens —— 全仓 shadow 走这一份,callers 不再 inline 写
// shadowColor/Offset/Opacity/Radius/elevation 5 件套。
//
// 暗色下中性阴影 shadowOpacity / elevation 全部置 0:视觉层次靠 surface 5 层
// 明度差表达(layered surface 替代 shadow)。

const BRAND = '#EB6E00';

export const lightShadow = {
  /** 轻提示浮起 —— Segmented active 段 */
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  /** 标准卡片下沉 —— Card 默认 variant */
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  /** 中性浮岛 —— TabBar 玻璃胶囊等贴底浮起,大半径柔散。 */
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 12,
  },
  /** 品牌光晕 - sm —— 品牌橙浮起轻量档。 */
  brandSm: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  /** GlassStats 数据条专用 shadow。
   *  顶部 `1px inset` 高光由 GlassStats topHighlight View 节点画,不进 shadow。 */
  glassBar: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  /** 品牌光晕 - md —— 主按钮 / Avatar ring 中等强调 */
  brandMd: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 24,
    elevation: 12,
  },
  /** 品牌光晕 - lg —— Login Logo halo。 */
  brandLg: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 36,
    elevation: 12,
  },
  /** 品牌光晕 - xl —— Splash Logo 启动屏最重浮起。 */
  brandXl: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 50,
    elevation: 12,
  },
  /** About icon halo —— 在 brandLg(Login Logo)和 brandXl(Splash)之间。 */
  brandAbout: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 40,
    elevation: 12,
  },
  /** AssistantCard 42×42 icon tile shadow —— 比 brandSm 重一档,给 hero 区品牌入口加视觉权重。 */
  brandAssistant: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 12,
  },
  /** Avatar 品牌橙光晕。
   *  数值不用 r() 缩放(shadow 不跟屏宽等比)。 */
  brandAvatar: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export type ShadowTokens = {
  [K in keyof typeof lightShadow]: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
};

/** 暗色统一置零 —— dark theme 用 surface 明度差替代 shadow */
const darkZero = {
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

export const darkShadow: ShadowTokens = {
  subtle: { ...darkZero, shadowColor: '#000' },
  card: { ...darkZero, shadowColor: '#000' },
  /** floating 暗色不走 darkZero:浮动胶囊在暗 bg 上需要黑色 drop shadow,
   *  否则跟暗背景贴平,视觉无层级。 */
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 28 },
    shadowOpacity: 0.85,
    shadowRadius: 60,
    elevation: 16,
  },
  brandSm: { ...darkZero, shadowColor: BRAND },
  brandMd: { ...darkZero, shadowColor: BRAND },
  brandLg: { ...darkZero, shadowColor: BRAND },
  brandXl: { ...darkZero, shadowColor: BRAND },
  brandAbout: { ...darkZero, shadowColor: BRAND },
  brandAssistant: { ...darkZero, shadowColor: BRAND },
  /** brandAvatar 暗色不置零:暗色 ring 0.10 几乎隐去,靠橙光晕(0.40 比亮色 0.28 更强)
   *  托起头像。 */
  brandAvatar: {
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 12,
  },
  /** glassBar 暗色不置零:黑色浮起让数据条在暗 hero 上凸起,缺它整个条贴在背景上
   *  像没渲染。 */
  glassBar: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  none: { ...darkZero, shadowColor: 'transparent' },
};
