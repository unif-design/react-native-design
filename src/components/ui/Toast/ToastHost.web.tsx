import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  motion,
  space,
  useColors,
  usePrefersReducedMotion,
  useThemedStyles,
} from '../../../theme';
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
 * Web 端 ToastHost —— RN-Web 上 reanimated 的 useAnimatedStyle 链路会在
 * `_updatePropsJS` 里 `Object.keys` 抛 TypeError(点击就崩),故走纯 React + CSS
 * transition 实现 fade + slide;native 端仍走 ToastHost.tsx 的 reanimated 实现。
 *
 * 行为复刻 native 版:
 * - opacity 0→1 + translateY 8→0 入场(motion.base ms)
 * - 停留 entry.duration ms
 * - opacity 1→0 + translateY 0→8 退场后 unmount
 *
 * 竞态纪律与 native 版一致:timer / RAF 在改 UI 或上报完成前,都要同时通过同步 ref
 * 与 `isCurrentToastDelivery(delivery)` 两道校验。
 */
export function ToastHost({
  testID,
}: ToastHostProps = {}): React.JSX.Element | null {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const reduced = usePrefersReducedMotion();
  const [delivery, setDelivery] = useState<ToastDelivery | null>(null);
  const [inert, setInert] = useState(false);
  const [visible, setVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterRafRef = useRef<number | null>(null);
  const currentDeliveryRef = useRef<DeliveryIdentity | null>(null);

  const cancelCallbacks = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (enterRafRef.current != null) {
      cancelAnimationFrame(enterRafRef.current);
      enterRafRef.current = null;
    }
  }, []);

  useEffect(() => {
    const subscriber = (next: ToastDelivery) => {
      // 顺序固定:先撤销旧回调 → 再写同步身份 ref → 最后才动 React state。
      cancelCallbacks();
      currentDeliveryRef.current = {
        ownerToken: next.ownerToken,
        leaseId: next.leaseId,
        entryId: next.entry.id,
      };
      setDelivery(next);
    };
    const lease = registerToastHost(subscriber);
    if (!lease) {
      setInert(true);
      return;
    }
    return () => {
      // 顺序固定:先清身份 ref(让所有在途回调立刻失效)→ 撤销 timer/RAF → 最后释放 owner。
      currentDeliveryRef.current = null;
      cancelCallbacks();
      lease.release();
    };
  }, [cancelCallbacks]);

  /** 退场完成:双重校验通过才清 UI 并上报完成。 */
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
    // delivery=null:上一轮 effect 的 cleanup 已清 timer/RAF,这里无需重复。
    if (!delivery) return;
    const entry = delivery.entry;
    // [M-15] web 同样主动播报(RN-Web announceForAccessibility 注入 aria-live region)。
    AccessibilityInfo.announceForAccessibility(entry.message);

    // cancelled 标志:delivery 快速连续切换 / 组件卸载时,cleanup 置 true。RAF 与
    // timer 回调执行前都检查它 —— cancelAnimationFrame 在部分浏览器不保证取消
    // 已排队回调,且双 RAF 的外层回调可能在 cleanup 后仍跑并 queue 内层,光靠
    // cancel 防不住。cancelled 兜底,杜绝 unmount 后 setState 警告 + 状态错位。
    let cancelled = false;
    // 进场:每次切换都从 visible=false 开始,确保 CSS transition 有起点
    setVisible(false);
    // 双 RAF 才能稳过 React commit/paint 一帧 —— 否则同一 microtask 内 visible
    // 还是 true(未刷),CSS transition 没起点。
    enterRafRef.current = requestAnimationFrame(() => {
      if (cancelled) return;
      enterRafRef.current = requestAnimationFrame(() => {
        if (cancelled || !isCurrentToastDelivery(delivery)) return;
        enterRafRef.current = null;
        setVisible(true);
      });
    });
    // 停留时长:从投递到关闭 = entry.duration ms。
    dismissTimerRef.current = setTimeout(() => {
      if (cancelled || !isCurrentToastDelivery(delivery)) return;
      setVisible(false);
      exitTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        finishIfCurrent(delivery);
      }, motion.base);
    }, entry.duration);

    return () => {
      cancelled = true;
      cancelCallbacks();
    };
  }, [delivery, cancelCallbacks, finishIfCurrent]);

  if (inert || !delivery) return null;

  const entry = delivery.entry;

  // 位置:top=顶部(safe-area + 间距)/ center=屏幕居中 / bottom=底部(默认),复刻 native 版。
  // 此前 web 完全未注入定位,position 参数被静默忽略、垂直位置随挂载次序漂移([H-6])。
  const posStyle =
    entry.position === 'top'
      ? { top: insets.top + space[10] }
      : entry.position === 'center'
        ? { top: 0, bottom: 0, justifyContent: 'center' as const }
        : { bottom: insets.bottom + space[10] };

  const dotColor = dotColorFor(entry.kind, c);
  const animatedWebStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0px)' : 'translateY(8px)',
    transition: reduced
      ? 'none'
      : `opacity ${motion.base}ms ease-out, transform ${motion.base}ms ease-out`,
  };

  return (
    <View style={[styles.host, posStyle]} pointerEvents="none" testID={testID}>
      <div style={animatedWebStyle}>
        <View style={styles.toast}>
          {dotColor ? (
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
          ) : null}
          <Text style={styles.text} testID={childTestID(testID, 'text')}>
            {entry.message}
          </Text>
        </View>
      </div>
    </View>
  );
}
