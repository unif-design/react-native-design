import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** Indicator 位置策略:
 *  - 'bottom'(默认):指示器独立行,跟 Carousel 下方;容器高度 = height + 16
 *  - 'overlay-bottom-right':指示器 absolute 浮在 Carousel 右下角,不占额外高度 */
export type CarouselIndicatorPosition = 'bottom' | 'overlay-bottom-right';

export type CarouselProps<T> = {
  /** 数组数据 */
  items: ReadonlyArray<T>;
  /** 单项渲染 */
  renderItem: (item: T, index: number) => ReactNode;
  /** 每张高度(宽度默认 = 屏宽,被 itemWidth 覆盖) */
  height: number;
  /** 每张宽度,默认 useWindowDimensions().width。
   *  若 caller 外层有 marginHorizontal(如 Dashboard banner inset 16),需要传
   *  `屏宽 - 左右 margin*2`,否则 slide 宽度超过可视区,右侧内容被裁切。 */
  itemWidth?: number;
  /** autoPlay 间隔 ms,undefined / 0 不自动 */
  autoPlay?: number;
  /** 是否显示底部 dot indicator,默认 true */
  showIndicator?: boolean;
  /** indicator 位置策略,默认 'bottom' */
  indicatorPosition?: CarouselIndicatorPosition;
  /** 单项点击 */
  onPressItem?: (item: T, index: number) => void;
  /** 单项 a11y label 解析器。仅 `onPressItem` 存在时启用 —— Pressable 拿来作
   *  `accessibilityLabel`(role 自动设 button)。不传则 fallback `第 N 项`。 */
  getAccessibilityLabel?: (item: T, index: number) => string;
  /** 外层 View 附加样式 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};
