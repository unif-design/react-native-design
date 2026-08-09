import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColors, useThemedStyles, motion, space } from '../../../theme';
import { childTestID } from '../../../utils/testID';
import { dotColorFor, makeStyles } from './styles';
import {
  completeToast,
  isCurrentToastDelivery,
  registerToastHost,
} from './toast';
import type { ToastDelivery } from './store';
import type { ToastHostProps } from './types';

/** Host 侧的同步身份副本 —— 迟到回调据此在动 UI 前自证「我还是当前那一次投递」。 */
type DeliveryIdentity = {
  ownerToken: symbol;
  leaseId: number;
  entryId: number;
};

/**
 * 在根附近挂一个。监听 toast() 调用并渲染当前 toast。
 * 同一时间只显示一条 —— 新的会替换旧的(latest-wins)。
 *
 * 栈式 owner:后挂载的实例接管投递,前任挂起并收起当前 toast;接管者卸载后自动归还。
 * 因此**允许**在自己的 `Modal` 里再挂一个 —— RN `Modal` 是独立 native window,根 Host
 * 的 toast 会被它物理盖住,内层自挂才看得见。
 *
 * 位置由 `entry.position`('top' / 'bottom' / 'center')决定,top/bottom 自动避让
 * safe-area;进入动画方向随位置(top 从上滑、bottom/center 从下滑)。
 *
 * 竞态纪律:每个 timer / 动画完成回调在改 UI 或上报完成前,都要同时通过同步 ref
 * 与 `isCurrentToastDelivery(delivery)` 两道校验 —— 只靠其中之一都不够:ref 挡不住
 * 「Host 重挂后同一 entry 的新投递」,Store 挡不住 React 批处理造成的 state 滞后。
 */
export function ToastHost({
  testID,
}: ToastHostProps = {}): React.JSX.Element | null {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [delivery, setDelivery] = useState<ToastDelivery | null>(null);
  const [inert, setInert] = useState(false);
  const op = useSharedValue(0);
  const ty = useSharedValue(8);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentDeliveryRef = useRef<DeliveryIdentity | null>(null);

  useEffect(() => {
    const subscriber = (next: ToastDelivery) => {
      // 顺序固定:先撤销旧回调 → 再写同步身份 ref → 最后才动 React state。
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
      cancelAnimation(op);
      cancelAnimation(ty);
      currentDeliveryRef.current = {
        ownerToken: next.ownerToken,
        leaseId: next.leaseId,
        entryId: next.entry.id,
      };
      setDelivery(next);
    };
    // 被后挂载的 Host 接管:立刻收起当前 toast。store 已丢弃这次投递,自身的退场
    // timer 从此过不了 CAS —— 不主动清,这条 toast 会冻在屏幕上直到本 Host 卸载。
    const clearOnSuspend = () => {
      currentDeliveryRef.current = null;
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
      cancelAnimation(op);
      cancelAnimation(ty);
      setDelivery(null);
    };
    const lease = registerToastHost(subscriber, clearOnSuspend);
    // null lease 只剩一种成因:补投 pending 时 subscriber 抛错,本 owner 当场被作废
    //(不再是「重复挂载」—— 那条现在走接管)。惰性到卸载为止。
    if (!lease) {
      setInert(true);
      return;
    }
    return () => {
      // 顺序固定:先清身份 ref(让所有在途回调立刻失效)→ 撤销 timer/动画 → 最后释放 owner。
      currentDeliveryRef.current = null;
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
      cancelAnimation(op);
      cancelAnimation(ty);
      lease.release();
    };
  }, [op, ty]);

  /** 退场完成:双重校验通过才清 UI 并上报完成,避免抹掉竞态期到达的新 toast([M-14])。 */
  const finishIfCurrent = useCallback((finished: ToastDelivery) => {
    const identity = currentDeliveryRef.current;
    if (
      !identity ||
      identity.ownerToken !== finished.ownerToken ||
      identity.leaseId !== finished.leaseId ||
      identity.entryId !== finished.entry.id
    ) {
      return;
    }
    if (!isCurrentToastDelivery(finished)) return;
    completeToast(finished.ownerToken, finished.leaseId, finished.entry.id);
    currentDeliveryRef.current = null;
    setDelivery((current) => (current === finished ? null : current));
  }, []);

  useEffect(() => {
    if (!delivery) return;
    const entry = delivery.entry;
    // [M-15] toast 出现时主动播报 —— 容器 pointerEvents="none" + 3s 自动消失,
    // SR 用户对一闪而过的反馈本无任何感知通道。
    AccessibilityInfo.announceForAccessibility(entry.message);
    // 进入方向:top 从上(-8)滑入,bottom / center 从下(8)滑入
    const from = entry.position === 'top' ? -8 : 8;
    cancelAnimation(op);
    cancelAnimation(ty);
    op.value = 0;
    ty.value = from;
    op.value = withTiming(1, { duration: motion.base });
    ty.value = withTiming(0, { duration: motion.base });

    dismissTimer.current = setTimeout(() => {
      // 定时器触发时可能早已不是当前投递(新 toast 抢先)—— 先自证再播退场动画。
      if (!isCurrentToastDelivery(delivery)) return;
      op.value = withTiming(0, { duration: motion.base });
      ty.value = withTiming(from, { duration: motion.base }, (done) => {
        if (done) runOnJS(finishIfCurrent)(delivery);
      });
    }, entry.duration);

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }
      cancelAnimation(op);
      cancelAnimation(ty);
    };
  }, [delivery, op, ty, finishIfCurrent]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  if (inert || !delivery) return null;

  const entry = delivery.entry;

  // 位置:top=顶部(safe-area + 间距)/ center=屏幕居中 / bottom=底部(默认)
  const posStyle =
    entry.position === 'top'
      ? { top: insets.top + space[10] }
      : entry.position === 'center'
        ? { top: 0, bottom: 0, justifyContent: 'center' as const }
        : { bottom: insets.bottom + space[10] };

  const dotColor = dotColorFor(entry.kind, c);

  return (
    <View style={[styles.host, posStyle]} pointerEvents="none" testID={testID}>
      <Animated.View style={[styles.toast, animatedStyle]}>
        {dotColor ? (
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
        ) : null}
        <Text style={styles.text} testID={childTestID(testID, 'text')}>
          {entry.message}
        </Text>
      </Animated.View>
    </View>
  );
}
