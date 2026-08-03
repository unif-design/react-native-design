import type {
  CarouselRef,
  CarouselRenderItem,
} from 'react-native-reanimated-carousel';
import type { StyleProp, ViewStyle } from 'react-native';

export type { CarouselRef };

/** Indicator 位置策略:
 *  - 'bottom'(默认):指示器独立行,跟 Carousel 下方;容器高度 = height + 16
 *  - 'overlay-bottom-right':指示器 absolute 浮在 Carousel 右下角,不占额外高度 */
export type CarouselIndicatorPosition = 'bottom' | 'overlay-bottom-right';

type CarouselBaseProps<T> = {
  /** 数组数据 */
  data: T[];
  /** 单项渲染 */
  renderItem: CarouselRenderItem<T>;
  /** 稳定 key 解析器,数据更新时用于保持 item 身份。 */
  keyExtractor?: (item: T, index: number) => string;
  /** 每张高度(宽度默认 = 屏宽,被 itemSize 覆盖) */
  height: number;
  /** 每张宽度与水平翻页步长,默认 useWindowDimensions().width。
   *  若 caller 外层有 marginHorizontal(如 Dashboard banner inset 16),需要传
   *  `屏宽 - 左右 margin*2`,否则 slide 宽度超过可视区,右侧内容被裁切。 */
  itemSize?: number;
  /** 是否自动播放,默认 false。 */
  autoplay?: boolean;
  /** 自动播放间隔 ms,默认 3000。 */
  autoplayInterval?: number;
  /** 是否循环播放,默认 true。传 false 时到首尾停止。 */
  loop?: boolean;
  /** 是否显示底部 dot indicator,默认 true */
  showIndicator?: boolean;
  /** indicator 位置策略,默认 'bottom' */
  indicatorPosition?: CarouselIndicatorPosition;
  /** 外层 View 附加样式 */
  style?: StyleProp<ViewStyle>;
  /** E2E / 测试定位 */
  testID?: string;
};

type CarouselAction<T> = {
  /** 单项点击。action slide 必须同时声明业务名称。 */
  onPressItem: (item: T, index: number) => void;
  /** 单项业务名称，供读屏器区分每个可操作 slide。 */
  getAccessibilityLabel: (item: T, index: number) => string;
};

type CarouselDisplay = {
  /** 纯展示 slide 不创建可点击节点。 */
  onPressItem?: never;
  getAccessibilityLabel?: never;
};

/** 轮播只有纯展示或可操作两种 slide，不能只提供其中一个 action 字段。 */
export type CarouselProps<T> = CarouselBaseProps<T> &
  (CarouselAction<T> | CarouselDisplay);
