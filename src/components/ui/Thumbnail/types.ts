import type { ReactNode } from 'react';
import type {
  ImageProps,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  ViewStyle,
} from 'react-native';

/** 缩略图尺寸阶梯 —— 跨场景统一,新增阶梯在这里与 constants.ts 同步。
 *  - sm:64×40 chat 行内、列表二级图缩略
 *  - md:113×67 NewsList / NewsArea 公告右侧缩略(默认)
 *  - lg:160×96 详情顶部 hero 小图、卡片头图缩略 */
export type ThumbnailSize = 'sm' | 'md' | 'lg';

/** 已计算好的 RN 布局尺寸；组件不再调用 r() 缩放。 */
export interface ThumbnailDimensions {
  width: number;
  height: number;
  borderRadius?: number;
}

export interface NormalizedThumbnailDimensions {
  dimensions: Required<ThumbnailDimensions>;
  diagnostics: readonly string[];
}

export interface SanitizedThumbnailImageStyle {
  style: ThumbnailImageStyle;
  diagnostics: readonly string[];
}

export type ThumbnailImageStyle = Omit<
  ImageStyle,
  | 'position'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'width'
  | 'height'
  | 'minWidth'
  | 'minHeight'
  | 'maxWidth'
  | 'maxHeight'
>;

type ThumbnailSource =
  | {
      /** 远程 URL(http/https/data URI)，运行时 trim 后必须非空。 */
      uri: string;
      source?: never;
    }
  | {
      /** RN Image source —— 本地 require / URI object / URI candidate 数组。 */
      source: ImageSourcePropType;
      uri?: never;
    };

interface ThumbnailCommonProps {
  /** 原三档或实际图像框尺寸，默认 md；非法对象整体回退 md。 */
  size?: ThumbnailSize | Readonly<ThumbnailDimensions>;
  /** 无有效 source 或当前图片失败时居中显示；加载中不显示。 */
  fallback?: ReactNode;
  /** 选中态:在固定 visual frame 内显示 2pt 品牌色 ring。 */
  selected?: boolean;
  /** 完整外部布局样式，只落到稳定根 View。 */
  containerStyle?: StyleProp<ViewStyle>;
  /** 图片表面样式；不能覆盖 frame 的 position / inset / size geometry。 */
  imageStyle?: StyleProp<ThumbnailImageStyle>;
  /** Image.resizeMode,默认 'cover'(裁切撑满)。 */
  resizeMode?: NonNullable<ImageProps['resizeMode']>;
  /** trim 后非空时作为图片名称；缺省或空白时图片从 a11y tree 隐藏。 */
  accessibilityLabel?: string;
  /** E2E / 测试定位，只落到外层 layout View。 */
  testID?: string;
}

export type ThumbnailProps = ThumbnailSource & ThumbnailCommonProps;
