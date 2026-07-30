import { StyleSheet } from 'react-native';
import { r, radius, space, type ColorTokens } from '../../../theme';

export const makeCarouselStyles = (c: ColorTokens) =>
  StyleSheet.create({
    /** 'bottom' 模式:独立行容器,让 dot 居中紧贴。 */
    dotsWrapBottom: {
      justifyContent: 'center',
      alignItems: 'center',
      // 正式版按 active 最大宽度为每个 dot 预留 12pt,额外保留 3pt 间距。
      gap: r(3),
      paddingTop: space['3'],
    },
    /** 'overlay-bottom-right' 模式:absolute 浮在 Carousel 右下角,
     *  override `justifyContent` → 'flex-end' 让 dot 群靠右。 */
    dotsWrapOverlay: {
      position: 'absolute',
      bottom: space['3'],
      right: space['5'],
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: r(3),
    },
    dot: {
      width: space['1'],
      height: space['1'],
      // 4×4 dot 走 pill —— 任意大正数都会被 clamp 成圆,自文档化
      borderRadius: radius.pill,
      backgroundColor: c.primary,
      opacity: 0.32,
    },
    /** activeDot —— 12×4 长条,正式版 Pagination 为每项预留 12pt 宽避免布局跳动。 */
    dotActive: {
      width: space['5'],
      backgroundColor: c.primary,
      opacity: 1,
    },
  });
