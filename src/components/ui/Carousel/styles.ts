import { StyleSheet } from 'react-native';
import { r, radius, space, type ColorTokens } from '../../../theme';

export const makeCarouselStyles = (c: ColorTokens) =>
  StyleSheet.create({
    /** 'bottom' 模式:独立行容器,覆盖 Pagination.Custom 默认的 `justifyContent: 'space-between'`
     *  (否则 dot 横向撑开),让 dot 居中紧贴。 */
    dotsWrapBottom: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      // 3pt 横间距:dot 单元 4pt + space[1]=r(4) 偏大,保留 r(3) 作为局部 dot 间隙
      gap: r(3),
      paddingTop: space['3'],
    },
    /** 'overlay-bottom-right' 模式:absolute 浮在 Carousel 右下角,
     *  override `justifyContent` → 'flex-end' 让 dot 群靠右。 */
    dotsWrapOverlay: {
      position: 'absolute',
      bottom: space['3'],
      right: space['5'],
      flexDirection: 'row',
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
    /** activeDot —— 12×4 长条,Pagination.Custom 会把 dotStyle 的 height /
     *  borderRadius 与 activeDotStyle 的 width 一起 interpolate,这里只 override 变化值。 */
    dotActive: {
      width: space['5'],
      opacity: 1,
    },
  });
