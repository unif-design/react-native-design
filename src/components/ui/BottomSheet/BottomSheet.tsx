import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useThemedStyles } from '@/theme';
import { BlurLayer } from '../BlurLayer';
import { makeStyles } from './styles';
import type { BottomSheetProps } from './types';

/** 底部 sheet —— @gorhom/bottom-sheet 的薄壳层。
 *
 *  适合 navigation `presentation: 'transparentModal'` 屏内 root 用法:mount 时
 *  默认 animateOnMount=true 从 -1 动画到 index=0,goBack() 自然关闭。
 *  state-driven sheet 应用 @gorhom 原生 `<BottomSheetModal>`,本 wrapper 不覆盖。
 *
 *  - `snapPoints` 必传(`['50%']` / `['50%', '90%']` 等)
 *  - `backdrop` 三档:`'scrim'` / `'blur'`(BlurLayer)/ `'none'` */
// 默认 30% / 60% / 95%,模块顶层 const 引用稳定。
const DEFAULT_SNAP_POINTS: (string | number)[] = ['30%', '60%', '95%'];

export function BottomSheet({
  snapPoints = DEFAULT_SNAP_POINTS,
  children,
  sheetStyle,
  backdrop = 'scrim',
  grabber = true,
  onClose,
  testID,
}: BottomSheetProps): React.JSX.Element {
  const styles = useThemedStyles(makeStyles);

  /** BlurView backdrop —— 复用 @gorhom BottomSheetBackdrop 的手势 + animatedIndex
   *  插值,opacity=1 + bg=transparent 让 backdrop 本身不画 scrim,只画 BlurLayer。
   *  tap-to-close + opacity 淡入 / pointer-events disable 全部继承自 @gorhom 内核。
   *
   *  useCallback + styles dep 保引用稳定(主题切换时才重建),避免每次渲染新引用让
   *  @gorhom 内部 memo 失效 / remount backdrop 树。 */
  const BlurBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        style={[props.style, styles.backdropTransparent]}
      >
        <BlurLayer intensity="strong" />
      </BottomSheetBackdrop>
    ),
    [styles.backdropTransparent]
  );

  /** Scrim backdrop —— 走 c.scrim token(亮 rgba(0,0,0,0.5) / 暗 0.7),opacity=1
   *  让 @gorhom 只跑透明度淡入动画,scrim 实色由 token 决定 → 暗色自动加深。 */
  const ScrimBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={1}
        style={[props.style, styles.scrimBackdrop]}
      />
    ),
    [styles.scrimBackdrop]
  );

  const renderBackdrop = useMemo(() => {
    switch (backdrop) {
      case 'none':
        return undefined;
      case 'blur':
        return BlurBackdrop;
      case 'scrim':
        return ScrimBackdrop;
    }
  }, [backdrop, BlurBackdrop, ScrimBackdrop]);

  // @gorhom onChange:index === -1 即关闭。配合 transparentModal route 必传
  // caller 的 onClose → navigation.goBack(),否则路由 stack 不 pop,native overlay 继续吞触摸。
  const onChange = (index: number) => {
    if (index === -1) onClose?.();
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <GorhomBottomSheet
        snapPoints={snapPoints}
        index={0}
        backdropComponent={renderBackdrop}
        handleComponent={grabber ? undefined : null}
        backgroundStyle={styles.sheet}
        onChange={onChange}
        // enableDynamicSizing=false 关键 —— @gorhom v5 默认 true 会让 sheet 跟内容
        // 自动撑高忽略 snapPoints max,设 false 强制按 snapPoints 锁高度(gorhom#1783 / #918)
        enableDynamicSizing={false}
        enableOverDrag={false}
        // @gorhom 默认 false:user 下拉到底部 snap 后不会关闭 sheet,只是 bounce
        // (BottomSheetScrollView 在 scrollOffset=0 时下拉看着像下拉刷新效果)。
        // 设 true 后超过最低 snap 阈值直接 dismiss → 走 onChange(-1) → onClose。
        enablePanDownToClose
      >
        <BottomSheetScrollView
          testID={testID}
          showsVerticalScrollIndicator={false}
        >
          {/* sheetStyle 给内层 View,ScrollView 只负责 scroll,不接管 padding / gap / maxHeight。 */}
          <View style={sheetStyle}>{children}</View>
        </BottomSheetScrollView>
      </GorhomBottomSheet>
    </GestureHandlerRootView>
  );
}
