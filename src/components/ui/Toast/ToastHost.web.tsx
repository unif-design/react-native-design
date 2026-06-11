import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  motion,
  space,
  useColors,
  usePrefersReducedMotion,
  useThemedStyles,
} from '../../../theme';
import { dotColorFor, makeStyles } from './styles';
import { _subs } from './toast';
import type { Subscriber, ToastEntry, ToastHostProps } from './types';

/**
 * Web 端 ToastHost —— RN-Web 上 reanimated 4 + worklets 0.9.x 的 useAnimatedStyle
 * 链路会在 _updatePropsJS 里 Object.keys 抛 TypeError(点击就崩),走纯 React + CSS
 * transition 实现 fade + slide,native 端仍走 ToastHost.tsx 的 reanimated 实现。
 *
 * 行为复刻 native 版:
 * - opacity 0→1 + translateY 8→0 入场(motion.base ms)
 * - 停留 entry.duration ms
 * - opacity 1→0 + translateY 0→8 退场后 unmount
 */
export function ToastHost({
  testID,
}: ToastHostProps = {}): React.JSX.Element | null {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const reduced = usePrefersReducedMotion();
  const [entry, setEntry] = useState<ToastEntry | null>(null);
  const [visible, setVisible] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterRafRef = useRef<number | null>(null);

  useEffect(() => {
    const sub: Subscriber = (next) => {
      setEntry(next);
    };
    _subs.add(sub);
    return () => {
      _subs.delete(sub);
    };
  }, []);

  useEffect(() => {
    // entry=null:上一轮 effect 的 cleanup 已清 timer/RAF,这里无需重复。
    if (!entry) return;

    // cancelled 标志:entry 快速连续切换 / 组件卸载时,cleanup 置 true。RAF 与
    // timer 回调执行前都检查它 —— cancelAnimationFrame 在部分浏览器不保证取消
    // 已排队回调,且双 RAF 的外层回调可能在 cleanup 后仍跑并 queue 内层,光靠
    // cancel 防不住。cancelled 兜底,杜绝 unmount 后 setState 警告 + 状态错位。
    let cancelled = false;
    // 进场:每次 entry 切换都从 visible=false 开始,确保 CSS transition 有起点
    setVisible(false);
    // 双 RAF 才能稳过 React commit/paint 一帧 —— 否则同一 microtask 内 visible
    // 还是 true(未刷),CSS transition 没起点。
    enterRafRef.current = requestAnimationFrame(() => {
      if (cancelled) return;
      enterRafRef.current = requestAnimationFrame(() => {
        if (cancelled) return;
        setVisible(true);
      });
    });
    // 停留时长:从 setEntry 到关闭 = entry.duration ms。
    dismissTimerRef.current = setTimeout(() => {
      if (cancelled) return;
      setVisible(false);
      exitTimerRef.current = setTimeout(() => {
        if (cancelled) return;
        setEntry(null);
      }, motion.base);
    }, entry.duration);

    return () => {
      cancelled = true;
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (enterRafRef.current != null)
        cancelAnimationFrame(enterRafRef.current);
    };
  }, [entry]);

  if (!entry) return null;

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
          <Text
            style={styles.text}
            testID={testID ? `${testID}-text` : undefined}
          >
            {entry.message}
          </Text>
        </View>
      </div>
    </View>
  );
}
