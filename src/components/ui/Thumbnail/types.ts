import type { StyleProp, ImageStyle, ImageSourcePropType } from 'react-native';

/** 缩略图尺寸阶梯 —— 跨场景统一,新增 size 在这里 + sizingFor.ts 同步。
 *  - sm:64×40 chat 行内、列表二级图缩略
 *  - md:113×67 NewsList / NewsArea 公告右侧缩略(默认)
 *  - lg:160×96 详情顶部 hero 小图、卡片头图缩略 */
export type ThumbnailSize = 'sm' | 'md' | 'lg';

export type ThumbnailProps = {
  /** 远程 URL(http/https/data URI)。和 source 二选一,优先 uri。 */
  uri?: string;
  /** RN Image source —— 本地 require('...') / { uri:... } 完整对象。 */
  source?: ImageSourcePropType;
  /** 视觉尺寸阶梯,默认 'md'。 */
  size?: ThumbnailSize;
  /** 自定义样式覆盖(尺寸 / 圆角 / bg 由 size 决定,style 仅做微调如 marginLeft)。 */
  style?: StyleProp<ImageStyle>;
  /** Image.resizeMode,默认 'cover'(裁切撑满)。 */
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  /** a11y 描述,SR 朗读;不传 RN Image 默认 hidden。 */
  accessibilityLabel?: string;
  /** 测试 testID */
  testID?: string;
};
