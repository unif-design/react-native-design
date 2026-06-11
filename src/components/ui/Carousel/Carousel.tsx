import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import ReanimatedCarousel, {
  Pagination,
} from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';
import { space, useThemedStyles } from '../../../theme';
import { makeCarouselStyles } from './styles';
import type { CarouselProps, ICarouselInstance } from './types';

/** Carousel —— 包装 `react-native-reanimated-carousel@5.0.0-beta.5`。
 *
 *  dot indicator 走 `c.primary` token,使用库内置 `Pagination.Custom`
 *  (`useSharedValue` + `onProgressChange` 驱动,re-render 全在 worklet 里)。
 *
 *  用 Pagination.Custom 而非 Basic:Basic 的 activeDot 用 translateX 推进
 *  内层 fill,外壳宽度等于 dotStyle.width,activeDotStyle.width 只影响内层,
 *  做不出"active 4 → 12 长条"。Custom 自己 interpolate width/height/bg。
 *
 *  forwardRef 透传 ICarouselInstance —— 解锁 a11y 暂停(ref.current.scrollTo)
 *  以及宿主页面的命令式 scrollTo / prev / next。
 */
// T 约束 object —— `Pagination.Basic<T extends {}>` 需要 object
function CarouselInner<T extends object>(
  {
    items,
    renderItem,
    height,
    itemWidth,
    autoPlay,
    loop = true,
    showIndicator = true,
    indicatorPosition = 'bottom',
    onPressItem,
    getAccessibilityLabel,
    style,
    testID,
  }: CarouselProps<T>,
  ref: React.Ref<ICarouselInstance>
): React.JSX.Element {
  const { width: screenWidth } = useWindowDimensions();
  const width = itemWidth ?? screenWidth;
  const styles = useThemedStyles(makeCarouselStyles);
  // Carousel `onProgressChange` 把 absoluteProgress 写进 shared value,Pagination 自动跟。
  const progress = useSharedValue<number>(0);

  // 'bottom' 模式给容器额外 +space[7] (=r(16)) 高度容纳独立行指示器;
  // 与 dotsWrapBottom 的 paddingTop=space[3]+dot height space[1] 一起跟 r() 同步缩放。
  // 'overlay-bottom-right' 不占额外高度。
  const indicatorReservedHeight =
    showIndicator && indicatorPosition === 'bottom' ? space['7'] : 0;

  const data = items as T[];

  return (
    <View
      style={[{ height: height + indicatorReservedHeight }, style]}
      testID={testID}
    >
      <ReanimatedCarousel
        // v5 把 width / height prop deprecate,迁到 style
        style={{ width, height }}
        data={data}
        loop={loop}
        autoPlay={!!autoPlay}
        autoPlayInterval={autoPlay}
        onProgressChange={progress}
        ref={ref}
        renderItem={({ item, index }) => (
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
            {renderItem(item, index)}
          </Pressable>
        )}
      />
      {showIndicator && items.length > 1 ? (
        // importantForAccessibility="no" —— dots 仅视觉辅助,SR 不需要读出
        // 每个 dot 的状态(已由 accessibilityRole=tab / accessibilityState.selected 表达
        // 的场景另论,这里 Pagination.Custom 无内置 a11y 语义,对 SR 隐藏比误读更优)。
        <Pagination.Custom<T>
          progress={progress}
          data={data}
          dotStyle={styles.dot}
          activeDotStyle={styles.dotActive}
          containerStyle={
            indicatorPosition === 'overlay-bottom-right'
              ? styles.dotsWrapOverlay
              : styles.dotsWrapBottom
          }
          // @ts-expect-error — importantForAccessibility 是 RN View prop,
          // Pagination.Custom containerStyle 走 ViewStyle 但 TS 类型未收录该 prop
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        />
      ) : null}
    </View>
  );
}

// forwardRef 不支持泛型函数组件直接推断 T,需要手动标注 + 类型断言
export const Carousel = React.forwardRef(CarouselInner) as <T extends object>(
  props: CarouselProps<T> & { ref?: React.Ref<ICarouselInstance> }
) => React.JSX.Element;
