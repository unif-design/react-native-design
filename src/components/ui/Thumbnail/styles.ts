import { StyleSheet } from 'react-native';
import { r, type ColorTokens } from '../../../theme';
import type { ThumbnailSize } from './types';

/** [L-94] ring 圆角外展量:border(2) + padding(1) = 3pt,让外圈圆角贴合内圆角。
 *  Thumbnail.tsx 侧用此常量替代魔数 `+ 3`。 */
export const RING_EXTRA_RADIUS = r(2) + r(1); // border + padding

/** Thumbnail 静态样式 ——
 *  - `base`:Image 占位色,加载中 / 失败时不至于空白
 *  - `ring`:`selected` 态的外圈品牌色描边,padding 抵消 ring 与 image 之间留 1pt gap */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    base: {
      backgroundColor: c.surfaceContainer,
    },
    ring: {
      borderWidth: r(2),
      borderColor: c.primary,
      padding: r(1),
    },
  });

/** Thumbnail size 阶梯 —— width / height / borderRadius 全 r() 缩放。
 *  新增 size 在 types.ts 加 union + 这里加 case,两处同步。 */
export const sizingFor = (size: ThumbnailSize) => {
  switch (size) {
    case 'sm':
      return { width: r(64), height: r(40), borderRadius: r(6) };
    case 'lg':
      return { width: r(160), height: r(96), borderRadius: r(10) };
    case 'md':
    default:
      // 113×67 与 NewsList / NewsArea 历史一致,16:9.5 接近视频宽高比
      return { width: r(113), height: r(67), borderRadius: r(8) };
  }
};
