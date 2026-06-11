import { Dimensions, Platform, PixelRatio } from 'react-native';

/** iPhone 17 Pro 逻辑宽。所有缩放以此为基准。 */
const DESIGN_WIDTH = 402;

/** 字体 moderate 系数:0 = 不缩放,0.5 = react-native-size-matters 默认,
 *  0.3 对中文字号最友好(避免大屏字过大、小屏字过小)。 */
const FONT_FACTOR = 0.3;

// 取短边而非宽度:横屏/iPad 启动时 width 会是长边(iPhone 17 Pro 874pt),
// 导致所有 r() 尺寸约翻倍。Math.min(w, h) 使竖屏行为完全不变,
// 同时收口横屏启动与 iPad Split View(window 宽可能小于 DESIGN_WIDTH)两个场景。
const { width: _w, height: _h } = Dimensions.get('window');
const w =
  Platform.OS === 'web'
    ? DESIGN_WIDTH
    : Math.min(_w || DESIGN_WIDTH, _h || DESIGN_WIDTH) || DESIGN_WIDTH;

/** 实际缩放比。 */
const ratio = w / DESIGN_WIDTH;

/** 尺寸缩放。返回值经 `PixelRatio.roundToNearestPixel` 对齐设备像素栅格,
 *  避免 0.5px 渲染瑕疵(@3x 屏 hairline 尤其明显)。 */
export const r = (n: number): number =>
  PixelRatio.roundToNearestPixel(n * ratio);

/** 字号 moderate 缩放。不做像素对齐 —— 字号小数点对排版有意义。 */
export const rf = (n: number): number => n + (n * ratio - n) * FONT_FACTOR;
