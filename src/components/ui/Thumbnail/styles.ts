import { StyleSheet } from 'react-native';
import { r, type ColorTokens } from '../../../theme';
import type { ThumbnailSize } from './types';

/** Thumbnail 静态样式 ——
 *  - `visualFrame`:固定尺寸、裁切、加载失败 placeholder
 *  - `ring`:始终存在的 2pt visual overlay，selected 只切颜色 */
export const makeStyles = (c: ColorTokens) =>
  StyleSheet.create({
    visualFrame: {
      backgroundColor: c.surfaceContainer,
      overflow: 'hidden',
    },
    ring: {
      borderWidth: 2,
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
