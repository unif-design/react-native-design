import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Text } from 'react-native';
import {
  SHIMMER_TEXT_CYCLE_MS,
  SHIMMER_TEXT_HIGHLIGHT,
  SHIMMER_TEXT_RADIUS,
  SHIMMER_TEXT_SWEEP_MS,
} from './constants';
import type { ShimmerTextRunProps } from './types';

export const ShimmerTextRun = memo(function Run({
  text,
  color,
}: ShimmerTextRunProps) {
  const animation = useRef(new Animated.Value(0)).current;
  const characters = Array.from(text);
  const positionScale =
    SHIMMER_TEXT_SWEEP_MS /
    SHIMMER_TEXT_CYCLE_MS /
    (characters.length + 2 * SHIMMER_TEXT_RADIUS);

  useEffect(() => {
    // 扫过与停顿共用一条原生时钟，不逐帧更新 React 或重绘业务列表。
    const loop = Animated.loop(
      Animated.timing(animation, {
        toValue: 1,
        duration: SHIMMER_TEXT_CYCLE_MS,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [animation]);

  return (
    <Text>
      {characters.map((character, index) => (
        <Animated.Text
          key={`${index}:${character}`}
          style={{
            color: animation.interpolate({
              inputRange: [
                index * positionScale,
                (index + SHIMMER_TEXT_RADIUS) * positionScale,
                (index + 2 * SHIMMER_TEXT_RADIUS) * positionScale,
              ],
              outputRange: [color, SHIMMER_TEXT_HIGHLIGHT, color],
              extrapolate: 'clamp',
            }),
          }}
        >
          {character}
        </Animated.Text>
      ))}
    </Text>
  );
});
