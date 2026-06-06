import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColors, useThemedStyles, motion, space } from '../../../theme';
import { dotColorFor, makeStyles } from './styles';
import { _subs } from './toast';
import type { Subscriber, ToastEntry, ToastHostProps } from './types';

/**
 * 在根附近挂一次。监听 toast() 调用并渲染当前 toast。
 * 同一时间只显示一条 —— 新的会替换旧的。
 *
 * 位置由 `entry.position`('top' / 'bottom' / 'center')决定,top/bottom 自动避让
 * safe-area;进入动画方向随位置(top 从上滑、bottom/center 从下滑)。
 */
export function ToastHost({
  testID,
}: ToastHostProps = {}): React.JSX.Element | null {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const [entry, setEntry] = useState<ToastEntry | null>(null);
  const op = useSharedValue(0);
  const ty = useSharedValue(8);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const sub: Subscriber = (next) => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      setEntry(next);
    };
    _subs.add(sub);
    return () => {
      _subs.delete(sub);
    };
  }, []);

  useEffect(() => {
    if (!entry) return;
    // 进入方向:top 从上(-8)滑入,bottom / center 从下(8)滑入
    const from = entry.position === 'top' ? -8 : 8;
    cancelAnimation(op);
    cancelAnimation(ty);
    op.value = 0;
    ty.value = from;
    op.value = withTiming(1, { duration: motion.base });
    ty.value = withTiming(0, { duration: motion.base });

    dismissTimer.current = setTimeout(() => {
      op.value = withTiming(0, { duration: motion.base });
      ty.value = withTiming(from, { duration: motion.base }, (finished) => {
        if (finished) runOnJS(setEntry)(null);
      });
    }, entry.duration);

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
      cancelAnimation(op);
      cancelAnimation(ty);
    };
  }, [entry, op, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: op.value,
    transform: [{ translateY: ty.value }],
  }));

  if (!entry) return null;

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
        <Text
          style={styles.text}
          testID={testID ? `${testID}-text` : undefined}
        >
          {entry.message}
        </Text>
      </Animated.View>
    </View>
  );
}
