import { StyleSheet } from 'react-native';
import { type ColorTokens } from '../../../theme';

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
    fallback: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
