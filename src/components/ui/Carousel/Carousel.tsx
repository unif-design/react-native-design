import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import {
  Carousel as ReanimatedCarousel,
  Pagination,
} from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import {
  space,
  usePrefersReducedMotion,
  useThemedStyles,
} from '../../../theme';
import { A11Y_HIDDEN_PROPS } from '../shared/a11y';
import {
  effectiveCarouselAutoplay,
  shouldRenderCarouselPagination,
} from './behavior';
import { makeCarouselStyles } from './styles';
import type { CarouselProps, CarouselRef } from './types';

/** Carousel —— 包装 `react-native-reanimated-carousel@5.0.0`。
 *
 *  dot indicator 走 `c.primary` token,使用库内置 `Pagination`
 *  (`useSharedValue` + `progress` 驱动,视觉插值留在 UI 线程)。
 *
 *  forwardRef 透传 CarouselRef,供宿主命令式 scrollTo / prev / next
 *  并读取最后一次完成落位的 index。
 */
function CarouselInner<T>(
  {
    data,
    renderItem,
    keyExtractor,
    height,
    itemSize,
    autoplay,
    autoplayInterval,
    loop = true,
    showIndicator = true,
    indicatorPosition = 'bottom',
    onPressItem,
    getAccessibilityLabel,
    style,
    testID,
  }: CarouselProps<T>,
  ref: React.Ref<CarouselRef>
): React.JSX.Element {
  const { width: screenWidth } = useWindowDimensions();
  const width = itemSize ?? screenWidth;
  const styles = useThemedStyles(makeCarouselStyles);
  const reducedMotion = usePrefersReducedMotion();
  const effectiveAutoplay = effectiveCarouselAutoplay(autoplay, reducedMotion);
  const shouldRenderPagination = shouldRenderCarouselPagination(
    showIndicator,
    data.length
  );
  const isActionable =
    onPressItem !== undefined && getAccessibilityLabel !== undefined;
  // Carousel 把逻辑页进度写进 shared value,Pagination 自动跟随。
  const progress = useSharedValue<number>(0);

  // 'bottom' 模式给容器额外 +space[7] (=r(16)) 高度容纳独立行指示器;
  // 与 dotsWrapBottom 的 paddingTop=space[3]+dot height space[1] 一起跟 r() 同步缩放。
  // 'overlay-bottom-right' 不占额外高度。
  const indicatorReservedHeight =
    shouldRenderPagination && indicatorPosition === 'bottom' ? space['7'] : 0;

  return (
    <View
      style={[{ height: height + indicatorReservedHeight }, style]}
      testID={testID}
    >
      <ReanimatedCarousel
        // v5 把 width / height prop deprecate,迁到 style
        style={{ width, height }}
        itemSize={width}
        data={data}
        keyExtractor={keyExtractor}
        loop={loop}
        autoplay={effectiveAutoplay}
        autoplayInterval={autoplayInterval}
        progress={progress}
        ref={ref}
        renderItem={({ item, index, relativeProgress }) => {
          const content = renderItem({ item, index, relativeProgress });
          const itemTestID = `${testID ?? 'carousel'}-item-${index}`;

          if (isActionable) {
            // RN Pressable 而非 RNGH Pressable:Carousel 的 GestureDetector 已挂在
            // ReanimatedCarousel 内部,外层再套 RNGH Pressable 会产生手势冲突;
            // 用 RN 原生 Pressable 让库自己的拖拽手势优先,tap 仍正常触发。
            return (
              <Pressable
                onPress={() => onPressItem(item, index)}
                style={{ width, height }}
                testID={itemTestID}
                accessibilityRole="button"
                accessibilityLabel={`${getAccessibilityLabel(item, index)}，第 ${index + 1} 项，共 ${data.length} 项`}
              >
                {content}
              </Pressable>
            );
          }

          return (
            <View style={{ width, height }} testID={itemTestID}>
              {content}
            </View>
          );
        }}
      />
      {shouldRenderPagination ? (
        // Pagination 是第三方组件，隐藏 props 必须落在本地 View，不能向其透传。
        <View
          {...A11Y_HIDDEN_PROPS}
          style={
            indicatorPosition === 'overlay-bottom-right'
              ? styles.dotsWrapOverlay
              : styles.dotsWrapBottom
          }
        >
          <Pagination
            progress={progress}
            count={data.length}
            dotStyle={styles.dot}
            activeDotStyle={styles.dotActive}
            containerStyle={styles.dots}
          />
        </View>
      ) : null}
    </View>
  );
}

// forwardRef 不支持泛型函数组件直接推断 T,需要手动标注 + 类型断言
export const Carousel = React.forwardRef(CarouselInner) as <T>(
  props: CarouselProps<T> & { ref?: React.Ref<CarouselRef> }
) => React.JSX.Element;
