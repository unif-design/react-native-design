import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import {
  Carousel as ReanimatedCarousel,
  Pagination,
} from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { space, useThemedStyles } from '../../../theme';
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
  // Carousel 把逻辑页进度写进 shared value,Pagination 自动跟随。
  const progress = useSharedValue<number>(0);

  // 'bottom' 模式给容器额外 +space[7] (=r(16)) 高度容纳独立行指示器;
  // 与 dotsWrapBottom 的 paddingTop=space[3]+dot height space[1] 一起跟 r() 同步缩放。
  // 'overlay-bottom-right' 不占额外高度。
  const indicatorReservedHeight =
    showIndicator && indicatorPosition === 'bottom' ? space['7'] : 0;

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
        autoplay={autoplay}
        autoplayInterval={autoplayInterval}
        progress={progress}
        ref={ref}
        renderItem={({ item, index, relativeProgress }) => (
          // RN Pressable 而非 RNGH Pressable:Carousel 的 GestureDetector 已挂在
          // ReanimatedCarousel 内部,外层再套 RNGH Pressable 会产生手势冲突;
          // 用 RN 原生 Pressable 让库自己的拖拽手势优先,tap 仍正常触发。
          <Pressable
            onPress={() => onPressItem?.(item, index)}
            style={{ width, height }}
            // [L-92] 恒产出兜底:testID 缺失时用 'carousel' 前缀而非 undefined。
            // 与 childTestID「父缺失返 undefined」语义不同,不替换为 childTestID。
            // 原因:renderItem 须向 ReanimatedCarousel 提供稳定可预期的子项 testID
            // 用于 E2E 定位,哪怕调用方未传 testID 也能用 carousel-item-0 等定位;
            // 副作用:同屏两个未传 testID 的 Carousel 会碰撞 carousel-item-N。
            // 建议:多 Carousel 场景请务必传 testID 以避免碰撞。
            testID={`${testID ?? 'carousel'}-item-${index}`}
            // 只在真正可点时声明 button 语义,纯展示型不标 button 避免读屏器误导
            {...(onPressItem
              ? {
                  accessibilityRole: 'button' as const,
                  accessibilityLabel:
                    getAccessibilityLabel?.(item, index) ??
                    `第 ${index + 1} 项`,
                }
              : null)}
          >
            {renderItem({ item, index, relativeProgress })}
          </Pressable>
        )}
      />
      {showIndicator && data.length > 1 ? (
        // 未传 onPress 时,正式版 Pagination 会把 dots 作为纯视觉辅助从 a11y 树隐藏。
        <Pagination
          progress={progress}
          count={data.length}
          dotStyle={styles.dot}
          activeDotStyle={styles.dotActive}
          containerStyle={
            indicatorPosition === 'overlay-bottom-right'
              ? styles.dotsWrapOverlay
              : styles.dotsWrapBottom
          }
        />
      ) : null}
    </View>
  );
}

// forwardRef 不支持泛型函数组件直接推断 T,需要手动标注 + 类型断言
export const Carousel = React.forwardRef(CarouselInner) as <T>(
  props: CarouselProps<T> & { ref?: React.Ref<CarouselRef> }
) => React.JSX.Element;
