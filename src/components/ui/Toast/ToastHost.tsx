import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useColors, useThemedStyles, motion } from '../../../theme';
import { dotColorFor, makeStyles } from './styles';
import { _subs } from './toast';
import type { Subscriber, ToastEntry, ToastHostProps } from './types';

/**
 * 在根附近挂一次。监听 toast() 调用并渲染当前 toast。
 * 同一时间只显示一条 —— 新的会替换旧的。
 */
export function ToastHost({
  testID,
}: ToastHostProps = {}): React.JSX.Element | null {
  const c = useColors();
  const styles = useThemedStyles(makeStyles);
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
    cancelAnimation(op);
    cancelAnimation(ty);
    op.value = withTiming(1, { duration: motion.base });
    ty.value = withTiming(0, { duration: motion.base });

    dismissTimer.current = setTimeout(() => {
      op.value = withTiming(0, { duration: motion.base });
      ty.value = withTiming(8, { duration: motion.base }, (finished) => {
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

  const dotColor = dotColorFor(entry.kind, c);

  return (
    <View style={styles.host} pointerEvents="none" testID={testID}>
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
